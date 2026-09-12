# Estado da integração InovArt

O backend foi ativado em 11 de setembro de 2026 exclusivamente no projeto Supabase **test-artesao** (`fpjxixijldymlkajenck`). O projeto preexistente `web-artesao` permaneceu fora do escopo.

## Ativado

- Seis migrações aplicadas e preservadas em `supabase/migrations`, com o histórico local sincronizado ao remoto. A mais recente, `20260912191350_harden_media_cleanup_leases`, protege a fila de mídia com leases, backoff e uma verificação de referências antes de qualquer remoção.
- Escritas anônimas diretas removidas; formulários passam pelo proxy do Site e pela Edge Function `inovart-api`.
- Segredo servidor-servidor gerado aleatoriamente; somente o SHA-256 é armazenado no banco e o valor original fica como segredo do Sites.
- `INOVART_BACKEND_READY=true`, origem privada do Site e segredo do proxy configurados no ambiente hospedado.
- Consentimento separado para divulgação de e-mail, telefone e Instagram.
- Limitação por cliente e e-mail, validação binária de imagens e publicação/arquivamento transacionais.
- Limites de corpo aplicados durante a leitura e dimensões JPEG, PNG e WebP verificadas antes da decodificação.
- Relações públicas limitadas a artesãos e trabalhos publicados.

## Acesso editorial

O login administrativo continua fechado por desenho: `shouldCreateUser: false` impede cadastro público. Para liberar uma pessoa, um administrador do projeto precisa provisioná-la no Supabase Auth e definir `app_metadata.role = "admin"`. Essa etapa exige escolher explicitamente a conta editorial e confirmar a entrega do link mágico; não deve ser automatizada com uma identidade presumida.

## Publicação

O Site permanece privado e acessível apenas ao proprietário. Antes de torná-lo público, revisar o conteúdo real, os consentimentos, a política de privacidade e a proteção antispam de produção.
