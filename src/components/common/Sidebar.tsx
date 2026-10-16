import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isOpenMobile = false,
  onCloseMobile,
}) => {
  const { currentUser, logout } = useAuth();
  const { compras, carrinho, desejos, avaliacoes, alunos } = useData();

  const role = currentUser?.tipo || 'aluno';

  // Badges calculation
  const pendingEntregasCount = compras.filter(c => !c.entregue).length;
  const cartCount = carrinho.reduce((acc, item) => acc + item.quantidade, 0);

  // Student specific wishes count
  const alunoDesejosCount = currentUser?.id
    ? desejos.filter(d => d.alunoId === currentUser.id).length
    : 0;

  // Responsavel specific pending negative occurrences
  const responsavelAlunosIds = alunos
    .filter(a => a.responsavelId === currentUser?.id)
    .map(a => a.id);
  const pendingConsentCount = avaliacoes.filter(
    av => responsavelAlunosIds.includes(av.alunoId) && av.tipo === 'negativa' && !av.consentido
  ).length;
  const wishesForResponsavelCount = desejos.filter(d =>
    responsavelAlunosIds.includes(d.alunoId)
  ).length;

  const renderNavButtons = () => {
    if (role === 'adm') {
      return (
        <>
          <button
            type="button"
            className={`polocoin-sidebar__btn ${activeTab === 'visao-geral' ? 'polocoin-sidebar__btn--active' : ''}`}
            onClick={() => { onSelectTab('visao-geral'); onCloseMobile?.(); }}
          >
            <span className="polocoin-sidebar__btn-icon">📊</span>
            <span className="polocoin-sidebar__btn-label">Painel Geral</span>
          </button>

          <button
            type="button"
            className={`polocoin-sidebar__btn ${activeTab === 'produtos' ? 'polocoin-sidebar__btn--active' : ''}`}
            onClick={() => { onSelectTab('produtos'); onCloseMobile?.(); }}
          >
            <span className="polocoin-sidebar__btn-icon">📦</span>
            <span className="polocoin-sidebar__btn-label">Produtos</span>
          </button>

          <button
            type="button"
            className={`polocoin-sidebar__btn ${activeTab === 'entregas' ? 'polocoin-sidebar__btn--active' : ''}`}
            onClick={() => { onSelectTab('entregas'); onCloseMobile?.(); }}
          >
            <span className="polocoin-sidebar__btn-icon">🚚</span>
            <span className="polocoin-sidebar__btn-label">Entregas Pendentes</span>
            {pendingEntregasCount > 0 && (
              <span className="polocoin-sidebar__btn-badge">{pendingEntregasCount}</span>
            )}
          </button>

          <button
            type="button"
            className={`polocoin-sidebar__btn ${activeTab === 'professores' ? 'polocoin-sidebar__btn--active' : ''}`}
            onClick={() => { onSelectTab('professores'); onCloseMobile?.(); }}
          >
            <span className="polocoin-sidebar__btn-icon">👨‍🏫</span>
            <span className="polocoin-sidebar__btn-label">Professores</span>
          </button>

          <button
            type="button"
            className={`polocoin-sidebar__btn ${activeTab === 'turmas' ? 'polocoin-sidebar__btn--active' : ''}`}
            onClick={() => { onSelectTab('turmas'); onCloseMobile?.(); }}
          >
            <span className="polocoin-sidebar__btn-icon">🏫</span>
            <span className="polocoin-sidebar__btn-label">Turmas & Alunos</span>
          </button>
        </>
      );
    }

    if (role === 'professor') {
      return (
        <>
          <button
            type="button"
            className={`polocoin-sidebar__btn ${activeTab === 'turmas' ? 'polocoin-sidebar__btn--active' : ''}`}
            onClick={() => { onSelectTab('turmas'); onCloseMobile?.(); }}
          >
            <span className="polocoin-sidebar__btn-icon">🏫</span>
            <span className="polocoin-sidebar__btn-label">Minhas Turmas</span>
          </button>

          <button
            type="button"
            className={`polocoin-sidebar__btn ${activeTab === 'perfil' ? 'polocoin-sidebar__btn--active' : ''}`}
            onClick={() => { onSelectTab('perfil'); onCloseMobile?.(); }}
          >
            <span className="polocoin-sidebar__btn-icon">👤</span>
            <span className="polocoin-sidebar__btn-label">Meu Perfil</span>
          </button>
        </>
      );
    }

    if (role === 'aluno') {
      return (
        <>
          <button
            type="button"
            className={`polocoin-sidebar__btn ${activeTab === 'loja' ? 'polocoin-sidebar__btn--active' : ''}`}
            onClick={() => { onSelectTab('loja'); onCloseMobile?.(); }}
          >
            <span className="polocoin-sidebar__btn-icon">🛍️</span>
            <span className="polocoin-sidebar__btn-label">Loja de Recompensas</span>
          </button>

          <button
            type="button"
            className={`polocoin-sidebar__btn ${activeTab === 'carrinho' ? 'polocoin-sidebar__btn--active' : ''}`}
            onClick={() => { onSelectTab('carrinho'); onCloseMobile?.(); }}
          >
            <span className="polocoin-sidebar__btn-icon">🛒</span>
            <span className="polocoin-sidebar__btn-label">Meu Carrinho</span>
            {cartCount > 0 && (
              <span className="polocoin-sidebar__btn-badge">{cartCount}</span>
            )}
          </button>

          <button
            type="button"
            className={`polocoin-sidebar__btn ${activeTab === 'desejos' ? 'polocoin-sidebar__btn--active' : ''}`}
            onClick={() => { onSelectTab('desejos'); onCloseMobile?.(); }}
          >
            <span className="polocoin-sidebar__btn-icon">✨</span>
            <span className="polocoin-sidebar__btn-label">Lista de Desejos</span>
            {alunoDesejosCount > 0 && (
              <span className="polocoin-sidebar__btn-badge">{alunoDesejosCount}</span>
            )}
          </button>

          <button
            type="button"
            className={`polocoin-sidebar__btn ${activeTab === 'ocorrencias' ? 'polocoin-sidebar__btn--active' : ''}`}
            onClick={() => { onSelectTab('ocorrencias'); onCloseMobile?.(); }}
          >
            <span className="polocoin-sidebar__btn-icon">📜</span>
            <span className="polocoin-sidebar__btn-label">Extrato e Avaliações</span>
          </button>

          <button
            type="button"
            className={`polocoin-sidebar__btn ${activeTab === 'perfil' ? 'polocoin-sidebar__btn--active' : ''}`}
            onClick={() => { onSelectTab('perfil'); onCloseMobile?.(); }}
          >
            <span className="polocoin-sidebar__btn-icon">🦊</span>
            <span className="polocoin-sidebar__btn-label">Avatar & Perfil</span>
          </button>
        </>
      );
    }

    if (role === 'responsavel') {
      return (
        <>
          <button
            type="button"
            className={`polocoin-sidebar__btn ${activeTab === 'filhos' ? 'polocoin-sidebar__btn--active' : ''}`}
            onClick={() => { onSelectTab('filhos'); onCloseMobile?.(); }}
          >
            <span className="polocoin-sidebar__btn-icon">👨‍👧</span>
            <span className="polocoin-sidebar__btn-label">Meus Filhos</span>
          </button>

          <button
            type="button"
            className={`polocoin-sidebar__btn ${activeTab === 'consentimento' || activeTab === 'ocorrencias' ? 'polocoin-sidebar__btn--active' : ''}`}
            onClick={() => { onSelectTab('consentimento'); onCloseMobile?.(); }}
          >
            <span className="polocoin-sidebar__btn-icon">📜</span>
            <span className="polocoin-sidebar__btn-label">Ocorrências dos Filhos</span>
            {pendingConsentCount > 0 && (
              <span className="polocoin-sidebar__btn-badge" style={{ background: 'var(--color-danger)' }}>
                {pendingConsentCount}
              </span>
            )}
          </button>

          <button
            type="button"
            className={`polocoin-sidebar__btn ${activeTab === 'desejos' ? 'polocoin-sidebar__btn--active' : ''}`}
            onClick={() => { onSelectTab('desejos'); onCloseMobile?.(); }}
          >
            <span className="polocoin-sidebar__btn-icon">🎁</span>
            <span className="polocoin-sidebar__btn-label">Pedidos dos Filhos</span>
            {wishesForResponsavelCount > 0 && (
              <span className="polocoin-sidebar__btn-badge">{wishesForResponsavelCount}</span>
            )}
          </button>
        </>
      );
    }

    return null;
  };

  return (
    <>
      {isOpenMobile && (
        <div
          className="polocoin-sidebar-overlay polocoin-sidebar-overlay--visible"
          onClick={onCloseMobile}
        />
      )}

      <aside className={`polocoin-sidebar ${isOpenMobile ? 'polocoin-sidebar--mobile polocoin-sidebar--open' : ''}`}>
        <div className="polocoin-sidebar__header">
          <div className="polocoin-sidebar__avatar">
            {currentUser?.avatar || '👤'}
          </div>
          <div className="polocoin-sidebar__user-name">{currentUser?.nome}</div>
          <div className="polocoin-sidebar__user-meta">
            {role === 'aluno' && currentUser?.turmaNome ? `Turma ${currentUser.turmaNome}` : ''}
            {role === 'professor' ? 'Docente Polo' : ''}
            {role === 'adm' ? 'Gestão Escolar' : ''}
            {role === 'responsavel' ? 'Responsável Legal' : ''}
          </div>
        </div>

        <nav className="polocoin-sidebar__nav">
          {renderNavButtons()}

          <div className="polocoin-sidebar__divider" />

          <button
            type="button"
            className="polocoin-sidebar__btn polocoin-sidebar__btn-danger"
            onClick={logout}
          >
            <span className="polocoin-sidebar__btn-icon">🚪</span>
            <span className="polocoin-sidebar__btn-label">Sair da Conta</span>
          </button>
        </nav>
      </aside>
    </>
  );
};
