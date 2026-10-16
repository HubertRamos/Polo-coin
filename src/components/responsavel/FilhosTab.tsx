import React from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../common/Toast';

export const FilhosTab: React.FC = () => {
  const { alunos, turmas, avaliacoes, updateAlunoPodeComprar } = useData();
  const { currentUser } = useAuth();
  const toast = useToast();

  const meusFilhos = alunos.filter(a => a.responsavelId === currentUser?.id);

  const handleTogglePodeComprar = async (alunoId: number, nome: string, statusAtual: boolean) => {
    await updateAlunoPodeComprar(alunoId, !statusAtual);
    toast.success(
      !statusAtual
        ? `Compras diretas liberadas para ${nome}!`
        : `Compras diretas pausadas para ${nome}. O aluno precisará pedir autorização.`
    );
  };

  return (
    <div>
      <div className="polocoin-main__header">
        <div>
          <h1 className="polocoin-main__title">Meus Filhos & Saldos</h1>
          <p className="polocoin-main__subtitle">
            Acompanhe o desempenho, pontuação PoloCoin e controle as permissões de compra
          </p>
        </div>
      </div>

      {meusFilhos.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon">👨‍👧</div>
          <div className="empty-state__text">Nenhum aluno vinculado a este responsável.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          {meusFilhos.map(filho => {
            const turma = turmas.find(t => t.id === filho.turmaId);
            const ocorrenciasPendentes = avaliacoes.filter(
              av => av.alunoId === filho.id && av.tipo === 'negativa' && !av.consentido
            ).length;

            return (
              <div key={filho.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        background: 'var(--gradient-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '30px',
                        color: '#fff',
                        boxShadow: 'var(--shadow-primary)',
                      }}
                    >
                      {filho.avatar}
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 900 }}>{filho.nome}</h3>
                      <span className="badge badge-info" style={{ marginTop: '4px' }}>
                        {turma ? `${turma.serie}º Ano ${turma.turma}` : 'Turma'}
                      </span>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, display: 'block' }}>
                      SALDO ATUAL
                    </span>
                    <span style={{ fontSize: '20px', fontWeight: 900, color: 'var(--color-coin-dark)' }}>
                      🪙 {filho.pontos}
                    </span>
                  </div>
                </div>

                {/* Avisos */}
                {ocorrenciasPendentes > 0 && (
                  <div className="alert alert-warning" style={{ fontSize: '12px', margin: 0, padding: '8px 12px' }}>
                    <span>⚠️ {ocorrenciasPendentes} ocorrência(s) pendente(s) de consentimento seu.</span>
                  </div>
                )}

                {/* Controle Parental de Compras */}
                <div
                  style={{
                    background: 'var(--bg-subtle)',
                    padding: '14px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <strong style={{ display: 'block', fontSize: '13px', color: 'var(--text-primary)' }}>
                      Compras na Loja Escolar
                    </strong>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {filho.pode_comprar
                        ? 'O aluno pode resgatar produtos sozinho'
                        : 'Requer sua aprovação na lista de desejos'}
                    </span>
                  </div>

                  <button
                    type="button"
                    className={`btn btn--sm ${filho.pode_comprar ? 'btn-success' : 'btn-secondary'}`}
                    onClick={() => handleTogglePodeComprar(filho.id, filho.nome, filho.pode_comprar)}
                  >
                    {filho.pode_comprar ? '✓ Liberado' : '🔒 Pausado'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
