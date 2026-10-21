import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Professor } from '../../types';
import { Modal } from '../common/Modal';
import { useToast } from '../common/Toast';
import { ImportarPlanilhaModal } from './ImportarPlanilhaModal';

import { validarDuplicidadeProfessor, normalizarUsuario } from '../../lib/duplicateValidation';

export const ProfessoresTab: React.FC = () => {
  const { professores, turmas, addProfessor, updateProfessor } = useData();
  const toast = useToast();

  const [modalNovo, setModalNovo] = useState(false);
  const [modalImportarAberto, setModalImportarAberto] = useState(false);
  const [professorEditando, setProfessorEditando] = useState<Professor | null>(null);

  const [name, setName] = useState('');
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erroDuplicidade, setErroDuplicidade] = useState('');

  const abrirModalNovo = () => {
    setName('');
    setUsuario('');
    setPassword('');
    setErroDuplicidade('');
    setModalNovo(true);
  };

  const abrirModalEditar = (p: Professor) => {
    setProfessorEditando(p);
    setName(p.name);
    setUsuario(p.usuario);
    setPassword(p.password || '');
    setErroDuplicidade('');
  };

  const handleSalvarNovo = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroDuplicidade('');

    if (!name.trim()) {
      toast.warning('Informe o nome do professor.');
      return;
    }

    // Calcula o usuário efetivo que será utilizado
    const userFinal = normalizarUsuario(usuario) || normalizarUsuario(name.trim().replace(/\s+/g, '.'));
    const validacao = validarDuplicidadeProfessor({ usuario: userFinal, name: name.trim() }, professores);

    if (validacao.isDuplicate) {
      const msg = validacao.message || `Já existe um professor cadastrado com este usuário (@${userFinal}).`;
      setErroDuplicidade(msg);
      toast.error(msg);
      return;
    }

    setSalvando(true);
    try {
      await addProfessor(name, usuario, password || '123');
      toast.success('Professor cadastrado com sucesso!');
      setModalNovo(false);
    } catch (err: any) {
      const msg = err?.message || 'Falha ao cadastrar professor.';
      setErroDuplicidade(msg);
      toast.error(msg);
    } finally {
      setSalvando(false);
    }
  };

  const handleSalvarEditar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!professorEditando) return;
    if (!name.trim()) {
      toast.warning('Informe o nome do professor.');
      return;
    }

    setSalvando(true);
    try {
      await updateProfessor(professorEditando.id, name, password);
      toast.success('Professor atualizado com sucesso!');
      setProfessorEditando(null);
    } catch (err: any) {
      toast.error(err?.message || 'Falha ao atualizar professor.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div>
      <div className="polocoin-main__header">
        <div>
          <h1 className="polocoin-main__title">Professores</h1>
          <p className="polocoin-main__subtitle">
            Cadastre professores e visualize as turmas vinculadas para atribuição de pontos
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setModalImportarAberto(true)}
            title="Importar professores por planilha Excel (.xlsx) ou CSV (.csv)"
          >
            <span>📥</span> Importar por Planilha
          </button>
          <button type="button" className="btn btn-primary" onClick={abrirModalNovo}>
            <span>➕</span> Novo Professor
          </button>
        </div>
      </div>

      <div className="tabela-wrapper">
        <table className="tabela">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Usuário de Acesso</th>
              <th>Turmas Vinculadas</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {professores.map(p => {
              const turmasDoProf = turmas.filter(t => p.turmasVinculadas.includes(t.id));
              return (
                <tr key={p.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '24px' }}>👨‍🏫</span>
                      <strong>{p.name}</strong>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>@{p.usuario}</span>
                  </td>
                  <td>
                    {turmasDoProf.length === 0 ? (
                      <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                        Nenhuma turma vinculada
                      </span>
                    ) : (
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {turmasDoProf.map(t => (
                          <span key={t.id} className="badge badge-info">
                            {t.serie}º{t.turma}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-secondary btn--sm"
                      onClick={() => abrirModalEditar(p)}
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

      {/* Modal Novo Professor */}
      <Modal
        isOpen={modalNovo}
        onClose={() => setModalNovo(false)}
        title="Cadastrar Professor"
        subtitle="Informe os dados de acesso do docente"
      >
        <form onSubmit={handleSalvarNovo}>
          <div className="form-group">
            <label className="form-label">Nome Completo</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ex: Carlos Eduardo de Oliveira"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Usuário de Login (opcional)</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ex: carloseduardo"
              value={usuario}
              onChange={e => setUsuario(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Senha Inicial</label>
            <input
              type="password"
              className="form-input"
              placeholder="Digite a senha (padrão: 123)"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          {erroDuplicidade && (
            <div className="alert alert-danger" style={{ marginBottom: '14px', fontSize: '13px' }}>
              <span>⚠️ {erroDuplicidade}</span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setModalNovo(false)}
              disabled={salvando}
            >
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={salvando}>
              {salvando ? 'Cadastrando...' : 'Cadastrar'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Editar Professor */}
      <Modal
        isOpen={!!professorEditando}
        onClose={() => setProfessorEditando(null)}
        title="Editar Professor"
        subtitle="Atualize o nome ou redefina a senha"
      >
        <form onSubmit={handleSalvarEditar}>
          <div className="form-group">
            <label className="form-label">Nome Completo</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Nova Senha (deixe em branco para manter)</label>
            <input
              type="password"
              className="form-input"
              placeholder="Digite a nova senha"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setProfessorEditando(null)}
            >
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              Salvar Alterações
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal de Importação em Massa por Planilha */}
      <ImportarPlanilhaModal
        isOpen={modalImportarAberto}
        onClose={() => setModalImportarAberto(false)}
        tipo="professores"
      />
    </div>
  );
};
