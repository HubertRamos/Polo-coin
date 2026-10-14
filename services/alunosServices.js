import { supabase } from '../config/supabase.js';
import { resolverAvatarAluno, salvarAvatarAluno, checarSuporteAvatar } from './avatarService.js';

export async function criarAlunoComResponsavel(turmaId, nomeAluno, nomeResponsavel, senhaAluno, senhaResponsavel) {
    const alunoNomeLimpo = nomeAluno ? nomeAluno.trim() : '';
    const respNomeLimpo = nomeResponsavel ? nomeResponsavel.trim() : '';
    const alunoSenhaLimpa = senhaAluno ? senhaAluno.trim() : '';
    const respSenhaLimpa = senhaResponsavel ? senhaResponsavel.trim() : '';

    if (!turmaId || !alunoNomeLimpo || !respNomeLimpo || !alunoSenhaLimpa || !respSenhaLimpa) {
        throw new Error('CAMPOS_VAZIOS');
    }

    const turmaIdNum = Number(turmaId);

    // 1. Verifica se o aluno já existe nesta turma
    const { data: alunoExistente, error: errAlunoExist } = await supabase
        .from('alunos')
        .select('id')
        .eq('turma_id', turmaIdNum)
        .eq('nome', alunoNomeLimpo)
        .maybeSingle();

    if (errAlunoExist) {
        throw new Error(errAlunoExist.message);
    }

    if (alunoExistente) {
        throw new Error('DUPLICADO');
    }

    // 2. Verifica se o responsável já existe (evita duplicação)
    const { data: respExistente, error: errRespExist } = await supabase
        .from('responsaveis')
        .select('id')
        .eq('nome', respNomeLimpo)
        .maybeSingle();

    if (errRespExist) {
        throw new Error(errRespExist.message);
    }

    let responsavelId;
    if (respExistente) {
        responsavelId = respExistente.id;
    } else {
        const { data: novoResp, error: errNovoResp } = await supabase
            .from('responsaveis')
            .insert([{ nome: respNomeLimpo, password: respSenhaLimpa }])
            .select('id')
            .single();

        if (errNovoResp) {
            throw new Error(errNovoResp.message);
        }
        responsavelId = novoResp.id;
    }

    // 3. Insere o aluno vinculado à turma e ao responsável (pode_comprar padrão: false - compras bloqueadas até liberação do responsável)
    const { error: errInsertAluno } = await supabase
        .from('alunos')
        .insert([{
            turma_id: turmaIdNum,
            responsavel_id: responsavelId,
            nome: alunoNomeLimpo,
            password: alunoSenhaLimpa,
            pode_comprar: false
        }]);

    if (errInsertAluno) {
        throw new Error(errInsertAluno.message);
    }
}

export async function puxarAlunosPorTurma(turmaId) {
    if (!turmaId) {
        throw new Error('CAMPOS_VAZIOS');
    }

    const temAvatar = await checarSuporteAvatar();
    const selectQuery = temAvatar ? `
        id,
        nome,
        avatar,
        pontos,
        pode_comprar,
        responsaveis (
            nome
        )
    ` : `
        id,
        nome,
        pontos,
        pode_comprar,
        responsaveis (
            nome
        )
    `;

    const { data, error } = await supabase
        .from('alunos')
        .select(selectQuery)
        .eq('turma_id', Number(turmaId))
        .order('nome', { ascending: true });

    if (error) {
        throw new Error(error.message);
    }

    return (data || []).map(a => {
        const resp = Array.isArray(a.responsaveis) ? a.responsaveis[0] : a.responsaveis;
        return {
            id: a.id,
            aluno_nome: a.nome,
            avatar: resolverAvatarAluno(a.id, a.avatar),
            pontos: a.pontos ?? 0,
            pode_comprar: a.pode_comprar ?? false,
            responsavel_nome: resp?.nome ?? null
        };
    });
}

/**
 * Busca avaliações (ocorrências) de um aluno específico.
 */
export async function puxarAvaliacoesDoAluno(alunoId) {
    if (!alunoId) {
        throw new Error('CAMPOS_VAZIOS');
    }

    const { data, error } = await supabase
        .from('avaliacoes')
        .select(`
            id,
            categoria,
            valor,
            pontos,
            observacao,
            criado_em,
            alunos (
                nome,
                turmas (
                    serie,
                    turma
                )
            )
        `)
        .eq('aluno_id', Number(alunoId))
        .order('criado_em', { ascending: false });

    if (error) {
        throw new Error(error.message);
    }

    return (data || []).map(av => {
        const aluno = Array.isArray(av.alunos) ? av.alunos[0] : av.alunos;
        const turma = aluno?.turmas ? (Array.isArray(aluno.turmas) ? aluno.turmas[0] : aluno.turmas) : null;
        const ts = av.criado_em ? new Date(av.criado_em) : null;

        return {
            avaliacao_id: av.id,
            categoria: av.categoria,
            valor: av.valor,
            pontos: av.pontos,
            observacao: av.observacao,
            data: ts ? ts.toISOString().slice(0, 10) : null,
            hora: ts ? ts.toISOString().slice(11, 19) : null,
            serie: turma?.serie ?? null,
            turma: turma?.turma ?? null,
            aluno_nome: aluno?.nome ?? null,
            aluno_avatar: resolverAvatarAluno(Number(alunoId), aluno?.avatar)
        };
    });
}

/**
 * Atualiza a senha de um aluno.
 */
export async function atualizarSenhaAluno(alunoId, senhaAtual, novaSenha) {
    if (!alunoId || !novaSenha) {
        throw new Error('CAMPOS_VAZIOS');
    }

    const alunoIdNum = Number(alunoId);

    // Verifica senha atual se fornecida
    if (senhaAtual) {
        const { data: aluno, error: errBusca } = await supabase
            .from('alunos')
            .select('password')
            .eq('id', alunoIdNum)
            .maybeSingle();

        if (errBusca) {
            throw new Error(errBusca.message);
        }
        if (!aluno) {
            throw new Error('ALUNO_NAO_ENCONTRADO');
        }
        if (aluno.password !== senhaAtual) {
            throw new Error('SENHA_ATUAL_INVALIDA');
        }
    }

    // Atualiza a senha
    const { error: errUpdate } = await supabase
        .from('alunos')
        .update({ password: novaSenha.trim() })
        .eq('id', alunoIdNum);

    if (errUpdate) {
        throw new Error(errUpdate.message);
    }

    return { success: true };
}

/**
 * Busca um aluno completo pelo ID, incluindo informações do responsável e da turma.
 */
export async function buscarAlunoPorId(alunoId) {
    if (!alunoId || isNaN(Number(alunoId))) return null;
    const temAvatar = await checarSuporteAvatar();
    const selectQuery = temAvatar ? `
        id,
        nome,
        password,
        avatar,
        turma_id,
        responsavel_id,
        pontos,
        pode_comprar,
        responsaveis (
            id,
            nome
        ),
        turmas (
            id,
            serie,
            turma
        )
    ` : `
        id,
        nome,
        password,
        turma_id,
        responsavel_id,
        pontos,
        pode_comprar,
        responsaveis (
            id,
            nome
        ),
        turmas (
            id,
            serie,
            turma
        )
    `;

    const { data, error } = await supabase
        .from('alunos')
        .select(selectQuery)
        .eq('id', Number(alunoId))
        .maybeSingle();

    if (error) {
        throw new Error(error.message);
    }
    if (!data) return null;

    const resp = Array.isArray(data.responsaveis) ? data.responsaveis[0] : data.responsaveis;
    const turm = Array.isArray(data.turmas) ? data.turmas[0] : data.turmas;

    return {
        id: data.id,
        nome: data.nome,
        avatar: resolverAvatarAluno(data.id, data.avatar),
        turma_id: data.turma_id,
        responsavel_id: data.responsavel_id,
        pontos: data.pontos,
        pode_comprar: data.pode_comprar,
        responsavel_nome: resp?.nome ?? null,
        turma_nome: turm ? `${turm.serie} - ${turm.turma}` : null
    };
}

/**
 * Atualiza os dados de um aluno (e de seu responsável associado).
 */
export async function atualizarAluno(id, dados = {}) {
    if (!id || isNaN(Number(id))) {
        throw new Error('ID_OBRIGATORIO');
    }
    const idNum = Number(id);

    const {
        nomeAluno,
        nome,
        nomeResponsavel,
        senhaAluno,
        senhaResponsavel,
        turmaId,
        turma_id,
        pontos,
        pode_comprar,
        podeComprar
    } = dados;

    const finalNomeAluno = (nomeAluno || nome || '').trim();
    if (!finalNomeAluno) {
        throw new Error('CAMPOS_VAZIOS');
    }

    // Busca o aluno atual no banco
    const { data: alunoAtual, error: errAluno } = await supabase
        .from('alunos')
        .select('id, turma_id, responsavel_id')
        .eq('id', idNum)
        .maybeSingle();

    if (errAluno) throw new Error(errAluno.message);
    if (!alunoAtual) throw new Error('NAO_ENCONTRADO');

    const targetTurmaId = turmaId || turma_id || alunoAtual.turma_id;

    // Verifica se já existe outro aluno com o mesmo nome na turma
    const { data: existente, error: errExist } = await supabase
        .from('alunos')
        .select('id')
        .eq('turma_id', Number(targetTurmaId))
        .eq('nome', finalNomeAluno)
        .neq('id', idNum)
        .maybeSingle();

    if (errExist) throw new Error(errExist.message);
    if (existente) throw new Error('DUPLICADO');

    // 1. Atualizar ou vincular Responsável se informado
    const finalNomeResp = (nomeResponsavel || '').trim();
    let responsavelId = alunoAtual.responsavel_id;

    if (finalNomeResp) {
        if (responsavelId) {
            const respUpdate = { nome: finalNomeResp };
            if (senhaResponsavel && senhaResponsavel.trim()) {
                respUpdate.password = senhaResponsavel.trim();
            }
            await supabase
                .from('responsaveis')
                .update(respUpdate)
                .eq('id', responsavelId);
        } else {
            const { data: respExist } = await supabase
                .from('responsaveis')
                .select('id')
                .eq('nome', finalNomeResp)
                .maybeSingle();

            if (respExist) {
                responsavelId = respExist.id;
            } else {
                const { data: novoResp } = await supabase
                    .from('responsaveis')
                    .insert([{ nome: finalNomeResp, password: (senhaResponsavel || '1234').trim() }])
                    .select('id')
                    .single();
                if (novoResp) responsavelId = novoResp.id;
            }
        }
    }

    // 2. Monta objeto de atualização do Aluno
    const alunoUpdate = {
        nome: finalNomeAluno,
        turma_id: Number(targetTurmaId),
        responsavel_id: responsavelId
    };

    if (senhaAluno && senhaAluno.trim()) {
        alunoUpdate.password = senhaAluno.trim();
    }
    if (pontos !== undefined && pontos !== null && !isNaN(pontos)) {
        alunoUpdate.pontos = Number(pontos);
    }
    if (pode_comprar !== undefined) {
        alunoUpdate.pode_comprar = Boolean(pode_comprar);
    } else if (podeComprar !== undefined) {
        alunoUpdate.pode_comprar = Boolean(podeComprar);
    }

    if (dados.avatar !== undefined && dados.avatar !== null) {
        await salvarAvatarAluno(idNum, dados.avatar);
    }

    const { data: alunoAtualizado, error: errUpdate } = await supabase
        .from('alunos')
        .update(alunoUpdate)
        .eq('id', idNum)
        .select(`
            id,
            nome,
            turma_id,
            responsavel_id,
            pontos,
            pode_comprar
        `)
        .single();

    if (errUpdate) {
        if (errUpdate.code === '23505') throw new Error('DUPLICADO');
        throw new Error(errUpdate.message);
    }

    return {
        ...alunoAtualizado,
        avatar: resolverAvatarAluno(idNum)
    };
}

export { salvarAvatarAluno };
