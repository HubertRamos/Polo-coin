import { supabase } from '../config/supabase.js';

/** Busca todos os produtos com categoria. */
export async function puxarTodosProdutos() {
    const { data, error } = await supabase
        .from('produtos')
        .select(`
            id,
            nome,
            custo_pontos,
            categoria_id,
            categorias (
                nome
            )
        `)
        .order('id', { ascending: false });

    if (error) {
        throw new Error(error.message);
    }

    return (data || []).map(p => {
        const cat = Array.isArray(p.categorias) ? p.categorias[0] : p.categorias;
        return {
            id: p.id,
            nome: p.nome,
            custo_pontos: p.custo_pontos,
            categoria_id: p.categoria_id,
            categoria_nome: cat?.nome ?? null
        };
    });
}

/** Busca produtos com filtros (categoria e/ou busca por nome). */
export async function puxarProdutosFiltrados({ categoria = null, busca = null } = {}) {
    let query = supabase
        .from('produtos')
        .select(`
            id,
            nome,
            custo_pontos,
            categoria_id,
            categorias (
                nome
            )
        `)
        .order('id', { ascending: false });

    if (busca && busca.trim()) {
        query = query.ilike('nome', `%${busca.trim()}%`);
    }

    const { data, error } = await query;
    if (error) {
        throw new Error(error.message);
    }

    let rows = (data || []).map(p => {
        const cat = Array.isArray(p.categorias) ? p.categorias[0] : p.categorias;
        return {
            id: p.id,
            nome: p.nome,
            custo_pontos: p.custo_pontos,
            categoria_id: p.categoria_id,
            categoria_nome: cat?.nome ?? null
        };
    });

    if (categoria) {
        rows = rows.filter(r => r.categoria_nome === categoria);
    }

    return rows;
}

/** Retorna lista de categorias para o filtro. */
export async function puxarCategoriasParaFiltro() {
    const { data, error } = await supabase
        .from('categorias')
        .select('id, nome')
        .order('nome', { ascending: true });

    if (error) {
        throw new Error(error.message);
    }
    return data || [];
}

/** Cria um novo produto. */
export async function criarProduto(nome, preco, categoria_id = null) {
    if (!nome || preco === undefined || preco === null) {
        throw new Error('CAMPOS_VAZIOS');
    }

    const { data, error } = await supabase
        .from('produtos')
        .insert([{
            nome: nome.trim(),
            custo_pontos: parseInt(preco, 10),
            categoria_id: categoria_id ? Number(categoria_id) : null
        }])
        .select('id')
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return {
        id: data.id,
        nome: nome.trim(),
        custo_pontos: parseInt(preco, 10),
        categoria_id
    };
}

/** Busca todas as categorias. */
export async function puxarTodasCategorias() {
    const { data, error } = await supabase
        .from('categorias')
        .select('id, nome')
        .order('nome', { ascending: true });

    if (error) {
        throw new Error(error.message);
    }
    return data || [];
}

/** Cria categoria se não existir, ou retorna o ID se já for numérico. */
export async function criarCategoriaSeNecesaria(categoriaOuId) {
    if (!categoriaOuId) return null;

    // Se já for um ID numérico ou string numérica, valida se a categoria existe
    if (typeof categoriaOuId === 'number' || (typeof categoriaOuId === 'string' && /^\d+$/.test(categoriaOuId.trim()))) {
        const idNum = Number(categoriaOuId);
        const { data: existId } = await supabase
            .from('categorias')
            .select('id')
            .eq('id', idNum)
            .maybeSingle();

        if (existId) return existId.id;
    }

    const nomeLimpo = String(categoriaOuId).trim();
    if (!nomeLimpo) return null;

    const { data: existing, error: errExist } = await supabase
        .from('categorias')
        .select('id')
        .eq('nome', nomeLimpo)
        .maybeSingle();

    if (errExist) {
        throw new Error(errExist.message);
    }

    if (existing) return existing.id;

    const { data, error } = await supabase
        .from('categorias')
        .insert([{ nome: nomeLimpo }])
        .select('id')
        .single();

    if (error) {
        // Possível concorrência com chave única
        const { data: again, error: errAgain } = await supabase
            .from('categorias')
            .select('id')
            .eq('nome', nomeLimpo)
            .maybeSingle();

        if (again) return again.id;
        throw new Error(errAgain ? errAgain.message : error.message);
    }

    return data.id;
}

/** Garante que as categorias básicas existam. */
export async function garantirCategoriasBasicas() {
    const categorias = [
        'Alimentação', 'Beleza', 'Vestuário', 'Limpeza',
        'Eletrônicos', 'Brinquedos', 'Outros'
    ];
    for (const nome of categorias) {
        try {
            await criarCategoriaSeNecesaria(nome);
        } catch (err) {
            // Ignora se não puder inserir devido a RLS ou tabela já populada
        }
    }
}

/**
 * Busca produto por ID com categoria.
 */
export async function buscarProdutoPorId(id) {
    if (!id || isNaN(Number(id))) return null;
    const { data, error } = await supabase
        .from('produtos')
        .select(`
            id,
            nome,
            custo_pontos,
            categoria_id,
            categorias (
                id,
                nome
            )
        `)
        .eq('id', Number(id))
        .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return null;

    const cat = Array.isArray(data.categorias) ? data.categorias[0] : data.categorias;
    return {
        id: data.id,
        nome: data.nome,
        custo_pontos: data.custo_pontos,
        categoria_id: data.categoria_id,
        categoria_nome: cat?.nome ?? null
    };
}

/**
 * Atualiza os dados de um produto.
 */
export async function atualizarProduto(id, dados = {}) {
    if (!id || isNaN(Number(id))) throw new Error('ID_OBRIGATORIO');
    const idNum = Number(id);

    const { nome, preco, custo_pontos, categoria } = dados;
    const nomeLimpo = nome ? nome.trim() : '';
    if (!nomeLimpo) {
        throw new Error('CAMPOS_VAZIOS');
    }

    const pontosValor = custo_pontos !== undefined && custo_pontos !== null && custo_pontos !== ''
        ? custo_pontos
        : preco;

    if (pontosValor === undefined || pontosValor === null || isNaN(Number(pontosValor))) {
        throw new Error('CAMPOS_VAZIOS');
    }

    let categoria_id = null;
    if (categoria) {
        categoria_id = await criarCategoriaSeNecesaria(categoria);
    }

    const updateObj = {
        nome: nomeLimpo,
        custo_pontos: parseInt(pontosValor, 10)
    };
    if (categoria_id !== null) {
        updateObj.categoria_id = categoria_id;
    }

    const { data, error } = await supabase
        .from('produtos')
        .update(updateObj)
        .eq('id', idNum)
        .select(`
            id,
            nome,
            custo_pontos,
            categoria_id,
            categorias (
                nome
            )
        `)
        .single();

    if (error) {
        throw new Error(error.message);
    }
    if (!data) {
        throw new Error('NAO_ENCONTRADO');
    }

    const cat = Array.isArray(data.categorias) ? data.categorias[0] : data.categorias;
    return {
        id: data.id,
        nome: data.nome,
        custo_pontos: data.custo_pontos,
        categoria_id: data.categoria_id,
        categoria_nome: cat?.nome ?? null
    };
}
