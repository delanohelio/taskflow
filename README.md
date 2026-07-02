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

### 1. Backend (FastAPI)

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

### 2. Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev
```

O frontend estará disponível em: `http://localhost:5173`  
O Vite faz proxy de `/api` → `http://localhost:8000` automaticamente.

### 3. Rodando ambos simultaneamente

Abra dois terminais:

**Terminal 1 — Backend:**
```bash
source .venv/bin/activate && uvicorn backend.app:app --reload --port 8000
```

**Terminal 2 — Frontend:**
```bash
cd frontend && npm run dev
```

## Arquitetura

```
web_app/
├── backend/
│   ├── app.py              # Entry point FastAPI (lifespan, CORS, rotas)
│   ├── database.py         # Engine SQLAlchemy + sessão
│   ├── models/
│   │   └── task.py         # Modelo ORM Task (hierárquico)
│   ├── schemas/
│   │   └── task.py         # Pydantic v2 schemas (request/response)
│   ├── routes/
│   │   └── tasks.py        # 9 endpoints REST
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.tsx              # Componente raiz
│   │   ├── hooks/useTasks.ts    # Custom hook (fetch + mutations)
│   │   ├── services/api.ts      # Cliente Axios
│   │   ├── types/task.ts        # Tipos TypeScript
│   │   ├── utils/               # Constantes e helpers
│   │   └── components/
│   │       ├── board/           # KanbanBoard, KanbanColumn, TaskCard, Banner
│   │       ├── layout/          # Sidebar
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

### Arquivamento de Tarefas

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
