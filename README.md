# TaskFlow — Kanban com Gatilhos Temporais

Aplicação full-stack de gerenciamento de tarefas pessoais com quadro Kanban interativo, gatilhos temporais automáticos e subtarefas hierárquicas.

## Stack Tecnológica

| Camada | Tecnologia |
|--------|------------|
| **Backend** | Python 3.11+, FastAPI, SQLAlchemy 2.0, SQLite |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React |
| **Drag & Drop** | @dnd-kit/core + @dnd-kit/sortable |

## Pré-requisitos

- **Python 3.11+** instalado
- **Node.js 18+** e **npm** instalados

## Como rodar

### 1. Usando Docker (Recomendado)

O projeto está totalmente dockerizado. Para iniciar toda a stack (Backend, Frontend e Banco de dados SQLite persistente) com um único comando:

```bash
# Iniciar o painel sem senha
docker compose up -d

# Iniciar o painel com senha de acesso à tela
PAGE_PASSWORD=minhasenha docker compose up -d

# Iniciar com senha e auto-arquivamento de tarefas concluídas após 60 minutos
PAGE_PASSWORD=minhasenha AUTO_ARCHIVE_AFTER_MINUTES=60 docker compose up -d
```

O Frontend estará disponível em: `http://localhost:4000`  
O Backend estará disponível em: `http://localhost:8000`

Para parar os serviços:
```bash
docker compose down
```

### 2. Desenvolvimento Local (Manual)

#### Backend (FastAPI)

```bash
# Na raiz do projeto
python3 -m venv .venv
source .venv/bin/activate       # macOS/Linux
# .venv\Scripts\activate        # Windows

pip install -r backend/requirements.txt

# Iniciar o servidor na porta 8000
uvicorn backend.app:app --reload --port 8000
```

O backend estará disponível em: `http://localhost:8000`  
Documentação da API: `http://localhost:8000/docs`

#### Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

O frontend estará disponível em: `http://localhost:5173`  
O Vite faz proxy de `/api` → `http://localhost:8000` automaticamente.

## Arquitetura

```
web_app/
├── backend/
│   ├── app.py              # Entry point FastAPI (lifespan, CORS, rotas, auth)
│   ├── database.py         # Engine SQLAlchemy + migrações automáticas
│   ├── models/
│   │   └── task.py         # Modelo ORM Task (hierárquico e auditado)
│   ├── schemas/
│   │   └── task.py         # Pydantic v2 schemas (request/response)
│   ├── routes/
│   │   └── tasks.py        # 9 endpoints REST
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.tsx              # Componente raiz
│   │   ├── hooks/
│   │   │   ├── useTasks.ts      # Custom hook (fetch + mutations)
│   │   │   └── useAuth.ts       # Hook de autenticação de página
│   │   ├── services/api.ts      # Cliente Axios
│   │   ├── types/task.ts        # Tipos TypeScript
│   │   ├── utils/               # Constantes e helpers
│   │   └── components/
│   │       ├── board/           # KanbanBoard, KanbanColumn, TaskCard, Banner
│   │       ├── layout/          # Sidebar, LoginScreen
│   │       ├── modals/          # CreateTaskModal, TaskDetailModal
│   │       └── ui/              # PriorityIndicator, TagBadge, ProgressBar
│   ├── index.html
│   ├── vite.config.ts
│   └── package.json
└── README.md
```

## Regras de Negócio

### Gatilho Temporal (Stand-by)

- Se `start_datetime` > agora → status é forçado para `standby`
- A tarefa **não aparece** nas colunas do Kanban enquanto em standby
- Quando o relógio ultrapassa `start_datetime` → promovida automaticamente para `todo`
- **Promoção Manual**: Tarefas em standby podem ser iniciadas manualmente a qualquer momento através da tela dedicada ou do modal de detalhes (limpando o agendamento e mudando status para `todo`).
- **Adiamento Manual**: Qualquer tarefa ativa pode ser adiada ao definir seu `start_datetime` no futuro, o que reverterá seu status para `standby` e a removerá temporariamente das colunas do quadro ativo.
- O backend verifica isso a cada 60 segundos (background task) e o frontend a cada 30 segundos (polling)

### Proteção por Senha (Opcional)

- Se a variável de ambiente `PAGE_PASSWORD` estiver definida no servidor, o frontend exibirá uma tela de login restrita antes de renderizar a interface de tarefas.
- Senha correta é guardada no `localStorage` do navegador para evitar a necessidade de logins repetitivos.
- Para deslogar e bloquear o painel novamente, basta clicar no botão **Sair** no rodapé do menu lateral (Sidebar).

### Auto-arquivamento de Tarefas Concluídas (Opcional)

- Permite configurar o arquivamento automático de tarefas no status `done` após um período de tempo.
- Pode ser configurado através da variável de ambiente `AUTO_ARCHIVE_AFTER_MINUTES` ou diretamente na interface do usuário através do **Menu de Configurações**.
- Uma tarefa executada em segundo plano no servidor verifica as tarefas concluídas a cada 60 segundos e as arquiva caso tenham atingido o tempo limite.

### Menu de Configurações

- Acessível no menu lateral (Sidebar) através de um ícone de engrenagem.
- Permite configurar e ajustar o período de auto-arquivamento em tempo de execução sem reiniciar a aplicação. O valor é persistido em `/app/data/settings.json`.
- Contém um botão para **Arquivar Todas as Concluídas** imediatamente.

### Seletor de Tags com Auto-complete Customizado

- A caixa de seleção de tags foi remodelada para um seletor moderno baseado em chips.
- Exibe sugestões inteligentes de tags já cadastradas ao digitar, permitindo adicioná-las clicando ou apertando Enter.
- As tags são exibidas como chips elegantes que podem ser removidos clicando no botão "X" interno do chip.

### Visão de Calendário Interativa

- Nova visão disponível no menu lateral que organiza todas as tarefas datadas (com início ou entrega agendados) em uma grade mensal.
- Permite navegar facilmente entre meses anteriores/posteriores e voltar para o dia atual ("Hoje").
- Cada dia no calendário exibe mini cards contendo o horário, título da tarefa e indicação visual de prioridade.
- Totalmente integrado: clicar em uma tarefa abre o modal completo de detalhes e edição.
- Responsividade mobile: Em telas pequenas, a grade exibe pontos coloridos de atividades, abrindo uma lista detalhada expansível logo abaixo do calendário ao tocar em qualquer dia.

### Ordenação Inteligente por Prioridade e Prazo

- Tanto o Quadro Kanban quanto a Listagem agora ordenam as tarefas automaticamente.
- Critério de ordenação: maior Prioridade no topo (`high` > `normal` > `low`), e em caso de empate, prazo de entrega mais próximo (`due_date` ascendente). Tarefas sem prazo de entrega vão para o final dentro de sua prioridade.

### Datas com Horário Opcional

- Ao criar ou editar uma tarefa, definir o horário para a data de **Início** é opcional.
- Se o horário não for definido explicitamente, os seguintes padrões inteligentes são aplicados automaticamente:
  - **Início**: `09:00` do dia selecionado.
  - **Entrega** (opcional no modal): `23:59` do dia selecionado.

### Responsividade (Mobile e Tablets)

- Toda a aplicação foi otimizada para smartphones e tablets.
- O menu lateral (Sidebar) vira um menu deslizante (sliding drawer) acionado por um botão Hamburger.
- As colunas do Kanban se empilham verticalmente em telas pequenas.
- Os modais de tarefas passam a ocupar tela cheia com rolagem interna para melhorar a usabilidade em celulares.
- Permite alterar o status da tarefa diretamente por botões rápidos de ação no Card ou no modal de Detalhes, facilitando o uso em telas sensíveis ao toque.

### Arquivamento Manual de Tarefas

- Tarefas concluídas ou que não são mais necessárias podem ser arquivadas (`archived = true`).
- Tarefas arquivadas são completamente ocultadas do Quadro Kanban e da Listagem principal.
- Podem ser visualizadas, restauradas (desarquivadas) ou excluídas definitivamente na tela de **Arquivadas**.

### Subtarefas

- Qualquer tarefa pode ter subtarefas infinitas (vinculadas por `parent_id`)
- Cards exibem progresso das subtarefas (ex: "2/5 concluídas")
- Deletar uma tarefa pai exclui todas as subtarefas (cascade)

### Revisão Diária

- Banner no topo do quadro mostra: "Você tem X tarefas para hoje e Y atrasadas"
- Tarefas atrasadas (due_date < hoje e não concluídas) aparecem na sidebar

## Endpoints da API

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/tasks` | Listar tarefas (filtros: status, tag, parent_id, archived) |
| `POST` | `/api/tasks` | Criar tarefa |
| `GET` | `/api/tasks/{id}` | Detalhe com subtarefas |
| `PATCH` | `/api/tasks/{id}` | Atualizar campos |
| `PATCH` | `/api/tasks/{id}/status` | Mover entre colunas (drag & drop) |
| `DELETE` | `/api/tasks/{id}` | Deletar (cascade) |
| `GET` | `/api/tasks/board` | Board agrupado por status |
| `GET` | `/api/tasks/review` | Resumo diário |
| `POST` | `/api/tasks/trigger-temporal` | Forçar re-avaliação temporal |
| `POST` | `/api/tasks/archive-done` | Arquivar todas as tarefas concluídas imediatamente |
| `GET` | `/api/settings` | Retorna as configurações atuais do app |
| `PATCH` | `/api/settings` | Atualiza as configurações do app (auto-arquivamento) |
| `GET` | `/api/auth/config` | Retorna se a senha é exigida no painel |
| `POST` | `/api/auth/verify` | Valida a senha enviada pelo usuário |

