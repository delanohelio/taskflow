---
name: taskflow-api
description: |
  Gerenciar tarefas no TaskFlow usando sua API HTTP/REST local (FastAPI).
  Permite consultar o board, obter revisão diária, estatísticas, notificações,
  criar e atualizar tarefas, gerenciar usuários/grupos, aceitar/sair de convites de compartilhamento.
---

# Skill: TaskFlow API Manager

Esta skill fornece instruções e templates para interagir com o servidor de backend do TaskFlow (`http://localhost:8000/api`) usando chamadas de terminal (`curl`) e autenticação JWT.

---

## 1. Configuração e Autenticação JWT

A URL base padrão da API é:
`http://localhost:8000/api`

### Autenticar e Obter Token JWT
```bash
curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "<usuario>", "password": "<senha>"}'
```
Adicione o cabeçalho `Authorization: Bearer <TOKEN>` nas requisições protegidas.

---

## 2. Endpoints e Exemplos curl

### A. Estatísticas e Desempenho
```bash
curl -s http://localhost:8000/api/stats \
  -H "Authorization: Bearer <TOKEN>"
```

### B. Notificações do Usuário
```bash
# Listar notificações
curl -s http://localhost:8000/api/notifications \
  -H "Authorization: Bearer <TOKEN>"

# Marcar todas como lidas
curl -s -X POST http://localhost:8000/api/notifications/read-all \
  -H "Authorization: Bearer <TOKEN>"
```

### C. Compartilhamento e Convites
```bash
# Enviar convite de compartilhamento (Usuários ou Grupos)
curl -s -X POST http://localhost:8000/api/tasks/<id_tarefa>/share \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"user_ids": [2], "group_ids": [1]}'

# Aceitar convite
curl -s -X POST http://localhost:8000/api/shares/<id_convite>/accept \
  -H "Authorization: Bearer <TOKEN>"

# Sair de uma tarefa compartilhada (Convidado)
curl -s -X POST http://localhost:8000/api/shares/leave/<id_tarefa> \
  -H "Authorization: Bearer <TOKEN>"
```

### D. Perfil e Configurações Individuais
```bash
# Atualizar perfil (Nome, E-mail, Senha)
curl -s -X PATCH http://localhost:8000/api/auth/profile \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"full_name": "Novo Nome", "email": "email@teste.com"}'

# Atualizar preferências de auto-arquivamento individual
curl -s -X PATCH http://localhost:8000/api/auth/settings \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"auto_archive_minutes": 1440}'
```

---

## 3. Visualização de Saída (Markdown)

### A. Painel de Estatísticas
Renderize os dados obtidos de `GET /api/stats` em um bloco de resumo analítico:

> [!NOTE]
> ### 📊 Desempenho do Usuário
> - **Total de Tarefas:** `<total_tasks>`
> - **Concluídas:** `<completed_tasks>` (`<completion_rate_percent>%`)
> - **Entregues no Prazo:** `<completed_on_time>` (`<on_time_rate_percent>%`)
> - **Atrasadas:** `<overdue_tasks>`
