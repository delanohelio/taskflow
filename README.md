# TaskFlow v3.0 — Kanban Inteligente & Analytics de Produtividade

Aplicação full-stack moderna de gerenciamento de tarefas pessoais e colaborativas com quadro Kanban interativo, suporte a múltiplos usuários, compartilhamento com convites, delegação de subtarefas, notificações em tempo real, dashboard analítico com gráficos customizados e animações de alta performance, e gatilhos temporais automáticos.

---

## Novidades da Versão 3.0

- 📊 **Dashboard Analítico Executivo com Gráficos Customizados:**
  - **Donut Chart Interativo:** Distribuição de tarefas por status (A Fazer, Fazendo, Concluído, Stand-by) com expansão dinâmica e tooltips em tempo real.
  - **Gráfico de Velocidade e Throughput:** Histórico de atividade dos últimos 7 dias comparando tarefas concluídas vs criadas.
  - **Medidores Radiais de Eficiência:** Indicadores visuais de Score Geral de Produtividade, Taxa de Entrega no Prazo e Conclusão.
  - **Equilíbrio de Prioridades & Categorias:** Barra segmentada de prioridades e gráfico de distribuição por tags.
- ⚡ **Otimizações Extremas de Desempenho:**
  - **SQLite WAL Mode:** Configuração de `PRAGMA journal_mode=WAL` e `synchronous=NORMAL` para máxima concorrência e velocidade de leitura/escrita.
  - **Índices de Banco de Dados:** Índices compostos criados para queries de status, prazos, compartilhamentos e notificações.
  - **Componentes Memoizados:** Redução de re-renders no Kanban através de `React.memo` para renderização fluida a 60 FPS durante drag & drop e filtros.
  - **Zero Bloat de Gráficos:** Gráficos desenvolvidos em SVG nativo responsivo, mantendo o bundle leve e carregamento instantâneo.
- 🎨 **UX e Design System Renovado:**
  - Paleta com tons indigo, esmeralda, rose e ardósia com suporte a micro-animações, elevações suaves, glassmorphism e transições refinadas.
  - Responsividade aprimorada para dispositivos móveis, tablets e monitores widescreen.
- 🧹 **Repositório Otimizado:**
  - Remoção de arquivos desnecessários de compilação e workflows obsoletos.

---

## Stack Tecnológica

| Camada | Tecnologia |
|--------|------------|
| **Backend** | Python 3.11+, FastAPI, SQLAlchemy 2.0, SQLite (WAL Mode), BCrypt, PyJWT |
| **Frontend** | React 19, TypeScript, Vite 6, Tailwind CSS v4, Lucide React |
| **Gráficos & Dataviz** | Custom SVG Animated Charts (Donut, Velocity Bar, Radial Gauges) |
| **Drag & Drop** | @dnd-kit/core + @dnd-kit/sortable |

---

## Como Rodar

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

### 2. Desenvolvimento Local

#### Backend:
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn backend.app:app --reload --port 8000
```

#### Frontend:
```bash
cd frontend
npm install
npm run dev
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

### 3. Dashboard de Estatísticas & Performance (v3.0)
- Tela analítica com métricas de produtividade, taxa de conclusão no prazo, tarefas atrasadas, gráfico de velocidade semanal e distribuição visual por status e prioridade.

### 4. Central de Notificações
- Notificações em tempo real / histórico no cabeçalho superior (novos convites, tarefas prestes a vencer, atrasos e atribuições de subtarefas).

### 5. Quadro Kanban, Listagem & Calendário Interativo
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
| `GET` | `/api/stats` | Retorna estatísticas de desempenho, throughput e produtividade v3.0 |
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
