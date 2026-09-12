# InovArt

Arquivo cultural de artesãos e trabalhos de Varginha, baseado no guia visual fornecido. Projeto local **test-artesao**.

## Desenvolvimento

Node 24; npm install; npm run dev. A prévia usa http://localhost:5173.

Comandos de validação:
- npm test
- npm run lint
- npx tsc --noEmit
- npm run build

O acervo público consulta Supabase. Conteúdo de demonstração aparece somente quando não há registros publicados e é identificado explicitamente. Erros de conexão não são tratados como acervo vazio.

## Rotas

Públicas: início, artesãos, perfil de artesão, trabalhos, detalhe de trabalho, sobre, contato e participação.

Editorial: login por link, fila de propostas, revisão com imagens privadas, edição de perfis/trabalhos/categorias e mensagens.

## Estado da integração

As seis migrações, a Edge Function e o proxy seguro do Site estão ativos no projeto isolado `test-artesao`. Os formulários públicos usam validação em duas camadas, limitação de abuso e armazenamento privado. Uma fila transacional com leases preserva a remoção pendente de mídias públicas, impede a exclusão de arquivos ainda referenciados e aplica novas tentativas com espera progressiva. Consulte o [estado da integração](docs/activation.md) para o passo deliberadamente manual de provisionamento da conta editorial.

Chaves privadas nunca usam `NEXT_PUBLIC_`. Copie `.env.example` para `.env.local` somente ao configurar um ambiente local; o segredo hospedado é gerenciado pelo Sites.

## Referências

- [Arquitetura e pesquisa](docs/architecture-and-research.md)
- [Migrações do Supabase](supabase/migrations)
- [Guia de ativação](docs/activation.md)

A camada de autenticação do Sites controla quem pode abrir a hospedagem privada. O papel editorial do Supabase é uma autorização separada.
