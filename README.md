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

As duas migrações iniciais foram aplicadas. A conclusão do fluxo editorial está em [ativação pendente](docs/activation.md), pois a revisão automática bloqueou a alteração do banco. O frontend está preparado e mantém envios desativados até que a ativação seja concluída e testada.

Não definir INOVART_BACKEND_READY=true antes da migração, da função e dos testes. Copiar .env.example para .env.local somente ao configurar o ambiente. Chaves privadas nunca usam NEXT_PUBLIC_.

## Referências

- [Arquitetura e pesquisa](docs/architecture-and-research.md)
- [SQL para revisão](docs/pending-editorial-migration.sql)
- [Guia de ativação](docs/activation.md)

A camada de autenticação do Sites controla quem pode abrir a hospedagem privada. O papel editorial do Supabase é uma autorização separada.
