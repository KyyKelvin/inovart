# Ativação pendente do backend InovArt

A implementação local está preparada para a etapa editorial, mas esta etapa ainda não foi aplicada ao Supabase. A revisão automática recusou duas tentativas por considerar mudanças persistentes de esquema e permissões amplas para a autorização disponível.

## Escopo exato a autorizar

Destino exclusivo: **test-artesao**, referência **fpjxixijldymlkajenck**. O projeto web-artesao está fora do escopo.

Arquivo de revisão: [pending-editorial-migration.sql](./pending-editorial-migration.sql).

A alteração adiciona:
- consentimento separado para divulgação de cada canal de contato;
- vínculos entre submissões, perfis e trabalhos;
- tabela pública contendo apenas contatos autorizados;
- transações de salvamento e revisão, com aprovação que cria rascunhos de forma idempotente;
- configuração privada da integração, dupla limitação por cliente/e-mail e índice de expiração;
- publicação editorial transacional para metadados, galeria sem posições duplicadas e caminhos públicos versionados;
- arquivamento transacional que oculta o perfil, suas obras e relações antes da limpeza segura das mídias públicas;
- atualização automática de datas e sincronização dos contatos consentidos.

Ela também retira os INSERTs anônimos diretos em submissões/mensagens/storage, substituindo-os pelo endpoint de servidor validado, e limita relações públicas a registros publicados. Não apaga tabelas ou conteúdo editorial existente.

## Sequência após autorização

1. Aplicar o SQL revisado ao projeto indicado e salvar o identificador real retornado na pasta de migrações. Executar consultores e testes de permissões com os papéis anon, authenticated e service_role.
2. Gerar um token aleatório de servidor; gravar apenas o SHA-256 em private.integration_settings com a chave proxy_token_sha256. Guardar o token em INOVART_PROXY_TOKEN no Sites e em .env.local (ignorado pelo Git).
3. Implantar a função inovart-api. Ela possui autenticação própria pelo token de servidor e valida separadamente cada JWT administrativo usando getUser. O flag verify_jwt fica false porque não aceita chamadas diretas de navegador.
4. Provisionar a conta editorial autorizada em Supabase Auth com app_metadata.role=admin, sem senha compartilhada. Configurar callbacks localhost e URL privada do Sites; desativar cadastro público e conferir entrega de e-mail.
5. Testar um envio sintético, as duas imagens por trabalho, rejeições de arquivo inválido, limite de 12 MP, privacidade dos dados, limitação de abuso, revisão, aprovação idempotente, rascunho, publicação, substituição de galeria e arquivamento. Remover apenas dados sintéticos identificados do teste.
6. Definir INOVART_BACKEND_READY=true e republicar o Site privado.

Enquanto a ativação estiver pendente, os endpoints retornam indisponibilidade e preservam os formulários preenchidos. Não simulam envio bem-sucedido.

Abertura para audiência pública exige configurar antispam adicional e revisar consentimentos/conteúdo real. O Site criado neste fluxo é uma prévia privada.
