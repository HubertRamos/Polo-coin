import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Turma, Aluno } from '../../types';
import { Modal } from '../common/Modal';
import { useToast } from '../common/Toast';
import { ImportarPlanilhaModal } from './ImportarPlanilhaModal';

import { validarDuplicidadeAluno } from '../../lib/duplicateValidation';

export const TurmasTab: React.FC = () => {
  const { turmas, alunos, responsaveis, addTurma, addAluno, updateAluno, updateResponsavel } = useData();
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
  const [modalImportarAberto, setModalImportarAberto] = useState(false);
  const [alunoEditando, setAlunoEditando] = useState<Aluno | null>(null);

  // Form states nova turma
  const [serie, setSerie] = useState('1');
  const [letraTurma, setLetraTurma] = useState('A');
  const [anoLetivoTurma, setAnoLetivoTurma] = useState(2026);

  // Form states novo aluno
  const [nomeAluno, setNomeAluno] = useState('');
  const [matriculaAluno, setMatriculaAluno] = useState('');
  const [nomeResponsavel, setNomeResponsavel] = useState('');
  const [senhaAluno, setSenhaAluno] = useState('123');
  const [salvandoAluno, setSalvandoAluno] = useState(false);
  const [erroAluno, setErroAluno] = useState('');

  // Form states editar aluno e responsável
  const [editNome, setEditNome] = useState('');
  const [editMatricula, setEditMatricula] = useState('');
  const [editSenhaAluno, setEditSenhaAluno] = useState('');
  const [editNomeResponsavel, setEditNomeResponsavel] = useState('');
  const [editSenhaResponsavel, setEditSenhaResponsavel] = useState('');
  const [mostrarSenhaAluno, setMostrarSenhaAluno] = useState(false);
  const [mostrarSenhaResponsavel, setMostrarSenhaResponsavel] = useState(false);
  const [erroEditAluno, setErroEditAluno] = useState('');

  const alunosDaTurma = turmaSelecionada
    ? alunos.filter(a => a.turmaId === turmaSelecionada.id)
    : [];

  const handleSalvarTurma = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serie || !letraTurma.trim()) {
      toast.warning('Preencha a série e a identificação da turma.');
      return;
    }
    const ano = Number(anoLetivoTurma) || 2026;
    await addTurma(Number(serie), letraTurma, ano);
    toast.success(`Turma ${serie}º Ano ${letraTurma.toUpperCase()} (${ano}) criada com sucesso!`);
    setModalNovaTurma(false);
  };

  const abrirModalNovoAluno = () => {
    setNomeAluno('');
    setMatriculaAluno('');
    setNomeResponsavel('');
    setSenhaAluno('123');
    setErroAluno('');
    setModalNovoAluno(true);
  };

  const handleSalvarAluno = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroAluno('');

    if (!turmaSelecionada) return;
    if (!nomeAluno.trim() || !nomeResponsavel.trim()) {
      toast.warning('Informe o nome do aluno e do responsável.');
      return;
    }

    // Validação de duplicidade antes do envio
    const validacao = validarDuplicidadeAluno(
      {
        nome: nomeAluno.trim(),
        turmaId: turmaSelecionada.id,
        matricula: matriculaAluno.trim() || undefined,
      },
      alunos
    );

    if (validacao.isDuplicate) {
      const msg = validacao.message || 'Aluno ou matrícula já cadastrada.';
      setErroAluno(msg);
      toast.error(msg);
      return;
    }

    setSalvandoAluno(true);
    try {
      await addAluno(
        turmaSelecionada.id,
        nomeAluno,
        nomeResponsavel,
        senhaAluno || '123',
        matriculaAluno.trim() || undefined
      );
      toast.success(`Aluno ${nomeAluno} cadastrado na turma com sucesso!`);
      setNomeAluno('');
      setMatriculaAluno('');
      setNomeResponsavel('');
      setSenhaAluno('123');
      setModalNovoAluno(false);
    } catch (err: any) {
      const msg = err?.message || 'Falha ao cadastrar aluno.';
      setErroAluno(msg);
      toast.error(msg);
    } finally {
      setSalvandoAluno(false);
    }
  };

  const abrirEditarAluno = (aluno: Aluno) => {
    setAlunoEditando(aluno);
    setEditNome(aluno.nome);
    setEditMatricula(aluno.matricula || '');
    setEditSenhaAluno('');
    const resp = responsaveis.find(r => r.id === aluno.responsavelId);
    setEditNomeResponsavel(resp?.nome || '');
    setEditSenhaResponsavel('');
    setMostrarSenhaAluno(false);
    setMostrarSenhaResponsavel(false);
    setErroEditAluno('');
  };

  const handleSalvarEdicaoAluno = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alunoEditando) return;
    setErroEditAluno('');

    const nomeAlunoTrim = editNome.trim();
    if (!nomeAlunoTrim) {
      setErroEditAluno('O nome do aluno é obrigatório.');
      toast.warning('O nome do aluno é obrigatório.');
      return;
    }

    const matriculaTrim = editMatricula.trim();

    // Validação de unicidade e duplicidade ignorando o próprio aluno
    const validacao = validarDuplicidadeAluno(
      {
        nome: nomeAlunoTrim,
        turmaId: alunoEditando.turmaId,
        matricula: matriculaTrim || undefined,
      },
      alunos,
      alunoEditando.id
    );

    if (validacao.isDuplicate) {
      const msg = validacao.message || 'Dados conflitantes com outro aluno já existente.';
      setErroEditAluno(msg);
      toast.error(msg);
      return;
    }

    // Validação de senha do aluno se informada
    if (editSenhaAluno.trim() && editSenhaAluno.trim().length < 3) {
      const msg = 'A nova senha do aluno deve conter no mínimo 3 caracteres.';
      setErroEditAluno(msg);
      toast.warning(msg);
      return;
    }

    // Validação dos dados do responsável
    const nomeRespTrim = editNomeResponsavel.trim();
    if (alunoEditando.responsavelId && !nomeRespTrim) {
      const msg = 'O nome do responsável é obrigatório.';
      setErroEditAluno(msg);
      toast.warning(msg);
      return;
    }

    // Validação de senha do responsável se informada
    if (editSenhaResponsavel.trim() && editSenhaResponsavel.trim().length < 3) {
      const msg = 'A nova senha do responsável deve conter no mínimo 3 caracteres.';
      setErroEditAluno(msg);
      toast.warning(msg);
      return;
    }

    setSalvandoAluno(true);
    try {
      // 1. Atualizar dados do aluno (preservando rigorosamente turma, saldo, autorização, avatar e vínculos)
      const alunoPayload: Partial<Aluno> = {
        nome: nomeAlunoTrim,
        matricula: matriculaTrim || undefined,
      };
      if (editSenhaAluno.trim()) {
        alunoPayload.senha = editSenhaAluno.trim();
      }
      await updateAluno(alunoEditando.id, alunoPayload);

      // 2. Atualizar dados do responsável (se vinculado)
      if (alunoEditando.responsavelId) {
        const respPayload: { nome?: string; senha?: string } = {
          nome: nomeRespTrim,
        };
        if (editSenhaResponsavel.trim()) {
          respPayload.senha = editSenhaResponsavel.trim();
        }
        await updateResponsavel(alunoEditando.responsavelId, respPayload);
      }

      toast.success('Dados do aluno e do responsável atualizados com sucesso!');
      setAlunoEditando(null);
    } catch (err: any) {
      const msg = err?.message || 'Falha ao atualizar dados.';
      setErroEditAluno(msg);
      toast.error(msg);
    } finally {
      setSalvandoAluno(false);
    }
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
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setModalImportarAberto(true)}
            title="Importar alunos por planilha Excel (.xlsx) ou CSV (.csv)"
          >
            <span>📥</span> Importar Alunos por Planilha
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setModalNovaTurma(true)}
          >
            <span>➕</span> Nova Turma
          </button>
        </div>
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
                      <span
                        style={{
                          marginLeft: '6px',
                          fontSize: '11px',
                          padding: '1px 6px',
                          background: isAtiva ? 'rgba(255,255,255,0.2)' : 'var(--bg-subtle)',
                          borderRadius: '4px',
                          color: isAtiva ? '#fff' : 'var(--text-secondary)',
                          fontWeight: 600,
                        }}
                      >
                        {t.anoLetivo || 2026}
                      </span>
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
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-secondary btn--sm"
                onClick={() => setModalImportarAberto(true)}
                title={`Importar alunos por planilha`}
              >
                <span>📥</span> Importar Planilha
              </button>
              <button
                type="button"
                className="btn btn-primary btn--sm"
                onClick={abrirModalNovoAluno}
              >
                <span>➕</span> Adicionar Aluno
              </button>
            </div>
          </div>

          {alunosDaTurma.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon">🎒</div>
              <div className="empty-state__text">Nenhum aluno cadastrado nesta turma ainda.</div>
              <div className="empty-state__action">
                <button
                  type="button"
                  className="btn btn-primary btn--sm"
                  onClick={abrirModalNovoAluno}
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
                              {aluno.matricula && (
                                <span
                                  className="badge badge-info"
                                  style={{ fontSize: '11px', marginTop: '2px', display: 'inline-block' }}
                                >
                                  Matrícula: {aluno.matricula}
                                </span>
                              )}
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

          <div className="form-group">
            <label className="form-label">Ano Letivo</label>
            <input
              type="number"
              min={2020}
              max={2035}
              className="form-input"
              value={anoLetivoTurma}
              onChange={e => setAnoLetivoTurma(Number(e.target.value) || 2026)}
              required
            />
            <small style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '4px', display: 'block' }}>
              Permite cadastrar previamente turmas para o ano corrente (2026) ou para o próximo ano letivo (2027).
            </small>
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
            <label className="form-label">Matrícula Escolar (opcional)</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ex: MAT-2024-001 (identificador institucional único)"
              value={matriculaAluno}
              onChange={e => setMatriculaAluno(e.target.value)}
            />
            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
              Se informada, a matrícula não pode ser duplicada em toda a escola.
            </span>
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

          {erroAluno && (
            <div className="alert alert-danger" style={{ marginBottom: '14px', fontSize: '13px' }}>
              <span>⚠️ {erroAluno}</span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setModalNovoAluno(false)}
              disabled={salvandoAluno}
            >
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={salvandoAluno}>
              {salvandoAluno ? 'Cadastrando...' : 'Cadastrar Aluno'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Editar Aluno e Responsável */}
      <Modal
        isOpen={!!alunoEditando}
        onClose={() => setAlunoEditando(null)}
        title="Editar Aluno e Responsável"
        subtitle="Ajuste os dados cadastrais do aluno e do responsável associado"
        maxWidth="580px"
      >
        <form onSubmit={handleSalvarEdicaoAluno}>
          {/* SEÇÃO 1: Dados do Aluno */}
          <div
            style={{
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-color)',
              borderRadius: '14px',
              padding: '16px 18px',
              marginBottom: '16px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '14px',
                paddingBottom: '8px',
                borderBottom: '1px solid var(--border-color)',
              }}
            >
              <span style={{ fontSize: '18px' }}>👤</span>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--text-color)' }}>
                Dados do Aluno
              </h3>
            </div>

            {/* Nome do Aluno */}
            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label className="form-label">
                Nome do Aluno <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="Nome completo do aluno"
                value={editNome}
                onChange={e => setEditNome(e.target.value)}
                required
              />
            </div>

            {/* Matrícula Escolar */}
            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label className="form-label">Matrícula Escolar</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ex: MAT-2024-001"
                value={editMatricula}
                onChange={e => setEditMatricula(e.target.value)}
              />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Identificador escolar único no sistema (opcional).
              </span>
            </div>

            {/* Nova Senha do Aluno */}
            <div className="form-group" style={{ marginBottom: '4px' }}>
              <label className="form-label">Nova Senha do Aluno (opcional)</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={mostrarSenhaAluno ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Deixe em branco para manter a senha atual"
                  value={editSenhaAluno}
                  onChange={e => setEditSenhaAluno(e.target.value)}
                  style={{ paddingRight: '40px' }}
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenhaAluno(!mostrarSenhaAluno)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '14px',
                    padding: '4px',
                    opacity: 0.75,
                  }}
                  title={mostrarSenhaAluno ? 'Ocultar senha' : 'Ver senha'}
                >
                  {mostrarSenhaAluno ? '🙈' : '👁️'}
                </button>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Deixe em branco para manter a senha atual.
              </span>
            </div>
          </div>

          {/* SEÇÃO 2: Dados do Responsável */}
          <div
            style={{
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-color)',
              borderRadius: '14px',
              padding: '16px 18px',
              marginBottom: '16px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '14px',
                paddingBottom: '8px',
                borderBottom: '1px solid var(--border-color)',
              }}
            >
              <span style={{ fontSize: '18px' }}>👨‍👩‍👧</span>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--text-color)' }}>
                Dados do Responsável
              </h3>
            </div>

            {/* Nome do Responsável */}
            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label className="form-label">
                Nome do Responsável {alunoEditando?.responsavelId && <span style={{ color: 'var(--color-danger)' }}>*</span>}
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="Nome completo do responsável"
                value={editNomeResponsavel}
                onChange={e => setEditNomeResponsavel(e.target.value)}
                required={!!alunoEditando?.responsavelId}
              />
            </div>

            {/* Nova Senha do Responsável */}
            <div className="form-group" style={{ marginBottom: '4px' }}>
              <label className="form-label">Nova Senha do Responsável (opcional)</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={mostrarSenhaResponsavel ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Deixe em branco para manter a senha atual"
                  value={editSenhaResponsavel}
                  onChange={e => setEditSenhaResponsavel(e.target.value)}
                  style={{ paddingRight: '40px' }}
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenhaResponsavel(!mostrarSenhaResponsavel)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '14px',
                    padding: '4px',
                    opacity: 0.75,
                  }}
                  title={mostrarSenhaResponsavel ? 'Ocultar senha' : 'Ver senha'}
                >
                  {mostrarSenhaResponsavel ? '🙈' : '👁️'}
                </button>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Deixe em branco para manter a senha atual.
              </span>
            </div>

            {alunoEditando?.responsavelId && (
              <div style={{ marginTop: '10px', fontSize: '11.5px', color: 'var(--text-muted)' }}>
                ℹ️ <em>A alteração dos dados do responsável é compartilhada com todos os alunos vinculados à mesma conta familiar.</em>
              </div>
            )}
          </div>

          {erroEditAluno && (
            <div className="alert alert-danger" style={{ marginBottom: '14px', fontSize: '13px' }}>
              <span>⚠️ {erroEditAluno}</span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setAlunoEditando(null)}
              disabled={salvandoAluno}
            >
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={salvandoAluno}>
              {salvandoAluno ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal de Importação em Massa por Planilha */}
      <ImportarPlanilhaModal
        isOpen={modalImportarAberto}
        onClose={() => setModalImportarAberto(false)}
        tipo="alunos"
        turmaIdPadrao={turmaSelecionada?.id}
      />
    </div>
  );
};
