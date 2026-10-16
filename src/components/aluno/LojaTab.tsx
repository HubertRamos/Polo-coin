import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Produto } from '../../types';
import { CarrinhoModal } from './CarrinhoModal';
import { useToast } from '../common/Toast';

export const LojaTab: React.FC = () => {
  const { produtos, categorias, carrinho, addToCart, alunos } = useData();
  const { currentUser } = useAuth();
  const toast = useToast();

  const [busca, setBusca] = useState('');
  const [categoriaSel, setCategoriaSel] = useState('todas');
  const [modalCarrinhoAberto, setModalCarrinhoAberto] = useState(false);
  const [quantidades, setQuantidades] = useState<Record<number, number>>({});
  const [adicionadoId, setAdicionadoId] = useState<number | null>(null);

  const aluno = alunos.find(a => a.id === currentUser?.id) || alunos[0];

  const cartCount = carrinho.reduce((acc, item) => acc + item.quantidade, 0);
  const cartTotal = carrinho.reduce((acc, item) => acc + item.produto.custo_pontos * item.quantidade, 0);

  const produtosFiltrados = produtos.filter(p => {
    const matchBusca = p.nome.toLowerCase().includes(busca.toLowerCase());
    const matchCat = categoriaSel === 'todas' || p.categoria === categoriaSel;
    return matchBusca && matchCat;
  });

  const setQtd = (produtoId: number, qtd: number) => {
    setQuantidades(prev => ({ ...prev, [produtoId]: Math.max(1, qtd) }));
  };

  const handleAddToCart = (p: Produto) => {
    const qtd = quantidades[p.id] || 1;
    const res = addToCart(p, qtd);
    if (!res.success) {
      toast.warning(res.error || 'Não foi possível adicionar ao carrinho.');
      return;
    }

    setAdicionadoId(p.id);
    setTimeout(() => {
      setAdicionadoId(prev => (prev === p.id ? null : prev));
    }, 1200);

    toast.success(`"${p.nome}" (${qtd}x) adicionado ao seu carrinho!`);
    setQuantidades(prev => ({ ...prev, [p.id]: 1 }));
  };

  return (
    <div>
      {/* Saldo Badge & Carrinho Top Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '20px',
          flexWrap: 'wrap',
        }}
      >
        <div className="saldo-badge" style={{ flex: '1', minWidth: '240px' }}>
          <span className="saldo-badge__icon">🪙</span>
          <div>
            <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.9 }}>
              Seu Saldo PoloCoin
            </div>
            <div className="saldo-badge__value">{aluno?.pontos || 0} PoloCoins</div>
          </div>
        </div>

        <button
          type="button"
          className="loja-carrinho-btn"
          onClick={() => setModalCarrinhoAberto(true)}
        >
          <span>🛒</span>
          <span className="loja-carrinho-btn__label">
            Ver Carrinho
            <span className="loja-carrinho-btn__qtd">{cartCount}</span>
          </span>
          {cartTotal > 0 && (
            <span className="loja-carrinho-btn__total">• 🪙 {cartTotal}</span>
          )}
        </button>
      </div>

      {/* Alerta de supervisão familiar se aluno não tiver compras autônomas */}
      {aluno && !aluno.pode_comprar && (
        <div className="alert alert-info" style={{ marginBottom: '18px' }}>
          <span>
            👨‍👩‍👧 <strong>Compras com aprovação familiar:</strong> Suas compras são supervisionadas pelos seus pais. Adicione os itens desejados ao carrinho e clique em <strong>"Confirmar compra"</strong> — o pedido será automaticamente encaminhado para autorização do seu responsável!
          </span>
        </div>
      )}

      {/* Filtros da Loja */}
      <div className="loja-filtros">
        <div className="loja-filtros__busca">
          <input
            type="text"
            className="form-input"
            placeholder="🔍 Procurar recompensa na loja..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
        </div>
        <div className="loja-filtros__categoria">
          <select
            className="form-select"
            value={categoriaSel}
            onChange={e => setCategoriaSel(e.target.value)}
          >
            <option value="todas">Todas as Categorias</option>
            {categorias.map(c => (
              <option key={c.id} value={c.nome}>
                {c.nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid de Recompensas */}
      {produtosFiltrados.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon">🎁</div>
          <div className="empty-state__text">Nenhum produto encontrado nesta categoria.</div>
        </div>
      ) : (
        <div className="produtos-grid">
          {produtosFiltrados.map(p => {
            const qtdSel = quantidades[p.id] || 1;
            const semEstoque = p.estoque !== undefined && p.estoque <= 0;
            const adicionadoRecente = adicionadoId === p.id;

            return (
              <div key={p.id} className="produto-card">
                <div className="produto-card__topo">
                  <span className="produto-card__categoria">{p.categoria}</span>
                  <span className="produto-card__preco">
                    🪙 {p.custo_pontos}
                  </span>
                </div>

                <h3 className="produto-card__nome">{p.nome}</h3>

                {p.estoque !== undefined && (
                  <div style={{ marginBottom: '10px' }}>
                    {semEstoque ? (
                      <span className="badge badge-danger">Esgotado</span>
                    ) : (
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Estoque disponível: <strong>{p.estoque}</strong>
                      </span>
                    )}
                  </div>
                )}

                <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {/* Seletor de quantidade no próprio card */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'var(--bg-subtle)',
                      borderRadius: '8px',
                      padding: '4px 8px',
                    }}
                  >
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Qtd:</span>
                    <div className="carrinho-qtd" style={{ margin: 0 }}>
                      <button
                        type="button"
                        className="carrinho-qtd__btn"
                        onClick={() => setQtd(p.id, qtdSel - 1)}
                        disabled={semEstoque || qtdSel <= 1}
                        title="Diminuir quantidade"
                      >
                        -
                      </button>
                      <span className="carrinho-qtd__valor">{qtdSel}</span>
                      <button
                        type="button"
                        className="carrinho-qtd__btn"
                        onClick={() => {
                          if (p.estoque !== undefined && qtdSel >= p.estoque) {
                            toast.warning(`Limite de estoque atingido (${p.estoque} disponíveis).`);
                            return;
                          }
                          setQtd(p.id, qtdSel + 1);
                        }}
                        disabled={semEstoque || (p.estoque !== undefined && qtdSel >= p.estoque)}
                        title="Aumentar quantidade"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Único botão da apresentação do produto */}
                  <button
                    type="button"
                    className={`btn ${adicionadoRecente ? 'btn-success' : 'btn-primary'} btn--sm`}
                    onClick={() => handleAddToCart(p)}
                    disabled={semEstoque}
                    title={semEstoque ? 'Produto indisponível no estoque' : 'Adicionar este produto ao carrinho'}
                  >
                    {adicionadoRecente ? '✓ Adicionado ao carrinho!' : '🛒 Ir para o carrinho'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal do Carrinho */}
      <CarrinhoModal
        isOpen={modalCarrinhoAberto}
        onClose={() => setModalCarrinhoAberto(false)}
      />
    </div>
  );
};
