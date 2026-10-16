import React from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../common/Modal';
import { useToast } from '../common/Toast';

interface CarrinhoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CarrinhoModal: React.FC<CarrinhoModalProps> = ({ isOpen, onClose }) => {
  const { carrinho, updateCartQtd, removeFromCart, checkoutCarrinho, alunos } = useData();
  const { currentUser } = useAuth();
  const toast = useToast();

  const aluno = alunos.find(a => a.id === currentUser?.id) || alunos[0];
  const totalPontos = carrinho.reduce((sum, item) => sum + item.produto.custo_pontos * item.quantidade, 0);

  const handleFinalizar = async () => {
    if (!aluno) return;
    const res = await checkoutCarrinho(aluno.id);
    if (!res.success) {
      toast.error(res.error || 'Não foi possível finalizar o pedido.');
    } else {
      toast.success('Pedido realizado com sucesso! Aguarde a entrega pela administração escolar.');
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Meu Carrinho de Recompensas"
      subtitle="Confira os itens selecionados antes de finalizar a troca de pontos"
      maxWidth="560px"
    >
      <div>
        {carrinho.length === 0 ? (
          <div className="carrinho-vazio">
            <div className="carrinho-vazio__icon">🛒</div>
            <h4 className="carrinho-vazio__title">Seu carrinho está vazio</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '4px 0 16px' }}>
              Explore a Loja PoloCoin e escolha suas recompensas favoritas!
            </p>
            <button type="button" className="btn btn-primary btn--sm" onClick={onClose}>
              Explorar Loja
            </button>
          </div>
        ) : (
          <div>
            <div className="carrinho-lista">
              {carrinho.map(item => (
                <div key={item.produto.id} className="carrinho-item">
                  <div className="carrinho-item__info">
                    <span className="carrinho-item__nome">{item.produto.nome}</span>
                    <span className="carrinho-item__preco-unit">
                      🪙 {item.produto.custo_pontos} cada ({item.produto.categoria})
                    </span>
                  </div>

                  <div className="carrinho-item__acoes">
                    <div className="carrinho-qtd">
                      <button
                        type="button"
                        className="carrinho-qtd__btn"
                        onClick={() => updateCartQtd(item.produto.id, -1)}
                      >
                        -
                      </button>
                      <span className="carrinho-qtd__valor">{item.quantidade}</span>
                      <button
                        type="button"
                        className="carrinho-qtd__btn"
                        onClick={() => updateCartQtd(item.produto.id, 1)}
                      >
                        +
                      </button>
                    </div>

                    <span className="carrinho-item__subtotal">
                      🪙 {item.produto.custo_pontos * item.quantidade}
                    </span>

                    <button
                      type="button"
                      className="btn btn-ghost btn--sm carrinho-item__remover"
                      onClick={() => removeFromCart(item.produto.id)}
                      title="Remover item"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Total e Saldo */}
            <div
              style={{
                background: 'var(--bg-subtle)',
                borderRadius: '12px',
                padding: '16px',
                margin: '16px 0',
                border: '1px solid var(--border-color)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Seu Saldo Disponível:</span>
                <span style={{ fontWeight: 800, color: 'var(--color-coin-dark)' }}>
                  🪙 {aluno?.pontos || 0} PoloCoins
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingTop: '8px',
                  borderTop: '1px solid var(--border-color)',
                  alignItems: 'center',
                }}
              >
                <strong style={{ fontSize: '15px' }}>Total do Pedido:</strong>
                <span style={{ fontSize: '20px', fontWeight: 900, color: 'var(--color-primary)' }}>
                  🪙 {totalPontos}
                </span>
              </div>
            </div>

            {aluno && aluno.pontos < totalPontos && (
              <div className="alert alert-warning" style={{ fontSize: '12px', marginBottom: '14px' }}>
                <span>⚠️ Saldo insuficiente! Faltam 🪙 {totalPontos - aluno.pontos} PoloCoins para esta compra.</span>
              </div>
            )}

            {!aluno?.pode_comprar && (
              <div className="alert alert-danger" style={{ fontSize: '12px', marginBottom: '14px' }}>
                <span>🔒 Compras diretas pausadas pelo responsável. Peça autorização ou adicione à lista de desejos!</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Continuar Escolhendo
              </button>
              <button
                type="button"
                className="btn btn-success"
                onClick={handleFinalizar}
                disabled={aluno && (aluno.pontos < totalPontos || !aluno.pode_comprar)}
              >
                Finalizar Troca de Pontos
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
