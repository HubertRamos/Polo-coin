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
  const [dataImpressao, setDataImpressao] = useState<string>('');

  // Augment purchases with student and class information
  const comprasCompletas = compras.map(c => {
    const aluno = alunos.find(a => a.id === c.alunoId);
    const turma = aluno ? turmas.find(t => t.id === aluno.turmaId) : null;
    return {
      ...c,
      alunoNome: aluno ? aluno.nome : 'Aluno Removido',
      alunoAvatar: aluno ? aluno.avatar : '👤',
      turmaNome: turma ? `${turma.serie}º Ano ${turma.turma}` : 'Sem Turma',
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

  const totalPontosFiltrados = filtradas.reduce((sum, c) => sum + (c.custoPontos || 0), 0);

  const turmaSelecionadaNome =
    turmaFiltro === 'todas'
      ? 'Todas as Turmas'
      : (() => {
          const t = turmas.find(item => String(item.id) === turmaFiltro);
          return t ? `${t.serie}º Ano ${t.turma}` : 'Turma selecionada';
        })();

  const categoriaSelecionadaNome =
    categoriaFiltro === 'todas' ? 'Todas as Categorias' : categoriaFiltro;

  const termoBuscaNome = buscaProduto.trim() ? `"${buscaProduto.trim()}"` : 'Todos (sem filtro de busca)';

  const handleImprimir = () => {
    const agora = new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date());
    setDataImpressao(agora);

    // Pequeno intervalo para sincronizar o estado da data antes do diálogo de impressão do navegador
    setTimeout(() => {
      window.print();
    }, 50);
  };

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
      {/* Visualização de Tela Interativa (Oculta na impressão) */}
      <div className="no-print">
        <div className="polocoin-main__header">
          <div>
            <h1 className="polocoin-main__title">Entregas de Produtos</h1>
            <p className="polocoin-main__subtitle">
              Acompanhe itens resgatados pelos alunos e confirme a entrega física
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
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
            {abaAtual === 'pendentes' && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleImprimir}
                title="Imprimir relatório das entregas pendentes com os filtros atuais"
              >
                🖨️ Imprimir
              </button>
            )}
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

      {/* Relatório de Impressão A4 (Visível exclusivamente na impressão) */}
      <div className="print-only">
        {/* Cabeçalho do Relatório */}
        <div style={{ borderBottom: '2px solid #0f172a', paddingBottom: '12px', marginBottom: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#475569', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                🪙 PoloCoin — Sistema Escolar
              </div>
              <h1 style={{ margin: '4px 0 0 0', fontSize: '20pt', fontWeight: 900, color: '#0f172a' }}>
                Relatório de Entregas Pendentes
              </h1>
              <p style={{ margin: '2px 0 0 0', fontSize: '10.5pt', color: '#475569' }}>
                Controle de itens resgatados na loja para entrega física aos alunos
              </p>
            </div>
            <div style={{ textAlign: 'right', fontSize: '9.5pt', color: '#334155' }}>
              <div><strong>Data/Hora da Emissão:</strong></div>
              <div>{dataImpressao || new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date())}</div>
              <div style={{ marginTop: '4px', fontSize: '8.5pt', color: '#64748b' }}>Painel Administrativo</div>
            </div>
          </div>

          {/* Filtros Aplicados */}
          <div
            style={{
              marginTop: '12px',
              padding: '8px 12px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              fontSize: '9.5pt',
            }}
          >
            <div style={{ fontWeight: 700, color: '#1e293b', marginBottom: '4px' }}>
              Filtros Aplicados na Emissão:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', color: '#334155' }}>
              <div>
                <span style={{ color: '#64748b' }}>Turma:</span>{' '}
                <strong>{turmaSelecionadaNome}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Categoria:</span>{' '}
                <strong>{categoriaSelecionadaNome}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Busca (Aluno/Produto):</span>{' '}
                <strong>{termoBuscaNome}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Total de Entregas:</span>{' '}
                <strong>{filtradas.length}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Total em PoloCoins:</span>{' '}
                <strong>🪙 {totalPontosFiltrados}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Tabela Formatada para A4 */}
        {filtradas.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', border: '1px dashed #cbd5e1', borderRadius: '6px', color: '#64748b', fontSize: '11pt' }}>
            Nenhuma entrega pendente encontrada para os filtros selecionados.
          </div>
        ) : (
          <table className="print-relatorio-tabela">
            <thead>
              <tr>
                <th style={{ width: '32px', textAlign: 'center' }}>#</th>
                <th style={{ width: '22%' }}>Aluno</th>
                <th style={{ width: '14%' }}>Turma</th>
                <th style={{ width: '24%' }}>Produto</th>
                <th style={{ width: '12%', textAlign: 'center' }}>Qtd.</th>
                <th style={{ width: '12%', textAlign: 'center' }}>PoloCoins</th>
                <th style={{ width: '16%' }}>Data do Pedido</th>
                <th style={{ width: '22%' }}>Visto / Assinatura</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map((c, index) => (
                <tr key={c.id}>
                  <td style={{ textAlign: 'center', fontSize: '9pt', color: '#64748b' }}>
                    {index + 1}
                  </td>
                  <td>
                    <strong>{c.alunoNome}</strong>
                  </td>
                  <td>{c.turmaNome}</td>
                  <td>
                    <strong>{c.produtoNome}</strong>
                    <div style={{ fontSize: '8.5pt', color: '#64748b' }}>{c.categoriaNome}</div>
                  </td>
                  <td style={{ textAlign: 'center' }}>1 un.</td>
                  <td style={{ textAlign: 'center', fontWeight: 700 }}>
                    🪙 {c.custoPontos}
                  </td>
                  <td style={{ fontSize: '9pt', whiteSpace: 'nowrap' }}>
                    {c.criadoEm}
                  </td>
                  <td style={{ verticalAlign: 'bottom', paddingBottom: '4px' }}>
                    <div style={{ borderBottom: '1px solid #94a3b8', height: '18px' }} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Rodapé do Relatório */}
        <div
          style={{
            marginTop: '20px',
            paddingTop: '10px',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '8.5pt',
            color: '#64748b',
          }}
        >
          <div>PoloCoin — Sistema Escolar de Mérito e Recompensas</div>
          <div>Documento gerado pelo Administrador da Escola • Página 1</div>
        </div>
      </div>
    </div>
  );
};
