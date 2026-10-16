import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserTipo } from '../types';
import { useToast } from '../components/common/Toast';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const toast = useToast();

  const [tipo, setTipo] = useState<UserTipo>('aluno');
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuario.trim() || !senha.trim()) {
      toast.warning('Preencha a identificação e a senha para entrar.');
      return;
    }

    setLoading(true);
    try {
      const res = await login(usuario, senha, tipo);
      if (!res.success) {
        toast.error(res.error || 'Credenciais inválidas.');
      } else {
        toast.success('Bem-vindo(a) ao PoloCoin!');
      }
    } catch (err: any) {
      toast.error('Não foi possível conectar. Tente novamente em alguns instantes.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-card__logo" aria-hidden="true">
          🪙
        </div>
        <h1 className="login-card__title">PoloCoin</h1>
        <p className="login-card__subtitle">Sistema escolar de pontuação e recompensas</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Perfil de Acesso</label>
            <select
              className="form-select"
              value={tipo}
              onChange={e => setTipo(e.target.value as UserTipo)}
            >
              <option value="aluno">Aluno (Estudante)</option>
              <option value="responsavel">Responsável Legal (Pais)</option>
              <option value="professor">Professor (Docente)</option>
              <option value="adm">Administrador (Direção Escolar)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">
              {tipo === 'adm'
                ? 'Identificação do Administrador'
                : tipo === 'professor'
                ? 'Usuário ou Nome do Docente'
                : tipo === 'aluno'
                ? 'Nome Completo do Aluno'
                : 'Usuário ou Nome do Responsável'}
            </label>
            <input
              type="text"
              className="form-input"
              placeholder={
                tipo === 'adm'
                  ? 'Digite o usuário da administração'
                  : tipo === 'professor'
                  ? 'Digite seu usuário de professor'
                  : tipo === 'aluno'
                  ? 'Digite seu nome de estudante'
                  : 'Digite seu usuário cadastrado'
              }
              value={usuario}
              onChange={e => setUsuario(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Senha</label>
            <input
              type="password"
              className="form-input"
              placeholder="Digite sua senha"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '8px' }}
            disabled={loading}
          >
            {loading ? 'Acessando...' : 'Entrar no Sistema'}
          </button>
        </form>

        <p className="login-card__footer">Ambiente escolar seguro PoloCoin ✨</p>
      </div>
    </div>
  );
};
