# TaskFlow — Kanban com Múltiplos Usuários, Notificações e Estatísticas

Aplicação full-stack de gerenciamento de tarefas pessoais e colaborativas com quadro Kanban interativo, suporte a múltiplos usuários, compartilhamento com convites, delegação de subtarefas, notificações em tempo real, dashboard de estatísticas e gatilhos temporais automáticos.

## Stack Tecnológica

| Camada | Tecnologia |
|--------|------------|
| **Backend** | Python 3.11+, FastAPI, SQLAlchemy 2.0, SQLite, BCrypt, PyJWT |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React |
| **Drag & Drop** | @dnd-kit/core + @dnd-kit/sortable |

---

## Como rodar

### 1. Usando Docker (Recomendado)

O projeto está totalmente dockerizado. Para iniciar toda a stack (Backend, Frontend e Banco de dados SQLite persistente) com um único comando:

```bash
# Iniciar a aplicação
docker compose up -d

# Iniciar definindo uma senha padrão customizada para o usuário administrador
DEFAULT_ADMIN_PASSWORD=minhasenhaadmin docker compose up -d
```

O Frontend estará disponível em: `http://localhost:4000`  
O Backend estará disponível em: `http://localhost:8000`

Para parar os serviços:
```bash
docker compose down
```

---

## Funcionalidades Principais

### 1. Autenticação de Múltiplos Usuários & Usuário Admin
- **Tokens JWT**: Autenticação segura via JSON Web Tokens.
- **Setup Inicial**: Criação automática do usuário admin (`admin`) no primeiro uso.
- **Gestão de Usuários**: Painel administrativo para criar novos usuários e definir cargos (`admin` ou `user`).
- **Edição de Perfil**: Modal de Configurações com abas para alterar senha, nome completo e e-mail.

### 2. Compartilhamento de Atividades & Subtarefas Delegadas
- **Convites e Aceitação**: Compartilhe tarefas por usuário ou por **Grupos de Usuários**. Tarefas só entram no plano do destinatário **após ele aceitar o convite**.
- **Delegação de Subtarefas**: Atribua subtarefas para si mesmo ou outros membros aceitos via chips com busca.
- **Sair da Tarefa**: Usuários convidados podem revogar seu próprio acesso a qualquer momento através do botão **"Sair da Atividade"**.

### 3. Grupos de Usuários
- Criação e gestão de grupos de trabalho para simplificar o compartilhamento em lote de tarefas recorrentes.

### 4. Dashboard de Estatísticas & Desempenho
- Tela analítica com métricas de produtividade, taxa de conclusão no prazo, tarefas atrasadas e distribuição visual por status e prioridade com barras de progresso.

### 5. Central de Notificações
- Notificações em tempo real / histórico no cabeçalho superior (novos convites, tarefas prestes a vencer, atrasos e atribuições de subtarefas).

### 6. Quadro Kanban, Listagem & Calendário Interativo
- Alternância entre visão de Quadro Kanban (Drag & Drop), Listagem estruturada e Calendário mensal interativo.

---

## Endpoints da API

| Método | Rota | Descrição |
|--------|------|-----------|
| `POST` | `/api/auth/login` | Autenticação de usuário por login/senha |
| `GET` | `/api/auth/me` | Retorna o perfil do usuário logado |
| `PATCH` | `/api/auth/profile` | Atualiza nome completo, e-mail ou senha do perfil |
| `GET` | `/api/auth/settings` | Retorna as preferências individuais do usuário |
| `PATCH` | `/api/auth/settings` | Atualiza preferências individuais do usuário |
| `GET` | `/api/users` | Busca pública de usuários (para autocomplete) |
| `GET` | `/api/admin/users` | Gestão de usuários (exclusivo Admin) |
| `GET` | `/api/user-groups` | CRUD de Grupos de Usuários |
| `POST` | `/api/tasks/{id}/share` | Enviar convites de compartilhamento de tarefa |
| `POST` | `/api/shares/{id}/accept` | Aceitar convite de compartilhamento |
| `POST` | `/api/shares/{id}/reject` | Recusar convite de compartilhamento |
| `POST` | `/api/shares/leave/{id}` | Sair de uma tarefa compartilhada (Destinatário) |
| `GET` | `/api/stats` | Retorna estatísticas de desempenho e produtividade |
| `GET` | `/api/notifications` | Lista as notificações do usuário logado |
| `PATCH` | `/api/notifications/{id}/read` | Marca uma notificação como lida |
| `POST` | `/api/notifications/read-all` | Marca todas as notificações como lidas |
| `GET` | `/api/tasks/board` | Quadro Kanban agrupado por status |
| `POST` | `/api/tasks/archive-done` | Arquivar tarefas concluídas |
| `GET` | `/api/backup/export` | Exportar backup completo em JSON |
| `POST` | `/api/backup/import` | Importar backup completo em JSON |

---

## Agent Skills
- [docker-setup](file:///.agents/skills/docker-setup/SKILL.md): Instruções para gerenciamento do ambiente TaskFlow com Docker e Docker Compose.
- [taskflow-api](file:///.agents/skills/taskflow-api/SKILL.md): Documentação completa da API REST FastAPI.
- [FEATURES](file:///.agents/skills/FEATURES.md): Avaliação de status e especificações das novas funcionalidades.
