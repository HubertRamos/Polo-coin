import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Produto } from '../../types';
import { Modal } from '../common/Modal';
import { useToast } from '../common/Toast';

export const ProdutosTab: React.FC = () => {
  const { produtos, categorias, addProduto, updateProduto } = useData();
  const toast = useToast();

  const [busca, setBusca] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('todas');

  const [modalNovoAberto, setModalNovoAberto] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState<Produto | null>(null);

  // Form states
  const [nome, setNome] = useState('');
  const [custoPontos, setCustoPontos] = useState('');
  const [categoria, setCategoria] = useState('');
  const [novaCategoria, setNovaCategoria] = useState('');

  const produtosFiltrados = produtos.filter(p => {
    const matchBusca = p.nome.toLowerCase().includes(busca.toLowerCase());
    const matchCat = categoriaFiltro === 'todas' || p.categoria === categoriaFiltro;
    return matchBusca && matchCat;
  });

  const abrirModalNovo = () => {
    setNome('');
    setCustoPontos('');
    setCategoria(categorias[0]?.nome || 'Geral');
    setNovaCategoria('');
    setModalNovoAberto(true);
  };

  const abrirModalEditar = (p: Produto) => {
    setProdutoEditando(p);
    setNome(p.nome);
    setCustoPontos(String(p.custo_pontos));
    setCategoria(p.categoria);
    setNovaCategoria('');
  };

  const handleSalvarNovo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !custoPontos) {
      toast.warning('Preencha o nome e o custo em pontos.');
      return;
    }
    const catFinal = categoria === '__nova__' ? novaCategoria.trim() : categoria;
    if (!catFinal) {
      toast.warning('Selecione ou informe uma categoria.');
      return;
    }

    await addProduto(nome, Number(custoPontos), catFinal);
    toast.success('Produto cadastrado com sucesso!');
    setModalNovoAberto(false);
  };

  const handleSalvarEdicao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!produtoEditando) return;
    if (!nome.trim() || !custoPontos) {
      toast.warning('Preencha o nome e o custo em pontos.');
      return;
    }
    const catFinal = categoria === '__nova__' ? novaCategoria.trim() : categoria;

    await updateProduto(produtoEditando.id, nome, Number(custoPontos), catFinal);
    toast.success('Produto atualizado com sucesso!');
    setProdutoEditando(null);
  };

  return (
    <div>
      <div className="polocoin-main__header">
        <div>
          <h1 className="polocoin-main__title">Produtos da Loja</h1>
          <p className="polocoin-main__subtitle">
            Gerencie itens, categorias e valores de resgate disponíveis para os alunos
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={abrirModalNovo}>
          <span>➕</span> Novo Produto
        </button>
      </div>

      {/* Filtros */}
      <div className="loja-filtros">
        <div className="loja-filtros__busca">
          <input
            type="text"
            className="form-input"
            placeholder="🔍 Buscar produto pelo nome..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
        </div>
        <div className="loja-filtros__categoria">
          <select
            className="form-select"
            value={categoriaFiltro}
            onChange={e => setCategoriaFiltro(e.target.value)}
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

      {/* Grid de Produtos */}
      {produtosFiltrados.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon">📦</div>
          <div className="empty-state__text">Nenhum produto encontrado.</div>
        </div>
      ) : (
        <div className="produtos-grid">
          {produtosFiltrados.map(p => (
            <div key={p.id} className="produto-card">
              <div className="produto-card__topo">
                <span className="produto-card__categoria">{p.categoria}</span>
              </div>
              <h3 className="produto-card__nome">{p.nome}</h3>
              <div className="produto-card__rodape">
                <span className="produto-card__preco">
                  🪙 {p.custo_pontos} <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>PoloCoins</span>
                </span>
                <button
                  type="button"
                  className="btn btn-secondary btn--sm"
                  onClick={() => abrirModalEditar(p)}
                >
                  ✏️ Editar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Novo Produto */}
      <Modal
        isOpen={modalNovoAberto}
        onClose={() => setModalNovoAberto(false)}
        title="Cadastrar Novo Produto"
        subtitle="Adicione uma recompensa para a loja escolar"
      >
        <form onSubmit={handleSalvarNovo}>
          <div className="form-group">
            <label className="form-label">Nome do Produto</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ex: Fone de Ouvido, Chocolate..."
              value={nome}
              onChange={e => setNome(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Custo em PoloCoins 🪙</label>
            <input
              type="number"
              min="1"
              className="form-input"
              placeholder="Ex: 50"
              value={custoPontos}
              onChange={e => setCustoPontos(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Categoria</label>
            <select
              className="form-select"
              value={categoria}
              onChange={e => setCategoria(e.target.value)}
            >
              {categorias.map(c => (
                <option key={c.id} value={c.nome}>
                  {c.nome}
                </option>
              ))}
              <option value="__nova__">+ Nova Categoria...</option>
            </select>
          </div>

          {categoria === '__nova__' && (
            <div className="form-group">
              <label className="form-label">Nome da Nova Categoria</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ex: Esportes, Papelaria..."
                value={novaCategoria}
                onChange={e => setNovaCategoria(e.target.value)}
                required
              />
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '18px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setModalNovoAberto(false)}
            >
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              Cadastrar Produto
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Editar Produto */}
      <Modal
        isOpen={!!produtoEditando}
        onClose={() => setProdutoEditando(null)}
        title="Editar Produto"
        subtitle="Altere informações da recompensa"
      >
        <form onSubmit={handleSalvarEdicao}>
          <div className="form-group">
            <label className="form-label">Nome do Produto</label>
            <input
              type="text"
              className="form-input"
              value={nome}
              onChange={e => setNome(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Custo em PoloCoins 🪙</label>
            <input
              type="number"
              min="1"
              className="form-input"
              value={custoPontos}
              onChange={e => setCustoPontos(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Categoria</label>
            <select
              className="form-select"
              value={categoria}
              onChange={e => setCategoria(e.target.value)}
            >
              {categorias.map(c => (
                <option key={c.id} value={c.nome}>
                  {c.nome}
                </option>
              ))}
              <option value="__nova__">+ Nova Categoria...</option>
            </select>
          </div>

          {categoria === '__nova__' && (
            <div className="form-group">
              <label className="form-label">Nome da Nova Categoria</label>
              <input
                type="text"
                className="form-input"
                value={novaCategoria}
                onChange={e => setNovaCategoria(e.target.value)}
                required
              />
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '18px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setProdutoEditando(null)}
            >
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              Salvar Alterações
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
