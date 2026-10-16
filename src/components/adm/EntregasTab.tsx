import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useToast } from '../common/Toast';

export const EntregasTab: React.FC = () => {
  const { compras, alunos, turmas, categorias, marcarEntrega, limparHistoricoVendas } = useData();
  const toast = useToast();

  const [buscaProduto, setBuscaProduto] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('todas');
  const [turmaFiltro, setTurmaFiltro] = useState('todas');
  const [abaAtual, setAbaAtual] = useState<'pendentes' | 'historico'>('pendentes');

  // Augment purchases with student and class information
  const comprasCompletas = compras.map(c => {
    const aluno = alunos.find(a => a.id === c.alunoId);
    const turma = aluno ? turmas.find(t => t.id === aluno.turmaId) : null;
    return {
      ...c,
      alunoNome: aluno ? aluno.nome : 'Aluno Removido',
      alunoAvatar: aluno ? aluno.avatar : '👤',
      turmaNome: turma ? `${turma.serie}º${turma.turma}` : 'Sem Turma',
      turmaId: turma?.id,
    };
  });

  const pendentes = comprasCompletas.filter(c => !c.entregue);
  const entregues = comprasCompletas.filter(c => c.entregue);

  const listaAtual = abaAtual === 'pendentes' ? pendentes : entregues;

  const filtradas = listaAtual.filter(c => {
    const matchProd = c.produtoNome.toLowerCase().includes(buscaProduto.toLowerCase()) ||
                      c.alunoNome.toLowerCase().includes(buscaProduto.toLowerCase());
    const matchCat = categoriaFiltro === 'todas' || c.categoriaNome === categoriaFiltro;
    const matchTurma = turmaFiltro === 'todas' || String(c.turmaId) === turmaFiltro;
    return matchProd && matchCat && matchTurma;
  });

  const handleEntregar = async (compraId: number, produtoNome: string, alunoNome: string) => {
    await marcarEntrega(compraId);
    toast.success(`Entrega de "${produtoNome}" confirmada para ${alunoNome}!`);
  };

  const handleLimparHistorico = async () => {
    if (window.confirm('Tem certeza que deseja limpar todo o histórico de produtos entregues?')) {
      await limparHistoricoVendas();
      toast.info('Histórico de produtos entregues foi limpo com sucesso.');
    }
  };

  return (
    <div>
      <div className="polocoin-main__header">
        <div>
          <h1 className="polocoin-main__title">Entregas de Produtos</h1>
          <p className="polocoin-main__subtitle">
            Acompanhe itens resgatados pelos alunos e confirme a entrega física
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className={`btn ${abaAtual === 'pendentes' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setAbaAtual('pendentes')}
          >
            🚚 Pendentes ({pendentes.length})
          </button>
          <button
            type="button"
            className={`btn ${abaAtual === 'historico' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setAbaAtual('historico')}
          >
            ✓ Histórico de Entregas ({entregues.length})
          </button>
          {abaAtual === 'historico' && entregues.length > 0 && (
            <button
              type="button"
              className="btn btn-danger btn--sm"
              onClick={handleLimparHistorico}
            >
              🗑️ Limpar Histórico
            </button>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div className="loja-filtros">
        <div className="loja-filtros__busca">
          <input
            type="text"
            className="form-input"
            placeholder="🔍 Filtrar por produto ou aluno..."
            value={buscaProduto}
            onChange={e => setBuscaProduto(e.target.value)}
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
        <div className="loja-filtros__categoria">
          <select
            className="form-select"
            value={turmaFiltro}
            onChange={e => setTurmaFiltro(e.target.value)}
          >
            <option value="todas">Todas as Turmas</option>
            {turmas.map(t => (
              <option key={t.id} value={String(t.id)}>
                {t.serie}º Ano {t.turma}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabela de Compras / Entregas */}
      {filtradas.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon">
            {abaAtual === 'pendentes' ? '🎉' : '📦'}
          </div>
          <div className="empty-state__text">
            {abaAtual === 'pendentes'
              ? 'Nenhuma entrega pendente no momento!'
              : 'Nenhum histórico encontrado para os filtros selecionados.'}
          </div>
        </div>
      ) : (
        <div className="tabela-wrapper">
          <table className="tabela">
            <thead>
              <tr>
                <th>Aluno</th>
                <th>Turma</th>
                <th>Produto</th>
                <th>Categoria</th>
                <th>PoloCoins</th>
                <th>Data do Pedido</th>
                <th>Status / Ação</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map(c => (
                <tr key={c.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '20px' }}>{c.alunoAvatar}</span>
                      <strong>{c.alunoNome}</strong>
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-info">{c.turmaNome}</span>
                  </td>
                  <td>
                    <strong>{c.produtoNome}</strong>
                  </td>
                  <td>
                    <span className="badge badge-neutral">{c.categoriaNome}</span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 800, color: 'var(--color-coin-dark)' }}>
                      🪙 {c.custoPontos}
                    </span>
                  </td>
                  <td style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {c.criadoEm}
                  </td>
                  <td>
                    {c.entregue ? (
                      <span className="badge badge-success">✓ Entregue</span>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-success btn--sm"
                        onClick={() => handleEntregar(c.id, c.produtoNome, c.alunoNome)}
                      >
                        ✓ Confirmar Entrega
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
