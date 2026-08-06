# Novas Features — Avaliação e Status de Implementação

Neste documento é realizada a avaliação ponto a ponto das **Novas Features** solicitadas para o **TaskFlow**, detalhando a conclusão de 100% de todas as funcionalidades.

---

## 📋 Avaliação Ponto a Ponto das Novas Features

### 1. Múltiplos Usuários
- [x] **0. Atributos do Usuário**: `usuario`, `senha` (hash bcrypt), `nome completo`, `e-mail` (opcional).
- [x] **1. Plano de Tarefas Individual**: Cada usuário visualiza e gerencia seu próprio plano de atividades.
- [x] **2. Autenticação e Autorização**: Sistema de login via JWT (`/api/auth/login`) com rotas protegidas no backend.
- [x] **3. Perfil do Usuário**: Endpoint `/api/auth/me` e `/api/auth/profile` para identificação e consulta.
- [x] **4. Tarefas Próprias**: Tarefas isoladas no banco de dados vinculadas ao `owner_id`.
- [x] **5. Configurações por Usuário**: Preferências individualizadas de auto-arquivamento por usuário salvas na tabela `user_settings`.
- [x] **6. Estatísticas por Usuário**: Dashboard analítico em `/api/stats` e tela `StatsScreen` com métricas visuais.
- [x] **7. Notificações do Usuário**: Central de Notificações com ícone de sino e popover no cabeçalho.

#### Regras da Tela de Login & Admin
- [x] **Substituição da Senha Única por Login**: Tela de login por Usuário + Senha ([LoginScreen.tsx](file:///Users/delano/dev/TaskFlow/frontend/src/components/layout/LoginScreen.tsx)).
- [x] **Usuário Administrador Padrão**: Criado no setup inicial (`admin`).
- [x] **1. Menu de Gestão de Usuários (Admin)**: Usuário admin possui suas próprias tarefas e o menu exclusivo **Gestão de Usuários** para CRUD de usuários.
- [x] **2. Edição de Perfil nas Configurações**: Aba **Meu Perfil** no modal de Configurações para alterar senha, nome completo e e-mail.
- [x] **3. Rodapé da Sidebar**: Exibe nome do usuário logado, username e botão de **Sair (Logout)**.
- [x] **4. Variável de Ambiente para Senha do Admin**: Variável `DEFAULT_ADMIN_PASSWORD` no setup inicial.

---

### 2. Compartilhamento de Atividades
- [x] **1. Aceitar ou Recusar Convites**: Tela de **Convites** onde o usuário aceita ou recusa o compartilhamento antes da atividade entrar no seu plano. A tarefa só aparece no plano do convidado **após ele aceitar o convite**.
- [x] **2. Compartilhamento Exclusivo pelo Proprietário**: Apenas o dono da tarefa pode enviar convites de compartilhamento.
- [x] **3. Revogação de Acesso pelo Destinatário ("Sair da Tarefa")**: Botão **"Sair da Atividade"** no modal de detalhes via endpoint `/api/shares/leave/{task_id}`, limpando automaticamente as delegações do convidado.
- [x] **4. Identificação Visual de Tarefas Compartilhadas**: Badge `Compartilhada` nos cards do Quadro Kanban.
- [x] **5. Identificação do Proprietário**: Exibição da informação do dono da tarefa (ex: `@admin (Dono)`).

---

### Subtarefas Delegadas
- [x] **Delegação de Responsáveis**: Botão/seletor por autocompletar em subtarefas para adicionar ou remover responsáveis (dono + participantes aceitos).
- [x] **1. Limpeza Automática ao Revogar Compartilhamento**: Se um usuário perde ou revoga o compartilhamento, todas as suas delegações de subtarefas naquela tarefa são removidas automaticamente.

---

### 3. Grupos de Usuários
- [x] **Criação e Gestão de Grupos**: Criação de grupos de usuários com busca por autocompletar para compartilhamento em lote.
- [x] **1. Menu de Grupos de Usuários**: Menu no painel lateral disponível para qualquer usuário autenticado.

---

### Edição de Atividades
- [x] **Botão Explícito de Edição**: Botão **Editar** no topo do modal de detalhes (antes do botão de arquivamento).
- [x] **1. Edição por Participantes**: Usuários com compartilhamento aceito podem editar a atividade e alterar o status.
- [x] **2. Exclusão Exclusiva pelo Dono**: Apenas o proprietário pode excluir a atividade.

---

### Edição de Subtarefas
- [x] **Edição ao Clicar no Texto**: Clicar no título da subtarefa abre a edição inline do nome.
- [x] **1. Edição de Subtarefas por Participantes**: Participantes podem editar nomes e alternar status das subtarefas.
- [x] **2. Adição e Remoção de Subtarefas**: Participantes podem incluir novas subtarefas ou remover existentes.
- [x] **3. Autodelegação e Delegação de Subtarefas**: Participantes podem atribuir subtarefas para si ou para outros membros do compartilhamento.

---

## ✅ Histórico de Features Concluídas

### 1. Múltiplos Usuários e Autenticação JWT
- Sistema de login com Usuário e Senha + JWT Tokens.
- Usuário `admin` padrão configurável por `DEFAULT_ADMIN_PASSWORD`.
- Tela de Gestão de Usuários (Admin) com controle contra auto-exclusão e auto-despromoção.
- Informação do usuário conectado na Sidebar com botão de Logout.
- Rota pública de busca/autocompletar de usuários (`GET /api/users`).

### 2. Perfil, Preferências e Notificações
- Modal de Configurações reformulado com abas **Meu Perfil**, **Preferências** e **Backup & Dados**.
- Notificações no cabeçalho com ícone de sino e contagem de não lidas.
- Dashboard de **Estatísticas** com indicadores de taxa de conclusão no prazo, prazos vencidos e gráficos de prioridade e status.

### 3. Compartilhamento e Grupos de Usuários
- Seletor de busca com autocompletar e chips em tempo real para Usuários e Grupos.
- Sistema de Convites (Pendentes, Aceitos, Recusados). Tarefas só entram no plano do convidado após aceitação.
- Botão **"Sair da Atividade"** para o participante revogar o próprio acesso.
- Grupos de Usuários com criação, edição e membros associados para envio em lote.
- Delegação de subtarefas por responsáveis.

### 4. Edição Aprimorada de Tarefas e Subtarefas
- Botão **Editar** explícito nos detalhes da tarefa.
- Edição inline do título de subtarefas clicando diretamente no texto.
- Permissões diferenciadas entre proprietários e convidados.

### 5. Quadro Kanban, Datas e Gatilhos Temporais (Stand-by)
- Colunas `todo`, `doing`, `done` e suporte a tarefas agendadas em `standby`.
- Promoção temporal automática a cada 60s no servidor.
- Ordenação automática por prioridade e prazo de entrega.
- Visão de Calendário mensal interativa.

### 6. Configurações, Arquivamento e Docker
- Auto-arquivamento de concluídas e exportação/importação de backup JSON.
- Docker & Docker Compose totalmente integrados e testados.
