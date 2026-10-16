import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { CATEGORIAS_AVATARES } from '../../data/avatarOptions';
import { useToast } from '../common/Toast';

export const PerfilAlunoTab: React.FC = () => {
  const { currentUser, updateCurrentUserAvatar } = useAuth();
  const { alunos, turmas, updateAlunoAvatar, updateAlunoSenha } = useData();
  const toast = useToast();

  const aluno = alunos.find(a => a.id === currentUser?.id) || alunos[0];
  const turma = turmas.find(t => t.id === aluno?.turmaId);

  const [categoriaAtiva, setCategoriaAtiva] = useState(CATEGORIAS_AVATARES[0].id);
  const [avatarEscolhido, setAvatarEscolhido] = useState(aluno?.avatar || '🦊');

  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  const catAtual = CATEGORIAS_AVATARES.find(c => c.id === categoriaAtiva) || CATEGORIAS_AVATARES[0];

  const handleSalvarAvatar = async () => {
    if (!aluno) return;
    await updateAlunoAvatar(aluno.id, avatarEscolhido);
    updateCurrentUserAvatar(avatarEscolhido);
    toast.success('Avatar atualizado com sucesso!');
  };

  const handleAlterarSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aluno) return;

    if (!novaSenha) {
      toast.warning('Digite a nova senha.');
      return;
    }
    if (aluno.senha && senhaAtual !== aluno.senha) {
      toast.error('A senha atual está incorreta.');
      return;
    }
    if (novaSenha !== confirmarSenha) {
      toast.warning('As senhas digitadas não coincidem.');
      return;
    }

    await updateAlunoSenha(aluno.id, novaSenha);
    toast.success('Senha atualizada com sucesso!');
    setSenhaAtual('');
    setNovaSenha('');
    setConfirmarSenha('');
  };

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      <div className="polocoin-main__header" style={{ marginBottom: '18px' }}>
        <div>
          <h1 className="polocoin-main__title">Meu Avatar & Perfil</h1>
          <p className="polocoin-main__subtitle">
            Personalize seu emoji de identificação e atualize sua senha
          </p>
        </div>
      </div>

      {/* Cartão de Destaque do Aluno */}
      <div className="card" style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div
          style={{
            width: '84px',
            height: '84px',
            borderRadius: '50%',
            background: 'var(--gradient-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '44px',
            margin: '0 auto 12px',
            boxShadow: 'var(--shadow-primary)',
            transition: 'transform 0.2s ease',
          }}
        >
          {avatarEscolhido}
        </div>
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 900 }}>{aluno?.nome}</h2>
        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          {turma ? `Turma ${turma.serie}º Ano ${turma.turma}` : 'Estudante Polo'} • 🪙 {aluno?.pontos || 0} PoloCoins
        </span>
      </div>

      {/* Seletor de Avatar em Categorias */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>Escolha seu Avatar</h3>
          {avatarEscolhido !== aluno?.avatar && (
            <button
              type="button"
              className="btn btn-primary btn--sm"
              onClick={handleSalvarAvatar}
            >
              Salvar Avatar Escolhido
            </button>
          )}
        </div>

        {/* Categoria Tabs */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '12px' }}>
          {CATEGORIAS_AVATARES.map(cat => {
            const isSel = cat.id === categoriaAtiva;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoriaAtiva(cat.id)}
                className={`btn btn--sm ${isSel ? 'btn-primary' : 'btn-secondary'}`}
                style={{ whiteSpace: 'nowrap', padding: '6px 12px', fontSize: '12px' }}
              >
                <span>{cat.icone}</span> {cat.nome}
              </button>
            );
          })}
        </div>

        {/* Grid de Emojis */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(44px, 1fr))',
            gap: '8px',
            background: 'var(--bg-subtle)',
            padding: '14px',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            maxHeight: '200px',
            overflowY: 'auto',
          }}
        >
          {catAtual.avatares.map(emoji => {
            const isCurrent = emoji === avatarEscolhido;
            return (
              <button
                key={emoji}
                type="button"
                onClick={() => setAvatarEscolhido(emoji)}
                style={{
                  background: isCurrent ? 'var(--gradient-primary)' : 'var(--bg-card)',
                  color: isCurrent ? '#fff' : 'inherit',
                  border: isCurrent ? '2px solid var(--color-primary)' : '1px solid var(--border-color)',
                  borderRadius: '10px',
                  height: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '22px',
                  cursor: 'pointer',
                  transform: isCurrent ? 'scale(1.1)' : 'none',
                  boxShadow: isCurrent ? 'var(--shadow-primary)' : 'var(--shadow-xs)',
                  transition: 'all 0.15s ease',
                }}
              >
                {emoji}
              </button>
            );
          })}
        </div>

        <div style={{ textAlign: 'center', marginTop: '12px' }}>
          <button
            type="button"
            className="btn btn-success"
            style={{ width: '100%' }}
            onClick={handleSalvarAvatar}
          >
            Confirmar e Salvar Avatar ({avatarEscolhido})
          </button>
        </div>
      </div>

      {/* Alterar Senha */}
      <div className="card">
        <h3 style={{ margin: '0 0 14px', fontSize: '16px', fontWeight: 800 }}>Alterar Senha do Aluno</h3>
        <form onSubmit={handleAlterarSenha}>
          <div className="form-group">
            <label className="form-label">Senha Atual</label>
            <input
              type="password"
              className="form-input"
              placeholder="Digite a senha atual"
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
              required
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
              required
            />
          </div>

          <button type="submit" className="btn btn-secondary" style={{ width: '100%', padding: '10px' }}>
            Atualizar Senha
          </button>
        </form>
      </div>
    </div>
  );
};
