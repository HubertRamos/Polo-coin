# STATUS.md - PoloCoin

## Visão Geral

PoloCoin é um sistema escolar baseado em Node.js (Express) + MySQL para gerenciar professores, alunos, responsáveis, turmas, avaliações de comportamento/entrega e um sistema de compras com pontos (PoloCoins).

- **Backend**: `server.js` (Express na porta 3333)
- **Frontend**: `app/` (HTML + JS vanilla, módulos ES)
- **Banco**: MySQL/MariaDB (`sistema_poloCoin`)

---

## Estrutura do Projeto

```
PoloCoin/
├── server.js                    # API REST principal
├── package.json                # Dependências (express, cors, mysql2)
├── mysql.db                    # Dump SQL (referência)
├── restaurar_db.sql            # Script de restauração do banco
├── const/
│   └── categoriasAvaliacao.json  # Categorias de avaliação externalizadas
├── services/                   # Lógica de negócio
│   ├── professoresServices.js    # CRUD professores
│   ├── turmasServices.js         # CRUD turmas
│   ├── alunosServices.js         # Cadastro de aluno + responsável
│   ├── authServices.js           # Login unificado
│   ├── avaliacoesServices.js     # CRUD avaliações (com creditarPontos)
│   ├── professorServices.js      # Senha do professor
│   ├── responsavelServices.js    # Alunos do responsável
│   ├── responsavelOcorrenciasServices.js  # Ocorrências negativas + consentimento
│   ├── responsavelDesejosServices.js      # Saldos dos filhos + desejos
│   ├── professorTurmaServices.js # Vínculo professor-turma
│   ├── pontosServices.js         # Saldo, deduzir e creditar pontos
│   ├── produtosServices.js       # CRUD produtos (custo_pontos)
│   ├── desejosServices.js        # Desejos + processar como compra
│   └── comprasServices.js        # Histórico de compras + marcar entrega
├── app/
│   ├── index.html / app.js      # Login
│   ├── aluno/                   # Área do aluno (loja com controle parental)
│   ├── responsavel/             # Área do responsável (painel filhos + desejos)
│   ├── professor/               # Área do professor
│   │   ├── Turmas/              # Lista de turmas
│   │   ├── Perfil/              # Alterar senha + gerenciar turmas
│   │   └── Turmas/alunos.js     # Avaliação de alunos
│   └── adm/                     # Área do admin (produtos + compras)
└── components/                  # Componentes reutilizáveis
    ├── Header/index.js
    ├── Form/index.js
    ├── Input/index.js
    ├── MenuLateral/index.js
    ├── TelaLoja/index.js
    ├── TelaCarrinho/index.js
    ├── TelaOcorrencias/index.js
    ├── TelaSenha/index.js
    ├── TelaResponsavel/index.js
    ├── CardProduto/index.js
    ├── CardOcorrencia/index.js
    ├── OcorrenciaConsentimento/index.js
    ├── DashBoard/index.js
    ├── ButtomReturn/index.js
    └── UploadFile/index.js
```

---

## Banco de Dados

### Tabelas

| Tabela | Descrição |
|--------|-----------|
| `professores` | Professores (id, name, password) |
| `admins` | Administradores (id, name, password) |
| `turmas` | Turmas (id, serie, turma) |
| `responsaveis` | Responsáveis (id, nome, password) |
| `alunos` | Alunos (id, turma_id, responsavel_id, nome, password, pontos, pode_comprar) |
| `avaliacoes` | Avaliações (id, aluno_id, professor_id, categoria, valor, pontos, observacao, consentido) |
| `categorias` | Categorias de avaliação (id, nome) |
| `produtos` | Produtos (id, nome, custo_pontos, categoria_id) |
| `desejos` | Desejos dos alunos (id, aluno_id, produto_id, criado_em) |
| `professor_turmas` | Vínculo professor-turma (professor_id, turma_id) |
| `compras` | Histórico de compras (id, aluno_id, produto_id, custo_pontos, autorizado_por, criado_em, entregue) |

### Script de restauração

`restaurar_db.sql` — cria o banco e todas as tabelas.

### Dados iniciais

- **Professor**: Robson / 12345
- **Admin**: adm / [REDACTED]
- **Responsável**: Hebert Ramos / 12345
- **Alunos**: Hubert Prado Ramos, Victor Hubo (ambos na turma 3ºA, responsável Hebert Ramos)

---

## Alterações Realizadas

### 2026-09-22

#### 1. Nome do responsável como campo obrigatório no cadastro de aluno

**Problema**: O sistema gerava o nome do responsável automaticamente como "Responsável de {nomeAluno}".

**Solução**: Campo "Nome do Responsável" adicionado no formulário de cadastro.

**Arquivos alterados**:
- `app/adm/Alunos/app.js` — novo campo `nome-responsavel-input`
- `services/alunosServices.js` — novo parâmetro `nomeResponsavel` (evita duplicação por nome)
- `server.js` — route `POST /turmas/:turmaId/alunos` repassa `nomeResponsavel`

#### 2. Restauração do banco de dados

**Problema**: Formatação do PC causou perda do MySQL.

**Solução**:
1. Criado `restaurar_db.sql` a partir de `mysql.db`
2. Recriado as tabelas do sistema (`mysql_install_db`)
3. Restaurado o banco `sistema_poloCoin`

**Arquivos criados**: `restaurar_db.sql`

#### 3. Administrador

**Problema**: Tabela `admins` vazia — sem acesso ao painel admin.

**Solução**: Criado admin `adm` / [REDACTED].

#### 4. Evitar duplicação de responsável

**Problema**: Responsáveis iguais podiam ser criados duas vezes (ex: irmãos na escola).

**Solução**: O service `criarAlunoComResponsavel` agora verifica se o responsável já existe pelo nome e reutiliza o ID existente.

**Arquivo alterado**: `services/alunosServices.js`

**Banco corrigido**: Responsável duplicado (id=2) removido, alunos reassociados ao id=1.

#### 5. Painel do responsável com listagem de alunos

**Problema**: Painel do responsável era apenas um placeholder.

**Solução**:
- Service `puxarAlunosDoResponsavel(responsavelId)` — busca alunos pelo responsavel_id
- Rota `GET /responsavel/alunos?id=<responsavelId>`
- Frontend `app/responsavel/app.js` — lista alunos, turma e senha

**Arquivos criados/alterados**:
- `services/responsavelServices.js` (novo)
- `server.js` (rota adicionada)
- `app/responsavel/app.js` (totalmente reescrito)

#### 6. Painel do professor — gerenciar turmas vinculadas

**Problema**: Professor não podia vincular/desvincular turmas.

**Solução**:
- Tabela `professor_turmas` criada (professor_id, turma_id)
- Service `professorTurmaServices.js` com operações de vincular/desvincular
- Rotas: `GET /professor/turmas`, `POST /professor/turmas/vincular`, `POST /professor/turmas/desvincular`
- Painel `app/professor/Perfil/app.js` — mostra turmas vinculadas + disponíveis para vincular

**Arquivos criados/alterados**:
- Tabela `professor_turmas` (SQL)
- `services/professorTurmaServices.js` (novo)
- `server.js` (rotas adicionadas)
- `app/professor/Perfil/app.js` (totalmente reescrito)
- `app/professor/Turmas/app.js` (corrigido para usar o endpoint de turmas vinculadas)

#### 7. Categorias de avaliação externalizadas

**Problema**: As categorias de avaliação estavam hardcoded no `alunos.js`.

**Solução**: Arquivo JSON externo `const/categoriasAvaliacao.json` carregado via fetch.

**Arquivos criados/alterados**:
- `const/categoriasAvaliacao.json` (novo)
- `app/professor/Turmas/alunos.js` (carrega do JSON em vez de hardcoded)

#### 8. Ocorrências negativas visíveis apenas ao professor autor

**Problema**: Qualquer professor podia ver avaliações de outros professores.

**Solução**:
- Service `puxarAvaliacoesPorAluno(alunoId, professorId)` — filtra por professorId quando fornecido
- Rota `GET /avaliacoes/:alunoId?professorId=<id>`
- Frontend passa `professorId` ao buscar avaliações

**Arquivos alterados**:
- `services/avaliacoesServices.js` (parâmetro adicional)
- `server.js` (rota atualizada para aceitar `?professorId=`)
- `app/professor/Turmas/alunos.js` (passa `?professorId=`)

#### 9. Pop-up de consentimento para ocorrências negativas no painel do responsável

**Problema**: Responsável precisa consentir explicitamente para ver ocorrências negativas dos filhos.

**Solução**:
- Service `puxarOcorrenciasNegativasDoResponsavel(responsavelId)` — busca ocorrências com pontos ≤ 10 ou valores negativos
- Rota `GET /responsavel/ocorrencias?id=<responsavelId>`
- Pop-up no `app/responsavel/app.js` quando há ocorrências negativas:
  - Explica o que são ocorrências negativas
  - Checkbox de consentimento obrigatório
  - Botão "Entrar" somente habilitado após consentimento

**Arquivos criados/alterados**:
- `services/responsavelOcorrenciasServices.js` (novo)
- `server.js` (rota adicionada)
- `app/responsavel/app.js` (pop-up de consentimento)

---

### 2026-09-23

#### 10. Sistema de Pontos (PoloCoins)

**Problema**: Produtos estavam com preço em Reais, mas o app é baseado em pontos.

**Solução**:
- Tabela `alunos` ganhou coluna `pontos INT DEFAULT 0`
- Coluna `produtos.preco` renomeada para `custo_pontos INT`
- Service `pontosServices.js` com `getSaldoPontos`, `deduzirPontos`, `creditarPontos`
- Service `avaliacoesServices.js` credita pontos automaticamente em avaliações positivas
- Frontend `TelaLoja` exibe saldo e custo em pontos
- Rota `/aluno/saldo` para consultar saldo

**Arquivos criados/alterados**:
- `services/pontosServices.js` (novo)
- `services/avaliacoesServices.js` (creditarPontos)
- `services/produtosServices.js` (custo_pontos no INSERT)
- `server.js` (rotas de saldo e compra com deduzirPontos)
- `components/TelaLoja/index.js` (exibe pontos)

#### 11. Controle Parental — Aluno só compra com liberação do responsável

**Problema**: Aluno podia comprar produtos livremente.

**Solução**:
- Tabela `alunos` ganhou coluna `pode_comprar TINYINT(1) DEFAULT 0`
- Tabela `desejos` criada para pedidos não liberados
- Service `responsavelDesejosServices.js` com `getFilhosComSaldos`, `getDesejosDosFilhos`
- Service `desejosServices.js` com `adicionarDesejo`, `processarDesejoComoCompra`, `puxarDesejosDoAluno`
- Rotas:
  - `POST /aluno/desejos` — adiciona produto à lista de desejos
  - `GET /aluno/desejos` — lista desejos do aluno
  - `GET /responsavel/filhos` — filhos com saldos
  - `GET /responsavel/desejos` — desejos dos filhos
  - `POST /responsavel/comprar-desejo` — pai autoriza compra do desejo
  - `GET /aluno/pode-comprar` — verifica se aluno pode comprar
  - `PATCH /aluno/pode-comprar` — pai libera/desvincular compra
- Frontend `TelaLoja` verifica `pode_comprar` e mostra botão "Comprar" ou "➕ Adiar aos Desejos"
- Frontend `TelaResponsavel` mostra filhos, saldos e desejos com botão de autorizar compra
- Verificação de ocorrências não consentidas bloqueia compra/desejo

**Arquivos criados/alterados**:
- `services/responsavelDesejosServices.js` (novo)
- `services/desejosServices.js` (novo)
- `services/responsavelOcorrenciasServices.js` (marcarComoConsentida)
- `server.js` (todas as rotas de controle parental)
- `components/TelaLoja/index.js` (reescrito com controle parental)
- `components/TelaResponsavel/index.js` (novo)
- `app/responsavel/app.js` (chama TelaResponsavel)
- `components/OcorrenciaConsentimento/index.js` (finalizar chama rota de consentimento)

#### 12. Consentimento persistente de ocorrências

**Problema**: Após o pai consentir ocorrências, elas reapareciam toda vez que abria a tela.

**Solução**:
- Tabela `avaliacoes` ganhou coluna `consentido TINYINT(1) DEFAULT 0`
- Service `responsavelOcorrenciasServices.js` filtra `consentido = 0` e possui `marcarComoConsentida`
- Rota `POST /responsavel/consentir-avaliacoes` marca múltiplas avaliações como consentidas
- Frontend `OcorrenciaConsentimento` chama rota ao finalizar
- Rotas de compra e desejos verificam ocorrências não consentidas

**Arquivos alterados**:
- `services/responsavelOcorrenciasServices.js` (filtro + marcarComoConsentida)
- `server.js` (rota de consentimento + verificações nas rotas de compra/desejo)
- `components/OcorrenciaConsentimento/index.js` (chama rota ao finalizar)

---

#### 13. Histórico de Compras e Confirmação de Entrega (Painel do Adm)

**Problema**: Produtos comprados pelos alunos não apareciam no painel do admin.

**Solução**:
- Tabela `compras` criada: `id, aluno_id, produto_id, custo_pontos, autorizado_por, criado_em, entregue`
- Service `comprasServices.js` com `puxarTodasCompras` (JOINs com aluno, produto, responsável) e `marcarEntrega`
- Rotas:
  - `GET /admin/compras` — lista todas as compras
  - `PATCH /admin/compras/:id/entregar` — marca compra como entregue
- Rotas de compra registram na tabela:
  - `/aluno/comprar` — insere com `autorizado_por = null`
  - `/responsavel/comprar-desejo` — insere com `autorizado_por = responsavel_id`
- Frontend `app/adm/Produtos/app.js` exibe:
  - Seção "Compras Realizadas" no painel principal de produtos (abaixo dos cards)
  - Separação entre "Autorizadas pelo Responsável" (verde) e "Compras Diretas" (amarelo)
  - Botão "✓ Confirmar" para cada compra não entregue
  - Após confirmação: mostra "Entregue" (cinza)
  - Página dedicada de compras com estatísticas (total, autorizadas, diretas)

**Arquivos criados/alterados**:
- Tabela `compras` (SQL)
- `services/comprasServices.js` (novo)
- `server.js` (rotas `/admin/compras` e `/admin/compras/:id/entregar`)
- `app/adm/Produtos/app.js` (reescrito com seção de compras + botão de entrega)

---

## Funcionalidades Implementadas

### Autenticação
- Login unificado para professores, alunos, responsáveis e admins
- Redirecionamento por tipo de usuário

### Professores
- Cadastro de professor
- Alterar senha (com verificação de senha atual)
- Vincular/desvincular turmas
- Avaliar alunos (categorias externalizadas, credita pontos em avaliações positivas)
- Ver apenas as próprias avaliações

### Responsáveis
- Ver lista de filhos com turma, saldo e senha
- Ver desejos dos filhos
- Autorizar compra de desejos (registra na tabela compras)
- Consentimento explícito antes de ver ocorrências negativas
- Consentimento persistente (não reaparece após conceder)
- Ocorrências negativas filtradas por pontos ≤ 10 ou valores negativos

### Alunos
- Cadastro com nome do responsável como campo obrigatório
- Responsável não é duplicado (reutiliza ID existente)
- Login com nome/senha
- Ver saldo de PoloCoins
- Filtros na loja (busca por texto, filtro por categoria)
- Carrinho de compras (adicionar múltiplos itens, salvo em sessionStorage, badge no menu)
- Comprar produtos (se liberado pelo pai e sem ocorrências pendentes)
- Comprar carrinho (processamento em lote, mantém itens com saldo suficiente)
- Adicionar produtos à lista de desejos (se não liberado ou com ocorrências pendentes)
- Bloqueado de comprar se tiver ocorrências não consentidas

### Admin
- Login como `adm` / [REDACTED]
- Acesso ao painel admin (turmas, professores, alunos, produtos)
- Ver histórico de compras dos alunos
- Separar compras autorizadas pelo pai das compras diretas
- Confirmar entrega de produtos comprados
- Service `comprasServices.js` adaptado com JOIN em `turmas` para suportar filtros de entrega (turma, categoria, produto)

### Sistema de Pontos (PoloCoins)
- Saldo de pontos por aluno
- Dedução de pontos na compra
- Crédito automático em avaliações positivas
- Produtos com custo em pontos (não em Reais)

## Próximos Passos (pendentes)

- [ ] Fluxo completo da área do aluno (perfil, ocorrências, senha)
- [ ] Testes de integração
- [ ] Validar se todas as rotas estão documentadas
- [ ] Entregas Pendentes — página `app/adm/Entregas/` com filtros (produto, categoria, turma). Service `comprasServices.js` já retorna `turma_id`/`turma_nome` (item 16); a página em si ainda não foi criada. (2026-09-25)

## Notas Técnicas

- Express 5.x com `type: "module"` (ESM)
- MySQL2 com `promise` API
- Frontend: HTML puro + JS modules, sem framework
- Conexão com banco: `root` / [REDACTED]
- Porta do servidor: 3333
- O app se chama "PoloCoin" — moeda interna é pontos, não Reais
