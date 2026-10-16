import React, { useState } from 'react';
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

  const [processando, setProcessando] = useState(false);

  const aluno = alunos.find(a => a.id === currentUser?.id) || alunos[0];
  const totalPontos = carrinho.reduce((sum, item) => sum + item.produto.custo_pontos * item.quantidade, 0);

  // Validação de estoque para itens do carrinho
  const itemSemEstoque = carrinho.find(
    item => item.produto.estoque !== undefined && item.quantidade > item.produto.estoque
  );

  const saldoInsuficiente = aluno ? aluno.pontos < totalPontos : false;
  const podeComprarAutonomo = aluno ? aluno.pode_comprar : true;

  // Botão desabilitado se:
  // - Carrinho vazio
  // - Processamento em andamento
  // - Item com estoque excedido
  // - Se liberado para compra autônoma (Caso A) e saldo for insuficiente
  const botaoDesabilitado =
    carrinho.length === 0 ||
    processando ||
    !!itemSemEstoque ||
    (podeComprarAutonomo && saldoInsuficiente);

  const handleUpdateQtd = (produtoId: number, delta: number) => {
    const res = updateCartQtd(produtoId, delta);
    if (!res.success && res.error) {
      toast.warning(res.error);
    }
  };

  const handleFinalizar = async () => {
    if (!aluno || processando) return;
    if (carrinho.length === 0) {
      toast.warning('Seu carrinho está vazio.');
      return;
    }

    setProcessando(true);
    try {
      const res = await checkoutCarrinho(aluno.id);
      if (!res.success) {
        toast.error(res.error || 'Não foi possível confirmar o pedido. Tente novamente.');
      } else {
        if (res.destino === 'desejos') {
          toast.success('Pedido enviado com sucesso para aprovação do seu responsável! Acompanhe o status na aba Desejos.');
        } else {
          toast.success('Compra confirmada com sucesso! Seu pedido foi encaminhado para a lista de entregas pendentes.');
        }
        onClose();
      }
    } catch (err: any) {
      toast.error('Ocorreu um erro inesperado ao processar o pedido. Tente novamente.');
    } finally {
      setProcessando(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Meu Carrinho de Compras"
      subtitle="Confira os itens selecionados antes de confirmar a compra"
      maxWidth="580px"
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
              {carrinho.map(item => {
                const temEstoqueInfo = item.produto.estoque !== undefined;
                const estoqueExcedido = temEstoqueInfo && item.quantidade > (item.produto.estoque ?? 0);

                return (
                  <div key={item.produto.id} className="carrinho-item">
                    <div className="carrinho-item__info">
                      <span className="carrinho-item__nome">{item.produto.nome}</span>
                      <span className="carrinho-item__preco-unit">
                        🪙 {item.produto.custo_pontos} cada ({item.produto.categoria})
                      </span>
                      {temEstoqueInfo && (
                        <span style={{ fontSize: '11px', color: estoqueExcedido ? 'var(--color-danger)' : 'var(--text-muted)' }}>
                          Estoque disponível: {item.produto.estoque} unid.
                        </span>
                      )}
                    </div>

                    <div className="carrinho-item__acoes">
                      <div className="carrinho-qtd">
                        <button
                          type="button"
                          className="carrinho-qtd__btn"
                          onClick={() => handleUpdateQtd(item.produto.id, -1)}
                          disabled={processando}
                          title="Diminuir"
                        >
                          -
                        </button>
                        <span className="carrinho-qtd__valor">{item.quantidade}</span>
                        <button
                          type="button"
                          className="carrinho-qtd__btn"
                          onClick={() => handleUpdateQtd(item.produto.id, 1)}
                          disabled={processando || (temEstoqueInfo && item.quantidade >= (item.produto.estoque ?? 0))}
                          title="Aumentar"
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
                        disabled={processando}
                        title="Remover item"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Painel Consolidado de Total e Saldo */}
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

              {podeComprarAutonomo && aluno && !saldoInsuficiente && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Saldo após a compra:</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-success)' }}>
                    🪙 {aluno.pontos - totalPontos} PoloCoins
                  </span>
                </div>
              )}

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

            {/* Alertas contextuais para Caso A vs Caso B */}
            {itemSemEstoque && (
              <div className="alert alert-danger" style={{ fontSize: '12px', marginBottom: '14px' }}>
                <span>
                  ⚠️ O produto <strong>"{itemSemEstoque.produto.nome}"</strong> excede o estoque disponível ({itemSemEstoque.produto.estoque} unidades). Por favor, ajuste a quantidade no carrinho para continuar.
                </span>
              </div>
            )}

            {podeComprarAutonomo && saldoInsuficiente && aluno && (
              <div className="alert alert-warning" style={{ fontSize: '12px', marginBottom: '14px' }}>
                <span>
                  ⚠️ <strong>Saldo insuficiente:</strong> Você possui 🪙 {aluno.pontos} PoloCoins e o total é 🪙 {totalPontos}. Faltam 🪙 {totalPontos - aluno.pontos} PoloCoins para concluir esta compra.
                </span>
              </div>
            )}

            {!podeComprarAutonomo && (
              <div className="alert alert-info" style={{ fontSize: '12px', marginBottom: '14px' }}>
                <span>
                  👨‍👩‍👧 <strong>Autorização familiar:</strong> Suas compras requerem aprovação dos seus pais. Ao clicar em <strong>"Confirmar compra"</strong>, o pedido será enviado para a sua <strong>Lista de Desejos</strong> para validação pelo responsável. Nenhum PoloCoin será debitado agora!
                </span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={processando}
              >
                Continuar Escolhendo
              </button>
              <button
                type="button"
                className="btn btn-success"
                onClick={handleFinalizar}
                disabled={botaoDesabilitado}
                title={
                  podeComprarAutonomo && saldoInsuficiente
                    ? 'Saldo insuficiente'
                    : itemSemEstoque
                    ? 'Estoque insuficiente'
                    : 'Confirmar compra do pedido'
                }
              >
                {processando ? 'Processando pedido...' : 'Confirmar compra'}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
