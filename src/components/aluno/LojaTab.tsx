import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Produto } from '../../types';
import { CarrinhoModal } from './CarrinhoModal';
import { useToast } from '../common/Toast';

export const LojaTab: React.FC = () => {
  const { produtos, categorias, carrinho, addToCart, comprarProdutoDireto, addDesejo, alunos } = useData();
  const { currentUser } = useAuth();
  const toast = useToast();

  const [busca, setBusca] = useState('');
  const [categoriaSel, setCategoriaSel] = useState('todas');
  const [modalCarrinhoAberto, setModalCarrinhoAberto] = useState(false);

  const aluno = alunos.find(a => a.id === currentUser?.id) || alunos[0];

  const cartCount = carrinho.reduce((acc, item) => acc + item.quantidade, 0);
  const cartTotal = carrinho.reduce((acc, item) => acc + item.produto.custo_pontos * item.quantidade, 0);

  const produtosFiltrados = produtos.filter(p => {
    const matchBusca = p.nome.toLowerCase().includes(busca.toLowerCase());
    const matchCat = categoriaSel === 'todas' || p.categoria === categoriaSel;
    return matchBusca && matchCat;
  });

  const handleComprarDireto = async (p: Produto) => {
    if (!aluno) return;
    const res = await comprarProdutoDireto(aluno.id, p.id);
    if (!res.success) {
      toast.error(res.error || 'Erro ao comprar produto.');
    } else {
      toast.success(`Parabéns! Você resgatou "${p.nome}". Aguarde a entrega!`);
    }
  };

  const handleAddToCart = (p: Produto) => {
    addToCart(p);
    toast.success(`"${p.nome}" adicionado ao seu carrinho!`);
  };

  const handlePedirDesejo = async (p: Produto) => {
    if (!aluno) return;
    const res = await addDesejo(aluno.id, p.id);
    if (!res.success) {
      toast.warning(res.error || 'Não foi possível adicionar aos desejos.');
    } else {
      toast.success(`"${p.nome}" adicionado à sua lista de desejos! Seu responsável foi notificado.`);
    }
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

      {/* Alerta se não puder comprar direto */}
      {aluno && !aluno.pode_comprar && (
        <div className="alert alert-warning" style={{ marginBottom: '18px' }}>
          <span>
            ℹ️ <strong>Atenção:</strong> Suas compras diretas estão pausadas pelo seu responsável. Você pode adicionar os produtos à sua <strong>Lista de Desejos</strong> para que seu pai/mãe aprove e compre para você!
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
            const podeComprarDireto = aluno && aluno.pode_comprar && aluno.pontos >= p.custo_pontos;
            return (
              <div key={p.id} className="produto-card">
                <div className="produto-card__topo">
                  <span className="produto-card__categoria">{p.categoria}</span>
                  <span className="produto-card__preco">
                    🪙 {p.custo_pontos}
                  </span>
                </div>

                <h3 className="produto-card__nome">{p.nome}</h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: 'auto' }}>
                  <button
                    type="button"
                    className="btn btn-primary btn--sm"
                    onClick={() => handleAddToCart(p)}
                  >
                    🛒 Adicionar ao Carrinho
                  </button>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      className="btn btn-success btn--sm"
                      style={{ flex: 1 }}
                      onClick={() => handleComprarDireto(p)}
                      disabled={!podeComprarDireto}
                      title={!podeComprarDireto ? 'Saldo insuficiente ou compra direta bloqueada' : 'Resgatar agora'}
                    >
                      ⚡ Resgatar
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn--sm"
                      style={{ flex: 1 }}
                      onClick={() => handlePedirDesejo(p)}
                      title="Pedir para o responsável autorizar a compra"
                    >
                      ✨ Desejo
                    </button>
                  </div>
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
