# Novas Features

## 1. Múltiplos Usuários
Quero que seja adicionado múltiplos usuários para usar o sistema. 
0. Um usuário tem: usuario, senha, nome completo, e-mail (opcional)
1. Cada usuário terá seu próprio plano de tarefas.
2. Com autenticação e autorização.
3. Cada usuário terá seu próprio perfil.
4. Cada usuário terá suas próprias tarefas.
5. Cada usuário terá suas próprias configurações.
6. Cada usuário terá suas próprias estatísticas.
7. Cada usuário terá suas próprias notificações.

Considerando esse novo requisito, vamos remover a senha do sistema e usar uma tela de login com usuário e senha. Além disso, vamos ter um usuário padrão admin para gerenciamento dos usuários e de funcionalidades do sistema como todo.
1. O admin será um usuário comum, com tarefas mas terá um menu a mais para gestão de usuários;
2. Para todo usuário, em configurações, o usuário poderá mudar a senha, nome completo e informar um e-mail (opcional);
3. Abaixo do botão de configurações haverá o a informação de logado e botão de logout;
4. Adicionar na variavel de ambiente, a possibilidade de colocar uma senha padrão para o admin ao fazer o setup inicial do sistema.

### 2. Compartilhamento de Atividades
Um usuário pode compartilhar uma atividade com outros usuários. As informações e status dessa atividade compartilhada será vista e editada por todos os usuários compartilhados.
1. O(s) usuário(s) compartilhado(s) poderão aceitar ou recusar a atividade e só assim ela fará parte do plano de tarefas do(s) usuário(s) compartilhado(s);
2. Apenas o dono da atividade pode compartilhar a atividade com outros.
3. A pessoa que aceitou o compartilhamento pode revogar o compartilhamento a qualquer momento, sendo necessário um novo convite para aceitar novamente.
4. Tarefas compartilhadas, devem ter alguma marca para identificar quando está compartilhada
5. Tarefas que são de outro dono mas está compartilhada comigo, deve ter alguma marca e a informação do usuario que compartilhou.

### Subtarefas
Quando uma atividade é compartilhada, as subtarefas poderão ter um ou mais pessoas delegadas. Deve ter um botão onde eu adiciono ou removo, similar como se faz em tags o(s) responsável(is) pela subtarefa. Os usuários que poderão estar lá são o dono da atividade e aqueles que aceitaram o compartilhamento.
1. Quando uma pessoa revogar o compartilhamento de uma atividade, serão removidas todas as suas delegações de subtarefas daquela atividade.

### 3. Grupos de Usuários
Um usuário poderá criar grupos de usuário para facilitar na hora de compartilhar atividades com os mesmos usuários.
1. Deve ter um menu onde permita fazer o CRUD desses grupos de usuários.

## Edição de Atividades
Ao abrir os detalhes de uma atividade, deve ter um botão antes do botão de arquivamento para editar e não apenas editar clicar no título da atividade.
1. Qualquer pessoa com a atividade compartilhada pode editar a atividade ou mudar o status dela.
2. Apenas o dono da atividade pode remover a atividade.

### Edição de Subtarefas
Ao clicar no texto da subtarefa, deve abrir a edição daquela subtarefa, permitindo alterar o nome dela.
1. Qualquer pessoa com a atividade compartilhada pode suas subtarefas e os status da mesma.
2. Qualquer pessoa com a atividade compartilhada pode adicionar ou remover subtarefas.
3. Qualquer pessoa com a atividade compartilhada pode delegar uma subtarefa para si ou outra pessoa do compartilhamento.

---

## Features Já Realizadas (Concluídas)

### 1. Gestão de Tarefas e Quadro Kanban
- Quadro Kanban interativo com colunas: **Para Fazer (`todo`)**, **Em Andamento (`doing`)** e **Concluído (`done`)**.
- Arrastar e soltar (Drag & Drop) de cards entre colunas com suporte a dispositivos touch/mobile via botões de transição rápida.
- Ordenação inteligente automática por prioridade (`high` > `normal` > `low`) e prazo de entrega (`due_date`).

### 2. Gatilhos Temporais Automáticos (Stand-by)
- Agendamento de início (`start_datetime`). Tarefas com data futura entram em estado `standby` e ficam ocultas do quadro ativo.
- Promoção automática de tarefas para `todo` via background worker (a cada 60 segundos) e polling no frontend.
- Promoção e adiamento manual de tarefas standby no modal de detalhes ou visualização dedicada.

### 3. Subtarefas Hierárquicas (Checklist)
- Subtarefas encadeadas com barra de progresso visual nos cards principais (ex: 2/5).
- Exclusão em cascata automatizada (deletar a tarefa pai remove todas as suas subtarefas).

### 4. Visão de Calendário Interativo
- Visualização em grade mensal de tarefas com datas de início ou entrega agendadas.
- Navegação entre meses, botão "Hoje" e alternância responsiva para mobile (indicadores de pontos com lista detalhada expansível).

### 5. Arquivamento de Tarefas
- Arquivamento manual de tarefas concluídas ou obsoletas.
- Auto-arquivamento de tarefas concluídas após período configurável via variável de ambiente (`AUTO_ARCHIVE_AFTER_MINUTES`) ou Menu de Configurações.
- Seção de gerenciamento de tarefas arquivadas com opções de restauração e exclusão definitiva.

### 6. Configurações, Backup e Restauração
- Painel de configurações para alterar regras de auto-arquivamento em tempo de execução (`settings.json`).
- Exportação completa da base de dados e configurações em arquivo `.json`.
- Restauração / Importação de backup `.json` diretamente pela interface ou API.

### 7. Tags Inteligentes com Auto-complete
- Seletor de tags em formato de chips com sugestões autocompletadas em tempo real com base nas tags existentes no sistema.

### 8. Renderização de Markdown em Descrições
- Suporte a formatação rica (Markdown) nas descrições das tarefas via biblioteca `marked`.

### 9. Autenticação Opcional por Senha
- Proteção opcional do painel via variável de ambiente `PAGE_PASSWORD`.
- Tela de login com persistência de token/senha no `localStorage` e botão de logout no menu lateral.

### 10. Suporte Mobile e Responsividade Completa
- Sidebar retrátil (drawer sliding menu) em telas menores.
- Modais em tela cheia com rolagem nativa para usabilidade em smartphones.

### 11. Containerização Docker e CI/CD
- Suporte completo a Docker e Docker Compose (containers FastAPI e Nginx/React com volume SQLite persistente).
- Workflows CI/CD no GitHub Actions com builds de matriz e publicação de imagens.
