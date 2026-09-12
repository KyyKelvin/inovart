# InovArt — arquitetura, pesquisa e contrato de implementação

## Resultado implementado

O projeto traduz o guia **“Arquivo Tecnoartesanal de Varginha”** para um MVP multipágina chamado **InovArt**. A experiência é uma vitrine cultural editorial — não um e-commerce — com arquivo público, chamada para participação, contato e backoffice de moderação. O projeto Supabase é isolado (`test-artesao`, região de São Paulo); o projeto preexistente `web-artesao` não foi modificado.

## Direção visual absorvida

- Fundo quase preto (`#080808`), painéis (`#0D0F0E`), linhas grafite (`#343A37`) e texto papel (`#F0F0EA`).
- Azul-cobalto (`#2347FF`) como ação e ritmo, verde ácido (`#55F58A`) para estado e magenta (`#F250C7`) apenas para alertas editoriais.
- Títulos serifados editoriais, pesados e compactos; metadados monoespaçados; janelas de sistema, coordenadas, grids, ruído e recortes abstratos. As imagens dos trabalhos recebem uma moldura própria inspirada no Windows XP — barra cobalto, controles em relevo e status — integrada à linguagem tecnoartesanal, sem transformar toda a interface em uma réplica de sistema operacional.
- Um “relicário” pseudo-3D no hero combina partículas em canvas, planos editoriais em perspectiva e resposta suave ao ponteiro. Os cards do acervo usam profundidade em camadas, sem esconder informação em hover.
- Movimento curto e funcional, com composição estática em telas de toque e quando `prefers-reduced-motion` estiver ativo. A orientação segue a recomendação oficial do Motion de desativar parallax e grandes transformações para pessoas que preferem movimento reduzido: [acessibilidade no Motion](https://motion.dev/docs/react-accessibility).
- Fotografias reais só entram com autorização; até lá, o site usa geometrias abstratas e sinaliza claramente o conteúdo demonstrativo.

## Arquitetura

O frontend usa Next.js 16 sobre o runtime vinext/Sites, React 19, Tailwind 4, componentes-base shadcn/Radix e Motion. O Supabase é a fonte de dados, autenticação e arquivos. As tabelas públicas só expõem registros publicados; contatos, submissões e mídia enviada permanecem privados.

Fluxo editorial:

1. A pessoa envia dados e até três trabalhos em `/participar`.
2. A submissão nasce como `pending` e as imagens vão para o bucket privado `submission-media`.
3. Um administrador autenticado por link mágico revisa em `/admin`.
4. Aprovação registra um evento de moderação, mas não publica automaticamente.
5. Artesão e trabalho entram como `draft`; somente a mudança explícita para `published` os torna públicos.

## Segurança e decisões verificadas

- RLS está ativado em todas as tabelas públicas, com políticas separadas para leitura anônima e administração autenticada. O verificador do Supabase não retornou avisos nem erros; as tabelas privadas deliberadamente fechadas permanecem sem políticas públicas. URLs substituídas ou arquivadas entram atomicamente em uma fila privada e só saem dela depois que o Storage confirma a remoção.
- A autorização administrativa usa `app_metadata.role = admin`; metadados editáveis pelo usuário não participam da decisão.
- Chaves secretas não são embarcadas no navegador. O frontend utiliza a chave publicável moderna. A documentação oficial recomenda publishable/secret keys para projetos novos e informa a transição das chaves legadas até o fim de 2026: [API keys do Supabase](https://supabase.com/docs/guides/api/api-keys).
- Projetos Supabase novos exigem privilégios SQL explícitos para exposição pela API; as migrações incluem `GRANT` e RLS de forma deliberada: [mudança de segurança do Data API](https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically).
- Arquivos aceitos: JPEG, PNG e WebP, até 5 MB. Assinatura binária e MIME são verificados; a função reorienta, limita a 12 MP, redimensiona para no máximo 1.800 px, remove metadados e reencoda em WebP. O processamento é sequencial para não reter todas as imagens em memória. O Supabase recomenda WASM em vez de Sharp e alerta que imagens grandes podem exceder recursos: [manipulação de imagens](https://supabase.com/docs/guides/functions/examples/image-manipulation). O desenho também considera os limites hospedados de 256 MB e 2 s de CPU por requisição: [limites de Edge Functions](https://supabase.com/docs/guides/functions/limits).
- O navegador não escreve diretamente nas tabelas nem nos buckets privados. O Site encaminha a operação com um segredo específico, limite de corpo por ação e uma impressão digital irreversível do cliente; a Edge Function repete validação, dupla limitação por cliente/e-mail e autorização administrativa. O padrão `verify_jwt = false` só é usado porque o handler valida sua própria credencial servidor-servidor, conforme a orientação para webhooks/segredos externos: [segurança de Edge Functions](https://supabase.com/docs/guides/functions/auth).
- A autenticação por e-mail usa link mágico, `shouldCreateUser: false` e uma conta previamente provisionada. A abordagem segue o pacote SSR oficial; autorização no servidor deve preferir validação de claims/usuário e nunca confiar apenas em `getSession()`: [Supabase SSR para Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs) e [escolha do pacote de autenticação](https://supabase.com/docs/guides/auth/choosing-a-server-package).

## Componentes 3D pesquisados e decisão de integração

- [shadcn/ui](https://ui.shadcn.com/docs): código-base adaptável, usado como infraestrutura e não como identidade visual pronta.
- [Radix Primitives](https://www.radix-ui.com/primitives): primitivas acessíveis para futuras expansões de diálogo, menus e seleção.
- [Motion for React](https://motion.dev/docs/react): entrada do hero, política global de movimento reduzido e transições de `transform`/`opacity`.
- O [3D Card Effect do Aceternity UI](https://ui.aceternity.com/components/3d-card-effect) confirmou o padrão de perspectiva CSS e elevação por `translateZ`. A mecânica foi reinterpretada em código próprio, com Pointer Events, foco visível, limite de inclinação e fallback estático — sem instalar a biblioteca ou importar sua aparência pronta.
- O [Floating 3D Particles do Magic UI](https://magicui.design/docs/components/floating-3d-particles) demonstrou que um campo pseudo-3D em canvas é suficiente para profundidade no hero sem Three.js. A versão InovArt usa menos partículas, resolução interna limitada, pausa fora da viewport/aba e três cores do contrato visual. Magic UI é distribuído sob [licença MIT](https://github.com/magicuidesign/magicui).
- [React Bits](https://github.com/DavidHDev/react-bits) foi avaliado como alternativa para tilt e transições pixeladas, mas não foi misturado ao efeito já implementado. Sua licença é MIT com Commons Clause, útil dentro de um produto final, mas restritiva para redistribuição de componentes: [licença React Bits](https://github.com/DavidHDev/react-bits/blob/main/LICENSE.md).
- [21st.dev](https://21st.dev/community/components/explore/components-gallery) permanece como catálogo de descoberta multi-autor. Cada item exige auditoria própria de licença e dependências; screenshots e materiais de demonstração não são reutilizados, conforme os [termos do 21st.dev](https://docs.21st.dev/terms).
- A decisão foi não instalar Three.js/R3F nesta fase: o requisito é profundidade editorial interativa, não visualização de um modelo 3D real. Isso reduz peso e consumo contínuo de GPU. Se o acervo receber futuramente um objeto `.glb` real, a evolução indicada é carregamento sob demanda com renderização por demanda e fallback DOM.
- O runtime atual segue a convenção `proxy.ts` introduzida no Next 16 quando middleware server-side for adicionado: [documentação do Next.js](https://nextjs.org/docs/app/getting-started/proxy).

## Modelo de dados

Entidades principais: `categories`, `artisans`, `artisan_contacts`, `works`, tabelas de relacionamento e mídia, `artisan_submissions`, `submission_works`, `contact_messages` e `moderation_events`. Índices cobrem status/data, relações e filas editoriais. Os arquivos aprovados usam o bucket público `public-media`; materiais submetidos ficam no bucket privado.

## Operação e ativação controlada

O acervo nasce sem pessoas fictícias publicadas. Para substituir a demonstração, são necessários retratos autorizados, biografias revisadas, técnicas, bairro, contatos com opção de divulgação e imagens/legendas dos trabalhos. A migração editorial reforçada, a Edge Function, o hash do segredo do proxy e o ambiente hospedado estão ativos exclusivamente no projeto Supabase `test-artesao`. O provisionamento de uma conta administrativa continua deliberadamente manual: a identidade escolhida deve existir no Supabase Auth e receber `{"role":"admin"}` em `app_metadata` antes de usar o link mágico.

## Critérios de aceite

- Rotas públicas responsivas em 360, 768 e 1440 px.
- Navegação por teclado, foco visível, link de salto, labels e mensagens em regiões `aria-live`.
- `prefers-reduced-motion` desativa animações não essenciais.
- Conteúdo real sempre vem do Supabase; o fallback é marcado como demonstrativo.
- Submissões e mensagens públicas passam apenas pelo proxy e pela Edge Function; não existe escrita anônima direta no banco ou Storage.
- Build, lint e verificação dos consultores Supabase devem passar antes da publicação.

## Fontes

1. Guia de Direção Visual InovaGeek, arquivo local `Guia_de_Direcao_Visual_InovaGeek.docx`, seções de identidade, componentes e movimento.
2. Aceternity UI. [3D Card Effect](https://ui.aceternity.com/components/3d-card-effect).
3. Magic UI. [Floating 3D Particles](https://magicui.design/docs/components/floating-3d-particles) e [repositório/licença MIT](https://github.com/magicuidesign/magicui).
4. React Bits. [Repositório oficial](https://github.com/DavidHDev/react-bits) e [MIT + Commons Clause](https://github.com/DavidHDev/react-bits/blob/main/LICENSE.md).
5. 21st.dev. [Termos de serviço](https://docs.21st.dev/terms).
6. Motion. [Accessibility](https://motion.dev/docs/react-accessibility).
7. Supabase. [Edge Functions: Limits](https://supabase.com/docs/guides/functions/limits), [Image Manipulation](https://supabase.com/docs/guides/functions/examples/image-manipulation), [Securing Edge Functions](https://supabase.com/docs/guides/functions/auth), [API keys](https://supabase.com/docs/guides/api/api-keys) e [SSR para Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs).
