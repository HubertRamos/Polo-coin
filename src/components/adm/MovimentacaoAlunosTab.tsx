import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../common/Toast';
import { Modal } from '../common/Modal';
import { Turma, Aluno, MovimentacaoAluno } from '../../types';
import {
  extrairAnosLetivos,
  formatarNomeTurmaComAno,
  prepararItensProgressao,
  validarRevisaoProgressao,
  StudentProgressionItem,
} from '../../lib/movementService';

type ModoOperacao = 'transferencia' | 'progressao' | 'historico';

export const MovimentacaoAlunosTab: React.FC = () => {
  const {
    turmas,
    alunos,
    compras,
    desejos,
    avaliacoes,
    movimentacoes,
    transferirAlunos,
    progredirAlunos,
  } = useData();
  const { currentUser } = useAuth();
  const toast = useToast();

  const [modo, setModo] = useState<ModoOperacao>('transferencia');

  // Anos letivos disponíveis
  const anosDisponiveis = useMemo(() => extrairAnosLetivos(turmas), [turmas]);

  // -------------------------------------------------------------
  // ESTADOS: MODO A — TRANSFERÊNCIA
  // -------------------------------------------------------------
  const [anoTransferencia, setAnoTransferencia] = useState<number>(() => anosDisponiveis[0] || 2026);
  const [turmaOrigemTransfId, setTurmaOrigemTransfId] = useState<number | ''>('');
  const [turmaDestinoTransfId, setTurmaDestinoTransfId] = useState<number | ''>('');
  const [alunosSelecionadosTransf, setAlunosSelecionadosTransf] = useState<number[]>([]);
  const [buscaAlunoTransf, setBuscaAlunoTransf] = useState('');
  const [motivoTransf, setMotivoTransf] = useState('');
  const [executandoTransf, setExecutandoTransf] = useState(false);
  const [modalConfirmarTransf, setModalConfirmarTransf] = useState(false);
  const [resultadoTransf, setResultadoTransf] = useState<{
    loteId: string;
    total: number;
    sucesso: boolean;
  } | null>(null);

  // Turmas do ano selecionado para transferência
  const turmasAnoTransf = useMemo(
    () => turmas.filter(t => (t.anoLetivo || 2026) === anoTransferencia),
    [turmas, anoTransferencia]
  );

  // Alunos da turma de origem selecionada
  const turmaOrigemTransf = useMemo(
    () => turmas.find(t => t.id === Number(turmaOrigemTransfId)),
    [turmas, turmaOrigemTransfId]
  );

  const turmaDestinoTransf = useMemo(
    () => turmas.find(t => t.id === Number(turmaDestinoTransfId)),
    [turmas, turmaDestinoTransfId]
  );

  const alunosOrigemTransf = useMemo(() => {
    if (!turmaOrigemTransfId) return [];
    return alunos.filter(a => a.turmaId === Number(turmaOrigemTransfId));
  }, [alunos, turmaOrigemTransfId]);

  const alunosFiltradosTransf = useMemo(() => {
    if (!buscaAlunoTransf.trim()) return alunosOrigemTransf;
    const q = buscaAlunoTransf.toLowerCase();
    return alunosOrigemTransf.filter(
      a =>
        a.nome.toLowerCase().includes(q) ||
        (a.matricula && a.matricula.toLowerCase().includes(q))
    );
  }, [alunosOrigemTransf, buscaAlunoTransf]);

  // Pendências dos alunos selecionados para transferência
  const pendenciasTransf = useMemo(() => {
    const list: { aluno: Aluno; tipo: string; descricao: string }[] = [];
    alunosSelecionadosTransf.forEach(id => {
      const al = alunos.find(a => a.id === id);
      if (!al) return;

      const comprasPend = compras.filter(c => c.alunoId === id && !c.entregue);
      if (comprasPend.length > 0) {
        list.push({
          aluno: al,
          tipo: 'Entrega Pendente',
          descricao: `${comprasPend.length} item(ns) aguardando entrega física na escola (${comprasPend.map(c => c.produtoNome).join(', ')}).`,
        });
      }

      const desejosAluno = desejos.filter(d => d.alunoId === id);
      if (desejosAluno.length > 0) {
        list.push({
          aluno: al,
          tipo: 'Lista de Desejos',
          descricao: `${desejosAluno.length} item(ns) na lista de desejos.`,
        });
      }
    });
    return list;
  }, [alunosSelecionadosTransf, alunos, compras, desejos]);

  // Toggle seleção individual de aluno na transferência
  const handleToggleAlunoTransf = (id: number) => {
    setAlunosSelecionadosTransf(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelecionarTodosTransf = () => {
    if (alunosSelecionadosTransf.length === alunosFiltradosTransf.length) {
      setAlunosSelecionadosTransf([]);
    } else {
      setAlunosSelecionadosTransf(alunosFiltradosTransf.map(a => a.id));
    }
  };

  const handleExecutarTransferencia = async () => {
    if (!turmaOrigemTransfId || !turmaDestinoTransfId) {
      toast.warning('Selecione a turma de origem e a de destino.');
      return;
    }
    if (alunosSelecionadosTransf.length === 0) {
      toast.warning('Selecione ao menos um aluno para transferir.');
      return;
    }

    setExecutandoTransf(true);
    try {
      const res = await transferirAlunos({
        turmaOrigemId: Number(turmaOrigemTransfId),
        turmaDestinoId: Number(turmaDestinoTransfId),
        alunosIds: alunosSelecionadosTransf,
        adminNome: currentUser?.nome || 'Direção Escolar',
        motivo: motivoTransf.trim() || undefined,
      });

      if (res.success) {
        toast.success(
          `${res.movimentados} aluno(s) transferido(s) com sucesso para ${formatarNomeTurmaComAno(turmaDestinoTransf)}!`
        );
        setResultadoTransf({
          loteId: res.loteId,
          total: res.movimentados,
          sucesso: true,
        });
        setModalConfirmarTransf(false);
        setAlunosSelecionadosTransf([]);
        setMotivoTransf('');
      } else {
        toast.error(res.error || 'Falha ao executar transferência.');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao transferir alunos.');
    } finally {
      setExecutandoTransf(false);
    }
  };

  // -------------------------------------------------------------
  // ESTADOS: MODO B — PROGRESSÃO DE ANO LETIVO
  // -------------------------------------------------------------
  const [anoOrigemProg, setAnoOrigemProg] = useState<number>(() => anosDisponiveis[0] || 2026);
  const anoDestinoProg = anoOrigemProg + 1;

  const [turmasOrigemProgIds, setTurmasOrigemProgIds] = useState<number[]>([]);
  const [etapaProg, setEtapaProg] = useState<'selecao' | 'revisao' | 'conclusao'>('selecao');
  const [itensRevisaoProg, setItensRevisaoProg] = useState<StudentProgressionItem[]>([]);
  const [buscaProg, setBuscaProg] = useState('');
  const [filtroStatusProg, setFiltroStatusProg] = useState<'todos' | 'aptos' | 'sem_destino' | 'excluidos'>('todos');
  const [motivoGeralProg, setMotivoGeralProg] = useState('');
  const [executandoProg, setExecutandoProg] = useState(false);
  const [resultadoProg, setResultadoProg] = useState<{
    loteId: string;
    total: number;
    sucesso: boolean;
  } | null>(null);

  // Turmas de origem disponíveis para o ano selecionado
  const turmasAnoOrigemProg = useMemo(
    () => turmas.filter(t => (t.anoLetivo || 2026) === anoOrigemProg),
    [turmas, anoOrigemProg]
  );

  // Turmas de destino disponíveis no ano seguinte
  const turmasAnoDestinoProg = useMemo(
    () => turmas.filter(t => (t.anoLetivo || 2026) === anoDestinoProg),
    [turmas, anoDestinoProg]
  );

  // Iniciar revisão de progressão
  const handleAvancarParaRevisaoProg = () => {
    if (turmasOrigemProgIds.length === 0) {
      toast.warning('Selecione pelo menos uma turma de origem para a progressão.');
      return;
    }

    if (turmasAnoDestinoProg.length === 0) {
      toast.warning(
        `Nenhuma turma cadastrada para o ano letivo de ${anoDestinoProg}. Cadastre previamente as turmas de ${anoDestinoProg} na aba "Turmas & Alunos".`
      );
      return;
    }

    const itens = prepararItensProgressao({
      turmasOrigemIds: turmasOrigemProgIds,
      anoOrigem: anoOrigemProg,
      anoDestino: anoDestinoProg,
      turmas,
      alunos,
      compras,
      desejos,
      avaliacoes,
    });

    if (itens.length === 0) {
      toast.warning('Não há alunos matriculados nas turmas de origem selecionadas.');
      return;
    }

    setItensRevisaoProg(itens);
    setEtapaProg('revisao');
  };

  // Alterar individualmente o destino de um aluno na tabela de revisão
  const handleAlterarDestinoAluno = (alunoId: number, novaTurmaId: number | '') => {
    setItensRevisaoProg(prev =>
      prev.map(item => {
        if (item.alunoId === alunoId) {
          const tDest = novaTurmaId
            ? turmasAnoDestinoProg.find(t => t.id === Number(novaTurmaId))
            : undefined;
          return {
            ...item,
            turmaDestinoId: tDest ? tDest.id : undefined,
            turmaDestinoNome: tDest ? `${tDest.serie}º Ano ${tDest.turma}` : undefined,
            sugestaoAutomatica: false,
          };
        }
        return item;
      })
    );
  };

  // Alternar exclusão individual do aluno da progressão (mantém ele sem ser movido)
  const handleToggleExclusaoAluno = (alunoId: number) => {
    setItensRevisaoProg(prev =>
      prev.map(item => {
        if (item.alunoId === alunoId) {
          return {
            ...item,
            excluido: !item.excluido,
          };
        }
        return item;
      })
    );
  };

  // Validação em tempo real da tabela de revisão
  const validacaoProg = useMemo(() => {
    return validarRevisaoProgressao(
      itensRevisaoProg,
      anoOrigemProg,
      anoDestinoProg,
      turmas
    );
  }, [itensRevisaoProg, anoOrigemProg, anoDestinoProg, turmas]);

  // Alunos filtrados na revisão
  const itensRevisaoFiltrados = useMemo(() => {
    return itensRevisaoProg.filter(item => {
      // Filtro de busca
      if (buscaProg.trim()) {
        const q = buscaProg.toLowerCase();
        const bateNome = item.alunoNome.toLowerCase().includes(q);
        const bateMat = item.alunoMatricula && item.alunoMatricula.toLowerCase().includes(q);
        if (!bateNome && !bateMat) return false;
      }

      // Filtro de status
      if (filtroStatusProg === 'aptos') {
        return !item.excluido && !!item.turmaDestinoId;
      }
      if (filtroStatusProg === 'sem_destino') {
        return !item.excluido && !item.turmaDestinoId;
      }
      if (filtroStatusProg === 'excluidos') {
        return item.excluido;
      }
      return true;
    });
  }, [itensRevisaoProg, buscaProg, filtroStatusProg]);

  const [modalConfirmarProg, setModalConfirmarProg] = useState(false);

  const handleExecutarProgressao = async () => {
    if (!validacaoProg.valido) {
      toast.warning(validacaoProg.erros[0] || 'Corrija as inconsistências antes de confirmar.');
      return;
    }

    const itensParaMover = itensRevisaoProg
      .filter(i => !i.excluido && i.turmaDestinoId)
      .map(i => ({
        alunoId: i.alunoId,
        turmaDestinoId: i.turmaDestinoId!,
        motivo: i.turmaDestinoNome
          ? `Progressão: ${i.turmaOrigemNome} (${anoOrigemProg}) → ${i.turmaDestinoNome} (${anoDestinoProg})`
          : undefined,
      }));

    setExecutandoProg(true);
    try {
      const res = await progredirAlunos({
        anoOrigem: anoOrigemProg,
        anoDestino: anoDestinoProg,
        itens: itensParaMover,
        adminNome: currentUser?.nome || 'Direção Escolar',
        motivoGeral: motivoGeralProg.trim() || `Progressão oficial de fim de ano letivo ${anoOrigemProg} → ${anoDestinoProg}`,
      });

      if (res.success) {
        toast.success(`${res.movimentados} aluno(s) progredido(s) com sucesso para o ano letivo ${anoDestinoProg}!`);
        setResultadoProg({
          loteId: res.loteId,
          total: res.movimentados,
          sucesso: true,
        });
        setModalConfirmarProg(false);
        setEtapaProg('conclusao');
      } else {
        toast.error(res.error || 'Falha ao executar progressão.');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Erro durante a progressão de alunos.');
    } finally {
      setExecutandoProg(false);
    }
  };

  // -------------------------------------------------------------
  // ESTADOS: HISTÓRICO DE MOVIMENTAÇÕES
  // -------------------------------------------------------------
  const [buscaHistorico, setBuscaHistorico] = useState('');
  const [filtroTipoHistorico, setFiltroTipoHistorico] = useState<'todos' | 'transferencia' | 'progressao'>('todos');

  const historicoFiltrado = useMemo(() => {
    return movimentacoes.filter(m => {
      if (filtroTipoHistorico !== 'todos' && m.tipo !== filtroTipoHistorico) {
        return false;
      }
      if (buscaHistorico.trim()) {
        const q = buscaHistorico.toLowerCase();
        const bateNome = m.alunoNome.toLowerCase().includes(q);
        const bateMat = m.alunoMatricula && m.alunoMatricula.toLowerCase().includes(q);
        const bateLote = m.loteId.toLowerCase().includes(q);
        if (!bateNome && !bateMat && !bateLote) return false;
      }
      return true;
    });
  }, [movimentacoes, filtroTipoHistorico, buscaHistorico]);

  return (
    <div>
      {/* Header com Design PoloCoin */}
      <div className="polocoin-main__header">
        <div>
          <h1 className="polocoin-main__title">Movimentação de Alunos</h1>
          <p className="polocoin-main__subtitle">
            Transferência entre turmas do mesmo ano letivo e progressão oficial de fim de ano escolar
          </p>
        </div>

        {/* Barra de Seleção de Modos */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`btn ${modo === 'transferencia' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setModo('transferencia')}
          >
            <span>🔄</span> Transferir Alunos
          </button>
          <button
            type="button"
            className={`btn ${modo === 'progressao' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => {
              setModo('progressao');
              setEtapaProg('selecao');
            }}
          >
            <span>🎓</span> Progressão de Fim de Ano
          </button>
          <button
            type="button"
            className={`btn ${modo === 'historico' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setModo('historico')}
          >
            <span>📜</span> Histórico ({movimentacoes.length})
          </button>
        </div>
      </div>

      {/* =========================================================
          MODO A: TRANSFERÊNCIA ENTRE TURMAS DO MESMO ANO
      ========================================================= */}
      {modo === 'transferencia' && (
        <div>
          {/* Card de Configuração de Origem e Destino */}
          <div className="card" style={{ marginBottom: '24px' }}>
            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <span>🔄</span> Parâmetros da Transferência
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
              {/* Seleção do Ano Letivo */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Ano Letivo</label>
                <select
                  className="form-select"
                  value={anoTransferencia}
                  onChange={e => {
                    const novoAno = Number(e.target.value);
                    setAnoTransferencia(novoAno);
                    setTurmaOrigemTransfId('');
                    setTurmaDestinoTransfId('');
                    setAlunosSelecionadosTransf([]);
                  }}
                >
                  {anosDisponiveis.map(ano => (
                    <option key={ano} value={ano}>
                      Ano Letivo {ano}
                    </option>
                  ))}
                </select>
                <small style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                  A transferência só ocorre entre turmas do mesmo ano letivo.
                </small>
              </div>

              {/* Turma de Origem */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Turma de Origem</label>
                <select
                  className="form-select"
                  value={turmaOrigemTransfId}
                  onChange={e => {
                    setTurmaOrigemTransfId(e.target.value ? Number(e.target.value) : '');
                    setAlunosSelecionadosTransf([]);
                    if (Number(e.target.value) === Number(turmaDestinoTransfId)) {
                      setTurmaDestinoTransfId('');
                    }
                  }}
                >
                  <option value="">Selecione a turma de origem...</option>
                  {turmasAnoTransf.map(t => {
                    const qtd = alunos.filter(a => a.turmaId === t.id).length;
                    return (
                      <option key={t.id} value={t.id}>
                        {t.serie}º Ano {t.turma} ({qtd} aluno{qtd !== 1 ? 's' : ''})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Turma de Destino */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Turma de Destino</label>
                <select
                  className="form-select"
                  value={turmaDestinoTransfId}
                  onChange={e => setTurmaDestinoTransfId(e.target.value ? Number(e.target.value) : '')}
                  disabled={!turmaOrigemTransfId}
                >
                  <option value="">Selecione a turma de destino...</option>
                  {turmasAnoTransf
                    .filter(t => t.id !== Number(turmaOrigemTransfId))
                    .map(t => {
                      const qtd = alunos.filter(a => a.turmaId === t.id).length;
                      return (
                        <option key={t.id} value={t.id}>
                          {t.serie}º Ano {t.turma} (atualmente com {qtd} aluno{qtd !== 1 ? 's' : ''})
                        </option>
                      );
                    })}
                </select>
              </div>
            </div>
          </div>

          {/* Seleção de Alunos para Transferência */}
          {turmaOrigemTransfId ? (
            <div className="card">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div>
                  <h3 className="card-title" style={{ margin: 0 }}>
                    Alunos da Turma {turmaOrigemTransf?.serie}º {turmaOrigemTransf?.turma} ({alunosOrigemTransf.length})
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: 'var(--text-muted)' }}>
                    Selecione um ou vários alunos para transferir para a turma de destino.
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Buscar por nome ou matrícula..."
                    value={buscaAlunoTransf}
                    onChange={e => setBuscaAlunoTransf(e.target.value)}
                    style={{ width: '230px', fontSize: '13px', padding: '6px 12px' }}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary btn--sm"
                    onClick={handleSelecionarTodosTransf}
                  >
                    {alunosSelecionadosTransf.length === alunosFiltradosTransf.length && alunosFiltradosTransf.length > 0
                      ? 'Desmarcar Todos'
                      : 'Selecionar Todos'}
                  </button>
                </div>
              </div>

              {alunosFiltradosTransf.length === 0 ? (
                <div className="empty-state" style={{ padding: '32px 0' }}>
                  <div className="empty-state__icon">👥</div>
                  <div className="empty-state__text">
                    Nenhum aluno encontrado nesta turma com o filtro atual.
                  </div>
                </div>
              ) : (
                <div className="tabela-wrapper">
                  <table className="tabela">
                    <thead>
                      <tr>
                        <th style={{ width: '40px', textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={
                              alunosSelecionadosTransf.length === alunosFiltradosTransf.length &&
                              alunosFiltradosTransf.length > 0
                            }
                            onChange={handleSelecionarTodosTransf}
                            title="Selecionar todos os alunos listados"
                          />
                        </th>
                        <th>Aluno</th>
                        <th>Matrícula</th>
                        <th>Saldo PoloCoins</th>
                        <th>Status / Pendências</th>
                      </tr>
                    </thead>
                    <tbody>
                      {alunosFiltradosTransf.map(aluno => {
                        const isSelecionado = alunosSelecionadosTransf.includes(aluno.id);
                        const comprasPend = compras.filter(c => c.alunoId === aluno.id && !c.entregue);
                        const desejosAluno = desejos.filter(d => d.alunoId === aluno.id);

                        return (
                          <tr
                            key={aluno.id}
                            style={{
                              backgroundColor: isSelecionado ? 'var(--color-primary-soft)' : undefined,
                              cursor: 'pointer',
                            }}
                            onClick={() => handleToggleAlunoTransf(aluno.id)}
                          >
                            <td style={{ textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={isSelecionado}
                                onChange={() => handleToggleAlunoTransf(aluno.id)}
                              />
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontSize: '22px' }}>{aluno.avatar}</span>
                                <div>
                                  <strong style={{ display: 'block', color: 'var(--text-primary)' }}>
                                    {aluno.nome}
                                  </strong>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                {aluno.matricula || 'Sem matrícula'}
                              </span>
                            </td>
                            <td>
                              <span style={{ fontWeight: 800, color: 'var(--color-coin-dark)' }}>
                                🪙 {aluno.pontos}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                {comprasPend.length > 0 && (
                                  <span className="badge badge-warning" title="Possui resgate de produto aguardando entrega física">
                                    📦 {comprasPend.length} entrega(s) pendente(s)
                                  </span>
                                )}
                                {desejosAluno.length > 0 && (
                                  <span className="badge badge-info" title="Possui produtos salvos na lista de desejos">
                                    ⭐ {desejosAluno.length} desejo(s)
                                  </span>
                                )}
                                {comprasPend.length === 0 && desejosAluno.length === 0 && (
                                  <span className="badge badge-success">✓ Regular</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Barra de Ação de Transferência */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '20px',
                  paddingTop: '16px',
                  borderTop: '1px solid var(--border-color)',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div>
                  <span style={{ fontWeight: 700, fontSize: '14px' }}>
                    {alunosSelecionadosTransf.length} aluno(s) selecionado(s)
                  </span>
                  {turmaDestinoTransf && (
                    <span style={{ color: 'var(--text-muted)', fontSize: '13px', marginLeft: '8px' }}>
                      → Destino: <strong>{formatarNomeTurmaComAno(turmaDestinoTransf)}</strong>
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={alunosSelecionadosTransf.length === 0 || !turmaDestinoTransfId}
                  onClick={() => setModalConfirmarTransf(true)}
                >
                  <span>🚀</span> Revisar e Confirmar Transferência
                </button>
              </div>
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '48px 0' }}>
              <div className="empty-state__icon">🏫</div>
              <div className="empty-state__text">
                Selecione a turma de origem acima para carregar a lista de estudantes.
              </div>
            </div>
          )}

          {/* Modal de Confirmação da Transferência */}
          <Modal
            isOpen={modalConfirmarTransf}
            onClose={() => setModalConfirmarTransf(false)}
            title="Revisão da Transferência de Alunos"
            subtitle={`Ano Letivo ${anoTransferencia} • Confirmação explícita de movimentação`}
          >
            <div>
              <div
                style={{
                  background: 'var(--bg-subtle)',
                  borderRadius: '10px',
                  padding: '14px',
                  marginBottom: '16px',
                  fontSize: '13px',
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Origem:</span>
                    <strong style={{ display: 'block', fontSize: '14px' }}>
                      {formatarNomeTurmaComAno(turmaOrigemTransf)}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Destino:</span>
                    <strong style={{ display: 'block', fontSize: '14px', color: 'var(--color-primary)' }}>
                      {formatarNomeTurmaComAno(turmaDestinoTransf)}
                    </strong>
                  </div>
                </div>
                <div style={{ color: 'var(--text-secondary)' }}>
                  Total de estudantes a transferir: <strong>{alunosSelecionadosTransf.length}</strong>
                </div>
              </div>

              {/* Aviso de Pendências / Compras */}
              {pendenciasTransf.length > 0 && (
                <div
                  className="alert alert-warning"
                  style={{ marginBottom: '16px', fontSize: '12.5px' }}
                >
                  <strong style={{ display: 'block', marginBottom: '4px' }}>
                    ⚠️ Atenção: Pendências identificadas em {pendenciasTransf.length} registro(s)
                  </strong>
                  <ul style={{ margin: 0, paddingLeft: '18px' }}>
                    {pendenciasTransf.map((p, idx) => (
                      <li key={idx}>
                        <strong>{p.aluno.nome}</strong>: {p.descricao}
                      </li>
                    ))}
                  </ul>
                  <p style={{ margin: '8px 0 0', fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                    ✓ <em>Conforme a regra de segurança, todos os pedidos, desejos e saldos em PoloCoins permanecem integralmente preservados.</em>
                  </p>
                </div>
              )}

              {/* Lista dos Alunos a Transferir */}
              <div style={{ maxHeight: '180px', overflowY: 'auto', marginBottom: '16px', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px 12px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Estudantes selecionados:
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {alunosSelecionadosTransf.map(id => {
                    const al = alunos.find(a => a.id === id);
                    return (
                      <div key={id} style={{ fontSize: '12.5px', display: 'flex', justifyContent: 'space-between' }}>
                        <span>
                          {al?.avatar} <strong>{al?.nome}</strong>
                          {al?.matricula && <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}> ({al.matricula})</span>}
                        </span>
                        <span style={{ color: 'var(--color-coin-dark)', fontWeight: 700 }}>
                          🪙 {al?.pontos}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Motivo opcional da movimentação */}
              <div className="form-group">
                <label className="form-label">Motivo ou Observação (Opcional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex: Remanejamento de turno a pedido dos pais"
                  value={motivoTransf}
                  onChange={e => setMotivoTransf(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setModalConfirmarTransf(false)}
                  disabled={executandoTransf}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleExecutarTransferencia}
                  disabled={executandoTransf}
                >
                  {executandoTransf ? 'Transferindo...' : 'Confirmar e Executar Transferência'}
                </button>
              </div>
            </div>
          </Modal>
        </div>
      )}

      {/* =========================================================
          MODO B: PROGRESSÃO DE FIM DE ANO LETIVO
      ========================================================= */}
      {modo === 'progressao' && (
        <div>
          {/* ETAPA 1: SELEÇÃO DO ANO E TURMAS */}
          {etapaProg === 'selecao' && (
            <div>
              <div className="card" style={{ marginBottom: '24px' }}>
                <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <span>🎓</span> Configuração do Ano Letivo
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                  {/* Ano que será encerrado */}
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">1. Ano Letivo a Encerrar (Origem)</label>
                    <select
                      className="form-select"
                      value={anoOrigemProg}
                      onChange={e => {
                        const novo = Number(e.target.value);
                        setAnoOrigemProg(novo);
                        setTurmasOrigemProgIds([]);
                      }}
                    >
                      {anosDisponiveis.map(ano => (
                        <option key={ano} value={ano}>
                          Ano Letivo {ano}
                        </option>
                      ))}
                    </select>
                    <small style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                      Turmas deste ano letivo serão promovidas para o ano subsequente.
                    </small>
                  </div>

                  {/* Ano de Destino */}
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">2. Próximo Ano Letivo (Destino)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={`Ano Letivo ${anoDestinoProg}`}
                      readOnly
                      style={{ background: 'var(--bg-subtle)', fontWeight: 700, color: 'var(--color-primary)' }}
                    />
                    <small style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                      Turmas cadastradas para {anoDestinoProg}: <strong>{turmasAnoDestinoProg.length} turma(s)</strong>
                    </small>
                  </div>
                </div>

                {turmasAnoDestinoProg.length === 0 && (
                  <div className="alert alert-warning" style={{ marginTop: '16px', fontSize: '13px' }}>
                    <span>
                      ⚠️ <strong>Atenção:</strong> Não existem turmas cadastradas para o ano letivo de {anoDestinoProg}.
                      Para realizar a progressão, crie previamente as turmas de {anoDestinoProg} na aba <strong>"Turmas & Alunos"</strong>.
                    </span>
                  </div>
                )}
              </div>

              {/* Seleção de Turmas de Origem */}
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h3 className="card-title" style={{ margin: 0 }}>
                      Turmas Elegíveis para Encerramento em {anoOrigemProg} ({turmasAnoOrigemProg.length})
                    </h3>
                    <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: 'var(--text-muted)' }}>
                      Marque as turmas que participarão da transição de fim de ano letivo.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="btn btn-secondary btn--sm"
                    onClick={() => {
                      if (turmasOrigemProgIds.length === turmasAnoOrigemProg.length) {
                        setTurmasOrigemProgIds([]);
                      } else {
                        setTurmasOrigemProgIds(turmasAnoOrigemProg.map(t => t.id));
                      }
                    }}
                  >
                    {turmasOrigemProgIds.length === turmasAnoOrigemProg.length && turmasAnoOrigemProg.length > 0
                      ? 'Desmarcar Todas'
                      : 'Selecionar Todas'}
                  </button>
                </div>

                {turmasAnoOrigemProg.length === 0 ? (
                  <div className="empty-state" style={{ padding: '32px 0' }}>
                    <div className="empty-state__icon">🏫</div>
                    <div className="empty-state__text">Nenhuma turma cadastrada para o ano letivo {anoOrigemProg}.</div>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
                    {turmasAnoOrigemProg.map(t => {
                      const isSel = turmasOrigemProgIds.includes(t.id);
                      const qtd = alunos.filter(a => a.turmaId === t.id).length;
                      return (
                        <div
                          key={t.id}
                          onClick={() => {
                            setTurmasOrigemProgIds(prev =>
                              prev.includes(t.id) ? prev.filter(x => x !== t.id) : [...prev, t.id]
                            );
                          }}
                          style={{
                            border: `2px solid ${isSel ? 'var(--color-primary)' : 'var(--border-color)'}`,
                            backgroundColor: isSel ? 'var(--color-primary-soft)' : 'var(--bg-card)',
                            borderRadius: '10px',
                            padding: '12px 14px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <div>
                            <strong style={{ fontSize: '15px', color: 'var(--text-primary)', display: 'block' }}>
                              {t.serie}º Ano {t.turma}
                            </strong>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                              {qtd} aluno{qtd !== 1 ? 's' : ''} matriculado{qtd !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <input
                            type="checkbox"
                            checked={isSel}
                            onChange={() => {}}
                            style={{ width: '18px', height: '18px' }}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Resumo e Botão de Avanço */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '24px',
                    paddingTop: '16px',
                    borderTop: '1px solid var(--border-color)',
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 800 }}>
                      {turmasOrigemProgIds.length} turma(s) selecionada(s)
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '13px', marginLeft: '8px' }}>
                      (Total de{' '}
                      {
                        alunos.filter(a => turmasOrigemProgIds.includes(a.turmaId)).length
                      }{' '}
                      alunos envolvidos)
                    </span>
                  </div>

                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={turmasOrigemProgIds.length === 0 || turmasAnoDestinoProg.length === 0}
                    onClick={handleAvancarParaRevisaoProg}
                  >
                    <span>➔</span> Avançar para Revisão Individual
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ETAPA 2: TABELA DE REVISÃO INDIVIDUAL OBRIGATÓRIA */}
          {etapaProg === 'revisao' && (
            <div>
              {/* Barra Superior de Resumo e Filtros da Revisão */}
              <div className="card" style={{ marginBottom: '16px' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px',
                    marginBottom: '16px',
                  }}
                >
                  <div>
                    <h3 className="card-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>📋</span> Revisão Individual de Progressão ({anoOrigemProg} → {anoDestinoProg})
                    </h3>
                    <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: 'var(--text-muted)' }}>
                      Revise o destino sugerido de cada estudante. Alunos sem destino definido impedem a conclusão.
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn--sm"
                      onClick={() => setEtapaProg('selecao')}
                    >
                      ← Voltar à seleção de turmas
                    </button>
                  </div>
                </div>

                {/* Métricas da Validação */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px', marginBottom: '16px' }}>
                  <div style={{ background: 'var(--bg-subtle)', padding: '10px', borderRadius: '8px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Total de Alunos</span>
                    <strong style={{ fontSize: '18px' }}>{validacaoProg.totalAlunos}</strong>
                  </div>
                  <div style={{ background: 'rgba(34, 197, 94, 0.1)', padding: '10px', borderRadius: '8px' }}>
                    <span style={{ fontSize: '11px', color: '#16a34a', display: 'block' }}>Aptos com Destino</span>
                    <strong style={{ fontSize: '18px', color: '#16a34a' }}>
                      {validacaoProg.totalAptos - validacaoProg.totalSemDestino}
                    </strong>
                  </div>
                  <div style={{ background: validacaoProg.totalSemDestino > 0 ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-subtle)', padding: '10px', borderRadius: '8px' }}>
                    <span style={{ fontSize: '11px', color: validacaoProg.totalSemDestino > 0 ? '#dc2626' : 'var(--text-muted)', display: 'block' }}>
                      Sem Destino Definido
                    </span>
                    <strong style={{ fontSize: '18px', color: validacaoProg.totalSemDestino > 0 ? '#dc2626' : 'inherit' }}>
                      {validacaoProg.totalSemDestino}
                    </strong>
                  </div>
                  <div style={{ background: 'var(--bg-subtle)', padding: '10px', borderRadius: '8px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Excluídos da Operação</span>
                    <strong style={{ fontSize: '18px' }}>{validacaoProg.totalExcluidos}</strong>
                  </div>
                </div>

                {/* Filtros da Tabela */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className={`btn btn--sm ${filtroStatusProg === 'todos' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setFiltroStatusProg('todos')}
                    >
                      Todos ({itensRevisaoProg.length})
                    </button>
                    <button
                      type="button"
                      className={`btn btn--sm ${filtroStatusProg === 'aptos' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setFiltroStatusProg('aptos')}
                    >
                      Com Destino ({itensRevisaoProg.filter(i => !i.excluido && i.turmaDestinoId).length})
                    </button>
                    <button
                      type="button"
                      className={`btn btn--sm ${filtroStatusProg === 'sem_destino' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setFiltroStatusProg('sem_destino')}
                    >
                      Sem Destino ({itensRevisaoProg.filter(i => !i.excluido && !i.turmaDestinoId).length})
                    </button>
                    <button
                      type="button"
                      className={`btn btn--sm ${filtroStatusProg === 'excluidos' ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setFiltroStatusProg('excluidos')}
                    >
                      Excluídos ({itensRevisaoProg.filter(i => i.excluido).length})
                    </button>
                  </div>

                  <input
                    type="text"
                    className="form-input"
                    placeholder="Pesquisar aluno..."
                    value={buscaProg}
                    onChange={e => setBuscaProg(e.target.value)}
                    style={{ width: '220px', fontSize: '13px', padding: '6px 12px' }}
                  />
                </div>
              </div>

              {/* Tabela de Revisão Individual */}
              <div className="card">
                <div className="tabela-wrapper">
                  <table className="tabela">
                    <thead>
                      <tr>
                        <th>Aluno</th>
                        <th>Turma Origem ({anoOrigemProg})</th>
                        <th>Turma Destino ({anoDestinoProg})</th>
                        <th>Situação da Revisão</th>
                        <th>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {itensRevisaoFiltrados.map(item => {
                        const comprasPend = compras.filter(c => c.alunoId === item.alunoId && !c.entregue);
                        return (
                          <tr
                            key={item.alunoId}
                            style={{
                              opacity: item.excluido ? 0.6 : 1,
                              backgroundColor: item.excluido ? 'var(--bg-subtle)' : undefined,
                            }}
                          >
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '22px' }}>{item.alunoAvatar}</span>
                                <div>
                                  <strong style={{ display: 'block', color: 'var(--text-primary)' }}>
                                    {item.alunoNome}
                                  </strong>
                                  <div style={{ display: 'flex', gap: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
                                    {item.alunoMatricula && <span>Matrícula: {item.alunoMatricula}</span>}
                                    <span style={{ color: 'var(--color-coin-dark)', fontWeight: 700 }}>
                                      🪙 {item.pontos}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td>
                              <span style={{ fontWeight: 600 }}>{item.turmaOrigemNome}</span>
                            </td>

                            <td>
                              {item.excluido ? (
                                <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '12px' }}>
                                  Permanecerá na turma atual
                                </span>
                              ) : (
                                <select
                                  className="form-select"
                                  value={item.turmaDestinoId || ''}
                                  onChange={e =>
                                    handleAlterarDestinoAluno(
                                      item.alunoId,
                                      e.target.value ? Number(e.target.value) : ''
                                    )
                                  }
                                  style={{
                                    fontSize: '12.5px',
                                    padding: '5px 8px',
                                    borderColor: !item.turmaDestinoId ? '#ef4444' : undefined,
                                    maxWidth: '220px',
                                  }}
                                >
                                  <option value="">(Selecione o destino manual...)</option>
                                  {turmasAnoDestinoProg.map(t => (
                                    <option key={t.id} value={t.id}>
                                      {t.serie}º Ano {t.turma} ({anoDestinoProg})
                                    </option>
                                  ))}
                                </select>
                              )}
                            </td>

                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                {item.excluido ? (
                                  <span className="badge badge-secondary">🚫 Excluído da Progressão</span>
                                ) : !item.turmaDestinoId ? (
                                  <span className="badge badge-danger">⚠️ Sem Destino Definido</span>
                                ) : item.sugestaoAutomatica ? (
                                  <span className="badge badge-success">✓ Sugestão Automática</span>
                                ) : (
                                  <span className="badge badge-info">✎ Ajuste Manual</span>
                                )}

                                {comprasPend.length > 0 && (
                                  <span className="badge badge-warning" style={{ fontSize: '10.5px' }}>
                                    📦 {comprasPend.length} entrega pendente
                                  </span>
                                )}
                              </div>
                            </td>

                            <td>
                              <button
                                type="button"
                                className="btn btn-ghost btn--sm"
                                onClick={() => handleToggleExclusaoAluno(item.alunoId)}
                                style={{ fontSize: '11.5px', padding: '4px 8px' }}
                              >
                                {item.excluido ? 'Restaurar' : 'Excluir da ação'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Rodapé com Confirmação e Validação */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '20px',
                    paddingTop: '16px',
                    borderTop: '1px solid var(--border-color)',
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}
                >
                  <div>
                    {!validacaoProg.valido && (
                      <span style={{ color: '#dc2626', fontSize: '13px', fontWeight: 600 }}>
                        ⚠️ {validacaoProg.erros[0]}
                      </span>
                    )}
                    {validacaoProg.valido && (
                      <span style={{ color: '#16a34a', fontSize: '13px', fontWeight: 700 }}>
                        ✓ Todos os {validacaoProg.totalAptos} alunos incluídos possuem turmas de destino válidas!
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={!validacaoProg.valido}
                    onClick={() => setModalConfirmarProg(true)}
                  >
                    <span>🚀</span> Resumo Final e Confirmação da Progressão
                  </button>
                </div>
              </div>

              {/* Modal de Confirmação Final da Progressão */}
              <Modal
                isOpen={modalConfirmarProg}
                onClose={() => setModalConfirmarProg(false)}
                title="Confirmação Final da Progressão de Ano Letivo"
                subtitle={`Transição Oficial ${anoOrigemProg} → ${anoDestinoProg}`}
              >
                <div>
                  <div
                    style={{
                      background: 'var(--bg-subtle)',
                      borderRadius: '10px',
                      padding: '16px',
                      marginBottom: '16px',
                      fontSize: '13px',
                    }}
                  >
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                      <div>
                        <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block' }}>Ano de Origem:</span>
                        <strong style={{ fontSize: '15px' }}>{anoOrigemProg}</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block' }}>Ano de Destino:</span>
                        <strong style={{ fontSize: '15px', color: 'var(--color-primary)' }}>{anoDestinoProg}</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block' }}>Alunos Movimentados:</span>
                        <strong style={{ fontSize: '15px', color: '#16a34a' }}>{validacaoProg.totalAptos}</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block' }}>Alunos Mantidos:</span>
                        <strong style={{ fontSize: '15px' }}>{validacaoProg.totalExcluidos}</strong>
                      </div>
                    </div>

                    {/* Distribuição por Turma de Destino */}
                    <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                        Distribuição nas turmas de destino ({anoDestinoProg}):
                      </span>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {Object.entries(validacaoProg.distribuicaoDestinos).map(([turmaNome, qtd]) => (
                          <span
                            key={turmaNome}
                            style={{
                              background: 'var(--bg-card)',
                              border: '1px solid var(--border-color)',
                              padding: '4px 10px',
                              borderRadius: '6px',
                              fontSize: '12px',
                            }}
                          >
                            <strong>{turmaNome}</strong>: {qtd} aluno(s)
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Avisos de Pendências de Entregas */}
                  {validacaoProg.avisosPendencias.length > 0 && (
                    <div className="alert alert-warning" style={{ marginBottom: '16px', fontSize: '12.5px' }}>
                      <strong style={{ display: 'block', marginBottom: '4px' }}>
                        📦 Aviso de Pedidos e Entregas Pendentes ({validacaoProg.avisosPendencias.length})
                      </strong>
                      <p style={{ margin: 0, fontSize: '12px' }}>
                        Estudantes selecionados possuem produtos resgatados aguardando entrega física. Os registros serão preservados e vinculados aos mesmos IDs de compra.
                      </p>
                    </div>
                  )}

                  {/* Motivo Geral Opcional */}
                  <div className="form-group">
                    <label className="form-label">Observação Geral do Fechamento (Opcional)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder={`Ex: Encerramento regular do ano letivo de ${anoOrigemProg}`}
                      value={motivoGeralProg}
                      onChange={e => setMotivoGeralProg(e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setModalConfirmarProg(false)}
                      disabled={executandoProg}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleExecutarProgressao}
                      disabled={executandoProg}
                    >
                      {executandoProg ? 'Executando Progressão...' : 'Confirmar e Progredir Alunos'}
                    </button>
                  </div>
                </div>
              </Modal>
            </div>
          )}

          {/* ETAPA 3: CONCLUSÃO DA PROGRESSÃO */}
          {etapaProg === 'conclusao' && resultadoProg && (
            <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎉</div>
              <h2 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 8px' }}>
                Progressão de Ano Letivo Concluída!
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '500px', margin: '0 auto 20px' }}>
                Foram movimentados com sucesso <strong>{resultadoProg.total} estudantes</strong> para o ano letivo de{' '}
                <strong>{anoDestinoProg}</strong>. Todos os históricos acadêmicos e saldos de PoloCoins permaneceram intactos.
              </p>

              <div
                style={{
                  display: 'inline-block',
                  background: 'var(--bg-subtle)',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '12.5px',
                  fontFamily: 'monospace',
                  marginBottom: '24px',
                }}
              >
                Identificador do Lote: <strong>{resultadoProg.loteId}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setModo('historico')}
                >
                  <span>📜</span> Ver Histórico de Movimentações
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setEtapaProg('selecao')}
                >
                  Nova Operação
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================
          HISTÓRICO AUDITÁVEL DE MOVIMENTAÇÕES
      ========================================================= */}
      {modo === 'historico' && (
        <div className="card">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div>
              <h3 className="card-title" style={{ margin: 0 }}>
                Histórico Auditável de Movimentações ({movimentacoes.length})
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '12.5px', color: 'var(--text-muted)' }}>
                Rastreabilidade permanente de todas as transferências e progressões realizadas.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <select
                className="form-select"
                value={filtroTipoHistorico}
                onChange={e => setFiltroTipoHistorico(e.target.value as any)}
                style={{ fontSize: '13px', width: '160px', padding: '6px 10px' }}
              >
                <option value="todos">Todos os Tipos</option>
                <option value="transferencia">Apenas Transferências</option>
                <option value="progressao">Apenas Progressões</option>
              </select>

              <input
                type="text"
                className="form-input"
                placeholder="Buscar por aluno ou lote..."
                value={buscaHistorico}
                onChange={e => setBuscaHistorico(e.target.value)}
                style={{ width: '220px', fontSize: '13px', padding: '6px 12px' }}
              />
            </div>
          </div>

          {historicoFiltrado.length === 0 ? (
            <div className="empty-state" style={{ padding: '36px 0' }}>
              <div className="empty-state__icon">📜</div>
              <div className="empty-state__text">Nenhuma movimentação registrada no histórico com este filtro.</div>
            </div>
          ) : (
            <div className="tabela-wrapper">
              <table className="tabela">
                <thead>
                  <tr>
                    <th>Data / Hora</th>
                    <th>Tipo</th>
                    <th>Aluno</th>
                    <th>Origem</th>
                    <th>Destino</th>
                    <th>Lote & Operador</th>
                    <th>Motivo</th>
                  </tr>
                </thead>
                <tbody>
                  {historicoFiltrado.map(item => {
                    const dataFormatada = item.dataHora
                      ? new Date(item.dataHora).toLocaleString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Data recente';

                    return (
                      <tr key={item.id}>
                        <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {dataFormatada}
                        </td>
                        <td>
                          {item.tipo === 'transferencia' ? (
                            <span className="badge badge-info">🔄 Transferência</span>
                          ) : (
                            <span className="badge badge-success">🎓 Progressão</span>
                          )}
                        </td>
                        <td>
                          <strong>{item.alunoNome}</strong>
                          {item.alunoMatricula && (
                            <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)' }}>
                              Matrícula: {item.alunoMatricula}
                            </span>
                          )}
                        </td>
                        <td>
                          <span style={{ fontSize: '13px' }}>{item.turmaOrigemNome}</span>
                          <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)' }}>
                            Ano {item.anoLetivoOrigem}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-primary)' }}>
                            {item.turmaDestinoNome}
                          </span>
                          <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)' }}>
                            Ano {item.anoLetivoDestino}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '12px', fontWeight: 600 }}>{item.adminNome}</span>
                          <span style={{ display: 'block', fontSize: '10.5px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                            {item.loteId}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                            {item.motivo || '—'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
