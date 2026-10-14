import { supabase } from '../config/supabase.js';

/**
 * Retorna o saldo atual de pontos de um aluno.
 */
export async function getSaldoPontos(alunoId) {
    if (!alunoId) return 0;
    try {
        const { data, error } = await supabase
            .from('alunos')
            .select('pontos')
            .eq('id', Number(alunoId))
            .maybeSingle();

        if (error) {
            console.error('Erro ao buscar saldo de pontos:', error.message);
            return 0;
        }
        if (!data) return 0;
        return data.pontos ?? 0;
    } catch {
        return 0;
    }
}

/**
 * Adiciona pontos à conta do aluno (ex: avaliação positiva).
 */
export async function creditarPontos(alunoId, quantidade) {
    const idNum = Number(alunoId);
    const qtdNum = Math.abs(Number(quantidade)) || 0;

    const saldoAtual = await getSaldoPontos(idNum);
    const novoSaldo = (Number(saldoAtual) || 0) + qtdNum;

    const { error } = await supabase
        .from('alunos')
        .update({ pontos: novoSaldo })
        .eq('id', idNum);

    if (error) {
        throw new Error(error.message);
    }
    return novoSaldo;
}

/**
 * Remove pontos da conta do aluno em decorrência de ocorrência negativa.
 * Reduz o saldo do aluno, respeitando o limite mínimo de 0.
 */
export async function debitarPontosOcorrencia(alunoId, quantidade) {
    const idNum = Number(alunoId);
    const qtdNum = Math.abs(Number(quantidade)) || 0;
    if (qtdNum === 0) return await getSaldoPontos(idNum);

    const saldoAtual = await getSaldoPontos(idNum);
    const novoSaldo = Math.max(0, (Number(saldoAtual) || 0) - qtdNum);

    const { error } = await supabase
        .from('alunos')
        .update({ pontos: novoSaldo })
        .eq('id', idNum);

    if (error) {
        throw new Error(error.message);
    }
    return novoSaldo;
}

/**
 * Remove pontos da conta do aluno (ex: compra).
 * Retorna o novo saldo.
 * Lança erro se saldo insuficiente ou aluno não encontrado.
 */
export async function deduzirPontos(alunoId, quantidade) {
    const idNum = Number(alunoId);
    const qtdNum = Number(quantidade) || 0;

    const { data: aluno, error } = await supabase
        .from('alunos')
        .select('pontos')
        .eq('id', idNum)
        .maybeSingle();

    if (error) {
        throw new Error(error.message);
    }
    if (!aluno) {
        throw new Error('ALUNO_NAO_ENCONTRADO');
    }

    const saldo = aluno.pontos ?? 0;
    if (saldo < qtdNum) {
        throw new Error('SALDO_INSUFICIENTE');
    }

    const novoSaldo = saldo - qtdNum;

    const { error: errUpdate } = await supabase
        .from('alunos')
        .update({ pontos: novoSaldo })
        .eq('id', idNum);

    if (errUpdate) {
        throw new Error(errUpdate.message);
    }
    return novoSaldo;
}
