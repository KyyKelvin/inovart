# Checklist — reestruturação da área administrativa

## Fase 1 — Workspace

- [x] Task 1: Criar o shell administrativo
- [x] Task 2: Tornar a nomenclatura operacional consistente

### Checkpoint

- [ ] Shell responsivo, autenticado e sem header público duplicado
- [ ] Testes, lint e build passam

## Fase 2 — Curadoria

- [x] Task 3: Reorganizar a visão geral
- [x] Task 4: Dar à fila uma leitura de triagem

### Checkpoint

- [ ] Solicitação percorre lista → detalhe → decisão → fila
- [ ] Aprovação continua criando rascunhos

## Fase 3 — Catálogo

- [ ] Task 5: Padronizar listas do catálogo
- [ ] Task 6: Responsividade e acessibilidade do workspace
- [ ] Task 7: Fechar o fluxo de mídia editorial (submissão já funciona; upload direto no editor ainda não existe)

### Checkpoint final

- [ ] Todas as rotas carregam o mesmo workspace
- [ ] `npm test`, `npx tsc --noEmit`, lint e `npm run build` passam
- [ ] Produção sem erros no console

## Auditoria de mídia — resultado atual

- [x] Submissão pública aceita JPEG/PNG/WebP até 5 MB e envia multipart para a Edge Function.
- [x] `submission-media` privado; leitura de revisão por URL assinada.
- [x] Promoção para `public-media` acontece no fluxo editorial de publicação.
- [x] Políticas de Storage restringem escrita/alteração a admin autenticado.
- [ ] Upload/substituição de imagem diretamente em `/admin/artesaos` e `/admin/trabalhos` — escopo da Task 7.
