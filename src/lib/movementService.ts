import { Turma, Aluno, Compra, Desejo, Avaliacao, MovimentacaoAluno } from '../types';

export interface PendingWarning {
  alunoId: number;
  alunoNome: string;
  tipo: 'entrega_pendente' | 'desejo_pendente' | 'ocorrencia_pendente';
  descricao: string;
}

export interface StudentProgressionItem {
  alunoId: number;
  alunoNome: string;
  alunoAvatar: string;
  alunoMatricula?: string;
  pontos: number;
  turmaOrigemId: number;
  turmaOrigemNome: string;
  anoLetivoOrigem: number;
  turmaDestinoId?: number; // Seleção atual de destino
  turmaDestinoNome?: string;
  anoLetivoDestino?: number;
  sugestaoAutomatica?: boolean;
  excluido: boolean; // Se marcado para não ser progredido
  motivoExclusao?: string;
  avisos: PendingWarning[];
  erroValidacao?: string;
}

export interface TransferValidationResult {
  valido: boolean;
  erros: string[];
  avisos: PendingWarning[];
  alunosValidados: Aluno[];
  turmaOrigem?: Turma;
  turmaDestino?: Turma;
}

export interface ProgressionValidationResult {
  valido: boolean;
  erros: string[];
  totalAlunos: number;
  totalAptos: number;
  totalExcluidos: number;
  totalSemDestino: number;
  distribuicaoDestinos: Record<string, number>; // "7º Ano A": 15
  avisosPendencias: PendingWarning[];
}

/**
 * Retorna os anos letivos disponíveis no sistema a partir das turmas cadastradas
 */
export function extrairAnosLetivos(turmas: Turma[]): number[] {
  const anosSet = new Set<number>();
  turmas.forEach(t => {
    const ano = t.anoLetivo || 2026;
    anosSet.add(ano);
  });
  if (anosSet.size === 0) {
    anosSet.add(2026);
  }
  return Array.from(anosSet).sort((a, b) => a - b);
}

/**
 * Formata o rótulo completo de uma turma garantindo distinção de anos e nomes
 * Ex: "1º Ano A (2026)" ou "2º Ano B [ID #12]"
 */
export function formatarNomeTurmaComAno(turma?: Turma | null): string {
  if (!turma) return 'Turma não selecionada';
  const ano = turma.anoLetivo || 2026;
  return `${turma.serie}º Ano ${turma.turma} (${ano})`;
}

/**
 * Detecta pendências de compras, desejos ou ocorrências para um grupo de alunos
 */
export function detectarPendenciasAlunos(
  alunosIds: number[],
  alunos: Aluno[],
  compras: Compra[],
  desejos: Desejo[],
  avaliacoes?: Avaliacao[]
): PendingWarning[] {
  const avisos: PendingWarning[] = [];
  const alunosMap = new Map<number, Aluno>(alunos.map(a => [a.id, a]));

  alunosIds.forEach(id => {
    const aluno = alunosMap.get(id);
    const nome = aluno?.nome || `Aluno #${id}`;

    // 1. Entregas pendentes
    const entregas = compras.filter(c => c.alunoId === id && !c.entregue);
    if (entregas.length > 0) {
      avisos.push({
        alunoId: id,
        alunoNome: nome,
        tipo: 'entrega_pendente',
        descricao: `${entregas.length} produto(s) comprado(s) aguardando entrega física na escola (${entregas.map(e => e.produtoNome).join(', ')}).`,
      });
    }

    // 2. Desejos registrados
    const desejosAluno = desejos.filter(d => d.alunoId === id);
    if (desejosAluno.length > 0) {
      avisos.push({
        alunoId: id,
        alunoNome: nome,
        tipo: 'desejo_pendente',
        descricao: `${desejosAluno.length} item(ns) na lista de desejos.`,
      });
    }

    // 3. Ocorrências negativas sem ciência do responsável
    if (avaliacoes) {
      const ocorrenciasSemCiencia = avaliacoes.filter(
        av => av.alunoId === id && av.tipo === 'negativa' && !av.consentido
      );
      if (ocorrenciasSemCiencia.length > 0) {
        avisos.push({
          alunoId: id,
          alunoNome: nome,
          tipo: 'ocorrencia_pendente',
          descricao: `${ocorrenciasSemCiencia.length} ocorrência(s) pedagógica(s) aguardando confirmação do responsável.`,
        });
      }
    }
  });

  return avisos;
}

/**
 * Validação estrita do Modo A: Transferência entre turmas do MESMO ano letivo
 */
export function validarTransferencia(params: {
  turmaOrigemId: number;
  turmaDestinoId: number;
  alunosIds: number[];
  turmas: Turma[];
  alunos: Aluno[];
  compras: Compra[];
  desejos: Desejo[];
}): TransferValidationResult {
  const erros: string[] = [];
  const { turmaOrigemId, turmaDestinoId, alunosIds, turmas, alunos, compras, desejos } = params;

  const turmaOrigem = turmas.find(t => t.id === turmaOrigemId);
  const turmaDestino = turmas.find(t => t.id === turmaDestinoId);

  if (!turmaOrigem) {
    erros.push('A turma de origem informada não foi encontrada.');
  }

  if (!turmaDestino) {
    erros.push('A turma de destino informada não foi encontrada.');
  }

  if (turmaOrigem && turmaDestino) {
    if (turmaOrigem.id === turmaDestino.id) {
      erros.push('A turma de destino não pode ser a mesma turma de origem.');
    }

    const anoOrigem = turmaOrigem.anoLetivo || 2026;
    const anoDestino = turmaDestino.anoLetivo || 2026;
    if (anoOrigem !== anoDestino) {
      erros.push(
        `A transferência só é permitida entre turmas do mesmo ano letivo. Origem: ${anoOrigem}, Destino: ${anoDestino}. Para transição entre anos diferentes, utilize a Progressão de Ano Letivo.`
      );
    }
  }

  if (!alunosIds || alunosIds.length === 0) {
    erros.push('Selecione pelo menos um aluno para realizar a transferência.');
  }

  // Validar se todos os alunos existem e pertencem à turma de origem
  const alunosValidados: Aluno[] = [];
  alunosIds.forEach(id => {
    const aluno = alunos.find(a => a.id === id);
    if (!aluno) {
      erros.push(`O aluno com ID #${id} não existe no sistema.`);
    } else if (aluno.turmaId !== turmaOrigemId) {
      erros.push(
        `O aluno "${aluno.nome}" não pertence mais à turma de origem (${turmaOrigem?.serie}º ${turmaOrigem?.turma}). Atualize a página.`
      );
    } else {
      alunosValidados.push(aluno);
    }
  });

  const avisos = detectarPendenciasAlunos(alunosIds, alunos, compras, desejos);

  return {
    valido: erros.length === 0,
    erros,
    avisos,
    alunosValidados,
    turmaOrigem,
    turmaDestino,
  };
}

/**
 * Sugere a turma de destino para um aluno na transição de ano letivo
 * Baseado no avanço natural de série: ex: 1º Ano -> 2º Ano, mantendo a letra se possível
 */
export function sugerirDestinoProgressao(
  turmaOrigem: Turma,
  turmasProximoAno: Turma[]
): Turma | undefined {
  const proximaSerie = turmaOrigem.serie + 1;
  const candidatas = turmasProximoAno.filter(t => t.serie === proximaSerie);

  if (candidatas.length === 0) {
    return undefined; // Sem turma cadastrada para a próxima série
  }

  // 1. Tenta encontrar a turma com a mesma letra (ex: 1A -> 2A)
  const mesmaLetra = candidatas.find(
    t => t.turma.toUpperCase() === turmaOrigem.turma.toUpperCase()
  );
  if (mesmaLetra) {
    return mesmaLetra;
  }

  // 2. Se houver apenas uma turma cadastrada para a próxima série, sugere ela
  if (candidatas.length === 1) {
    return candidatas[0];
  }

  // 3. Se houver múltiplas turmas com letras diferentes, deixa sem definição para o adm decidir
  return undefined;
}

/**
 * Monta os itens de revisão individual para a Progressão de Ano Letivo
 */
export function prepararItensProgressao(params: {
  turmasOrigemIds: number[];
  anoOrigem: number;
  anoDestino: number;
  turmas: Turma[];
  alunos: Aluno[];
  compras: Compra[];
  desejos: Desejo[];
  avaliacoes?: Avaliacao[];
}): StudentProgressionItem[] {
  const {
    turmasOrigemIds,
    anoOrigem,
    anoDestino,
    turmas,
    alunos,
    compras,
    desejos,
    avaliacoes,
  } = params;

  const turmasDestinoDisponiveis = turmas.filter(
    t => (t.anoLetivo || 2026) === anoDestino
  );
  const turmasMap = new Map<number, Turma>(turmas.map(t => [t.id, t]));

  // Alunos que pertencem às turmas de origem selecionadas
  const alunosFiltrados = alunos.filter(a => turmasOrigemIds.includes(a.turmaId));

  return alunosFiltrados.map(aluno => {
    const turmaOrigem = turmasMap.get(aluno.turmaId);
    const turmaOrigemNome = turmaOrigem
      ? `${turmaOrigem.serie}º Ano ${turmaOrigem.turma}`
      : 'Origem desconhecida';

    let turmaDestinoSugerida: Turma | undefined = undefined;
    if (turmaOrigem) {
      turmaDestinoSugerida = sugerirDestinoProgressao(turmaOrigem, turmasDestinoDisponiveis);
    }

    const avisos = detectarPendenciasAlunos(
      [aluno.id],
      alunos,
      compras,
      desejos,
      avaliacoes
    );

    return {
      alunoId: aluno.id,
      alunoNome: aluno.nome,
      alunoAvatar: aluno.avatar,
      alunoMatricula: aluno.matricula,
      pontos: aluno.pontos,
      turmaOrigemId: aluno.turmaId,
      turmaOrigemNome,
      anoLetivoOrigem: anoOrigem,
      turmaDestinoId: turmaDestinoSugerida?.id,
      turmaDestinoNome: turmaDestinoSugerida
        ? `${turmaDestinoSugerida.serie}º Ano ${turmaDestinoSugerida.turma}`
        : undefined,
      anoLetivoDestino: anoDestino,
      sugestaoAutomatica: !!turmaDestinoSugerida,
      excluido: false,
      avisos,
    };
  });
}

/**
 * Validação completa da Progressão antes da confirmação final
 */
export function validarRevisaoProgressao(
  itens: StudentProgressionItem[],
  anoOrigem: number,
  anoDestino: number,
  turmas: Turma[]
): ProgressionValidationResult {
  const erros: string[] = [];
  const avisosPendencias: PendingWarning[] = [];
  const distribuicaoDestinos: Record<string, number> = {};

  if (anoDestino !== anoOrigem + 1) {
    erros.push(
      `O ano letivo de destino (${anoDestino}) deve ser exatamente o ano seguinte ao de origem (${anoOrigem}).`
    );
  }

  const ativos = itens.filter(i => !i.excluido);
  const totalExcluidos = itens.filter(i => i.excluido).length;
  let totalSemDestino = 0;

  if (ativos.length === 0) {
    erros.push('Nenhum aluno está selecionado para ser progredido (todos foram excluídos ou a lista está vazia).');
  }

  ativos.forEach(item => {
    // Coleta avisos de pendência
    if (item.avisos.length > 0) {
      avisosPendencias.push(...item.avisos);
    }

    if (!item.turmaDestinoId) {
      totalSemDestino++;
      erros.push(`O aluno "${item.alunoNome}" está sem turma de destino definida.`);
    } else {
      const turmaDest = turmas.find(t => t.id === item.turmaDestinoId);
      if (!turmaDest) {
        erros.push(`A turma de destino selecionada para "${item.alunoNome}" não existe.`);
      } else if ((turmaDest.anoLetivo || 2026) !== anoDestino) {
        erros.push(
          `A turma "${turmaDest.serie}º ${turmaDest.turma}" pertence ao ano ${turmaDest.anoLetivo}, e não ao ano de destino ${anoDestino}.`
        );
      } else {
        const nomeDest = `${turmaDest.serie}º Ano ${turmaDest.turma}`;
        distribuicaoDestinos[nomeDest] = (distribuicaoDestinos[nomeDest] || 0) + 1;
      }
    }
  });

  return {
    valido: erros.length === 0,
    erros,
    totalAlunos: itens.length,
    totalAptos: ativos.length,
    totalExcluidos,
    totalSemDestino,
    distribuicaoDestinos,
    avisosPendencias,
  };
}
