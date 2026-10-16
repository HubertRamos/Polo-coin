import React from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../common/Toast';

export const DesejosFilhosTab: React.FC = () => {
  const { desejos, produtos, alunos, comprarDesejoPorResponsavel, removerDesejo } = useData();
  const { currentUser } = useAuth();
  const toast = useToast();

  const meusFilhos = alunos.filter(a => a.responsavelId === currentUser?.id || currentUser?.id === 1);
  const meusFilhosIds = meusFilhos.map(f => f.id);

  const desejosDosFilhos = desejos.filter(d => meusFilhosIds.includes(d.alunoId));

  const handleAutorizarCompra = async (alunoId: number, produtoId: number, produtoNome: string, alunoNome: string) => {
    const res = await comprarDesejoPorResponsavel(alunoId, produtoId, currentUser?.id || 1);
    if (!res.success) {
      toast.error(res.error || 'Não foi possível autorizar o resgate.');
    } else {
      toast.success(`Resgate de "${produtoNome}" autorizado com sucesso para ${alunoNome}!`);
    }
  };

  const handleRecusar = (alunoId: number, produtoId: number, produtoNome: string) => {
    removerDesejo(alunoId, produtoId);
    toast.info(`O pedido de "${produtoNome}" foi removido.`);
  };

  return (
    <div>
      <div className="polocoin-main__header">
        <div>
          <h1 className="polocoin-main__title">Pedidos dos Filhos</h1>
          <p className="polocoin-main__subtitle">
            Autorize o resgate de recompensas solicitadas pelos seus filhos na Loja PoloCoin
          </p>
        </div>
      </div>

      {desejosDosFilhos.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon">🎁</div>
          <div className="empty-state__text">Nenhum pedido de recompensa pendente no momento!</div>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
            Quando seus filhos escolherem itens na loja, os pedidos aparecerão aqui para sua aprovação.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          {desejosDosFilhos.map(d => {
            const filho = alunos.find(a => a.id === d.alunoId);
            const produto = produtos.find(p => p.id === d.produtoId);
            if (!filho || !produto) return null;

            const saldoSuficiente = filho.pontos >= produto.custo_pontos;

            return (
              <div key={d.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '26px' }}>{filho.avatar}</span>
                    <div>
                      <strong style={{ fontSize: '15px' }}>{filho.nome}</strong>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>
                        Solicitado em {d.criadoEm}
                      </span>
                    </div>
                  </div>
                  <span className="badge badge-info">{produto.categoria}</span>
                </div>

                <div
                  style={{
                    background: 'var(--bg-subtle)',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <h4 style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: 800 }}>{produto.nome}</h4>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span>Custo do Item:</span>
                    <strong style={{ color: 'var(--color-coin-dark)' }}>🪙 {produto.custo_pontos} PoloCoins</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginTop: '4px' }}>
                    <span>Saldo do Aluno:</span>
                    <strong style={{ color: saldoSuficiente ? 'var(--color-success)' : 'var(--color-danger)' }}>
                      🪙 {filho.pontos} PoloCoins
                    </strong>
                  </div>
                </div>

                {!saldoSuficiente && (
                  <div className="alert alert-warning" style={{ margin: 0, padding: '6px 10px', fontSize: '12px' }}>
                    <span>⚠️ O aluno precisa de mais 🪙 {produto.custo_pontos - filho.pontos} PoloCoins para este resgate.</span>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn--sm"
                    style={{ flex: 1 }}
                    onClick={() => handleRecusar(filho.id, produto.id, produto.nome)}
                  >
                    Recusar
                  </button>

                  <button
                    type="button"
                    className="btn btn-success btn--sm"
                    style={{ flex: 1 }}
                    onClick={() => handleAutorizarCompra(filho.id, produto.id, produto.nome, filho.nome)}
                    disabled={!saldoSuficiente}
                  >
                    ✓ Autorizar e Comprar
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
