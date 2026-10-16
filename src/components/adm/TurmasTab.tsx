import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Turma, Aluno } from '../../types';
import { Modal } from '../common/Modal';
import { useToast } from '../common/Toast';

export const TurmasTab: React.FC = () => {
  const { turmas, alunos, responsaveis, addTurma, addAluno, updateAluno } = useData();
  const toast = useToast();

  const [turmaSelecionada, setTurmaSelecionada] = useState<Turma | null>(turmas[0] || null);

  React.useEffect(() => {
    if (!turmaSelecionada && turmas.length > 0) {
      setTurmaSelecionada(turmas[0]);
    }
  }, [turmas, turmaSelecionada]);

  // Modais
  const [modalNovaTurma, setModalNovaTurma] = useState(false);
  const [modalNovoAluno, setModalNovoAluno] = useState(false);
  const [alunoEditando, setAlunoEditando] = useState<Aluno | null>(null);

  // Form states nova turma
  const [serie, setSerie] = useState('1');
  const [letraTurma, setLetraTurma] = useState('A');

  // Form states novo aluno
  const [nomeAluno, setNomeAluno] = useState('');
  const [nomeResponsavel, setNomeResponsavel] = useState('');
  const [senhaAluno, setSenhaAluno] = useState('123');

  // Form states editar aluno
  const [editNome, setEditNome] = useState('');
  const [editPontos, setEditPontos] = useState('0');
  const [editPodeComprar, setEditPodeComprar] = useState(true);

  const alunosDaTurma = turmaSelecionada
    ? alunos.filter(a => a.turmaId === turmaSelecionada.id)
    : [];

  const handleSalvarTurma = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serie || !letraTurma.trim()) {
      toast.warning('Preencha a série e a identificação da turma.');
      return;
    }
    await addTurma(Number(serie), letraTurma);
    toast.success(`Turma ${serie}º Ano ${letraTurma.toUpperCase()} criada com sucesso!`);
    setModalNovaTurma(false);
  };

  const handleSalvarAluno = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!turmaSelecionada) return;
    if (!nomeAluno.trim() || !nomeResponsavel.trim()) {
      toast.warning('Informe o nome do aluno e do responsável.');
      return;
    }
    await addAluno(turmaSelecionada.id, nomeAluno, nomeResponsavel, senhaAluno || '123');
    toast.success(`Aluno ${nomeAluno} cadastrado na turma com sucesso!`);
    setNomeAluno('');
    setNomeResponsavel('');
    setSenhaAluno('123');
    setModalNovoAluno(false);
  };

  const abrirEditarAluno = (aluno: Aluno) => {
    setAlunoEditando(aluno);
    setEditNome(aluno.nome);
    setEditPontos(String(aluno.pontos));
    setEditPodeComprar(aluno.pode_comprar);
  };

  const handleSalvarEdicaoAluno = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alunoEditando) return;
    await updateAluno(alunoEditando.id, {
      nome: editNome.trim() || alunoEditando.nome,
      pontos: Number(editPontos) || 0,
      pode_comprar: editPodeComprar,
    });
    toast.success('Dados do aluno atualizados com sucesso!');
    setAlunoEditando(null);
  };

  return (
    <div>
      <div className="polocoin-main__header">
        <div>
          <h1 className="polocoin-main__title">Turmas & Alunos</h1>
          <p className="polocoin-main__subtitle">
            Gerencie as turmas escolares, alunos cadastrados e seus respectivos responsáveis
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setModalNovaTurma(true)}
        >
          <span>➕</span> Nova Turma
        </button>
      </div>

      {/* Grid de seleção de turmas */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '12px',
          marginBottom: '24px',
        }}
      >
        {turmas.map(t => {
          const qtd = alunos.filter(a => a.turmaId === t.id).length;
          const isAtiva = turmaSelecionada?.id === t.id;
          return (
            <div
              key={t.id}
              onClick={() => setTurmaSelecionada(t)}
              className="card-turma"
              style={{
                cursor: 'pointer',
                borderColor: isAtiva ? 'var(--color-primary)' : 'var(--border-color)',
                backgroundColor: isAtiva ? 'var(--color-primary-soft)' : 'var(--bg-card)',
                boxShadow: isAtiva ? 'var(--shadow-primary)' : 'var(--shadow-xs)',
              }}
            >
              <div className="card-turma__row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: isAtiva ? 'var(--gradient-primary)' : '#e2e8f0',
                      color: isAtiva ? '#fff' : '#475569',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 900,
                      fontSize: '15px',
                    }}
                  >
                    {t.serie}º{t.turma}
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800 }}>
                      {t.serie}º Ano {t.turma}
                    </h4>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {qtd} aluno(s)
                    </span>
                  </div>
                </div>
                <span style={{ color: isAtiva ? 'var(--color-primary)' : 'var(--text-muted)' }}>
                  {isAtiva ? '● Ativa' : '→'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detalhes da Turma Selecionada */}
      {turmaSelecionada && (
        <div className="card">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '18px',
              paddingBottom: '14px',
              borderBottom: '1px solid var(--border-color)',
              flexWrap: 'wrap',
              gap: '10px',
            }}
          >
            <div>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 900, color: 'var(--text-primary)' }}>
                Alunos da Turma {turmaSelecionada.serie}º {turmaSelecionada.turma}
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                Total: {alunosDaTurma.length} estudantes matriculados
              </p>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn--sm"
              onClick={() => setModalNovoAluno(true)}
            >
              <span>➕</span> Adicionar Aluno a esta Turma
            </button>
          </div>

          {alunosDaTurma.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon">🎒</div>
              <div className="empty-state__text">Nenhum aluno cadastrado nesta turma ainda.</div>
              <div className="empty-state__action">
                <button
                  type="button"
                  className="btn btn-primary btn--sm"
                  onClick={() => setModalNovoAluno(true)}
                >
                  Cadastrar Primeiro Aluno
                </button>
              </div>
            </div>
          ) : (
            <div className="tabela-wrapper">
              <table className="tabela">
                <thead>
                  <tr>
                    <th>Avatar & Aluno</th>
                    <th>Responsável</th>
                    <th>Saldo PoloCoins</th>
                    <th>Permissão de Compra</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {alunosDaTurma.map(aluno => {
                    const resp = responsaveis.find(r => r.id === aluno.responsavelId);
                    return (
                      <tr key={aluno.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '24px' }}>{aluno.avatar}</span>
                            <div>
                              <strong style={{ display: 'block', color: 'var(--text-primary)' }}>
                                {aluno.nome}
                              </strong>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontWeight: 600 }}>{resp ? resp.nome : 'Não informado'}</span>
                        </td>
                        <td>
                          <span style={{ fontWeight: 900, color: 'var(--color-coin-dark)', fontSize: '15px' }}>
                            🪙 {aluno.pontos}
                          </span>
                        </td>
                        <td>
                          {aluno.pode_comprar ? (
                            <span className="badge badge-success">✓ Liberado</span>
                          ) : (
                            <span className="badge badge-warning">⏸ Pausado</span>
                          )}
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-secondary btn--sm"
                            onClick={() => abrirEditarAluno(aluno)}
                          >
                            ✏️ Editar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal Nova Turma */}
      <Modal
        isOpen={modalNovaTurma}
        onClose={() => setModalNovaTurma(false)}
        title="Criar Nova Turma"
        subtitle="Defina o ano escolar e a letra da classe"
      >
        <form onSubmit={handleSalvarTurma}>
          <div className="form-group">
            <label className="form-label">Série / Ano</label>
            <select
              className="form-select"
              value={serie}
              onChange={e => setSerie(e.target.value)}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                <option key={n} value={n}>
                  {n}º Ano do Ensino Fundamental
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Identificação da Turma (Letra)</label>
            <input
              type="text"
              maxLength={2}
              className="form-input"
              placeholder="Ex: A, B, C..."
              value={letraTurma}
              onChange={e => setLetraTurma(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setModalNovaTurma(false)}
            >
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              Criar Turma
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Novo Aluno */}
      <Modal
        isOpen={modalNovoAluno}
        onClose={() => setModalNovoAluno(false)}
        title={`Adicionar Aluno na Turma ${turmaSelecionada?.serie}º${turmaSelecionada?.turma}`}
        subtitle="Cadastre o aluno e vincule a um responsável"
      >
        <form onSubmit={handleSalvarAluno}>
          <div className="form-group">
            <label className="form-label">Nome Completo do Aluno</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ex: Larissa Martins"
              value={nomeAluno}
              onChange={e => setNomeAluno(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Nome do Responsável Legal</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ex: Fernanda Martins"
              value={nomeResponsavel}
              onChange={e => setNomeResponsavel(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Senha Inicial do Aluno</label>
            <input
              type="password"
              className="form-input"
              placeholder="Padrão: 123"
              value={senhaAluno}
              onChange={e => setSenhaAluno(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setModalNovoAluno(false)}
            >
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              Cadastrar Aluno
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Editar Aluno */}
      <Modal
        isOpen={!!alunoEditando}
        onClose={() => setAlunoEditando(null)}
        title="Editar Aluno"
        subtitle="Ajuste o nome, saldo ou permissão do aluno"
      >
        <form onSubmit={handleSalvarEdicaoAluno}>
          <div className="form-group">
            <label className="form-label">Nome do Aluno</label>
            <input
              type="text"
              className="form-input"
              value={editNome}
              onChange={e => setEditNome(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Saldo de PoloCoins 🪙</label>
            <input
              type="number"
              min="0"
              className="form-input"
              value={editPontos}
              onChange={e => setEditPontos(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 700 }}>
              <input
                type="checkbox"
                checked={editPodeComprar}
                onChange={e => setEditPodeComprar(e.target.checked)}
              />
              <span>Aluno autorizado a comprar diretamente na Loja PoloCoin</span>
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setAlunoEditando(null)}
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
