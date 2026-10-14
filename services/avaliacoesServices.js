import { supabase } from '../config/supabase.js';
import { resolverAvatarAluno } from './avatarService.js';
import { creditarPontos, debitarPontosOcorrencia } from './pontosServices.js';

export const VALORES_OCORRENCIAS_NEGATIVAS = [
    'bagunça', 'bagunca', 'desmotivado', 'não entregou', 'nao entregou', 'conflituante',
    'isolado', 'desinteressado', 'indiferente', 'atrasado', 'desrespeito', 'desrespeito_prof',
    'uso_inadequado', 'uso inadequado', 'agitado', 'danificou', 'atraso'
];

export const VALORES_OCORRENCIAS_POSITIVAS = [
    'produtivo', 'participou', 'participou_aula', 'calmo', 'comprometido',
    'concluiu', 'concluiu_atividade', 'proativo', 'ajudou', 'ajudou_colegas',
    'colaborador', 'líder', 'lider', 'no prazo', 'no_prazo', 'antecipou', 'elogio'
];

/**
 * Resolve o tipo da ocorrência com garantia estrutural e migração de registros legados.
 * A classificação das ocorrências padrão é intrínseca e canônica:
 * "Bagunça em sala", "Desrespeito ao professor", "Não entregou atividade" etc. são SEMPRE negativas.
 * "Participou da aula", "Ajudou colegas", "Concluiu atividade" etc. são SEMPRE positivas.
 */
export function resolverTipoOcorrencia(tipo, pontos, valor) {
    const v = String(valor || '').toLowerCase().trim();

    // 1. Verificação canônica pelas ocorrências padrão conhecidas (não depende de input manual)
    if (v && VALORES_OCORRENCIAS_NEGATIVAS.some(neg => v.includes(neg))) {
        return 'negativa';
    }
    if (v && VALORES_OCORRENCIAS_POSITIVAS.some(pos => v.includes(pos))) {
        return 'positiva';
    }

    // 2. Se for ocorrência personalizada ou avulsa com tipo definido
    if (tipo) {
        const t = String(tipo).toLowerCase().trim();
        if (t === 'negativa' || t === 'positiva') return t;
    }

    // 3. Pelo sinal dos pontos registrados
    const pts = Number(pontos);
    if (!isNaN(pts) && pts < 0) return 'negativa';
    if (!isNaN(pts) && pts > 0) return 'positiva';

    // 4. Regra de migração segura para registros legados sem tipo: padrão negativa
    return 'negativa';
}

let suporteColunaTipo = null;
async function checarSuporteTipo() {
    if (suporteColunaTipo !== null) return suporteColunaTipo;
    try {
        const { error } = await supabase.from('avaliacoes').select('tipo').limit(1);
        suporteColunaTipo = !error;
    } catch {
        suporteColunaTipo = false;
    }
    return suporteColunaTipo;
}

/**
 * Cria uma nova avaliação para um aluno.
 * Aplica a regra do tipo ('positiva' ou 'negativa') e normaliza o valor usando Math.abs.
 * Se for positiva: valor final positivo e soma PoloCoins ao saldo.
 * Se for negativa: valor final negativo e deduz PoloCoins do saldo.
 */
export async function criarAvaliacao(alunoId, professorId, categoria, valor, pontos = 0, observacao = '', tipo = 'positiva') {
    if (!alunoId || !professorId || !categoria || valor === undefined || valor === null || valor === '') {
        throw new Error('CAMPOS_VAZIOS');
    }

    const alunoIdNum = Number(alunoId);
    const professorIdNum = Number(professorId);

    if (!alunoIdNum || !professorIdNum) {
        throw new Error('CAMPOS_VAZIOS');
    }

    // Normaliza tipo
    const tipoNormalizado = (tipo && String(tipo).toLowerCase().trim() === 'negativa') ? 'negativa' : 'positiva';

    // Normaliza valor informado com Math.abs
    const pontosValor = Number(pontos !== undefined ? pontos : valor) || 0;
    const valorNormalizado = Math.abs(pontosValor);
    const valorFinal = tipoNormalizado === 'negativa' ? -valorNormalizado : valorNormalizado;

    const temTipo = await checarSuporteTipo();
    const insertPayload = {
        aluno_id: alunoIdNum,
        professor_id: professorIdNum,
        categoria,
        valor: String(valor),
        pontos: valorFinal,
        observacao: observacao || null,
        consentido: false
    };

    if (temTipo) {
        insertPayload.tipo = tipoNormalizado;
    }

    let { data, error } = await supabase
        .from('avaliacoes')
        .insert([insertPayload])
        .select('id')
        .single();

    if (error && error.message && error.message.includes("'tipo'")) {
        suporteColunaTipo = false;
        delete insertPayload.tipo;
        const retry = await supabase
            .from('avaliacoes')
            .insert([insertPayload])
            .select('id')
            .single();
        data = retry.data;
        error = retry.error;
    }

    if (error) {
        throw new Error(error.message);
    }

    // Atualiza saldo do aluno conforme o tipo
    if (tipoNormalizado === 'negativa') {
        if (valorNormalizado > 0) {
            await debitarPontosOcorrencia(alunoIdNum, valorNormalizado);
        }
    } else {
        if (valorNormalizado > 0) {
            await creditarPontos(alunoIdNum, valorNormalizado);
        }
    }

    return {
        id: data.id,
        aluno_id: alunoIdNum,
        professor_id: professorIdNum,
        categoria,
        valor: String(valor),
        pontos: valorFinal,
        tipo: tipoNormalizado,
        observacao: observacao || null
    };
}

/**
 * Puxa todas as avaliações de um aluno, ordenadas por data (mais recente primeiro).
 * Retorna o histórico completo do aluno com tipo e nome do professor responsável.
 */
export async function puxarAvaliacoesPorAluno(alunoId, professorId = null) {
    if (!alunoId) {
        throw new Error('CAMPOS_VAZIOS');
    }

    const temTipo = await checarSuporteTipo();
    const selectFields = temTipo ? `
        id,
        professor_id,
        categoria,
        valor,
        tipo,
        pontos,
        observacao,
        criado_em,
        professores (
            name
        )
    ` : `
        id,
        professor_id,
        categoria,
        valor,
        pontos,
        observacao,
        criado_em,
        professores (
            name
        )
    `;

    const { data, error } = await supabase
        .from('avaliacoes')
        .select(selectFields)
        .eq('aluno_id', Number(alunoId))
        .order('criado_em', { ascending: false });

    if (error) {
        throw new Error(error.message);
    }

    return (data || []).map(r => {
        const ts = r.criado_em ? new Date(r.criado_em) : null;
        const prof = Array.isArray(r.professores) ? r.professores[0] : r.professores;
        const tipoFinal = resolverTipoOcorrencia(r.tipo, r.pontos, r.valor);
        return {
            id: r.id,
            professor_id: r.professor_id,
            categoria: r.categoria,
            valor: r.valor,
            tipo: tipoFinal,
            pontos: r.pontos,
            observacao: r.observacao,
            data: ts ? ts.toISOString().slice(0, 10) : null,
            hora: ts ? ts.toISOString().slice(11, 19) : null,
            aluno_id: Number(alunoId),
            aluno_avatar: resolverAvatarAluno(Number(alunoId)),
            professor_nome: prof?.name ?? null
        };
    });
}

/**
 * Puxa os ids dos alunos de uma turma.
 */
export async function puxarIdsAlunosDaTurma(turmaId) {
    if (!turmaId) {
        throw new Error('CAMPOS_VAZIOS');
    }

    const { data, error } = await supabase
        .from('alunos')
        .select('id')
        .eq('turma_id', Number(turmaId));

    if (error) {
        throw new Error(error.message);
    }
    return (data || []).map(r => r.id);
}

/**
 * Puxa todas as avaliações de uma turma, com nome dos alunos e professores.
 * Usada pelo painel "Ocorrências da Turma" do professor.
 */
export async function puxarAvaliacoesPorTurma(turmaId) {
    if (!turmaId) {
        throw new Error('CAMPOS_VAZIOS');
    }

    const alunoIds = await puxarIdsAlunosDaTurma(turmaId);
    if (!alunoIds || alunoIds.length === 0) {
        return [];
    }

    const temTipo = await checarSuporteTipo();
    const selectFields = temTipo ? `
        id,
        aluno_id,
        professor_id,
        categoria,
        valor,
        tipo,
        pontos,
        observacao,
        criado_em,
        alunos (
            nome
        ),
        professores (
            name
        )
    ` : `
        id,
        aluno_id,
        professor_id,
        categoria,
        valor,
        pontos,
        observacao,
        criado_em,
        alunos (
            nome
        ),
        professores (
            name
        )
    `;

    const { data, error } = await supabase
        .from('avaliacoes')
        .select(selectFields)
        .in('aluno_id', alunoIds)
        .order('criado_em', { ascending: false });

    if (error) {
        throw new Error(error.message);
    }

    return (data || []).map(a => {
        const ts = a.criado_em ? new Date(a.criado_em) : null;
        const aluno = Array.isArray(a.alunos) ? a.alunos[0] : a.alunos;
        const prof = Array.isArray(a.professores) ? a.professores[0] : a.professores;
        const tipoFinal = resolverTipoOcorrencia(a.tipo, a.pontos, a.valor);
        return {
            id: a.id,
            aluno_id: a.aluno_id,
            professor_id: a.professor_id,
            categoria: a.categoria,
            valor: a.valor,
            tipo: tipoFinal,
            pontos: a.pontos,
            observacao: a.observacao,
            data: ts ? ts.toISOString().slice(0, 10) : null,
            hora: ts ? ts.toISOString().slice(11, 19) : null,
            aluno_nome: aluno?.nome ?? null,
            aluno_avatar: resolverAvatarAluno(a.aluno_id, aluno?.avatar),
            professor_nome: prof?.name ?? null
        };
    });
}
