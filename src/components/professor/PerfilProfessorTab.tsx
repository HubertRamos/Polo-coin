import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useToast } from '../common/Toast';

export const PerfilProfessorTab: React.FC = () => {
  const { currentUser } = useAuth();
  const { professores, updateProfessor } = useData();
  const toast = useToast();

  const currentProf = professores.find(p => p.id === currentUser?.id) || professores[0];

  const [nome, setNome] = useState(currentProf?.name || '');
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nome.trim()) {
      toast.warning('O nome não pode ficar vazio.');
      return;
    }

    if (novaSenha) {
      if (senhaAtual !== currentProf.password) {
        toast.error('A senha atual digitada está incorreta.');
        return;
      }
      if (novaSenha !== confirmarSenha) {
        toast.warning('A nova senha e a confirmação não coincidem.');
        return;
      }
    }

    await updateProfessor(currentProf.id, nome, novaSenha || currentProf.password);
    toast.success('Perfil atualizado com sucesso!');
    setSenhaAtual('');
    setNovaSenha('');
    setConfirmarSenha('');
  };

  return (
    <div style={{ maxWidth: '520px', margin: '0 auto' }}>
      <div className="polocoin-main__header" style={{ marginBottom: '18px' }}>
        <div>
          <h1 className="polocoin-main__title">Meu Perfil Docente</h1>
          <p className="polocoin-main__subtitle">
            Atualize seus dados pessoais e gerencie sua senha de acesso
          </p>
        </div>
      </div>

      <div className="card">
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: 'var(--gradient-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '36px',
              margin: '0 auto 10px',
              boxShadow: 'var(--shadow-primary)',
            }}
          >
            👨‍🏫
          </div>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>{currentProf?.name}</h3>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Usuário: @{currentProf?.usuario}
          </span>
        </div>

        <form onSubmit={handleSalvar}>
          <div className="form-group">
            <label className="form-label">Nome Completo</label>
            <input
              type="text"
              className="form-input"
              value={nome}
              onChange={e => setNome(e.target.value)}
              required
            />
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', margin: '18px 0', paddingTop: '16px' }}>
            <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 800 }}>Alterar Senha</h4>

            <div className="form-group">
              <label className="form-label">Senha Atual</label>
              <input
                type="password"
                className="form-input"
                placeholder="Digite a senha atual para alterar"
                value={senhaAtual}
                onChange={e => setSenhaAtual(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Nova Senha</label>
              <input
                type="password"
                className="form-input"
                placeholder="Digite a nova senha"
                value={novaSenha}
                onChange={e => setNovaSenha(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Confirmar Nova Senha</label>
              <input
                type="password"
                className="form-input"
                placeholder="Repita a nova senha"
                value={confirmarSenha}
                onChange={e => setConfirmarSenha(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
            Salvar Alterações
          </button>
        </form>
      </div>
    </div>
  );
};
