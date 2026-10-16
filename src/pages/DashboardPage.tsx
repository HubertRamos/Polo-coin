import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Header } from '../components/common/Header';
import { Sidebar } from '../components/common/Sidebar';

// Admin Tabs
import { VisaoGeralTab } from '../components/adm/VisaoGeralTab';
import { ProdutosTab } from '../components/adm/ProdutosTab';
import { EntregasTab } from '../components/adm/EntregasTab';
import { ProfessoresTab } from '../components/adm/ProfessoresTab';
import { TurmasTab } from '../components/adm/TurmasTab';

// Professor Tabs
import { TurmasProfessorTab } from '../components/professor/TurmasProfessorTab';
import { PerfilProfessorTab } from '../components/professor/PerfilProfessorTab';

// Aluno Tabs
import { LojaTab } from '../components/aluno/LojaTab';
import { CarrinhoModal } from '../components/aluno/CarrinhoModal';
import { DesejosTab } from '../components/aluno/DesejosTab';
import { OcorrenciasTab } from '../components/aluno/OcorrenciasTab';
import { PerfilAlunoTab } from '../components/aluno/PerfilAlunoTab';

// Responsável Tabs
import { FilhosTab } from '../components/responsavel/FilhosTab';
import { ConsentimentoTab } from '../components/responsavel/ConsentimentoTab';
import { DesejosFilhosTab } from '../components/responsavel/DesejosFilhosTab';

export const DashboardPage: React.FC = () => {
  const { currentUser } = useAuth();
  const role = currentUser?.tipo || 'aluno';

  const getDefaultTab = (currentRole: string) => {
    switch (currentRole) {
      case 'adm':
        return 'visao-geral';
      case 'professor':
        return 'turmas';
      case 'aluno':
        return 'loja';
      case 'responsavel':
        return 'filhos';
      default:
        return 'loja';
    }
  };

  const [activeTab, setActiveTab] = useState<string>(() => getDefaultTab(role));
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Sync default tab when role switches
  useEffect(() => {
    setActiveTab(getDefaultTab(role));
  }, [role]);

  const renderContent = () => {
    if (role === 'adm') {
      switch (activeTab) {
        case 'visao-geral':
          return <VisaoGeralTab onNavigateTab={setActiveTab} />;
        case 'produtos':
          return <ProdutosTab />;
        case 'entregas':
          return <EntregasTab />;
        case 'professores':
          return <ProfessoresTab />;
        case 'turmas':
          return <TurmasTab />;
        default:
          return <VisaoGeralTab onNavigateTab={setActiveTab} />;
      }
    }

    if (role === 'professor') {
      switch (activeTab) {
        case 'turmas':
          return <TurmasProfessorTab />;
        case 'perfil':
          return <PerfilProfessorTab />;
        default:
          return <TurmasProfessorTab />;
      }
    }

    if (role === 'aluno') {
      switch (activeTab) {
        case 'loja':
          return <LojaTab />;
        case 'carrinho':
          return (
            <div>
              <LojaTab />
              <CarrinhoModal isOpen={true} onClose={() => setActiveTab('loja')} />
            </div>
          );
        case 'desejos':
          return <DesejosTab />;
        case 'ocorrencias':
          return <OcorrenciasTab />;
        case 'perfil':
          return <PerfilAlunoTab />;
        default:
          return <LojaTab />;
      }
    }

    if (role === 'responsavel') {
      switch (activeTab) {
        case 'filhos':
          return <FilhosTab />;
        case 'consentimento':
          return <ConsentimentoTab />;
        case 'desejos':
          return <DesejosFilhosTab />;
        default:
          return <FilhosTab />;
      }
    }

    return null;
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header onToggleSidebar={() => setIsMobileSidebarOpen(prev => !prev)} />

      <div className="polocoin-layout">
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        <main className="polocoin-main">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};
