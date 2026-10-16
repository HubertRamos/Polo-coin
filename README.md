# PoloCoin — Sistema Escolar de Pontuação e Recompensas

Aplicação React moderna, responsiva e gamificada para gestão de pontuação escolar, avaliação pedagógica, consentimento de responsáveis e loja de recompensas com a moeda escolar **PoloCoin (🪙)** conectada ao **Supabase**.

---

## 🔌 Conexão com o Supabase

O projeto está pronto para conectar ao seu banco de dados Supabase:

### Opção 1: Variáveis de Ambiente (`.env`)
No arquivo `.env` (ou `.env.local`), configure:
```env
VITE_SUPABASE_URL=https://seuid.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key-aqui
```

### Opção 2: Pelo Painel da Aplicação
Na tela de login ou no cabeçalho do sistema, clique no botão **"Conectar Banco Supabase" / "🟢 Banco Conectado"** para inserir suas credenciais diretamente e testar a conexão em tempo real.

### Tabelas do Banco de Dados
O script completo de criação das tabelas PostgreSQL (`admins`, `turmas`, `professores`, `professor_turmas`, `responsaveis`, `alunos`, `categorias`, `produtos`, `avaliacoes`, `compras`, `desejos`) está disponível na aba **"Script SQL das Tabelas"** do modal de configuração.

---

## 🚀 Principais Funcionalidades

### 1. 🛡️ Painel do Administrador (Direção)
- **Produtos**: Cadastro, edição, busca e categorização de itens resgatáveis na loja escolar.
- **Entregas Pendentes**: Rastreamento de pedidos feitos pelos alunos com filtros por turma, categoria e produto; confirmação de entrega física e histórico de vendas.
- **Professores**: Cadastro e gerenciamento de docentes e suas turmas vinculadas.
- **Turmas & Alunos**: Gestão de classes por série, matrículas de estudantes vinculados aos seus responsáveis e controle de permissões.
- **Retenção de Dados & Supabase**: Métricas de banco, gerenciamento de conexão e rotina de otimização/limpeza.

### 2. 👨‍🏫 Painel do Professor (Docentes)
- **Minhas Turmas**: Visualização e gerenciamento de turmas vinculadas ao professor.
- **Painel de Avaliação de Alunos**: Atribuição de pontos positivos (reforço positivo) ou registro de ocorrências negativas com opções pedagógicas pré-definidas (Comportamento, Comprometimento, Social, Entrega de Materiais), pontos customizáveis e observações.
- **Relatórios Pedagógicos**: Emissão de extrato consolidado por aluno ou turma com filtros por data, tipo e suporte à impressão.
- **Meu Perfil**: Atualização de dados pessoais e alteração de senha.

### 3. 🦊 Painel do Aluno (Estudantes)
- **Saldo Gamificado**: Exibição destacada de saldo em PoloCoins com efeitos visuais.
- **Loja de Recompensas**: Vitrine de produtos com busca, filtros por categoria, resgate imediato e adição ao carrinho.
- **Carrinho de Compras**: Ajuste de quantidades, verificação de saldo e validação de permissões.
- **Lista de Desejos**: Solicitação de itens para que pais ou responsáveis aprovem e comprem.
- **Extrato & Ocorrências**: Linha do tempo com histórico de pontos conquistados, compras e ocorrências.
- **Personalização de Avatar**: Escolha entre centenas de avatares divididos em 7 categorias (Rostos, Animais, Jogos, Esportes, Tecnologia, Criatividade, Diversão) e alteração de senha.

### 4. 👨‍👧 Painel do Responsável (Pais / Tutores)
- **Meus Filhos**: Acompanhamento dos saldos de cada filho e controle de permissão de compras na loja escolar (`pode_comprar`).
- **Consentimento de Ocorrências**: Ciência e consentimento de ocorrências registradas pela escola (desbloqueando compras caso haja pendências).
- **Pedidos dos Filhos**: Visualização de solicitações da lista de desejos com autorização e compra direta usando o saldo do aluno.

---

## 🛠️ Tecnologias Utilizadas

- **Framework**: React 19 + TypeScript
- **Backend & Banco de Dados**: Supabase (PostgreSQL + Auth + Real-time)
- **Bundler & Dev Server**: Vite
- **Estilos**: PoloCoin Design System (Nunito font, design tokens, botões, modais, toasts e animações)
- **Ícones**: Emojis padronizados e Lucide React
