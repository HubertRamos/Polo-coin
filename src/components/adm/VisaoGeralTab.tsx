import React from 'react';
import { useData } from '../../context/DataContext';
import { useToast } from '../common/Toast';

interface VisaoGeralTabProps {
  onNavigateTab?: (tab: string) => void;
}

export const VisaoGeralTab: React.FC<VisaoGeralTabProps> = ({ onNavigateTab }) => {
  const { alunos, turmas, professores, produtos, compras, avaliacoes, executarLimpezaGeral } = useData();
  const toast = useToast();

  const totalAlunos = alunos.length;
  const totalTurmas = turmas.length;
  const totalProfessores = professores.length;
  const totalProdutos = produtos.length;
  const saldoTotalCirculante = alunos.reduce((sum, a) => sum + (a.pontos || 0), 0);
  const entregasPendentes = compras.filter(c => !c.entregue).length;
  const entregasConcluidas = compras.filter(c => c.entregue).length;

  const ultimasAvaliacoes = [...avaliacoes].slice(0, 5);
  const ultimosResgates = [...compras].slice(0, 5);

  const handleOtimizarHistorico = async () => {
    if (window.confirm('Deseja arquivar os registros antigos de produtos que já foram entregues?')) {
      const res = await executarLimpezaGeral();
      toast.success(`Histórico escolar atualizado. ${res.removidos} registro(s) arquivado(s).`);
    }
  };

  return (
    <div>
      <div className="polocoin-main__header">
        <div>
          <h1 className="polocoin-main__title">Painel Geral da Escola</h1>
          <p className="polocoin-main__subtitle">
            Visão consolidada de alunos, turmas, circulação de PoloCoins e movimentações
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {onNavigateTab && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => onNavigateTab('movimentacoes')}
              title="Transferência entre turmas e progressão de fim de ano"
            >
              <span>🔄</span> Movimentar Alunos
            </button>
          )}
          {entregasConcluidas > 0 && (
            <button type="button" className="btn btn-secondary" onClick={handleOtimizarHistorico}>
              🧹 Arquivar Histórico Antigo
            </button>
          )}
        </div>
      </div>

      {/* Grid de Estatísticas Principais */}
      <div className="stats-grid">
        <div className="stat-card stat-card--info">
          <div className="stat-card__label">Alunos Matriculados</div>
          <div className="stat-card__value">{totalAlunos}</div>
        </div>

        <div className="stat-card stat-card--success">
          <div className="stat-card__label">Turmas Ativas</div>
          <div className="stat-card__value">{totalTurmas}</div>
        </div>

        <div className="stat-card stat-card--danger">
          <div className="stat-card__label">Entregas Pendentes</div>
          <div className="stat-card__value">{entregasPendentes}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* Desempenho por Turma */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 className="card-title" style={{ margin: 0 }}>Turmas Escolares</h3>
            {onNavigateTab && (
              <button
                type="button"
                className="btn btn-ghost btn--sm"
                onClick={() => onNavigateTab('turmas')}
              >
                Ver todas →
              </button>
            )}
          </div>

          {turmas.length === 0 ? (
            <div className="empty-state" style={{ padding: '24px 0' }}>
              <div className="empty-state__icon">🏫</div>
              <div className="empty-state__text">Nenhuma turma cadastrada ainda.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {turmas.map(turma => {
                const alunosTurma = alunos.filter(a => a.turmaId === turma.id);
                const pontosTurma = alunosTurma.reduce((sum, a) => sum + (a.pontos || 0), 0);
                const mediaPontos = alunosTurma.length > 0 ? Math.round(pontosTurma / alunosTurma.length) : 0;
                const profsTurma = professores.filter(p => p.turmasVinculadas.includes(turma.id));

                return (
                  <div
                    key={turma.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: '14.5px', color: 'var(--text-primary)' }}>
                        {turma.serie}º Ano {turma.turma}
                      </strong>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {alunosTurma.length} estudante(s) • Docentes: {profsTurma.length > 0 ? profsTurma.map(p => p.name).join(', ') : 'Não atribuído'}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--color-coin-dark)' }}>
                        🪙 {pontosTurma}
                      </span>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        média {mediaPontos} pts
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Resumo da Loja e Recompensas */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 className="card-title" style={{ margin: 0 }}>Loja & Entregas</h3>
            {onNavigateTab && (
              <button
                type="button"
                className="btn btn-ghost btn--sm"
                onClick={() => onNavigateTab('entregas')}
              >
                Gerenciar entregas →
              </button>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
            <div style={{ background: 'var(--bg-subtle)', padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Produtos Ativos</div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text-primary)', marginTop: '4px' }}>
                {totalProdutos}
              </div>
            </div>

            <div style={{ background: 'var(--bg-subtle)', padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Professores</div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text-primary)', marginTop: '4px' }}>
                {totalProfessores}
              </div>
            </div>
          </div>

          <h4 style={{ margin: '0 0 10px', fontSize: '13.5px', fontWeight: 800 }}>Últimos Resgates de Itens</h4>
          {ultimosResgates.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '16px 0' }}>
              Nenhum resgate registrado ainda.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {ultimosResgates.map(c => {
                const aluno = alunos.find(a => a.id === c.alunoId);
                return (
                  <div
                    key={c.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '13px',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      background: 'var(--bg-subtle)',
                    }}
                  >
                    <div>
                      <strong>{c.produtoNome}</strong>
                      <span style={{ color: 'var(--text-muted)', marginLeft: '6px' }}>
                        por {aluno?.nome || 'Aluno'}
                      </span>
                    </div>
                    <span className={c.entregue ? 'badge badge-success' : 'badge badge-warning'}>
                      {c.entregue ? 'Entregue' : 'Pendente'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
