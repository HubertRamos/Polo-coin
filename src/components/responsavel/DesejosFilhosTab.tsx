import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../common/Toast';

export const DesejosFilhosTab: React.FC = () => {
  const { desejos, produtos, alunos, compras, comprarDesejoPorResponsavel, removerDesejo } = useData();
  const { currentUser } = useAuth();
  const toast = useToast();

  const [filtroFilhoId, setFiltroFilhoId] = useState<number | 'todos'>('todos');
  const [processandoId, setProcessandoId] = useState<number | null>(null);

  // Apenas filhos estritamente vinculados a este responsável
  const meusFilhos = useMemo(() => {
    if (!currentUser?.id) return [];
    return alunos.filter(a => a.responsavelId === currentUser.id);
  }, [alunos, currentUser?.id]);

  const meusFilhosIds = useMemo(() => meusFilhos.map(f => f.id), [meusFilhos]);

  // Pedidos da lista de desejos dos filhos
  const desejosDosFilhos = useMemo(() => {
    return desejos.filter(d => {
      if (!meusFilhosIds.includes(d.alunoId)) return false;
      if (filtroFilhoId !== 'todos' && d.alunoId !== filtroFilhoId) return false;
      return true;
    });
  }, [desejos, meusFilhosIds, filtroFilhoId]);

  // Histórico de compras/resgates realizados pelos filhos
  const comprasDosFilhos = useMemo(() => {
    return compras.filter(c => {
      if (!meusFilhosIds.includes(c.alunoId)) return false;
      if (filtroFilhoId !== 'todos' && c.alunoId !== filtroFilhoId) return false;
      return true;
    });
  }, [compras, meusFilhosIds, filtroFilhoId]);

  const handleAutorizarCompra = async (alunoId: number, produtoId: number, produtoNome: string, alunoNome: string) => {
    if (!currentUser?.id) return;
    setProcessandoId(produtoId);
    const res = await comprarDesejoPorResponsavel(alunoId, produtoId, currentUser.id);
    setProcessandoId(null);

    if (!res.success) {
      toast.error(res.error || 'Não foi possível autorizar o resgate.');
    } else {
      toast.success(`Resgate de "${produtoNome}" autorizado com sucesso para ${alunoNome}!`);
    }
  };

  const handleRecusar = (alunoId: number, produtoId: number, produtoNome: string) => {
    removerDesejo(alunoId, produtoId);
    toast.info(`O pedido de "${produtoNome}" foi removido da lista.`);
  };

  return (
    <div>
      <div className="polocoin-main__header">
        <div>
          <h1 className="polocoin-main__title">Pedidos & Resgates dos Filhos</h1>
          <p className="polocoin-main__subtitle">
            Autorize o resgate de recompensas solicitadas na lista de desejos e acompanhe as entregas dos produtos
          </p>
        </div>

        {meusFilhos.length > 1 && (
          <div style={{ minWidth: '200px' }}>
            <select
              className="form-select"
              value={filtroFilhoId}
              onChange={e => {
                const val = e.target.value;
                setFiltroFilhoId(val === 'todos' ? 'todos' : Number(val));
              }}
            >
              <option value="todos">Todos os Filhos ({meusFilhos.length})</option>
              {meusFilhos.map(f => (
                <option key={f.id} value={f.id}>
                  {f.avatar} {f.nome}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Seção 1: Pedidos Pendentes de Autorização */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🎁</span>
          <span>Pedidos Aguardando Sua Aprovação ({desejosDosFilhos.length})</span>
        </h2>

        {desejosDosFilhos.length === 0 ? (
          <div className="empty-state" style={{ padding: '28px 20px' }}>
            <div className="empty-state__icon">🎉</div>
            <div className="empty-state__text">Nenhum pedido de recompensa pendente no momento!</div>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
              Quando seus filhos salvarem produtos na lista de desejos, os pedidos aparecerão aqui para sua aprovação.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            {desejosDosFilhos.map(d => {
              const filho = alunos.find(a => a.id === d.alunoId);
              const produto = produtos.find(p => p.id === d.produtoId);
              if (!filho || !produto) return null;

              const qtd = d.quantidade && d.quantidade > 0 ? d.quantidade : 1;
              const custoTotal = produto.custo_pontos * qtd;
              const semEstoque = produto.estoque !== undefined && produto.estoque < qtd;
              const saldoSuficiente = filho.pontos >= custoTotal;
              const ocupado = processandoId === produto.id;

              return (
                <div key={d.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '28px' }}>{filho.avatar}</span>
                      <div>
                        <strong style={{ fontSize: '15px' }}>{filho.nome}</strong>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>
                          Pedido em {d.criadoEm}
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
                    <h4 style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: 800 }}>
                      {produto.nome} {qtd > 1 && <span style={{ color: 'var(--color-primary)' }}>({qtd}x)</span>}
                    </h4>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span>Custo Total do Pedido:</span>
                      <strong style={{ color: 'var(--color-coin-dark)' }}>🪙 {custoTotal} PoloCoins</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginTop: '4px' }}>
                      <span>Saldo Atual do Aluno:</span>
                      <strong style={{ color: saldoSuficiente ? 'var(--color-success)' : 'var(--color-danger)' }}>
                        🪙 {filho.pontos} PoloCoins
                      </strong>
                    </div>
                    {produto.estoque !== undefined && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: '4px', color: 'var(--text-muted)' }}>
                        <span>Estoque escolar:</span>
                        <span>{produto.estoque} unidades disponíveis</span>
                      </div>
                    )}
                  </div>

                  {semEstoque && (
                    <div className="alert alert-danger" style={{ margin: 0, padding: '6px 10px', fontSize: '12px' }}>
                      <span>⚠️ Estoque insuficiente na escola para autorizar este resgate ({produto.estoque} disponíveis).</span>
                    </div>
                  )}

                  {!semEstoque && !saldoSuficiente && (
                    <div className="alert alert-warning" style={{ margin: 0, padding: '6px 10px', fontSize: '12px' }}>
                      <span>⚠️ Saldo insuficiente: faltam 🪙 {custoTotal - filho.pontos} PoloCoins para este resgate.</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn--sm"
                      style={{ flex: 1 }}
                      onClick={() => handleRecusar(filho.id, produto.id, produto.nome)}
                      disabled={ocupado}
                    >
                      Recusar
                    </button>

                    <button
                      type="button"
                      className="btn btn-success btn--sm"
                      style={{ flex: 1 }}
                      onClick={() => handleAutorizarCompra(filho.id, produto.id, produto.nome, filho.nome)}
                      disabled={!saldoSuficiente || ocupado || semEstoque}
                    >
                      {ocupado ? 'Processando...' : '✓ Autorizar e Comprar'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Seção 2: Histórico de Resgates e Entregas dos Filhos */}
      <div>
        <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🛍️</span>
          <span>Histórico de Resgates e Entregas Escolares ({comprasDosFilhos.length})</span>
        </h2>

        {comprasDosFilhos.length === 0 ? (
          <div className="empty-state" style={{ padding: '24px 20px' }}>
            <div className="empty-state__icon">📦</div>
            <div className="empty-state__text">Nenhum produto resgatado até o momento.</div>
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-wrapper" style={{ margin: 0 }}>
              <table className="tabela" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Estudante</th>
                    <th>Produto / Recompensa</th>
                    <th>Valor</th>
                    <th>Data do Pedido</th>
                    <th>Autorização</th>
                    <th>Situação da Entrega</th>
                  </tr>
                </thead>
                <tbody>
                  {comprasDosFilhos.map(compra => {
                    const filho = alunos.find(a => a.id === compra.alunoId);
                    return (
                      <tr key={compra.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>{filho?.avatar || '👤'}</span>
                            <strong>{filho?.nome}</strong>
                          </div>
                        </td>
                        <td>
                          <strong>{compra.produtoNome}</strong>
                          <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)' }}>
                            {compra.categoriaNome}
                          </span>
                        </td>
                        <td>
                          <strong style={{ color: 'var(--color-coin-dark)' }}>
                            🪙 {compra.custoPontos}
                          </strong>
                        </td>
                        <td style={{ fontSize: '12px' }}>{compra.criadoEm}</td>
                        <td>
                          {compra.autorizadoPor ? (
                            <span className="badge badge-info" style={{ fontSize: '11px' }}>
                              Aprovado pelo Responsável
                            </span>
                          ) : (
                            <span className="badge" style={{ fontSize: '11px', background: '#f1f5f9' }}>
                              Compra Direta
                            </span>
                          )}
                        </td>
                        <td>
                          {compra.entregue ? (
                            <span className="badge badge-success" style={{ fontSize: '11px' }}>
                              ✓ Entregue no Colégio
                            </span>
                          ) : (
                            <span className="badge badge-warning" style={{ fontSize: '11px' }}>
                              ⏳ Aguardando Entrega
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
