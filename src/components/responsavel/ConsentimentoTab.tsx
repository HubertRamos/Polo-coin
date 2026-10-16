import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../common/Toast';

export const ConsentimentoTab: React.FC = () => {
  const { avaliacoes, alunos, turmas, consentirAvaliacoes } = useData();
  const { currentUser } = useAuth();
  const toast = useToast();

  const meusFilhos = alunos.filter(a => a.responsavelId === currentUser?.id || currentUser?.id === 1);
  const meusFilhosIds = meusFilhos.map(f => f.id);

  // Ocorrências negativas pendentes de consentimento
  const ocorrenciasPendentes = avaliacoes.filter(
    av => meusFilhosIds.includes(av.alunoId) && av.tipo === 'negativa' && !av.consentido
  );

  const [selecionadas, setSelecionadas] = useState<number[]>([]);

  const toggleSelect = (id: number) => {
    setSelecionadas(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleConsentirSelecionadas = async () => {
    if (selecionadas.length === 0) {
      toast.warning('Selecione pelo menos uma ocorrência para dar ciência.');
      return;
    }
    await consentirAvaliacoes(selecionadas);
    toast.success(`${selecionadas.length} ocorrência(s) consentida(s) com sucesso!`);
    setSelecionadas([]);
  };

  const handleConsentirTodas = async () => {
    const todosIds = ocorrenciasPendentes.map(o => o.id);
    await consentirAvaliacoes(todosIds);
    toast.success(`Todas as ${todosIds.length} ocorrências foram consentidas com sucesso!`);
    setSelecionadas([]);
  };

  return (
    <div>
      <div className="polocoin-main__header">
        <div>
          <h1 className="polocoin-main__title">Consentimento de Ocorrências</h1>
          <p className="polocoin-main__subtitle">
            Tome ciência das advertências e observações pedagógicas enviadas pelos professores
          </p>
        </div>

        {ocorrenciasPendentes.length > 0 && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleConsentirSelecionadas}
              disabled={selecionadas.length === 0}
            >
              Consentir Selecionadas ({selecionadas.length})
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleConsentirTodas}
            >
              ✓ Consentir Todas
            </button>
          </div>
        )}
      </div>

      <div className="alert alert-info" style={{ marginBottom: '18px' }}>
        <span>
          🛡️ <strong>Importante:</strong> Alunos com ocorrências negativas pendentes ficam temporariamente impossibilitados de resgatar itens na loja escolar até que os responsáveis registrem o consentimento/ciência nesta tela.
        </span>
      </div>

      {ocorrenciasPendentes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon">🎉</div>
          <div className="empty-state__text">Nenhuma ocorrência pendente no momento!</div>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
            Seus filhos estão com a conduta e atividades em dia na escola.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {ocorrenciasPendentes.map(oc => {
            const filho = alunos.find(a => a.id === oc.alunoId);
            const turma = filho ? turmas.find(t => t.id === filho.turmaId) : null;
            const isChecked = selecionadas.includes(oc.id);

            return (
              <div
                key={oc.id}
                className="card"
                style={{
                  borderLeft: '5px solid var(--color-danger)',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '14px',
                }}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleSelect(oc.id)}
                  style={{ marginTop: '4px' }}
                />

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '24px' }}>{filho?.avatar}</span>
                      <strong>{filho?.nome}</strong>
                      <span className="badge badge-info">
                        {turma ? `${turma.serie}º${turma.turma}` : 'Turma'}
                      </span>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontWeight: 800, color: 'var(--color-danger)' }}>
                        -{oc.pontos} PoloCoins
                      </span>
                      <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)' }}>
                        {oc.data} às {oc.hora}
                      </span>
                    </div>
                  </div>

                  <div style={{ marginBottom: '6px' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '14px' }}>
                      Motivo: {oc.valor} ({oc.categoria})
                    </span>
                  </div>

                  {oc.observacao && (
                    <div
                      style={{
                        background: 'var(--bg-subtle)',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontStyle: 'italic',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      "{oc.observacao}"
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      Professor(a): {oc.professorNome || 'Docente'}
                    </span>
                    <button
                      type="button"
                      className="btn btn-success btn--sm"
                      onClick={async () => {
                        await consentirAvaliacoes([oc.id]);
                        toast.success('Ciência confirmada!');
                      }}
                    >
                      ✓ Dar Ciência
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
