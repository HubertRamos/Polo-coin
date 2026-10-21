import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Produto } from '../../types';
import { Modal } from '../common/Modal';
import { useToast } from '../common/Toast';
import { ImportarPlanilhaModal } from './ImportarPlanilhaModal';
import { validarDuplicidadeProduto } from '../../lib/duplicateValidation';
import { getCategoriaIcone, CATEGORIAS_PADRAO } from '../../data/categoriaProdutos';
import { INITIAL_CATEGORIAS } from '../../data/initialData';

export const ProdutosTab: React.FC = () => {
  const { produtos, categorias: categoriasData, addProduto, updateProduto } = useData();
  const toast = useToast();

  // Garante que categorias sempre tenha no mínimo as categorias padrão esperadas
  const categorias = React.useMemo(() => {
    if (!categoriasData || categoriasData.length === 0) {
      return INITIAL_CATEGORIAS;
    }
    const mapa = new Map<string, { id: number; nome: string }>();
    INITIAL_CATEGORIAS.forEach(c => mapa.set(c.nome.trim().toLowerCase(), c));
    categoriasData.forEach(c => {
      const chave = (c.nome || '').trim().toLowerCase();
      if (chave && !mapa.has(chave)) {
        mapa.set(chave, c);
      }
    });
    return Array.from(mapa.values());
  }, [categoriasData]);

  const [busca, setBusca] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('todas');

  const [modalNovoAberto, setModalNovoAberto] = useState(false);
  const [modalImportarAberto, setModalImportarAberto] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState<Produto | null>(null);

  // Form states
  const [nome, setNome] = useState('');
  const [codigo, setCodigo] = useState('');
  const [custoPontos, setCustoPontos] = useState('');
  const [categoria, setCategoria] = useState('');
  const [novaCategoria, setNovaCategoria] = useState('');
  const [estoque, setEstoque] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erroDuplicidade, setErroDuplicidade] = useState('');

  const produtosFiltrados = produtos.filter(p => {
    const matchBusca =
      p.nome.toLowerCase().includes(busca.toLowerCase()) ||
      (p.codigo && p.codigo.toLowerCase().includes(busca.toLowerCase()));
    const matchCat =
      categoriaFiltro === 'todas' ||
      (p.categoria && p.categoria.trim().toLowerCase() === categoriaFiltro.trim().toLowerCase());
    return matchBusca && matchCat;
  });

  const abrirModalNovo = () => {
    setNome('');
    setCodigo('');
    setCustoPontos('');
    setCategoria(categorias[0]?.nome || 'Alimentação');
    setNovaCategoria('');
    setEstoque('');
    setErroDuplicidade('');
    setModalNovoAberto(true);
  };

  const abrirModalEditar = (p: Produto) => {
    setProdutoEditando(p);
    setNome(p.nome);
    setCodigo(p.codigo || '');
    setCustoPontos(String(p.custo_pontos));
    setCategoria(p.categoria);
    setNovaCategoria('');
    setEstoque(p.estoque !== undefined ? String(p.estoque) : '');
    setErroDuplicidade('');
  };

  const handleSalvarNovo = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroDuplicidade('');

    if (!nome.trim() || !custoPontos) {
      toast.warning('Preencha o nome e o custo em pontos.');
      return;
    }
    const catFinal = categoria === '__nova__' ? novaCategoria.trim() : categoria;
    if (!catFinal) {
      toast.warning('Selecione ou informe uma categoria.');
      return;
    }

    // Validação centralizada de duplicidade (código único ou nome na mesma categoria)
    const validacao = validarDuplicidadeProduto(
      {
        nome: nome.trim(),
        categoria: catFinal,
        codigo: codigo.trim() || undefined,
      },
      produtos
    );

    if (validacao.isDuplicate) {
      const msg = validacao.message || 'Produto já cadastrado com estes dados.';
      setErroDuplicidade(msg);
      toast.error(msg);
      return;
    }

    setSalvando(true);
    try {
      const estoqueNum = estoque.trim() !== '' ? Number(estoque) : undefined;
      await addProduto(nome, Number(custoPontos), catFinal, estoqueNum, codigo.trim() || undefined);
      toast.success('Produto cadastrado com sucesso!');
      setModalNovoAberto(false);
    } catch (err: any) {
      const msg = err?.message || 'Falha ao cadastrar produto.';
      setErroDuplicidade(msg);
      toast.error(msg);
    } finally {
      setSalvando(false);
    }
  };

  const handleSalvarEdicao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!produtoEditando) return;
    setErroDuplicidade('');

    if (!nome.trim() || !custoPontos) {
      toast.warning('Preencha o nome e o custo em pontos.');
      return;
    }
    const catFinal = categoria === '__nova__' ? novaCategoria.trim() : categoria;

    // Validação de duplicidade excluindo o próprio produto
    const validacao = validarDuplicidadeProduto(
      {
        nome: nome.trim(),
        categoria: catFinal,
        codigo: codigo.trim() || undefined,
      },
      produtos,
      produtoEditando.id
    );

    if (validacao.isDuplicate) {
      const msg = validacao.message || 'Dados conflitantes com outro produto já existente.';
      setErroDuplicidade(msg);
      toast.error(msg);
      return;
    }

    setSalvando(true);
    try {
      const estoqueNum = estoque.trim() !== '' ? Number(estoque) : undefined;
      await updateProduto(produtoEditando.id, nome, Number(custoPontos), catFinal, estoqueNum, codigo.trim() || undefined);
      toast.success('Produto atualizado com sucesso!');
      setProdutoEditando(null);
    } catch (err: any) {
      const msg = err?.message || 'Falha ao atualizar produto.';
      setErroDuplicidade(msg);
      toast.error(msg);
    } finally {
      setSalvando(false);
    }
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
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setModalImportarAberto(true)}
            title="Importar produtos por planilha Excel (.xlsx) ou CSV (.csv)"
          >
            <span>📥</span> Importar por Planilha
          </button>
          <button type="button" className="btn btn-primary" onClick={abrirModalNovo}>
            <span>➕</span> Novo Produto
          </button>
        </div>
      </div>

      {/* Área de Categorias dos Produtos */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '16px 20px',
          marginBottom: '20px',
          boxShadow: 'var(--shadow-xs)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: '15px',
                fontWeight: 800,
                color: 'var(--text-color)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>🏷️</span> Categorias dos Produtos
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Filtre o catálogo por categoria ou visualize os itens disponíveis em cada seção
            </span>
          </div>
          <span
            className="badge badge-info"
            style={{ fontSize: '11px', fontWeight: 700 }}
          >
            {categorias.length} categorias disponíveis
          </span>
        </div>

        {/* Chips de Categorias com Ícones e Contagem de Produtos */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            alignItems: 'center',
          }}
        >
          <button
            type="button"
            onClick={() => setCategoriaFiltro('todas')}
            className={`btn ${categoriaFiltro === 'todas' ? 'btn-primary' : 'btn-secondary'}`}
            style={{
              padding: '8px 14px',
              borderRadius: '20px',
              fontSize: '12.5px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>✨</span>
            <span>Todas as Categorias</span>
            <span
              style={{
                background: categoriaFiltro === 'todas' ? 'rgba(255,255,255,0.25)' : 'var(--bg-subtle)',
                padding: '2px 7px',
                borderRadius: '10px',
                fontSize: '11px',
                fontWeight: 800,
              }}
            >
              {produtos.length}
            </span>
          </button>

          {categorias.map(c => {
            const count = produtos.filter(
              p => (p.categoria || '').trim().toLowerCase() === c.nome.trim().toLowerCase()
            ).length;
            const isAtiva = categoriaFiltro.trim().toLowerCase() === c.nome.trim().toLowerCase();
            const icone = getCategoriaIcone(c.nome);

            return (
              <button
                key={c.id || c.nome}
                type="button"
                onClick={() => setCategoriaFiltro(isAtiva ? 'todas' : c.nome)}
                className={`btn ${isAtiva ? 'btn-primary' : 'btn-secondary'}`}
                style={{
                  padding: '8px 14px',
                  borderRadius: '20px',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease-in-out',
                }}
                title={`Filtrar por ${c.nome} (${count} ${count === 1 ? 'produto' : 'produtos'})`}
              >
                <span>{icone}</span>
                <span>{c.nome}</span>
                <span
                  style={{
                    background: isAtiva ? 'rgba(255,255,255,0.25)' : 'var(--bg-subtle)',
                    padding: '2px 7px',
                    borderRadius: '10px',
                    fontSize: '11px',
                    fontWeight: 800,
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filtros */}
      <div className="loja-filtros">
        <div className="loja-filtros__busca">
          <input
            type="text"
            className="form-input"
            placeholder="🔍 Buscar produto pelo nome ou código..."
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
            <option value="todas">✨ Todas as Categorias</option>
            {categorias.map(c => (
              <option key={c.id} value={c.nome}>
                {getCategoriaIcone(c.nome)} {c.nome}
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
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  {p.codigo && (
                    <span className="badge badge-info" style={{ fontSize: '10.5px' }}>
                      SKU: {p.codigo}
                    </span>
                  )}
                  {p.estoque !== undefined && (
                    <span
                      className={`badge ${p.estoque > 0 ? 'badge-success' : 'badge-danger'}`}
                      style={{ fontSize: '11px' }}
                    >
                      {p.estoque > 0 ? `${p.estoque} unid.` : 'Esgotado'}
                    </span>
                  )}
                </div>
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
            <label className="form-label">Código / SKU (opcional)</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ex: SKU-001 (identificador único na loja)"
              value={codigo}
              onChange={e => setCodigo(e.target.value)}
            />
            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
              Se informado, não pode ser repetido em nenhum outro produto.
            </span>
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
            <label className="form-label">Estoque Disponível (Opcional)</label>
            <input
              type="number"
              min="0"
              className="form-input"
              placeholder="Deixe em branco para estoque ilimitado"
              value={estoque}
              onChange={e => setEstoque(e.target.value)}
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
                  {getCategoriaIcone(c.nome)} {c.nome}
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

          {erroDuplicidade && (
            <div className="alert alert-danger" style={{ marginBottom: '14px', fontSize: '13px' }}>
              <span>⚠️ {erroDuplicidade}</span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '18px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setModalNovoAberto(false)}
              disabled={salvando}
            >
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={salvando}>
              {salvando ? 'Cadastrando...' : 'Cadastrar Produto'}
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
            <label className="form-label">Código / SKU (opcional)</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ex: SKU-001"
              value={codigo}
              onChange={e => setCodigo(e.target.value)}
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
            <label className="form-label">Estoque Disponível (Opcional)</label>
            <input
              type="number"
              min="0"
              className="form-input"
              placeholder="Deixe em branco para estoque ilimitado"
              value={estoque}
              onChange={e => setEstoque(e.target.value)}
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
                  {getCategoriaIcone(c.nome)} {c.nome}
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

          {erroDuplicidade && (
            <div className="alert alert-danger" style={{ marginBottom: '14px', fontSize: '13px' }}>
              <span>⚠️ {erroDuplicidade}</span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '18px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setProdutoEditando(null)}
              disabled={salvando}
            >
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={salvando}>
              {salvando ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal de Importação em Massa por Planilha */}
      <ImportarPlanilhaModal
        isOpen={modalImportarAberto}
        onClose={() => setModalImportarAberto(false)}
        tipo="produtos"
      />
    </div>
  );
};
