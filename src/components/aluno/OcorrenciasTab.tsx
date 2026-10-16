import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';

export const OcorrenciasTab: React.FC = () => {
  const { avaliacoes, compras, alunos } = useData();
  const { currentUser } = useAuth();

  const aluno = alunos.find(a => a.id === currentUser?.id) || alunos[0];

  const [filtro, setFiltro] = useState<'todas' | 'positivas' | 'negativas' | 'compras'>('todas');

  const minhasAvaliacoes = avaliacoes.filter(av => av.alunoId === aluno?.id);
  const minhasCompras = compras.filter(c => c.alunoId === aluno?.id);

  const totalGanhos = minhasAvaliacoes
    .filter(av => av.tipo === 'positiva')
    .reduce((sum, av) => sum + av.pontos, 0);

  const totalDeducoes = minhasAvaliacoes
    .filter(av => av.tipo === 'negativa')
    .reduce((sum, av) => sum + av.pontos, 0);

  const totalGastoLoja = minhasCompras.reduce((sum, c) => sum + c.custoPontos, 0);

  // Unify timeline items
  interface TimelineItem {
    id: string;
    tipo: 'positiva' | 'negativa' | 'compra';
    titulo: string;
    subtitulo: string;
    pontos: number;
    dataHora: string;
    observacao?: string;
    consentido?: boolean;
  }

  const itensTimeline: TimelineItem[] = [];

  minhasAvaliacoes.forEach(av => {
    itensTimeline.push({
      id: `av-${av.id}`,
      tipo: av.tipo,
      titulo: `${av.tipo === 'positiva' ? '🌟 Ganho:' : '⚠️ Ocorrência:'} ${av.valor}`,
      subtitulo: `Categoria: ${av.categoria} • Por: ${av.professorNome || 'Professor'}`,
      pontos: av.pontos,
      dataHora: `${av.data} às ${av.hora}`,
      observacao: av.observacao,
      consentido: av.consentido,
    });
  });

  minhasCompras.forEach(c => {
    itensTimeline.push({
      id: `cp-${c.id}`,
      tipo: 'compra',
      titulo: `🛍️ Resgate: ${c.produtoNome}`,
      subtitulo: `Categoria: ${c.categoriaNome} • Status: ${c.entregue ? 'Entregue ✓' : 'Aguardando entrega'}`,
      pontos: c.custoPontos,
      dataHora: c.criadoEm,
      observacao: c.autorizadoPor ? 'Aprovado pelo responsável' : 'Resgatado diretamente pelo aluno',
    });
  });

  // Sort descending by date
  itensTimeline.sort((a, b) => b.dataHora.localeCompare(a.dataHora));

  const itensFiltrados = itensTimeline.filter(item => {
    if (filtro === 'todas') return true;
    if (filtro === 'positivas') return item.tipo === 'positiva';
    if (filtro === 'negativas') return item.tipo === 'negativa';
    if (filtro === 'compras') return item.tipo === 'compra';
    return true;
  });

  return (
    <div>
      <div className="polocoin-main__header">
        <div>
          <h1 className="polocoin-main__title">Extrato e Avaliações</h1>
          <p className="polocoin-main__subtitle">
            Histórico completo de pontos acumulados, ocorrências pedagógicas e resgates na loja
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card stat-card--warning">
          <div className="stat-card__label">Saldo Atual</div>
          <div className="stat-card__value">🪙 {aluno?.pontos || 0}</div>
        </div>
        <div className="stat-card stat-card--success">
          <div className="stat-card__label">Total Conquistado</div>
          <div className="stat-card__value">+{totalGanhos} pts</div>
        </div>
        <div className="stat-card stat-card--info">
          <div className="stat-card__label">Gasto na Loja</div>
          <div className="stat-card__value">-{totalGastoLoja} pts</div>
        </div>
        <div className="stat-card stat-card--danger">
          <div className="stat-card__label">Deduções / Ocorrências</div>
          <div className="stat-card__value">-{totalDeducoes} pts</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '18px', flexWrap: 'wrap' }}>
        <button
          type="button"
          className={`btn btn--sm ${filtro === 'todas' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFiltro('todas')}
        >
          Tudo ({itensTimeline.length})
        </button>
        <button
          type="button"
          className={`btn btn--sm ${filtro === 'positivas' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFiltro('positivas')}
        >
          🌟 Pontos Positivos
        </button>
        <button
          type="button"
          className={`btn btn--sm ${filtro === 'negativas' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFiltro('negativas')}
        >
          ⚠️ Ocorrências
        </button>
        <button
          type="button"
          className={`btn btn--sm ${filtro === 'compras' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFiltro('compras')}
        >
          🛍️ Compras & Resgates
        </button>
      </div>

      {/* Timeline List */}
      {itensFiltrados.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon">📜</div>
          <div className="empty-state__text">Nenhum registro encontrado nesta categoria.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {itensFiltrados.map(item => {
            const isPos = item.tipo === 'positiva';
            const isNeg = item.tipo === 'negativa';
            const isCompra = item.tipo === 'compra';

            const borderCor = isPos ? 'var(--color-success)' : isNeg ? 'var(--color-danger)' : 'var(--color-primary)';

            return (
              <div
                key={item.id}
                className="card"
                style={{
                  borderLeft: `5px solid ${borderCor}`,
                  padding: '14px 18px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800 }}>{item.titulo}</h3>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{item.subtitulo}</span>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span
                      style={{
                        fontSize: '16px',
                        fontWeight: 900,
                        color: isPos ? 'var(--color-success)' : isNeg ? 'var(--color-danger)' : 'var(--color-primary)',
                      }}
                    >
                      {isPos ? `+${item.pontos}` : `-${item.pontos}`} PoloCoins
                    </span>
                    <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)' }}>
                      {item.dataHora}
                    </span>
                  </div>
                </div>

                {item.observacao && (
                  <div
                    style={{
                      background: 'var(--bg-subtle)',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      marginTop: '8px',
                      fontSize: '13px',
                      color: 'var(--text-secondary)',
                      fontStyle: 'italic',
                    }}
                  >
                    "{item.observacao}"
                  </div>
                )}

                {isNeg && (
                  <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'flex-end' }}>
                    {item.consentido ? (
                      <span className="badge badge-success">✓ Consentida pelo Responsável</span>
                    ) : (
                      <span className="badge badge-warning">⏳ Pendente de Ciência dos Pais</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
