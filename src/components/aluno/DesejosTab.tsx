import React from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../common/Toast';

export const DesejosTab: React.FC = () => {
  const { desejos, produtos, alunos, removerDesejo, comprarProdutoDireto } = useData();
  const { currentUser } = useAuth();
  const toast = useToast();

  const aluno = alunos.find(a => a.id === currentUser?.id) || alunos[0];
  const meusDesejos = desejos.filter(d => d.alunoId === aluno?.id);

  const handleRemover = (produtoId: number, produtoNome: string) => {
    if (aluno) {
      removerDesejo(aluno.id, produtoId);
      toast.info(`"${produtoNome}" foi removido da sua lista de desejos.`);
    }
  };

  const handleResgatarAgora = async (produtoId: number) => {
    if (!aluno) return;
    const res = await comprarProdutoDireto(aluno.id, produtoId);
    if (!res.success) {
      toast.error(res.error || 'Erro ao resgatar item.');
    } else {
      removerDesejo(aluno.id, produtoId);
      toast.success('Parabéns! O item foi resgatado com sucesso!');
    }
  };

  return (
    <div>
      <div className="polocoin-main__header">
        <div>
          <h1 className="polocoin-main__title">Minha Lista de Desejos</h1>
          <p className="polocoin-main__subtitle">
            Itens que você pediu para seus pais ou responsáveis aprovarem e comprarem
          </p>
        </div>
      </div>

      <div className="alert alert-info" style={{ marginBottom: '20px' }}>
        <span>
          💡 <strong>Como funciona:</strong> Ao adicionar um item aos desejos, seu responsável pode visualizar e autorizar o resgate diretamente no painel familiar, usando seus PoloCoins acumulados.
        </span>
      </div>

      {meusDesejos.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon">✨</div>
          <div className="empty-state__text">Sua lista de desejos está vazia.</div>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '6px' }}>
            Vá até a Loja PoloCoin e clique no botão "✨ Desejo" nos itens que você gostaria de ganhar!
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {meusDesejos.map(d => {
            const prod = produtos.find(p => p.id === d.produtoId);
            if (!prod) return null;
            const saldoSuficiente = aluno && aluno.pontos >= prod.custo_pontos;

            return (
              <div key={d.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span className="badge badge-info">{prod.categoria}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{d.criadoEm}</span>
                </div>

                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>{prod.nome}</h3>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '18px', fontWeight: 900, color: 'var(--color-coin-dark)' }}>
                    🪙 {prod.custo_pontos} PoloCoins
                  </span>
                  <span className={`badge ${saldoSuficiente ? 'badge-success' : 'badge-warning'}`}>
                    {saldoSuficiente ? 'Saldo OK' : `Faltam ${prod.custo_pontos - (aluno?.pontos || 0)}`}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid var(--border-color)' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn--sm"
                    style={{ flex: 1 }}
                    onClick={() => handleRemover(prod.id, prod.nome)}
                  >
                    Remover
                  </button>

                  {aluno?.pode_comprar && (
                    <button
                      type="button"
                      className="btn btn-success btn--sm"
                      style={{ flex: 1 }}
                      onClick={() => handleResgatarAgora(prod.id)}
                      disabled={!saldoSuficiente}
                    >
                      Resgatar Agora
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
