---
name: docker-setup
description: |
  Instruções de como subir o ambiente TaskFlow usando Docker e Docker Compose,
  incluindo build a partir de arquivos locais ou repositório Git, gerenciamento de volumes locais para a base SQLite e exposição de portas.
---

# Skill: TaskFlow Docker Manager

Esta skill fornece instruções detalhadas para construir, subir e gerenciar a aplicação TaskFlow (FastAPI + React + Vite) em containers Docker usando o Docker Compose.

---

## 1. Requisitos

* **Docker** instalado na máquina hospedeira.
* **Docker Compose** (V2 ou superior) instalado.

---

## 2. Visão Geral da Configuração

A aplicação é dividida em dois containers principais, orquestrados pelo Docker Compose:
1. **Backend (`taskflow-backend`)**:
   - Container baseado em `python:3.11-slim`.
   - Executa na porta `8000`.
   - Possui o volume `./data` (no host) mapeado para `/app/data` (no container).
   - O banco de dados SQLite (`tasks.db`) é salvo no volume local, mantendo os dados persistidos mesmo após parar ou remover os containers.
2. **Frontend (`taskflow-frontend`)**:
   - Container com build multi-stage (`node:20-alpine` para compilação + `nginx:alpine` para servir arquivos estáticos).
   - Porta externa exposta: **`4000`**.
   - Encaminha (via Proxy Nginx) as chamadas em `/api` diretamente para `http://backend:8000/api`.

---

## 3. Instruções de Execução (Localmente)

### A. Subir os Containers
Para compilar e iniciar os containers em segundo plano (detached mode):

```bash
docker compose up --build -d
```

*Nota: Caso utilize uma versão antiga do docker-compose, use `docker-compose up --build -d`.*

Uma vez iniciado, a estrutura de arquivos no host terá uma nova pasta chamada `./data` que conterá o banco de dados SQLite `tasks.db`.

### B. Verificar Status dos Containers
Para certificar-se de que os containers estão rodando de forma estável:

```bash
docker compose ps
```

### C. Acessar a Aplicação
* **Frontend (Kanban Board)**: [http://localhost:4000](http://localhost:4000)
* **Backend (Documentação da API)**: [http://localhost:8000/docs](http://localhost:8000/docs)
* **Health Check do Backend**: [http://localhost:8000/health](http://localhost:8000/health)

### D. Acompanhar Logs
Para depurar problemas ou acompanhar requisições em tempo real:

```bash
docker compose logs -f
```

Você também pode verificar os logs de um container específico:
```bash
docker compose logs -f backend
docker compose logs -f frontend
```

### E. Parar a Aplicação
Para parar e remover os containers temporariamente (sem excluir o volume de dados):

```bash
docker compose down
```

### F. Parar e Limpar Volumes
Caso queira reiniciar o banco de dados do zero, removendo também os volumes persistidos (Cuidado: isso limpará os dados do DB):

```bash
docker compose down -v
```

---

## 4. Build Direto da URL do Git

Se você não deseja baixar os arquivos do repositório localmente e prefere compilar a aplicação diretamente a partir de um repositório remoto Git (público), o Docker Compose e o próprio Docker CLI suportam build remoto.

### A. Usando Docker Compose com Repositório Remoto
Você pode rodar uma versão diretamente do Git definindo uma referência remota. Para isso, você pode apontar o build dos serviços no `docker-compose.yml` para repositórios remotos.

Exemplo de estrutura a ser utilizada para build direto de um repositório Git (substituindo o `docker-compose.yml` original por referências ao Git):

```yaml
services:
  backend:
    build: https://github.com/SEU_USUARIO/TaskFlow.git#:backend
    container_name: taskflow-backend
    ports:
      - "8000:8000"
    environment:
      - DB_PATH=/app/data/tasks.db
    volumes:
      - ./data:/app/data
    restart: unless-stopped

  frontend:
    build: https://github.com/SEU_USUARIO/TaskFlow.git#:frontend
    container_name: taskflow-frontend
    ports:
      - "4000:80"
    depends_on:
      - backend
    restart: unless-stopped
```

Substitua `SEU_USUARIO` pela conta correta do GitHub.
Depois, basta rodar:
```bash
docker compose up --build -d
```
O Docker irá baixar o repositório temporariamente na máquina hospedeira e compilar os containers com base nas subpastas `#backend` e `#frontend` indicadas na URL de build.

### B. Fazendo Build Manual de uma Imagem com Docker CLI pelo Git
Caso queira construir imagens independentes usando apenas o Docker CLI sem o Docker Compose:

* **Build do Backend diretamente do Git:**
  ```bash
  docker build -t meu-taskflow-backend:latest https://github.com/SEU_USUARIO/TaskFlow.git#:backend
  ```

* **Build do Frontend diretamente do Git:**
  ```bash
  docker build -t meu-taskflow-frontend:latest https://github.com/SEU_USUARIO/TaskFlow.git#:frontend
  ```

Após criar as imagens, você pode rodar os containers individualmente informando a rede compartilhada.

---

## 5. Proteção por Senha (Opcional)

A aplicação conta com um sistema de autenticação opcional. Para ativar a exigência de senha:

1. Defina a variável de ambiente `APP_PASSWORD` na inicialização do Docker Compose:
   ```bash
   APP_PASSWORD=minhasenha docker compose up -d
   ```
   *Ou configure a variável de ambiente em um arquivo `.env` na raiz do projeto:*
   ```env
   APP_PASSWORD=minhasenha
   ```

2. Ao acessar a aplicação, a tela de acesso restrito será exibida solicitando a senha. O frontend armazenará a senha informada no `localStorage` do seu navegador para não precisar digitá-la novamente.
3. Para fechar a sessão e bloquear o painel novamente, clique no botão **Sair** localizado no rodapé do menu lateral (Sidebar).

---

## 6. Resolução de Problemas Comuns

### Banco de dados bloqueado ou erro de permissão (SQLite)
Se o container do backend falhar ao iniciar reportando erros de permissão de escrita no volume de dados, certifique-se de que a pasta local `./data` no host possui as permissões corretas de leitura e escrita para o usuário que executa os processos do Docker.
```bash
chmod -R 777 ./data
```

### Alterações no código não refletem no Docker
Se você modificou arquivos de código e a alteração não aparece no Docker, force o rebuild ignorando o cache:
```bash
docker compose build --no-cache
docker compose up -d
```
