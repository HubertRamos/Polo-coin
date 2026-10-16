import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../common/Toast';

interface ConsentimentoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConsentimentoModal: React.FC<ConsentimentoModalProps> = ({ isOpen, onClose }) => {
  const { avaliacoes, alunos, turmas, consentirAvaliacoes } = useData();
  const { currentUser } = useAuth();
  const toast = useToast();

  const [confirmouLeitura, setConfirmouLeitura] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erroMensagem, setErroMensagem] = useState<string | null>(null);

  if (!isOpen || currentUser?.tipo !== 'responsavel') return null;

  // Apenas filhos vinculados à conta do responsável autenticado
  const meusFilhos = alunos.filter(a => a.responsavelId === currentUser.id);
  const meusFilhosIds = meusFilhos.map(f => f.id);

  // Ocorrências negativas pendentes de confirmação
  const ocorrenciasPendentes = avaliacoes.filter(
    av => meusFilhosIds.includes(av.alunoId) && av.tipo === 'negativa' && !av.consentido
  );

  // Se não houver ocorrências pendentes, não exibe
  if (ocorrenciasPendentes.length === 0) return null;

  const handleConfirmarCiencia = async () => {
    if (!confirmouLeitura) {
      setErroMensagem('Por favor, marque a caixa confirmando que leu e está ciente das ocorrências.');
      return;
    }

    setSalvando(true);
    setErroMensagem(null);

    const idsParaConsentir = ocorrenciasPendentes.map(o => o.id);
    const resultado = await consentirAvaliacoes(idsParaConsentir, currentUser.id);

    setSalvando(false);

    if (!resultado.success) {
      setErroMensagem(resultado.error || 'Ocorreu um erro ao salvar sua confirmação. Tente novamente.');
      return;
    }

    toast.success(`Ciência registrada com sucesso para ${idsParaConsentir.length} ocorrência(s)!`);
    setConfirmouLeitura(false);
    onClose();
  };

  return (
    <div
      className="polocoin-modal-overlay polocoin-modal-overlay--visible"
      style={{ zIndex: 1100 }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="polocoin-modal-container"
        style={{
          maxWidth: '680px',
          width: '92%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 45px rgba(0, 0, 0, 0.28)',
          borderRadius: '18px',
          border: '2px solid var(--color-danger)',
          background: 'var(--bg-card, #ffffff)',
          overflow: 'hidden',
        }}
      >
        {/* Cabeçalho do Pop-up */}
        <div
          className="polocoin-modal-header"
          style={{
            background: 'linear-gradient(135deg, #fee2e2 0%, #fef2f2 100%)',
            borderBottom: '1px solid #fca5a5',
            padding: '20px 24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: '#ef4444',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                flexShrink: 0,
                boxShadow: '0 4px 10px rgba(239, 68, 68, 0.3)',
              }}
            >
              🛡️
            </div>
            <div>
              <h3
                className="polocoin-modal-title"
                style={{ color: '#991b1b', fontSize: '18px', fontWeight: 900, margin: 0 }}
              >
                Confirmação Obrigatória de Ocorrências
              </h3>
              <p
                className="polocoin-modal-subtitle"
                style={{ color: '#b91c1c', fontSize: '13px', marginTop: '3px', margin: 0 }}
              >
                Identificamos {ocorrenciasPendentes.length} advertência(s) pedagógica(s) recente(s) aguardando sua ciência
              </p>
            </div>
          </div>
        </div>

        {/* Corpo do Pop-up com lista rolável */}
        <div
          className="polocoin-modal-body"
          style={{
            padding: '20px 24px',
            overflowY: 'auto',
            maxHeight: 'calc(90vh - 240px)',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '12px 14px',
              fontSize: '13px',
              color: 'var(--text-secondary, #475569)',
              lineHeight: 1.5,
            }}
          >
            ℹ️ Caro(a) responsável, para garantir o acompanhamento escolar e o diálogo pedagógico da família com a escola, solicitamos a leitura e o registro de ciência das ocorrências abaixo. Enquanto houver pendências, o aluno não poderá realizar compras na Loja PoloCoin.
          </div>

          {erroMensagem && (
            <div
              className="alert alert-danger"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 14px',
                borderRadius: '10px',
                fontSize: '13px',
                margin: 0,
              }}
            >
              <span>❌ {erroMensagem}</span>
            </div>
          )}

          {/* Lista das ocorrências pendentes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {ocorrenciasPendentes.map((oc, index) => {
              const filho = alunos.find(a => a.id === oc.alunoId);
              const turma = filho ? turmas.find(t => t.id === filho.turmaId) : null;

              return (
                <div
                  key={oc.id}
                  style={{
                    border: '1px solid #fecaca',
                    borderLeft: '5px solid var(--color-danger, #ef4444)',
                    borderRadius: '12px',
                    padding: '14px 16px',
                    background: '#fff',
                    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
                  }}
                >
                  {/* Identificação clara do Filho */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderBottom: '1px solid #f1f5f9',
                      paddingBottom: '10px',
                      marginBottom: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '24px' }}>{filho?.avatar || '👤'}</span>
                      <div>
                        <strong style={{ fontSize: '15px', color: 'var(--text-primary, #0f172a)' }}>
                          {filho?.nome}
                        </strong>
                        <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
                          <span className="badge badge-info" style={{ fontSize: '11px', padding: '2px 8px' }}>
                            {turma ? `${turma.serie}º Ano ${turma.turma}` : 'Turma'}
                          </span>
                          <span
                            className="badge badge-danger"
                            style={{
                              fontSize: '11px',
                              padding: '2px 8px',
                              background: '#fee2e2',
                              color: '#b91c1c',
                              border: '1px solid #fca5a5',
                            }}
                          >
                            Ocorrência {index + 1} de {ocorrenciasPendentes.length}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span
                        style={{
                          fontWeight: 800,
                          fontSize: '15px',
                          color: 'var(--color-danger, #ef4444)',
                          display: 'block',
                        }}
                      >
                        -{oc.pontos} PoloCoins
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)' }}>
                        {oc.data} às {oc.hora}
                      </span>
                    </div>
                  </div>

                  {/* Detalhes da Advertência */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                      <span style={{ fontSize: '13px', color: 'var(--text-secondary, #475569)' }}>
                        <strong>Motivo:</strong> {oc.valor}
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)' }}>
                        Categoria: <em>{oc.categoria}</em>
                      </span>
                    </div>

                    {oc.observacao && (
                      <div
                        style={{
                          background: '#fef2f2',
                          border: '1px dashed #fca5a5',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          fontSize: '13px',
                          fontStyle: 'italic',
                          color: '#7f1d1d',
                          marginTop: '4px',
                        }}
                      >
                        "{oc.observacao}"
                      </div>
                    )}

                    <div style={{ marginTop: '4px', fontSize: '12px', color: 'var(--text-muted, #64748b)' }}>
                      Docente responsável: <strong>{oc.professorNome || 'Professor(a)'}</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Rodapé com Checkbox Obrigatória e Ação */}
        <div
          className="polocoin-modal-footer"
          style={{
            padding: '16px 24px',
            background: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {/* Caixa de seleção obrigatória */}
          <label
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              cursor: 'pointer',
              userSelect: 'none',
              background: '#fff',
              border: confirmouLeitura ? '1px solid var(--color-primary)' : '1px solid #cbd5e1',
              padding: '12px 14px',
              borderRadius: '10px',
              transition: 'border-color 0.2s ease',
            }}
          >
            <input
              type="checkbox"
              checked={confirmouLeitura}
              onChange={e => {
                setConfirmouLeitura(e.target.checked);
                if (e.target.checked) setErroMensagem(null);
              }}
              style={{
                width: '18px',
                height: '18px',
                marginTop: '2px',
                accentColor: 'var(--color-primary, #6366f1)',
                cursor: 'pointer',
              }}
            />
            <span style={{ fontSize: '13px', color: 'var(--text-primary, #1e293b)', lineHeight: 1.4 }}>
              <strong>Confirmo que li e estou ciente das ocorrências negativas apresentadas.</strong>
              <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted, #64748b)' }}>
                Ao confirmar, o registro de ciência será gravado no sistema e os alunos serão liberados para atividades normais.
              </span>
            </span>
          </label>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              className="btn btn-primary"
              style={{
                minWidth: '220px',
                padding: '11px 20px',
                fontWeight: 700,
                fontSize: '14px',
                opacity: !confirmouLeitura || salvando ? 0.6 : 1,
                cursor: !confirmouLeitura || salvando ? 'not-allowed' : 'pointer',
              }}
              onClick={handleConfirmarCiencia}
              disabled={!confirmouLeitura || salvando}
            >
              {salvando ? 'Gravando ciência...' : '✓ Confirmar Ciência das Ocorrências'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
