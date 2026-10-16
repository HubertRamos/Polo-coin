import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Turma, Aluno } from '../../types';
import { AlunoPainelModal } from './AlunoPainelModal';
import { RelatorioModal } from './RelatorioModal';
import { Modal } from '../common/Modal';
import { useToast } from '../common/Toast';

export const TurmasProfessorTab: React.FC = () => {
  const { turmas, professores, alunos, linkTurmaProfessor, unlinkTurmaProfessor } = useData();
  const { currentUser } = useAuth();
  const toast = useToast();

  const currentProf = professores.find(p => p.id === currentUser?.id) || professores[0];
  const turmasVinculadasIds = currentProf?.turmasVinculadas || [];

  const turmasDoProfessor = turmas.filter(t => turmasVinculadasIds.includes(t.id));
  const turmasDisponiveis = turmas.filter(t => !turmasVinculadasIds.includes(t.id));

  const [turmaSelecionada, setTurmaSelecionada] = useState<Turma | null>(turmasDoProfessor[0] || turmas[0] || null);
  const [alunoSelecionado, setAlunoSelecionado] = useState<Aluno | null>(null);

  React.useEffect(() => {
    if (!turmaSelecionada && (turmasDoProfessor[0] || turmas[0])) {
      setTurmaSelecionada(turmasDoProfessor[0] || turmas[0]);
    }
  }, [turmasDoProfessor, turmas, turmaSelecionada]);

  const [modalGerenciarTurmas, setModalGerenciarTurmas] = useState(false);
  const [modalRelatorio, setModalRelatorio] = useState(false);

  const alunosDaTurma = turmaSelecionada
    ? alunos.filter(a => a.turmaId === turmaSelecionada.id)
    : [];

  const handleVincular = (turmaId: number) => {
    if (currentProf) {
      linkTurmaProfessor(currentProf.id, turmaId);
      toast.success('Turma vinculada ao seu perfil com sucesso!');
    }
  };

  const handleDesvincular = (turmaId: number) => {
    if (currentProf) {
      unlinkTurmaProfessor(currentProf.id, turmaId);
      toast.info('Turma desvinculada do seu perfil.');
    }
  };

  return (
    <div>
      <div className="polocoin-main__header">
        <div>
          <h1 className="polocoin-main__title">Minhas Turmas</h1>
          <p className="polocoin-main__subtitle">
            Selecione uma turma para avaliar os alunos com PoloCoins e registrar ocorrências
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setModalGerenciarTurmas(true)}
          >
            ⚙️ Gerenciar Vínculos
          </button>
          {turmaSelecionada && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setModalRelatorio(true)}
            >
              📊 Relatório da Turma
            </button>
          )}
        </div>
      </div>

      {/* Seletor de turmas vinculadas */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {turmasDoProfessor.length === 0 ? (
          <div className="alert alert-warning" style={{ width: '100%' }}>
            <span>Você não possui turmas vinculadas. Clique em "Gerenciar Vínculos" para selecionar suas classes.</span>
          </div>
        ) : (
          turmasDoProfessor.map(t => {
            const isAtiva = turmaSelecionada?.id === t.id;
            const count = alunos.filter(a => a.turmaId === t.id).length;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTurmaSelecionada(t)}
                className={`btn ${isAtiva ? 'btn-primary' : 'btn-secondary'}`}
                style={{
                  padding: '12px 18px',
                  borderRadius: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <span style={{ fontSize: '18px' }}>🏫</span>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 800 }}>{t.serie}º Ano {t.turma}</div>
                  <span style={{ fontSize: '11px', opacity: 0.85 }}>{count} alunos</span>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Lista de Alunos da Turma Selecionada */}
      {turmaSelecionada && (
        <div className="card">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '18px',
              paddingBottom: '12px',
              borderBottom: '1px solid var(--border-color)',
            }}
          >
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 900 }}>
              Alunos da Turma {turmaSelecionada.serie}º {turmaSelecionada.turma}
            </h2>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Clique em um aluno para abrir o painel de avaliação
            </span>
          </div>

          {alunosDaTurma.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon">🎒</div>
              <div className="empty-state__text">Nenhum aluno matriculado nesta turma.</div>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: '14px',
              }}
            >
              {alunosDaTurma.map(aluno => (
                <div
                  key={aluno.id}
                  className="card-aluno"
                  style={{ cursor: 'pointer' }}
                  onClick={() => setAlunoSelecionado(aluno)}
                >
                  <div className="card-aluno__content">
                    <div className="card-aluno__info">
                      <span style={{ fontSize: '32px' }}>{aluno.avatar}</span>
                      <div className="card-aluno__identidade">
                        <span className="card-aluno__nome">{aluno.nome}</span>
                        <span className="card-aluno__sub">
                          {aluno.pode_comprar ? '✓ Ativo na loja' : '⏸ Compra pausada'}
                        </span>
                      </div>
                    </div>
                    <div className="card-aluno__meta">
                      <span className="card-aluno__saldo">🪙 {aluno.pontos}</span>
                      <span className="card-aluno__saldo-label">PoloCoins</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal de Avaliação do Aluno */}
      <AlunoPainelModal
        isOpen={!!alunoSelecionado}
        aluno={alunoSelecionado}
        turma={turmaSelecionada}
        onClose={() => setAlunoSelecionado(null)}
      />

      {/* Modal de Relatório da Turma */}
      <RelatorioModal
        isOpen={modalRelatorio}
        turma={turmaSelecionada}
        onClose={() => setModalRelatorio(false)}
      />

      {/* Modal Gerenciar Vínculos de Turmas */}
      <Modal
        isOpen={modalGerenciarTurmas}
        onClose={() => setModalGerenciarTurmas(false)}
        title="Gerenciar Vínculos de Turmas"
        subtitle="Vincule as classes que você leciona"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <h4 style={{ margin: '0 0 10px', fontSize: '14px', fontWeight: 800 }}>Turmas Vinculadas Atualmente</h4>
            {turmasDoProfessor.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Nenhuma turma vinculada.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {turmasDoProfessor.map(t => (
                  <div
                    key={t.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: 'var(--bg-subtle)',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    <strong>{t.serie}º Ano {t.turma}</strong>
                    <button
                      type="button"
                      className="btn btn-danger btn--sm"
                      onClick={() => handleDesvincular(t.id)}
                    >
                      Desvincular
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
            <h4 style={{ margin: '0 0 10px', fontSize: '14px', fontWeight: 800 }}>Outras Turmas Disponíveis</h4>
            {turmasDisponiveis.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Todas as turmas já estão vinculadas.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {turmasDisponiveis.map(t => (
                  <div
                    key={t.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: 'var(--bg-subtle)',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    <span>{t.serie}º Ano {t.turma}</span>
                    <button
                      type="button"
                      className="btn btn-primary btn--sm"
                      onClick={() => handleVincular(t.id)}
                    >
                      + Vincular
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};
