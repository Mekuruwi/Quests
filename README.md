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

- No primeiro acesso, criar perfil local Master (nome, nickname e e-mail); janela abre maximizada com controles de título próprios.
- Criar quests únicas, diárias, semanais ou mensais; para a recorrência semanal, escolher os dias da semana em que as próximas ocorrências devem surgir.
- Adicionar subquests e atribuir cada uma a várias pessoas.
- Concluir subquests; ao concluir a última, concluir a ocorrência e gerar a próxima no banco.
- Concluir diretamente uma quest sem subquests.
- Criar grupos persistentes, gerenciar participantes e administradores demonstrativos, consultar calendário e relatórios.
- Preparar convite por e-mail para grupo ou quest e ajustar tema/cor em Configurações.
- Filtrar por grupo e prazo e alternar a ordenação da lista.

A frequência mensal preserva o dia escolhido e ajusta para o último dia do mês quando necessário. A recorrência semanal permite selecionar um ou mais dias; ao concluir uma ocorrência, a próxima é agendada no próximo dia selecionado. Ocorrências anteriores são mantidas como histórico.

## Acesso e papéis

Esta versão usa a credencial configurada para conectar cada instalação ao banco. O perfil Master é local; o convite abre um rascunho no aplicativo de e-mail e não cria conta nem concede acesso. Ainda não há login individual nem autorização por papel aplicada no banco; o controle Master/Admin e o cadastro real de membros precisam ser finalizados antes de usar dados que exijam segregação por pessoa/grupo. As pessoas adicionais apresentadas atualmente na interface são dados de demonstração.

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

## Versionamento e atualizações

O número exibido pelo app vem de `version` em `package.json`; mantenha também `package-lock.json` sincronizado. Em **Configurações > Atualizações**, é possível conferir a versão instalada, verificar novas versões, acompanhar o download e reiniciar para instalar. O app instalado também verifica atualizações ao iniciar.

As atualizações são distribuídas pelos GitHub Releases do repositório `Mekuruwi/Quests`. Para publicar, aumente a versão, envie a tag `v<versão>` correspondente e aguarde o workflow anexar os instaladores e metadados de atualização para cada plataforma. Builds de desenvolvimento não consultam releases.

## CI/CD e releases

O workflow do GitHub Actions em `.github/workflows/ci-cd.yml` verifica segredos e compila o app em pull requests e pushes para `main`. Depois, gera instaladores nos runners Windows, macOS e Linux e os publica como artefatos da execução por 14 dias.

Para publicar uma versão:

1. Atualize `version` em `package.json` e `package-lock.json`.
2. Faça merge em `main` e crie uma tag correspondente à versão, por exemplo `v0.1.1`.
3. Envie a tag (`git push origin v0.1.1`). O workflow compila as três plataformas e cria um GitHub Release com notas geradas e os instaladores anexados.

O workflow exige que a tag corresponda à versão do pacote e usa `GITHUB_TOKEN` com permissão de escrita apenas no job de release. Não há pipeline de testes automatizados neste repositório ainda; a validação atual é a compilação/typecheck do renderer e do processo principal do Electron.
