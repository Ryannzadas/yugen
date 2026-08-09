# Yugen

> Catálogo, wiki e comunidade de animes em uma única plataforma.

O **Yugen** é uma aplicação web para descobrir animes, consultar informações, organizar uma biblioteca pessoal e participar de discussões com outros usuários. A interface responsiva em preto e branco foi inspirada no conceito visual Kurosaw.

[Acessar o Yugen](https://yugen-chi.vercel.app)

## Principais funcionalidades

- Home com destaques, recomendações, tendências e animes populares.
- Catálogo paginado com pesquisa e filtros avançados.
- Pesquisa de animes e perfis com sugestões em tempo real.
- Página individual com sinopse, trailer, personagens, equipe e músicas-tema.
- Interface em português, inglês e espanhol.
- Biblioteca com progresso, notas, favoritos, metas e lembretes.
- Importação de listas do MyAnimeList.
- Perfis públicos, seguidores, avatar e banner personalizados.
- Coleções pessoais e colaborativas.
- Discussões, respostas, curtidas, denúncias e notificações.
- Avaliações da comunidade.
- Wiki colaborativa com histórico de revisões e moderação.
- Tema escuro e claro com layout responsivo.

## Tecnologias

| Camada | Tecnologia |
| --- | --- |
| Frontend e backend | Next.js 16 e React 19 |
| Linguagem | TypeScript |
| Banco de dados | PostgreSQL no Neon |
| ORM | Drizzle ORM |
| Autenticação | Auth.js / NextAuth |
| Arquivos | Vercel Blob |
| Dados dos animes | Jikan e Shikimori |
| Deploy | Vercel |

## Como executar

O código da aplicação está diretamente na raiz deste repositório.

```powershell
git clone https://github.com/Ryannzadas/yugen.git
cd yugen

Copy-Item .env.example .env.local
npm install
npm run db:migrate
npm run dev
```

Depois, abra `http://localhost:3000`.

## Variáveis de ambiente

```env
DATABASE_URL=postgresql://usuario:senha@host/banco?sslmode=require
AUTH_SECRET=uma-chave-longa-e-aleatoria

# Opcionais
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
AUTH_APPLE_ID=
AUTH_APPLE_SECRET=
BLOB_READ_WRITE_TOKEN=
```

Não envie credenciais ou o arquivo `.env.local` para o GitHub.

## Banco de dados

Para criar ou atualizar as tabelas usando as migrações versionadas:

```powershell
npm run db:migrate
```

O banco armazena contas, biblioteca, progresso, coleções, seguidores, avaliações, discussões, notificações, revisões da wiki, moderação, traduções e cache dos provedores externos.

## Validação

```powershell
npm run typecheck
npm run lint
npm run build
```

## Deploy

O projeto está preparado para o Vercel. Ao importar o repositório, configure:

- **Root Directory:** raiz do repositório (`.` ou campo vazio)
- `DATABASE_URL`
- `AUTH_SECRET`
- `BLOB_READ_WRITE_TOKEN`, caso utilize avatar e banner.
- Credenciais Google e Apple, caso utilize login social.

Depois de conectar o Neon e cadastrar as variáveis, aplique as migrações e faça um novo deploy.

---

Desenvolvido como uma plataforma de descoberta e comunidade para fãs de anime.
