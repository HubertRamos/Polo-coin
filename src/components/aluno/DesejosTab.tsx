import React from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../common/Toast';
import { Produto } from '../../types';

export const DesejosTab: React.FC = () => {
  const { desejos, produtos, alunos, removerDesejo, addToCart } = useData();
  const { currentUser } = useAuth();
  const toast = useToast();

  const aluno = alunos.find(a => a.id === currentUser?.id) || alunos[0];
  const meusDesejos = desejos.filter(d => d.alunoId === aluno?.id);

  const handleRemover = (produtoId: number, produtoNome: string) => {
    if (aluno) {
      removerDesejo(aluno.id, produtoId);
      toast.info(`"${produtoNome}" foi removido da sua lista de pedidos pendentes.`);
    }
  };

  const handleMoverParaCarrinho = (prod: Produto, qtd = 1) => {
    const res = addToCart(prod, qtd);
    if (!res.success) {
      toast.warning(res.error || 'Não foi possível adicionar ao carrinho.');
      return;
    }
    toast.success(`"${prod.nome}" adicionado ao seu carrinho!`);
  };

  return (
    <div>
      <div className="polocoin-main__header">
        <div>
          <h1 className="polocoin-main__title">Minha Lista de Desejos & Pedidos</h1>
          <p className="polocoin-main__subtitle">
            Acompanhe pedidos enviados que aguardam autorização e resgate pelos seus responsáveis
          </p>
        </div>
      </div>

      <div className="alert alert-info" style={{ marginBottom: '20px' }}>
        <span>
          💡 <strong>Como funciona:</strong> Os itens adicionados aqui foram encaminhados pelo carrinho e estão aguardando a aprovação do seu responsável no painel familiar. Nenhum PoloCoin foi debitado até que seus pais aprovem o resgate.
        </span>
      </div>

      {meusDesejos.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon">✨</div>
          <div className="empty-state__text">Sua lista de desejos está vazia.</div>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '6px' }}>
            Monte seu pedido na <strong>Loja PoloCoin</strong> e clique em <strong>"Confirmar compra"</strong> no carrinho para enviar recompensas para autorização familiar!
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {meusDesejos.map(d => {
            const prod = produtos.find(p => p.id === d.produtoId);
            if (!prod) return null;
            const qtd = d.quantidade && d.quantidade > 0 ? d.quantidade : 1;
            const custoTotal = prod.custo_pontos * qtd;
            const saldoSuficiente = aluno && aluno.pontos >= custoTotal;

            return (
              <div key={d.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span className="badge badge-info">{prod.categoria}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{d.criadoEm}</span>
                </div>

                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>
                    {prod.nome} {qtd > 1 && <span style={{ color: 'var(--color-primary)' }}>({qtd}x)</span>}
                  </h3>
                  <div style={{ marginTop: '6px' }}>
                    <span className="badge badge-warning" style={{ fontSize: '11px' }}>
                      ⏳ Aguardando aprovação dos pais
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Custo total:</div>
                    <span style={{ fontSize: '18px', fontWeight: 900, color: 'var(--color-coin-dark)' }}>
                      🪙 {custoTotal} PoloCoins
                    </span>
                  </div>
                  <span className={`badge ${saldoSuficiente ? 'badge-success' : 'badge-danger'}`}>
                    {saldoSuficiente ? 'Saldo OK' : `Faltam ${custoTotal - (aluno?.pontos || 0)}`}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid var(--border-color)' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn--sm"
                    style={{ flex: 1 }}
                    onClick={() => handleRemover(prod.id, prod.nome)}
                  >
                    Cancelar Pedido
                  </button>

                  {aluno?.pode_comprar && (
                    <button
                      type="button"
                      className="btn btn-primary btn--sm"
                      style={{ flex: 1 }}
                      onClick={() => handleMoverParaCarrinho(prod, qtd)}
                      title="Mover de volta para o carrinho para compra autônoma"
                    >
                      🛒 Ir para o carrinho
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
