import { supabase } from '../config/supabase.js';
import { resolverTipoOcorrencia } from './avaliacoesServices.js';
import { resolverAvatarAluno } from './avatarService.js';

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
 * Gera relatório filtrado das ocorrências de um aluno específico.
 * Inclui ocorrências registradas por TODOS os professores.
 */
export async function gerarRelatorioAluno({ alunoId, dataInicio, dataFim, tipo, ordem = 'recentes' }) {
    if (!alunoId) {
        throw new Error('ID do aluno não fornecido.');
    }

    const alunoIdNum = Number(alunoId);

    // 1. Busca dados do aluno e sua turma
    const { data: aluno, error: errAluno } = await supabase
        .from('alunos')
        .select(`
            id,
            nome,
            pontos,
            turma_id,
            turmas (
                id,
                serie,
                turma
            ),
            responsaveis (
                nome
            )
        `)
        .eq('id', alunoIdNum)
        .maybeSingle();

    if (errAluno) throw new Error(errAluno.message);
    if (!aluno) throw new Error('Aluno não encontrado.');

    const turmaObj = Array.isArray(aluno.turmas) ? aluno.turmas[0] : aluno.turmas;
    const respObj = Array.isArray(aluno.responsaveis) ? aluno.responsaveis[0] : aluno.responsaveis;
    const turmaNome = turmaObj ? `${turmaObj.serie}º ${turmaObj.turma}` : 'N/A';

    // 2. Monta consulta de ocorrências filtradas
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

    let query = supabase
        .from('avaliacoes')
        .select(selectFields)
        .eq('aluno_id', alunoIdNum);

    // Filtro por período
    if (dataInicio) {
        query = query.gte('criado_em', `${dataInicio}T00:00:00.000Z`);
    }
    if (dataFim) {
        query = query.lte('criado_em', `${dataFim}T23:59:59.999Z`);
    }

    // Ordenação
    const asc = ordem === 'antigas';
    query = query.order('criado_em', { ascending: asc });

    const { data: rawOcorrencias, error: errOcorrencias } = await query;
    if (errOcorrencias) throw new Error(errOcorrencias.message);

    // 3. Processamento das ocorrências e estatísticas com resolução canônica de tipo
    let totalPositivas = 0;
    let totalNegativas = 0;
    let polocoinsGanhos = 0;
    let polocoinsRetirados = 0;

    const todasOcorrencias = (rawOcorrencias || []).map(r => {
        const ts = r.criado_em ? new Date(r.criado_em) : null;
        const prof = Array.isArray(r.professores) ? r.professores[0] : r.professores;
        const tipoFinal = resolverTipoOcorrencia(r.tipo, r.pontos, r.valor);
        const pts = Number(r.pontos) || 0;

        if (tipoFinal === 'negativa') {
            totalNegativas++;
            polocoinsRetirados += Math.abs(pts);
        } else {
            totalPositivas++;
            polocoinsGanhos += Math.abs(pts);
        }

        return {
            id: r.id,
            professor_id: r.professor_id,
            professor_nome: prof?.name ?? 'Não informado',
            categoria: r.categoria,
            valor: r.valor,
            tipo: tipoFinal,
            pontos: pts,
            observacao: r.observacao,
            data: ts ? ts.toISOString().slice(0, 10) : null,
            hora: ts ? ts.toISOString().slice(11, 19) : null,
            criado_em: r.criado_em
        };
    });

    // Aplica o filtro de tipo garantindo compatibilidade com registros antigos
    const ocorrencias = tipoFiltro && (tipoFiltro === 'positiva' || tipoFiltro === 'negativa')
        ? todasOcorrencias.filter(o => o.tipo === tipoFiltro)
        : todasOcorrencias;

    const saldoLiquido = polocoinsGanhos - polocoinsRetirados;

    return {
        aluno: {
            id: aluno.id,
            nome: aluno.nome,
            avatar: resolverAvatarAluno(aluno.id, aluno.avatar),
            turma_id: aluno.turma_id,
            turma_nome: turmaNome,
            responsavel_nome: respObj?.nome ?? 'Não informado',
            saldo_atual: aluno.pontos ?? 0
        },
        filtrosAplicados: {
            dataInicio: dataInicio || null,
            dataFim: dataFim || null,
            tipo: tipoFiltro || 'todas',
            ordem: ordem || 'recentes'
        },
        estatisticas: {
            totalOcorrencias: ocorrencias.length,
            totalPositivas,
            totalNegativas,
            polocoinsGanhos,
            polocoinsRetirados,
            saldoLiquido
        },
        ocorrencias
    };
}

/**
 * Gera relatório filtrado das ocorrências de uma turma inteira (ou agrupado por aluno).
 * Inclui ocorrências registradas por TODOS os professores.
 */
export async function gerarRelatorioTurma({ turmaId, alunoId, dataInicio, dataFim, tipo, ordem = 'recentes' }) {
    if (!turmaId) {
        throw new Error('ID da turma não fornecido.');
    }

    const turmaIdNum = Number(turmaId);

    // 1. Busca dados da turma
    const { data: turma, error: errTurma } = await supabase
        .from('turmas')
        .select('*')
        .eq('id', turmaIdNum)
        .maybeSingle();

    if (errTurma) throw new Error(errTurma.message);
    if (!turma) throw new Error('Turma não encontrada.');

    const turmaNome = `${turma.serie}º ${turma.turma}`;

    // 2. Busca alunos da turma (filtrados caso alunoId específico tenha sido passado)
    let alunosQuery = supabase
        .from('alunos')
        .select('id, nome, pontos')
        .eq('turma_id', turmaIdNum)
        .order('nome', { ascending: true });

    if (alunoId) {
        alunosQuery = alunosQuery.eq('id', Number(alunoId));
    }

    const { data: alunos, error: errAlunos } = await alunosQuery;
    if (errAlunos) throw new Error(errAlunos.message);
    if (!alunos || alunos.length === 0) {
        return {
            turma: { id: turma.id, serie: turma.serie, turma: turma.turma, turma_nome: turmaNome },
            filtrosAplicados: { dataInicio: dataInicio || null, dataFim: dataFim || null, tipo: tipo || 'todas', alunoId: alunoId || null, ordem },
            alunos: [],
            resumoGeral: { totalAlunos: 0, totalOcorrencias: 0, totalPositivas: 0, totalNegativas: 0, polocoinsConcedidos: 0, polocoinsRetirados: 0, saldoLiquido: 0 }
        };
    }

    const alunoIds = alunos.map(a => a.id);
    const alunoMap = new Map(alunos.map(a => [a.id, a]));

    // 3. Monta busca de ocorrências para os alunos da turma
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
        professores (
            name
        )
    `;

    let query = supabase
        .from('avaliacoes')
        .select(selectFields)
        .in('aluno_id', alunoIds);

    // Filtros de período
    if (dataInicio) {
        query = query.gte('criado_em', `${dataInicio}T00:00:00.000Z`);
    }
    if (dataFim) {
        query = query.lte('criado_em', `${dataFim}T23:59:59.999Z`);
    }

    // Ordenação
    const asc = ordem === 'antigas';
    query = query.order('criado_em', { ascending: asc });

    const { data: rawOcorrencias, error: errOcorrencias } = await query;
    if (errOcorrencias) throw new Error(errOcorrencias.message);

    // 4. Agrupamento por aluno e cálculo dos resumos com classificação canônica
    const ocorrenciasPorAluno = new Map();
    alunoIds.forEach(id => ocorrenciasPorAluno.set(id, []));

    let geralTotalPositivas = 0;
    let geralTotalNegativas = 0;
    let geralPolocoinsConcedidos = 0;
    let geralPolocoinsRetirados = 0;

    for (const r of (rawOcorrencias || [])) {
        const ts = r.criado_em ? new Date(r.criado_em) : null;
        const prof = Array.isArray(r.professores) ? r.professores[0] : r.professores;
        const tipoFinal = resolverTipoOcorrencia(r.tipo, r.pontos, r.valor);
        const pts = Number(r.pontos) || 0;

        // Filtro canônico por tipo se especificado
        if (tipoFiltro && (tipoFiltro === 'positiva' || tipoFiltro === 'negativa') && tipoFinal !== tipoFiltro) {
            continue;
        }

        if (tipoFinal === 'negativa') {
            geralTotalNegativas++;
            geralPolocoinsRetirados += Math.abs(pts);
        } else {
            geralTotalPositivas++;
            geralPolocoinsConcedidos += Math.abs(pts);
        }

        const item = {
            id: r.id,
            aluno_id: r.aluno_id,
            professor_id: r.professor_id,
            professor_nome: prof?.name ?? 'Não informado',
            categoria: r.categoria,
            valor: r.valor,
            tipo: tipoFinal,
            pontos: pts,
            observacao: r.observacao,
            data: ts ? ts.toISOString().slice(0, 10) : null,
            hora: ts ? ts.toISOString().slice(11, 19) : null,
            criado_em: r.criado_em
        };

        if (ocorrenciasPorAluno.has(r.aluno_id)) {
            ocorrenciasPorAluno.get(r.aluno_id).push(item);
        }
    }

    // Monta a estrutura final agrupada por aluno com totais individuais
    const alunosRelatorio = [];
    for (const aluno of alunos) {
        const listaOcorrencias = ocorrenciasPorAluno.get(aluno.id) || [];
        let alunoPos = 0;
        let alunoNeg = 0;
        let alunoGanhos = 0;
        let alunoRetirados = 0;

        for (const oc of listaOcorrencias) {
            if (oc.tipo === 'negativa') {
                alunoNeg++;
                alunoRetirados += Math.abs(oc.pontos);
            } else {
                alunoPos++;
                alunoGanhos += Math.abs(oc.pontos);
            }
        }

        alunosRelatorio.push({
            aluno_id: aluno.id,
            aluno_nome: aluno.nome,
            aluno_avatar: resolverAvatarAluno(aluno.id, aluno.avatar),
            saldo_atual: aluno.pontos ?? 0,
            ocorrencias: listaOcorrencias,
            resumo: {
                totalOcorrencias: listaOcorrencias.length,
                totalPositivas: alunoPos,
                totalNegativas: alunoNeg,
                polocoinsGanhos: alunoGanhos,
                polocoinsRetirados: alunoRetirados,
                saldoLiquido: alunoGanhos - alunoRetirados
            }
        });
    }

    const geralSaldoLiquido = geralPolocoinsConcedidos - geralPolocoinsRetirados;

    return {
        turma: {
            id: turma.id,
            serie: turma.serie,
            turma: turma.turma,
            turma_nome: turmaNome
        },
        filtrosAplicados: {
            dataInicio: dataInicio || null,
            dataFim: dataFim || null,
            tipo: tipoFiltro || 'todas',
            alunoId: alunoId ? Number(alunoId) : null,
            ordem: ordem || 'recentes'
        },
        alunos: alunosRelatorio,
        resumoGeral: {
            totalAlunos: alunosRelatorio.length,
            totalOcorrencias: (rawOcorrencias || []).length,
            totalPositivas: geralTotalPositivas,
            totalNegativas: geralTotalNegativas,
            polocoinsConcedidos: geralPolocoinsConcedidos,
            polocoinsRetirados: geralPolocoinsRetirados,
            saldoLiquido: geralSaldoLiquido
        }
    };
}
