import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../common/Toast';
import { ConsentimentoModal } from './ConsentimentoModal';

export const ConsentimentoTab: React.FC = () => {
  const { avaliacoes, alunos, turmas, consentirAvaliacoes } = useData();
  const { currentUser } = useAuth();
  const toast = useToast();

  // Apenas filhos estritamente vinculados a este responsável
  const meusFilhos = useMemo(() => {
    if (!currentUser?.id) return [];
    return alunos.filter(a => a.responsavelId === currentUser.id);
  }, [alunos, currentUser?.id]);

  const meusFilhosIds = useMemo(() => meusFilhos.map(f => f.id), [meusFilhos]);

  // Histórico completo de ocorrências dos filhos (positivas e negativas de todos os professores)
  const todasOcorrencias = useMemo(() => {
    return avaliacoes.filter(av => meusFilhosIds.includes(av.alunoId));
  }, [avaliacoes, meusFilhosIds]);

  // Filtros de visualização
  const [filtroFilhoId, setFiltroFilhoId] = useState<number | 'todos'>('todos');
  const [filtroTipo, setFiltroTipo] = useState<'todas' | 'positivas' | 'negativas' | 'pendentes' | 'consentidas'>('todas');
  const [busca, setBusca] = useState('');
  const [modalConsentimentoAberto, setModalConsentimentoAberto] = useState(false);
  const [processandoId, setProcessandoId] = useState<number | null>(null);

  // Ocorrências negativas pendentes de consentimento
  const ocorrenciasPendentes = useMemo(() => {
    return todasOcorrencias.filter(av => av.tipo === 'negativa' && !av.consentido);
  }, [todasOcorrencias]);

  // Estatísticas consolidadas
  const totalGanhos = useMemo(() => {
    return todasOcorrencias
      .filter(av => av.tipo === 'positiva')
      .reduce((sum, av) => sum + av.pontos, 0);
  }, [todasOcorrencias]);

  const totalDeducoes = useMemo(() => {
    return todasOcorrencias
      .filter(av => av.tipo === 'negativa')
      .reduce((sum, av) => sum + av.pontos, 0);
  }, [todasOcorrencias]);

  // Ocorrências filtradas conforme seleção do responsável
  const ocorrenciasFiltradas = useMemo(() => {
    return todasOcorrencias.filter(oc => {
      // Filtro por filho
      if (filtroFilhoId !== 'todos' && oc.alunoId !== filtroFilhoId) {
        return false;
      }

      // Filtro por tipo
      if (filtroTipo === 'positivas' && oc.tipo !== 'positiva') return false;
      if (filtroTipo === 'negativas' && oc.tipo !== 'negativa') return false;
      if (filtroTipo === 'pendentes' && (oc.tipo !== 'negativa' || oc.consentido)) return false;
      if (filtroTipo === 'consentidas' && (oc.tipo !== 'negativa' || !oc.consentido)) return false;

      // Filtro de busca textual
      if (busca.trim()) {
        const termo = busca.toLowerCase().trim();
        const filho = meusFilhos.find(f => f.id === oc.alunoId);
        const matchFilho = filho?.nome.toLowerCase().includes(termo);
        const matchMotivo = oc.valor.toLowerCase().includes(termo);
        const matchCat = oc.categoria.toLowerCase().includes(termo);
        const matchProf = (oc.professorNome || '').toLowerCase().includes(termo);
        const matchObs = (oc.observacao || '').toLowerCase().includes(termo);

        if (!matchFilho && !matchMotivo && !matchCat && !matchProf && !matchObs) {
          return false;
        }
      }

      return true;
    });
  }, [todasOcorrencias, filtroFilhoId, filtroTipo, busca, meusFilhos]);

  // Dar ciência individual de uma ocorrência
  const handleDarCienciaIndividual = async (id: number) => {
    if (!currentUser?.id) return;
    setProcessandoId(id);
    const res = await consentirAvaliacoes([id], currentUser.id);
    setProcessandoId(null);

    if (res.success) {
      toast.success('Ciência confirmada com sucesso!');
    } else {
      toast.error(res.error || 'Não foi possível confirmar a ciência.');
    }
  };

  return (
    <div>
      {/* Pop-up obrigatório de consentimento quando acionado */}
      <ConsentimentoModal
        isOpen={modalConsentimentoAberto}
        onClose={() => setModalConsentimentoAberto(false)}
      />

      {/* Cabeçalho */}
      <div className="polocoin-main__header">
        <div>
          <h1 className="polocoin-main__title">Histórico de Ocorrências dos Filhos</h1>
          <p className="polocoin-main__subtitle">
            Acompanhe o histórico escolar completo de avaliações pedagógicas, pontos positivos e advertências de seus filhos
          </p>
        </div>

        {ocorrenciasPendentes.length > 0 && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setModalConsentimentoAberto(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)',
              background: '#ef4444',
            }}
          >
            <span>🛡️</span>
            <span>Revisar e Confirmar Pendências ({ocorrenciasPendentes.length})</span>
          </button>
        )}
      </div>

      {/* Alerta de Ocorrências Pendentes se houver */}
      {ocorrenciasPendentes.length > 0 && (
        <div
          className="alert alert-danger"
          style={{
            marginBottom: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>⚠️</span>
            <span>
              <strong>Atenção:</strong> Existem <strong>{ocorrenciasPendentes.length}</strong> ocorrência(s) negativa(s) aguardando sua confirmação de ciência. Enquanto houver pendências, os resgates de recompensas na loja ficam suspensos para os alunos envolvidos.
            </span>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn--sm"
            style={{ background: '#fff', color: '#b91c1c', fontWeight: 700 }}
            onClick={() => setModalConsentimentoAberto(true)}
          >
            Abrir Termo de Ciência
          </button>
        </div>
      )}

      {/* Cards de Resumo */}
      <div className="stats-grid" style={{ marginBottom: '20px' }}>
        <div className="stat-card stat-card--info">
          <div className="stat-card__label">Total de Registros</div>
          <div className="stat-card__value">{todasOcorrencias.length}</div>
        </div>
        <div className="stat-card stat-card--success">
          <div className="stat-card__label">Pontos Positivos Ganhos</div>
          <div className="stat-card__value">+{totalGanhos} pts</div>
        </div>
        <div className="stat-card stat-card--danger">
          <div className="stat-card__label">Pontos Negativos Deduzidos</div>
          <div className="stat-card__value">-{totalDeducoes} pts</div>
        </div>
        <div
          className={`stat-card ${ocorrenciasPendentes.length > 0 ? 'stat-card--warning' : 'stat-card--success'}`}
        >
          <div className="stat-card__label">Pendentes de Ciência</div>
          <div className="stat-card__value">
            {ocorrenciasPendentes.length === 0 ? '0 (Tudo em dia ✓)' : `${ocorrenciasPendentes.length} pendente(s)`}
          </div>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div
        className="card"
        style={{
          marginBottom: '20px',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Filtro por Filho */}
          {meusFilhos.length > 1 && (
            <div style={{ minWidth: '220px', flex: '1 1 200px' }}>
              <label className="form-label" style={{ fontSize: '12px', marginBottom: '4px' }}>
                Filtrar por Filho:
              </label>
              <select
                className="form-select"
                value={filtroFilhoId}
                onChange={e => {
                  const val = e.target.value;
                  setFiltroFilhoId(val === 'todos' ? 'todos' : Number(val));
                }}
              >
                <option value="todos">Todos os Filhos ({meusFilhos.length})</option>
                {meusFilhos.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.avatar} {f.nome}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Campo de Busca */}
          <div style={{ flex: '2 1 260px' }}>
            <label className="form-label" style={{ fontSize: '12px', marginBottom: '4px' }}>
              Buscar Ocorrência:
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="Buscar por motivo, professor, observação ou categoria..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
            />
          </div>
        </div>

        {/* Abas de Tipo */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`btn btn--sm ${filtroTipo === 'todas' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFiltroTipo('todas')}
          >
            Todas ({todasOcorrencias.length})
          </button>
          <button
            type="button"
            className={`btn btn--sm ${filtroTipo === 'positivas' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFiltroTipo('positivas')}
          >
            🌟 Positivas ({todasOcorrencias.filter(o => o.tipo === 'positiva').length})
          </button>
          <button
            type="button"
            className={`btn btn--sm ${filtroTipo === 'negativas' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFiltroTipo('negativas')}
          >
            ⚠️ Negativas ({todasOcorrencias.filter(o => o.tipo === 'negativa').length})
          </button>
          <button
            type="button"
            className={`btn btn--sm ${filtroTipo === 'pendentes' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFiltroTipo('pendentes')}
          >
            🛡️ Pendentes de Ciência ({ocorrenciasPendentes.length})
          </button>
          <button
            type="button"
            className={`btn btn--sm ${filtroTipo === 'consentidas' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFiltroTipo('consentidas')}
          >
            ✓ Com Ciência Registrada ({todasOcorrencias.filter(o => o.tipo === 'negativa' && o.consentido).length})
          </button>
        </div>
      </div>

      {/* Lista do Histórico Completo */}
      {meusFilhos.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon">👨‍👧</div>
          <div className="empty-state__text">Nenhum aluno vinculado a este responsável.</div>
        </div>
      ) : ocorrenciasFiltradas.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon">📜</div>
          <div className="empty-state__text">Nenhuma ocorrência encontrada para os filtros selecionados.</div>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
            Ajuste a busca ou selecione outra categoria de filtro acima.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {ocorrenciasFiltradas.map(oc => {
            const filho = alunos.find(a => a.id === oc.alunoId);
            const turma = filho ? turmas.find(t => t.id === filho.turmaId) : null;
            const isPositiva = oc.tipo === 'positiva';
            const isPendente = !isPositiva && !oc.consentido;

            return (
              <div
                key={oc.id}
                className="card"
                style={{
                  borderLeft: isPositiva
                    ? '5px solid var(--color-success, #10b981)'
                    : isPendente
                    ? '5px solid var(--color-danger, #ef4444)'
                    : '5px solid #94a3b8',
                  padding: '16px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  background: isPendente ? '#fffbfb' : '#fff',
                }}
              >
                {/* Linha 1: Filho, Turma e Pontuação */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '24px' }}>{filho?.avatar || '👤'}</span>
                    <div>
                      <strong style={{ fontSize: '15px', color: 'var(--text-primary)' }}>{filho?.nome}</strong>
                      <span className="badge badge-info" style={{ marginLeft: '8px', fontSize: '11px' }}>
                        {turma ? `${turma.serie}º Ano ${turma.turma}` : 'Turma'}
                      </span>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span
                      style={{
                        fontWeight: 800,
                        fontSize: '16px',
                        color: isPositiva ? 'var(--color-success, #10b981)' : 'var(--color-danger, #ef4444)',
                        display: 'block',
                      }}
                    >
                      {isPositiva ? `+${oc.pontos} PoloCoins` : `-${oc.pontos} PoloCoins`}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {oc.data} às {oc.hora}
                    </span>
                  </div>
                </div>

                {/* Linha 2: Motivo, Categoria e Status de Ciência */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '14px' }}>
                      {isPositiva ? '🌟' : '⚠️'} {oc.valor}
                    </span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '13px', marginLeft: '6px' }}>
                      ({oc.categoria})
                    </span>
                  </div>

                  {/* Badges de Status Visual */}
                  <div>
                    {isPositiva ? (
                      <span className="badge badge-success" style={{ fontSize: '11px' }}>
                        🌟 Reconhecimento Positivo
                      </span>
                    ) : isPendente ? (
                      <span
                        className="badge badge-danger"
                        style={{
                          fontSize: '11px',
                          background: '#fee2e2',
                          color: '#b91c1c',
                          border: '1px solid #fca5a5',
                        }}
                      >
                        ⚠️ Aguardando Ciência do Responsável
                      </span>
                    ) : (
                      <span
                        className="badge"
                        style={{
                          fontSize: '11px',
                          background: '#f1f5f9',
                          color: '#334155',
                          border: '1px solid #cbd5e1',
                        }}
                      >
                        ✓ Ciência Registrada
                      </span>
                    )}
                  </div>
                </div>

                {/* Observação Pedagógica */}
                {oc.observacao && (
                  <div
                    style={{
                      background: isPositiva ? '#f0fdf4' : '#f8fafc',
                      border: isPositiva ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontStyle: 'italic',
                      color: isPositiva ? '#166534' : 'var(--text-secondary)',
                    }}
                  >
                    "{oc.observacao}"
                  </div>
                )}

                {/* Linha Final: Professor Responsável e Ação */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderTop: '1px solid #f1f5f9',
                    paddingTop: '8px',
                    fontSize: '12px',
                    color: 'var(--text-muted)',
                  }}
                >
                  <span>
                    Professor(a): <strong>{oc.professorNome || 'Docente Polo'}</strong>
                  </span>

                  {isPendente && (
                    <button
                      type="button"
                      className="btn btn-success btn--sm"
                      onClick={() => handleDarCienciaIndividual(oc.id)}
                      disabled={processandoId === oc.id}
                      style={{ fontSize: '12px', padding: '4px 12px' }}
                    >
                      {processandoId === oc.id ? 'Salvando...' : '✓ Confirmar Ciência'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
