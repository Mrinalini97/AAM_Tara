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
4. After both complete, read alignment, differences, and conversation prompts. When the invitation is **ready**, you can also read each other’s questionnaire answers at `/partner/responses`.
5. Mark conversations and save a post-comparison reflection.
6. Delete your profile and responses in Settings.

## Admin dashboard

User onboarding, questionnaire selections, couple-report status, and whether both partners opened Understand us are only visible at [`/admin`](/admin), behind a separate admin login (not a regular account).

If the live database already exists, run `supabase/comparison-views.sql` in the SQL editor so viewing the shared report can be recorded.

1. Set `ADMIN_USERNAME`, `ADMIN_PASSWORD`, and `ADMIN_SESSION_SECRET` in `.env.local`.
2. Open `/admin/login`. Default local credentials are `admin_manasa` / `admin123`.
3. Keep `SUPABASE_SERVICE_ROLE_KEY` on the server so the dashboard can load all users.

Regular signed-in users cannot open this dashboard. For ad-hoc SQL, run `supabase/admin-queries.sql` in the Supabase SQL editor as a project owner.

## Local qualitative reports

When you finish the questionnaire, the server calls a local [Ollama](https://ollama.com) model to rewrite the qualitative self-report. There is no cloud LLM and no API key.

1. Install Ollama and pull the model: `ollama pull qwen3:4b-instruct` (Qwen3-4B-Instruct-2507).
2. Keep Ollama running (`ollama serve` if it is not already).
3. Optional `.env.local` overrides: `OLLAMA_BASE_URL` (default `http://127.0.0.1:11434`) and `OLLAMA_MODEL`.

If Ollama is not reachable, the app stores the rule-based report instead. To swap models later, implement `LlmProvider` in `src/lib/llm/` and set `LLM_PROVIDER`.

## Notes

- Questions live in `src/lib/questions/data.ts` so they can be edited without touching UI.
- Interpretation uses rules in `src/lib/engine/` plus a local LLM pass (`src/lib/llm/`) when you finish a reflection.
- Partners can read each other’s questionnaire answers only after both finish and the invitation is `ready` (RLS in `supabase/schema.sql`).
