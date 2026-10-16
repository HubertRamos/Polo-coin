import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserTipo } from '../../types';

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { currentUser, logout } = useAuth();

  const roleLabels: Record<UserTipo, { title: string; color: string }> = {
    adm: { title: 'Administrador', color: '#dc2626' },
    professor: { title: 'Professor', color: '#6366f1' },
    aluno: { title: 'Aluno', color: '#f59e0b' },
    responsavel: { title: 'Responsável', color: '#10b981' },
  };

  const currentRole = currentUser?.tipo || 'aluno';

  return (
    <header className="polocoin-header">
      <div className="polocoin-header__inner">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {onToggleSidebar && (
            <button
              type="button"
              className="btn btn-secondary btn--sm"
              style={{ padding: '6px 10px', display: 'flex', alignItems: 'center' }}
              onClick={onToggleSidebar}
              aria-label="Abrir menu"
            >
              ☰
            </button>
          )}

          <div className="polocoin-header__brand">
            <div className="polocoin-header__brand-icon">🪙</div>
            <span>PoloCoin</span>
          </div>

          <span
            style={{
              fontSize: '11px',
              fontWeight: 800,
              padding: '3px 8px',
              borderRadius: '999px',
              background: '#eef2ff',
              color: roleLabels[currentRole].color,
              border: `1px solid ${roleLabels[currentRole].color}33`,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            {roleLabels[currentRole].title}
          </span>
        </div>

        {/* Informações do Usuário e Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>{currentUser?.avatar || '👤'}</span>
            <span style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--text-primary)' }}>
              {currentUser?.nome}
            </span>
          </div>

          <div style={{ borderLeft: '1px solid var(--border-color)', height: '22px' }} />

          <button
            type="button"
            className="btn btn-ghost btn--sm"
            onClick={logout}
            title="Sair do sistema"
            style={{ color: 'var(--color-danger)', fontSize: '13px', fontWeight: 700 }}
          >
            Sair
          </button>
        </div>
      </div>
    </header>
  );
};
