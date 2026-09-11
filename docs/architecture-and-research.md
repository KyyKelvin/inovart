# InovArt — arquitetura, pesquisa e contrato de implementação

## Resultado implementado

O projeto traduz o guia **“Arquivo Tecnoartesanal de Varginha”** para um MVP multipágina chamado **InovArt**. A experiência é uma vitrine cultural editorial — não um e-commerce — com arquivo público, chamada para participação, contato e backoffice de moderação. O projeto Supabase é isolado (`test-artesao`, região de São Paulo); o projeto preexistente `web-artesao` não foi modificado.

## Direção visual absorvida

- Fundo quase preto (`#080808`), painéis (`#0D0F0E`), linhas grafite (`#343A37`) e texto papel (`#F0F0EA`).
- Azul-cobalto (`#2347FF`) como ação e ritmo, verde ácido (`#55F58A`) para estado e magenta (`#F250C7`) apenas para alertas editoriais.
- Títulos serifados de alto contraste, metadados monoespaçados, janelas de sistema, coordenadas, grids, ruído e recortes abstratos.
- Movimento curto e funcional, com respeito a `prefers-reduced-motion`.
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

- RLS está ativado em todas as tabelas públicas, com políticas separadas para leitura anônima e administração autenticada. O verificador de segurança do Supabase retornou zero alertas após as migrações.
- A autorização administrativa usa `app_metadata.role = admin`; metadados editáveis pelo usuário não participam da decisão.
- Chaves secretas não são embarcadas no navegador. O frontend utiliza a chave publicável moderna. A documentação oficial recomenda publishable/secret keys para projetos novos e informa a transição das chaves legadas até o fim de 2026: [API keys do Supabase](https://supabase.com/docs/guides/api/api-keys).
- Projetos Supabase novos exigem privilégios SQL explícitos para exposição pela API; as migrações incluem `GRANT` e RLS de forma deliberada: [mudança de segurança do Data API](https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically).
- Arquivos aceitos: JPEG, PNG e WebP, até 5 MB. O limite e os MIME types são repetidos no navegador e no bucket. Antes de abertura pública ampla, recomenda-se acrescentar Cloudflare Turnstile e transformação server-side que remova EXIF e normalize para WebP.
- A autenticação por e-mail usa link mágico, `shouldCreateUser: false` e uma conta previamente provisionada. A abordagem segue o pacote SSR oficial; autorização no servidor deve preferir validação de claims/usuário e nunca confiar apenas em `getSession()`: [Supabase SSR para Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs) e [escolha do pacote de autenticação](https://supabase.com/docs/guides/auth/choosing-a-server-package).

## Componentes pesquisados e licença

- [shadcn/ui](https://ui.shadcn.com/docs): código-base adaptável, usado como infraestrutura e não como identidade visual pronta.
- [Radix Primitives](https://www.radix-ui.com/primitives): primitivas acessíveis para futuras expansões de diálogo, menus e seleção.
- [Motion for React](https://motion.dev/docs/react): entrada do hero e política global de movimento reduzido.
- [Magic UI](https://magicui.design/docs/components): referência MIT para grids e blur/reveal; o MVP recria apenas texturas discretas em CSS para evitar aparência de template.
- O runtime atual segue a convenção `proxy.ts` introduzida no Next 16 quando middleware server-side for adicionado: [documentação do Next.js](https://nextjs.org/docs/app/getting-started/proxy).

## Modelo de dados

Entidades principais: `categories`, `artisans`, `artisan_contacts`, `works`, tabelas de relacionamento e mídia, `artisan_submissions`, `submission_works`, `contact_messages` e `moderation_events`. Índices cobrem status/data, relações e filas editoriais. Os arquivos aprovados usam o bucket público `public-media`; materiais submetidos ficam no bucket privado.

## Operação e próximos dados necessários

O acervo nasce sem pessoas fictícias publicadas. Para substituir a demonstração, são necessários retratos autorizados, biografias revisadas, técnicas, bairro, contatos com opção de divulgação e imagens/legendas dos trabalhos. Também é necessário provisionar a conta do administrador no Supabase Auth e atribuir `{"role":"admin"}` em `app_metadata` antes do primeiro login mágico.

## Critérios de aceite

- Rotas públicas responsivas em 360, 768 e 1440 px.
- Navegação por teclado, foco visível, link de salto, labels e mensagens em regiões `aria-live`.
- `prefers-reduced-motion` desativa animações não essenciais.
- Conteúdo real sempre vem do Supabase; o fallback é marcado como demonstrativo.
- Submissões e mensagens podem ser inseridas anonimamente, mas nunca lidas anonimamente.
- Build, lint e verificação dos consultores Supabase devem passar antes da publicação.
