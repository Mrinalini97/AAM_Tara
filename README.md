# Tara

A private reflection tool for people considering a life partner. It is not a dating app and it does not produce a compatibility score.

## Local setup

1. Create a [Supabase](https://supabase.com) project.
2. In **Authentication → Providers**, enable Email. For local testing, turn **off** “Confirm email”.
3. In the SQL editor, run `supabase/schema.sql`.
4. Copy `.env.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

5. Install and run:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## What you can do

1. Create an account and complete the self-discovery questionnaire (progress is saved).
2. Read a qualitative relationship profile (no scores).
3. Invite a partner with a private `/invite/{token}` link. They cannot see your answers first.
4. After both complete, read alignment, differences, and conversation prompts.
5. Mark conversations and save a post-comparison reflection.
6. Delete your profile and responses in Settings.

## Notes

- Questions live in `src/lib/questions/data.ts` so they can be edited without touching UI.
- Interpretation is rule-based in `src/lib/engine/` so an LLM layer can be added later.
- Raw answers are never shared between partners; only generated comparison content is.
