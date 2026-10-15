# Questly

Aplicativo desktop Electron para organizar quests recorrentes, grupos, responsáveis e subquests. A interface segue a estrutura visual do `C:\Sites\Funil versão 2`.

## Iniciar

Requisitos: Node.js 20 ou superior e npm.

```bash
npm install
npm start
```

`npm start` compila e abre a janela do aplicativo Electron. Durante desenvolvimento, `npm run dev` inicia Vite com Electron.

## Banco de dados

Abra **Configurações > Banco de dados**, selecione o provedor e informe a conexão/chave. O app conecta diretamente ao banco escolhido; não exige hospedar um servidor próprio do Questly. As credenciais ficam no armazenamento seguro do sistema operacional e não são enviadas ao renderer.

Provedores disponíveis: SQLite local, PostgreSQL, Supabase/PostgreSQL, MySQL/MariaDB e Turso/libSQL. Teste a conexão antes de salvar. As tabelas de quests, ocorrências, subquests e histórico são criadas automaticamente no banco selecionado.

## Fluxos disponíveis

- Criar quests únicas, diárias, semanais ou mensais.
- Adicionar subquests e atribuir cada uma a várias pessoas.
- Concluir subquests; ao concluir a última, concluir a ocorrência e gerar a próxima no banco.
- Concluir diretamente uma quest sem subquests.
- Criar grupos persistentes, gerenciar participantes e administradores demonstrativos, consultar calendário e relatórios.
- Filtrar por grupo e prazo e alternar a ordenação da lista.

A frequência mensal preserva o dia escolhido e ajusta para o último dia do mês quando necessário. Ocorrências anteriores são mantidas como histórico.

## Acesso e papéis

Esta versão usa a credencial configurada para conectar cada instalação ao banco. Ainda não há login individual nem autorização por papel aplicada no banco; o controle Master/Admin e o cadastro real de membros precisam ser finalizados antes de usar dados que exijam segregação por pessoa/grupo. As pessoas apresentadas atualmente na interface são dados de demonstração.

## Arquitetura

- React + TypeScript + Vite na interface.
- Electron com `contextIsolation`, sandbox e Node desativado no renderer.
- API estreita via preload/IPC; validação e conexão com banco no processo principal.
- Knex para SQLite, PostgreSQL/Supabase e MySQL; cliente libSQL para Turso.
- Leia [docs/agents.md](docs/agents.md) para o fluxo do produto, regras e limitações ainda pendentes.

Para gerar um instalador local:

```bash
npm run electron:build
```
