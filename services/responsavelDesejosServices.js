import { supabase } from '../config/supabase.js';
import { processarDesejoComoCompra } from './desejosServices.js';
import { resolverAvatarAluno } from './avatarService.js';

/**
 * Busca desejos pendentes de um aluno.
 */
export async function puxarDesejosDoAluno(alunoId) {
    if (!alunoId) {
        throw new Error('CAMPOS_VAZIOS');
    }

    const { data, error } = await supabase
        .from('desejos')
        .select(`
            id,
            aluno_id,
            produto_id,
            criado_em,
            produtos (
                nome,
                custo_pontos
            )
        `)
        .eq('aluno_id', Number(alunoId))
        .order('criado_em', { ascending: false });

    if (error) {
        throw new Error(error.message);
    }

    return (data || []).map(d => {
        const p = Array.isArray(d.produtos) ? d.produtos[0] : d.produtos;
        return {
            id: d.id,
            aluno_id: d.aluno_id,
            produto_id: d.produto_id,
            criado_em: d.criado_em,
            produto_nome: p?.nome ?? null,
            custo_pontos: p?.custo_pontos ?? 0
        };
    });
}

/**
 * Adiciona um desejo à lista do aluno.
 */
export async function adicionarDesejo(alunoId, produtoId) {
    if (!alunoId || !produtoId) {
        throw new Error('CAMPOS_VAZIOS');
    }

    const aId = Number(alunoId);
    const pId = Number(produtoId);

    // Verifica se já existe esse desejo
    const { data: existing, error: errExist } = await supabase
        .from('desejos')
        .select('id')
        .eq('aluno_id', aId)
        .eq('produto_id', pId)
        .maybeSingle();

    if (errExist) {
        throw new Error(errExist.message);
    }
    if (existing) {
        throw new Error('DESEJO_EXISTENTE');
    }

    const { data, error } = await supabase
        .from('desejos')
        .insert([{ aluno_id: aId, produto_id: pId }])
        .select('id')
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return { id: data.id, aluno_id: aId, produto_id: pId };
}

/**
 * Busca todos os filhos de um responsável com seus saldos.
 */
export async function getFilhosComSaldos(responsavelId) {
    if (!responsavelId) {
        throw new Error('CAMPOS_VAZIOS');
    }

    const { data, error } = await supabase
        .from('alunos')
        .select(`
            id,
            nome,
            pontos,
            pode_comprar,
            turma_id,
            turmas (
                serie,
                turma
            )
        `)
        .eq('responsavel_id', Number(responsavelId))
        .order('nome', { ascending: true });

    if (error) {
        throw new Error(error.message);
    }

    return (data || []).map(a => {
        const t = Array.isArray(a.turmas) ? a.turmas[0] : a.turmas;
        const podeComprarBool = a.pode_comprar === true || a.pode_comprar === 1;
        return {
            id: a.id,
            nome: a.nome,
            avatar: resolverAvatarAluno(a.id, a.avatar),
            pontos: a.pontos,
            pode_comprar: podeComprarBool,
            turma_id: a.turma_id,
            serie: t?.serie ?? null,
            turma: t?.turma ?? null
        };
    });
}

/**
 * Busca os desejos de todos os filhos de um responsável.
 */
export async function getDesejosDosFilhos(responsavelId) {
    if (!responsavelId) {
        throw new Error('CAMPOS_VAZIOS');
    }

    const { data: filhos, error } = await supabase
        .from('alunos')
        .select('id, nome')
        .eq('responsavel_id', Number(responsavelId));

    if (error) {
        throw new Error(error.message);
    }

    const resultado = [];
    for (const filho of (filhos || [])) {
        const desejos = await puxarDesejosDoAluno(filho.id);
        resultado.push({
            aluno: {
                id: filho.id,
                nome: filho.nome,
                avatar: resolverAvatarAluno(filho.id, filho.avatar)
            },
            desejos: desejos
        });
    }
    return resultado;
}

/**
 * Converte um desejo em compra real (autorizado pelo responsável).
 * Delega para processarDesejoComoCompra para garantir movimentação para Pendentes de Entrega.
 */
export async function comprarDesejo(alunoId, produtoId, autorizadoPor = null) {
    return processarDesejoComoCompra(alunoId, produtoId, autorizadoPor);
}
