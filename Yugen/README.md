# Yugen

Catálogo e wiki social de animes em Next.js, com dados públicos da Jikan, biblioteca pessoal e discussões.

## Stack de produção

- Next.js 16 + React 19
- PostgreSQL no Neon
- Drizzle ORM
- Auth.js com email/senha e OAuth opcional (Google e Apple)
- Deploy no Vercel

## Executar localmente

1. Instale o Node.js 22.
2. Copie `.env.example` para `.env`.
3. Preencha `DATABASE_URL` e `AUTH_SECRET`.
4. Instale e prepare o banco:

   ```bash
   npm install
   npm run db:migrate
   npm run dev
   ```

O site fica disponível em `http://localhost:3000`.

## Configurar o Neon no Vercel

1. Abra o projeto no Vercel.
2. Acesse **Storage** → **Create Database** → **Neon**.
3. Conecte o banco ao projeto e confirme que `DATABASE_URL` foi criada para Production, Preview e Development.
4. Em **Settings** → **Environment Variables**, crie `AUTH_SECRET` com uma chave aleatória longa.
5. Rode a migração uma vez, usando a `DATABASE_URL` do Neon:

   ```bash
   npm run db:migrate
   ```

6. Faça um novo deploy no Vercel.

O diretório raiz do projeto no Vercel deve ser o diretório que contém este `package.json`. Se o GitHub mantiver a pasta `Yugen`, use **Root Directory: `Yugen`**.

## Login com Google (opcional)

Crie um cliente OAuth no Google Cloud, use a URL abaixo como callback e adicione as variáveis ao Vercel:

```text
https://SEU-DOMINIO/api/auth/callback/google
```

```env
AUTH_GOOGLE_ID=...
AUTH_GOOGLE_SECRET=...
```

## Login com Apple (opcional)

Configure o serviço no Apple Developer, use a callback abaixo e adicione as variáveis:

```text
https://SEU-DOMINIO/api/auth/callback/apple
```

```env
AUTH_APPLE_ID=...
AUTH_APPLE_SECRET=...
```

Sem essas variáveis, o login por email e senha continua disponível.

## Comandos

```bash
npm run dev          # desenvolvimento
npm run build        # build de produção
npm run typecheck    # validação TypeScript
npm run lint         # ESLint
npm run db:generate  # cria uma nova migração após alterar o schema
npm run db:migrate   # aplica as migrações no banco configurado
npm run db:push      # sincronização direta para desenvolvimento
```

## Dados de animes

Os títulos, imagens, sinopses, trailers, personagens, equipe e músicas-tema vêm da API pública da Jikan/MyAnimeList. Dados pessoais, biblioteca e discussões ficam no PostgreSQL do projeto.
