import { supabase } from '../config/supabase.js';
import { resolverAvatarAluno } from './avatarService.js';

/**
 * Busca todas as compras registradas com detalhes do aluno, produto e responsável.
 */
export async function puxarTodasCompras() {
    const { data, error } = await supabase
        .from('compras')
        .select(`
            id,
            aluno_id,
            produto_id,
            custo_pontos,
            autorizado_por,
            criado_em,
            entregue,
            alunos (
                nome,
                turma_id,
                turmas (
                    serie,
                    turma
                )
            ),
            produtos (
                nome,
                categoria_id,
                categorias (
                    nome
                )
            ),
            responsaveis (
                nome
            )
        `)
        .order('criado_em', { ascending: false });

    if (error) {
        throw new Error(error.message);
    }

    return (data || []).map(c => {
        const aluno = Array.isArray(c.alunos) ? c.alunos[0] : c.alunos;
        const turma = aluno?.turmas ? (Array.isArray(aluno.turmas) ? aluno.turmas[0] : aluno.turmas) : null;
        const prod = Array.isArray(c.produtos) ? c.produtos[0] : c.produtos;
        const cat = prod?.categorias ? (Array.isArray(prod.categorias) ? prod.categorias[0] : prod.categorias) : null;
        const resp = Array.isArray(c.responsaveis) ? c.responsaveis[0] : c.responsaveis;

        const serie = turma?.serie ?? null;
        const turmaLetra = turma?.turma ?? null;
        const turmaNome = (serie !== null && turmaLetra !== null) ? `${serie}${turmaLetra}` : null;
        const entregueBool = c.entregue === true || c.entregue === 1;

        return {
            id: c.id,
            aluno_id: c.aluno_id,
            aluno_nome: aluno?.nome ?? null,
            aluno_avatar: resolverAvatarAluno(c.aluno_id, aluno?.avatar),
            turma_id: aluno?.turma_id ?? null,
            serie,
            turma: turmaLetra,
            turma_nome: turmaNome,
            produto_id: c.produto_id,
            produto_nome: prod?.nome ?? null,
            categoria_id: prod?.categoria_id ?? null,
            categoria_nome: cat?.nome ?? null,
            custo_pontos: c.custo_pontos,
            autorizado_por: c.autorizado_por,
            responsavel_nome: resp?.nome ?? null,
            criado_em: c.criado_em,
            entregue: entregueBool
        };
    });
}

/**
 * Marca uma compra como entregue (entregue: true).
 */
export async function marcarEntrega(compraId) {
    if (!compraId) {
        throw new Error('CAMPOS_VAZIOS');
    }

    const { data, error } = await supabase
        .from('compras')
        .update({ entregue: true })
        .eq('id', Number(compraId))
        .select('id');

    if (error) {
        throw new Error(error.message);
    }
    return Boolean(data && data.length > 0);
}

/**
 * Busca o histórico de vendas dos últimos 7 dias.
 */
export async function puxarHistoricoVendas() {
    const seteDiasAtras = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
        .from('compras')
        .select(`
            id,
            aluno_id,
            produto_id,
            custo_pontos,
            autorizado_por,
            criado_em,
            entregue,
            alunos (
                nome
            ),
            produtos (
                nome,
                categoria_id,
                categorias (
                    nome
                )
            ),
            responsaveis (
                nome
            )
        `)
        .gte('criado_em', seteDiasAtras)
        .order('criado_em', { ascending: false });

    if (error) {
        throw new Error(error.message);
    }

    return (data || []).map(c => {
        const aluno = Array.isArray(c.alunos) ? c.alunos[0] : c.alunos;
        const prod = Array.isArray(c.produtos) ? c.produtos[0] : c.produtos;
        const cat = prod?.categorias ? (Array.isArray(prod.categorias) ? prod.categorias[0] : prod.categorias) : null;
        const resp = Array.isArray(c.responsaveis) ? c.responsaveis[0] : c.responsaveis;
        const entregueBool = c.entregue === true || c.entregue === 1;

        return {
            id: c.id,
            aluno_id: c.aluno_id,
            aluno_nome: aluno?.nome ?? null,
            aluno_avatar: resolverAvatarAluno(c.aluno_id, aluno?.avatar),
            produto_id: c.produto_id,
            produto_nome: prod?.nome ?? null,
            categoria_id: prod?.categoria_id ?? null,
            categoria_nome: cat?.nome ?? null,
            custo_pontos: c.custo_pontos,
            autorizado_por: c.autorizado_por,
            responsavel_nome: resp?.nome ?? null,
            criado_em: c.criado_em,
            entregue: entregueBool
        };
    });
}

/**
 * Remove compras com mais de 7 dias registradas.
 * Retorna o número de registros removidos.
 */
export async function limparHistoricoAntigo() {
    const seteDiasAtras = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
        .from('compras')
        .delete()
        .lt('criado_em', seteDiasAtras)
        .select('id');

    if (error) {
        throw new Error(error.message);
    }
    return data ? data.length : 0;
}
