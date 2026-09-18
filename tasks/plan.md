# Plano de reestruturação da área administrativa InovArt

## Contexto

O vídeo do protótipo anterior mostra um backoffice orientado a tarefa: uma sidebar persistente organiza o catálogo, a primeira tela responde “o que precisa da minha atenção hoje?” e cada módulo usa a mesma gramática de tabela, busca, status, ações e feedback. A versão atual já tem a autenticação Google, RLS/admin metadata e os módulos de submissões, artesãos, trabalhos, categorias e mensagens, mas os módulos aparecem sob uma navegação horizontal acoplada ao layout público.

O objetivo é manter a direção tecnoartesanal — fundo escuro, grid sutil, azul-cobalto, verde ácido, janelas, mono para metadados e títulos editoriais — e importar apenas a clareza operacional do protótipo antigo. O admin será um workspace próprio, não uma segunda versão genérica do site público.

## Pesquisa de padrões de mercado incorporada

O padrão recorrente em produtos editoriais e backoffices maduros é separar navegação global de navegação do produto: ações globais ficam no topo e os módulos do trabalho ficam numa sidebar persistente, com estado ativo, recolhimento e comportamento de drawer em telas estreitas. Isso aparece na documentação de navegação do Atlassian Design System e no modelo de rail/drawer do Material 3. Para listas densas, o padrão Shopify Polaris combina busca, filtros, ordenação e views salvas antes da tabela; Carbon reforça a tabela como superfície para leitura e ação em lote.

Aplicação ao InovArt:

- manter a sidebar como “instrumento editorial” fixo, mas com a nossa moldura de arquivo, grid e estados azul/verde;
- usar `/admin` para prioridade e saúde, e não para repetir a fila de submissões;
- tratar cada módulo como lista → detalhe → ação, com filtros e estado vazio explícitos;
- deixar o topo para contexto, busca/refresh, sessão e sair — não para duplicar a navegação;
- usar progressão de informação: resumo primeiro, revisão detalhada depois, sem uma parede de cards genéricos;
- reservar seleção em lote para quando houver uma ação real que se beneficie dela, evitando complexidade ornamental.

Fontes consultadas: [Atlassian Navigation System](https://atlassian.design/components/navigation-system/migration-guide), [Material 3 Navigation Rail](https://github.com/material-components/material-components-android/blob/master/docs/components/NavigationRail.md), [Shopify Polaris Index Filters](https://polaris-site-prod-kit.shopify.prod.shopifyapps.com/components/selection-and-input/index-filters) e [Carbon Data Table](https://carbondesignsystem.com/components/data-table/code/). As fontes são referências de interação e arquitetura, não componentes a serem copiados nem novas dependências do projeto.

## Evidências do protótipo analisado

- Sidebar fixa com marca, grupo “Gestão do catálogo”, navegação e contadores.
- “Visão geral” como entrada: prioridade do dia, métricas de artistas/obras/destaques, distribuição por categoria, atividade recente e saúde operacional.
- “Solicitações” como fila dedicada, com estado vazio explícito.
- “Artistas”, “Produtos” e “Categorias” como listas consistentes: busca, CTA de criação, tabela, status e ações agrupadas à direita.
- Sessão ativa e ação “Recolher” no rodapé da sidebar.
- Feedback não bloqueante por toast/status após editar, arquivar ou excluir; confirmação apenas para ações destrutivas.

## Decisões de arquitetura

- `/admin` passa a ser a visão geral; a fila atual ganha a rota explícita `/admin/submissoes`, preservando `/admin/submissoes/[id]`.
- “Produtos” é o rótulo operacional de `/admin/trabalhos`; não será criada uma tabela ou entidade nova.
- A navegação e o controle de sessão ficam em um `AdminShell` compartilhado dentro de `AdminGate`.
- O `SiteHeader` público não aparece em `/admin/**`; o admin terá seu próprio topo, sidebar e contexto visual.
- Busca, contadores e estados serão derivados dos dados já existentes no Supabase. Nenhuma dependência visual nova será adicionada.
- A autorização continua baseada em `app_metadata.role === "admin"`, RLS e funções editoriais existentes; esta reforma não amplia permissões.

## Fluxo proposto

```text
Google OAuth → AdminGate → AdminShell
                         ├── Visão geral (/admin)
                         ├── Solicitações (/admin/submissoes)
                         │    └── Revisão (/admin/submissoes/[id])
                         ├── Artesãos (/admin/artesaos)
                         ├── Produtos (/admin/trabalhos)
                         ├── Categorias (/admin/categorias)
                         └── Mensagens (/admin/mensagens)
```

## Tarefas

### Fase 1 — Workspace e navegação

#### Task 1: Criar o shell administrativo

**Descrição:** Extrair a navegação atual de `AdminGate` para um shell com sidebar persistente, topo de página, sessão ativa, sair e modo recolhido. Aplicar a estética tecnoartesanal com tokens já existentes.

**Critérios de aceitação:**
- [ ] Todas as rotas `/admin/**` exibem o mesmo shell e marcam a rota ativa.
- [ ] O header público não aparece no admin.
- [ ] Sidebar recolhe no desktop e vira drawer acessível no mobile.
- [ ] A identidade, logout e checagem de admin permanecem intactos.

**Verificação:** testes de navegação/role, `npm run build`, revisão visual desktop/mobile e teclado.

**Dependências:** Nenhuma.

**Arquivos prováveis:** `components/admin-gate.tsx`, `components/admin-shell.tsx`, `components/site-header.tsx`, `app/refinements.css`.

**Escopo:** Médio.

#### Task 2: Tornar a nomenclatura operacional consistente

**Descrição:** Ajustar rótulos e rotas para que a sidebar reflita o vocabulário do protótipo: Visão geral, Solicitações, Artistas, Produtos, Categorias e Mensagens.

**Critérios de aceitação:**
- [ ] `/admin` renderiza a visão geral.
- [ ] `/admin/submissoes` renderiza a fila atual.
- [ ] Links antigos importantes não quebram; o detalhe de submissão continua acessível.

**Verificação:** teste de todas as rotas e links, sem 404.

**Dependências:** Task 1.

**Arquivos prováveis:** `app/admin/page.tsx`, `app/admin/submissoes/page.tsx`, `components/admin-gate.tsx`.

**Escopo:** Pequeno.

### Checkpoint 1 — Shell

- [ ] 16 testes atuais passam.
- [ ] Build e lint passam.
- [ ] Usuário admin consegue entrar, navegar e sair sem perder a sessão.
- [ ] Nenhum dado privado aparece para visitante não autenticado.

### Fase 2 — Visão geral e fila editorial

#### Task 3: Reorganizar a visão geral

**Descrição:** Transformar o painel em uma tela de prioridade: card “o que precisa de atenção”, métricas de artesãos/trabalhos/destaques, distribuição por categoria, atividade recente e saúde operacional. Reutilizar consultas e tabelas existentes.

**Critérios de aceitação:**
- [ ] O primeiro bloco leva à fila de solicitações quando há pendências e confirma quando está vazia.
- [ ] Métricas refletem dados reais, sem números hardcoded.
- [ ] As informações cabem em uma leitura inicial sem espalhar o conteúdo em várias páginas.

**Verificação:** teste com fila vazia e com dados seed; checagem de estados loading/erro.

**Dependências:** Tasks 1–2.

**Arquivos prováveis:** `components/admin-overview.tsx`, `app/admin/page.tsx`, `app/refinements.css`.

**Escopo:** Médio.

#### Task 4: Dar à fila uma leitura de triagem

**Descrição:** Mover o `AdminDashboard` atual para `/admin/submissoes`, mantendo filtro de status, cards/lista de propostas e acesso ao detalhe. Destacar pendências e reduzir ruído quando não houver itens.

**Critérios de aceitação:**
- [ ] Filtro Todos/Recebida/Em revisão/Aprovada/Recusada permanece funcional.
- [ ] Cada item mostra nome, ofício, status, data e ação clara para abrir.
- [ ] O detalhe mantém revisão, notas internas e confirmação de aprovação/recusa.

**Verificação:** fluxo manual completo de abrir, marcar em revisão e revisar uma proposta; testes de autorização.

**Dependências:** Task 2.

**Arquivos prováveis:** `components/admin-dashboard.tsx`, `components/submission-review.tsx`, `app/admin/submissoes/page.tsx`.

**Escopo:** Médio.

### Checkpoint 2 — Curadoria

- [ ] Uma solicitação percorre lista → detalhe → decisão → retorno à fila.
- [ ] Aprovação continua criando rascunhos, nunca publicando automaticamente.
- [ ] RLS e funções editoriais não são enfraquecidas.

### Fase 3 — Catálogo consistente

#### Task 5: Padronizar listas do catálogo

**Descrição:** Aplicar a mesma barra de busca, CTA, tabela/linhas, chips de status e ações aos módulos de artesãos, produtos, categorias e mensagens, aproveitando `AdminCollection` e `AdminMessages` sem criar uma abstração genérica maior que o problema.

**Critérios de aceitação:**
- [ ] “Produtos” usa `/admin/trabalhos` e mostra artista, preço, status e destaque.
- [ ] Artesãos, produtos e categorias têm busca local, estado vazio e feedback após ação.
- [ ] Mensagens têm status e ações de leitura/resolução no mesmo padrão.
- [ ] Ações destrutivas pedem confirmação; salvar/publicar/arquivar informam resultado.

**Verificação:** testes de edição/publicação/arquivamento, confirmação de exclusão e revisão visual.

**Dependências:** Task 1.

**Arquivos prováveis:** `components/admin-collection.tsx`, `components/admin-messages.tsx`, páginas em `app/admin/**`, `app/refinements.css`.

**Escopo:** Médio.

#### Task 6: Responsividade e acessibilidade do workspace

**Descrição:** Ajustar foco, landmarks, nomes de botões, tabela em telas estreitas e sidebar drawer, preservando o grid sutil e sem adicionar ruído visual.

**Critérios de aceitação:**
- [ ] Fluxo completo funciona em viewport estreita sem scroll horizontal.
- [ ] Sidebar e diálogos são navegáveis por teclado e têm foco visível.
- [ ] `prefers-reduced-motion` evita animações decorativas do shell.

**Verificação:** teste manual mobile/desktop, auditoria de console e verificação de contraste/foco.

**Dependências:** Tasks 1 e 5.

**Arquivos prováveis:** `app/refinements.css`, `components/admin-shell.tsx`, componentes admin.

**Escopo:** Médio.

#### Task 7: Fechar o fluxo de mídia editorial

**Diagnóstico:** a submissão pública já aceita retrato e até duas imagens por trabalho via `multipart/form-data`, valida tipo real, limite de 5 MB e dimensões, converte para WebP e grava em `submission-media`. A revisão administrativa cria URLs assinadas para visualizar essas imagens; ao aprovar, a função editorial promove os arquivos para `public-media`. Já o `AdminCollection` atual não possui `input type=file` nem envia mídia: `save_editorial_record` recebe apenas JSON de metadados. Portanto “a submissão consegue enviar imagens” está funcionando; “o editor do catálogo consegue substituir/adicionar imagens” ainda não existe.

**Plano mínimo:** adicionar upload editorial apenas quando houver uma necessidade real de substituir/adicionar uma mídia de um registro, reutilizando `public-media`, `is_admin()` e as funções editoriais existentes. O fluxo deve usar caminho novo por versão (evita cache velho), validar assinatura/tamanho no servidor, mostrar preview/progresso/erro e publicar a mídia somente junto da ação de publicação. Não abrir INSERT público em `storage.objects` e não expor service key.

**Critérios de aceitação:**
- [ ] O editor diferencia claramente “imagem recebida na solicitação” de “imagem publicada no catálogo”.
- [ ] Um admin consegue anexar/substituir mídia em rascunho sem criar URL pública prematuramente.
- [ ] A publicação e o arquivamento continuam acionando a limpeza transacional já existente.
- [ ] Visitante não autenticado não ganha acesso ao bucket privado nem a endpoints editoriais.
- [ ] Existe um teste de contrato do multipart e uma verificação E2E isolada antes de qualquer upload real em produção.

**Verificação atual:** bucket `submission-media` está privado, limitado a JPEG/PNG/WebP de 5 MB; `public-media` é público para leitura, mas escrita e alteração estão restritas a `authenticated` + `is_admin()`. A Edge Function `inovart-api` está ativa (versão 5). O advisor de segurança apontou apenas tabelas privadas sem políticas explícitas (inacessíveis por desenho) e proteção contra senhas vazadas desativada; nenhuma permissão pública de upload foi encontrada.

**Escopo:** Médio, posterior ao shell e à fila.

### Checkpoint 3 — Catálogo

- [ ] Todas as rotas da sidebar carregam o mesmo contexto visual.
- [ ] `npm test`, `npx tsc --noEmit`, lint e `npm run build` passam.
- [ ] Verificação no domínio de produção não mostra erros no console.

## Riscos e mitigação

| Risco | Impacto | Mitigação |
|---|---|---|
| Trocar `/admin` quebra links antigos | Médio | Criar a rota explícita de submissões e manter o detalhe atual; validar todos os links antes do deploy. |
| Consultas de métricas deixarem o overview lento | Médio | Limitar consultas, usar contagens simples e carregar atividade em quantidade pequena. |
| Misturar layout público e admin novamente | Médio | Renderizar o shell no `AdminGate` e ocultar `SiteHeader` só para `/admin/**`. |
| “Produtos” sugerir um modelo novo | Baixo | Usar o rótulo apenas como tradução de `works`; nenhum schema novo. |
| Dados privados aparecerem em estado de erro | Alto | Manter RLS, app_metadata e consultas autenticadas; testar visitante e admin separadamente. |
| Upload editorial misturar mídia privada e pública | Alto | Manter `submission-media` privado, promover para `public-media` somente no publish e auditar políticas antes do E2E. |

## Fora do escopo nesta etapa

- Novo sistema de permissões além de `role=admin`.
- Nova dependência de UI, analytics ou dashboard externo.
- Reescrita do schema Supabase.
- Novo bucket, nova tabela de mídia ou escrita pública sem autenticação.

## Critério final de pronto

O admin deve parecer um único instrumento editorial: ao entrar, o usuário sabe o que precisa fazer; a sidebar mostra onde está; cada lista usa o mesmo padrão; e a estética de arquivo tecnoartesanal continua presente sem sacrificar legibilidade.
