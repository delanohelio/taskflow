---
name: taskflow-api
description: |
  Gerenciar tarefas no TaskFlow usando sua API HTTP/REST local (FastAPI).
  Permite consultar o board, obter revisão diária, criar e atualizar tarefas,
  adicionar subtarefas, promover tarefas standby e exibir saídas em tabelas e listas markdown formatadas.
---

# Skill: TaskFlow API Manager

Esta skill fornece instruções e templates para interagir com o servidor de backend do TaskFlow (`http://localhost:8000/api`) usando chamadas de terminal (`curl`) e formatar as respostas de forma visualmente rica para o usuário.

---

## 1. Configuração e Variáveis

A URL base padrão da API é:
`http://localhost:8000/api`

---

## 2. Templates de Entrada de Dados (API Payloads)

Use os seguintes templates `curl` para executar ações no TaskFlow. Substitua os placeholders indicados por `<valor>`.

### A. Criar Nova Tarefa Principal
Se `start_datetime` for no futuro, o status será automaticamente definido como `standby`.

```bash
curl -s -X POST http://localhost:8000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "<Título da tarefa>",
    "description": "<Descrição detalhada ou null>",
    "start_datetime": "<ISO-8601 ex: 2026-07-05T10:00:00 ou null>",
    "due_date": "<YYYY-MM-DD ex: 2026-07-03 ou null>",
    "priority": "<low | normal | high>",
    "tags": ["<tag1>", "<tag2>"]
  }'
```

### B. Adicionar Subtarefa (Tarefa Filha)
Vincule uma subtarefa informando o `parent_id` da tarefa pai correspondente.

```bash
curl -s -X POST http://localhost:8000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "<Título da subtarefa>",
    "priority": "normal",
    "tags": [],
    "parent_id": <id_da_tarefa_pai>
  }'
```

### C. Atualizar uma Tarefa / Subtarefa (Edição)
Edite parcialmente qualquer tarefa passando apenas os campos modificados.

```bash
curl -s -X PATCH http://localhost:8000/api/tasks/<id_da_tarefa> \
  -H "Content-Type: application/json" \
  -d '{
    "title": "<Novo título>",
    "description": "<Nova descrição>",
    "priority": "<low | normal | high>",
    "due_date": "<YYYY-MM-DD>",
    "archived": <true | false>
  }'
```

### D. Mover Tarefa entre Colunas (Kanban)
Use este endpoint dedicado para arrastar tarefas ativas entre as colunas do board.

```bash
curl -s -X PATCH http://localhost:8000/api/tasks/<id_da_tarefa>/status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "<todo | doing | done>"
  }'
```

### E. Excluir uma Tarefa ou Subtarefa
*Nota: Excluir uma tarefa pai excluirá automaticamente todas as suas subtarefas em cascata.*

```bash
curl -s -X DELETE http://localhost:8000/api/tasks/<id_da_tarefa>
```

### F. Forçar Gatilho Temporal
Dispare a promoção em lote de todas as tarefas standby elegíveis (cujo `start_datetime` já passou).

```bash
curl -s -X POST http://localhost:8000/api/tasks/trigger-temporal
```

### G. Promover uma Tarefa Standby para Execução Imediata
Promova manualmente uma tarefa agendada (standby) limpando seu início (`start_datetime: null`) e mudando o status para `todo`.

```bash
curl -s -X PATCH http://localhost:8000/api/tasks/<id_da_tarefa> \
  -H "Content-Type: application/json" \
  -d '{
    "status": "todo",
    "start_datetime": null
  }'
```

### H. Arquivar / Desarquivar uma Tarefa
Arquive uma tarefa (definindo `archived: true`) para ocultá-la das telas ativas, ou desarquive (definindo `archived: false`).

```bash
curl -s -X PATCH http://localhost:8000/api/tasks/<id_da_tarefa> \
  -H "Content-Type: application/json" \
  -d '{
    "archived": true
  }'
```

---

## 3. Templates de Visualização de Saída (Markdown)

Ao ler as respostas em JSON da API do TaskFlow, formate os dados usando os templates estruturados abaixo para exibi-los ao usuário final em Markdown limpo e fácil de ler.

### A. Resumo da Revisão Diária (Banner)
Colete as informações de `GET /api/tasks/review` e renderize um bloco de resumo baseado na urgência:

*Se houver tarefas atrasadas:*
> [!WARNING]
> ### 📋 Revisão Diária: Atenção Requerida
> Você tem **<today_count>** tarefas para hoje e **<overdue_count>** tarefas atrasadas!
>
> **Tarefas Atrasadas:**
> - [ ] `#<id>` **<title>** (Venceu em: `<due_date>`) — *Prioridade: `<priority>`*

*Se tudo estiver em dia:*
> [!NOTE]
> ### 🌟 Revisão Diária: Tudo em dia!
> Você tem **<today_count>** tarefas para hoje e nenhuma tarefa atrasada.

---

### B. Visualização do Quadro Kanban (Sem Tabelas)
Colete as informações de `GET /api/tasks/board` e renderize em formato de árvore usando marcadores visuais. É a forma ideal para visualização em canais ou bots do Telegram:

**📥 PARA FAZER (`todo`)**
├─ 🟥 **#`<id>` `<title>`** (Entrega: `<due_date | "Não definida">`)
│  🔥 *Prioridade:* `<priority>` • 🏷️ `[<tags>]`
├─ ...
└─ *(Fim da lista)*

**⚙️ EM ANDAMENTO (`doing`)**
├─ 🟧 **#`<id>` `<title>`** (Entrega: `<due_date | "Não definida">`)
│  🔥 *Prioridade:* `<priority>` • 🏷️ `[<tags>]`
└─ *(Fim da lista)*

**✅ CONCLUÍDO (`done`)**
├─ 🟩 **#`<id>` `<title>`**
│  🏷️ `[<tags>]`
└─ *(Fim da lista)*

> Exemplo: Para detalhar, editar ou adicionar subtarefas, use a rota `/api/tasks/{id}`.

---

### C. Visualização de Stand-by e Agendamentos (Sem Tabelas)
Colete a chave `"standby"` de `GET /api/tasks/board` e liste-as organizadas cronologicamente por liberação:

⏰ **TAREFAS EM STAND-BY (AGENDADAS)**
├─ ⏳ **#`<id>` `<title>`**
│  ⏰ *Liberação em:* `<start_datetime>`
│  🔥 *Prioridade:* `<priority>` • 🏷️ `[<tags>]`
├─ ...
└─ *(Fim da lista)*

---

### D. Detalhes de Tarefa com Checklist de Subtarefas
Ao exibir os detalhes de uma tarefa principal obtidos de `GET /api/tasks/{id}`:

### 📑 Tarefa #`<id>`: `<title>`
* **Status:** `<status>`
* **Prioridade:** `<priority>`
* **Data de Entrega:** `<due_date | "Não definida">`
* **Início Agendado:** `<start_datetime | "Imediato">`
* **Arquivada:** `<"Sim" | "Não">`
* **Tags:** `<tag_list | "Nenhuma">`

**Descrição:**
> `<description | "Sem descrição adicional.">`

**Progresso das Subtarefas:** `[<subtasks_done>/<subtasks_total>]`
```
[bar-progresso-visual: <=========> 100%]
```
- [x] `#<sub_id>` **<sub_title>** (Concluída)
- [ ] `#<sub_id>` **<sub_title>** (Pendente)

---

### E. Visualização de Tarefas Arquivadas (Sem Tabelas)
Colete as tarefas arquivadas por `GET /api/tasks?archived=true` e renderize a lista:

📦 **TAREFAS ARQUIVADAS**
├─ 📦 **#`<id>` `<title>`** (Vencimento: `<due_date | "Não definido">`)
│  🏷️ `[<tags>]` • 🗄️ *Status original:* `<status>`
├─ ...
└─ *(Fim da lista)*
