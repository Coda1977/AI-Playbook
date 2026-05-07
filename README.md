# AI Playbook

Workshop tool for managers: answer 7 intake questions, then AI helps discover personalized AI use cases and build a behavioral-science-based change strategy. Output is a one-page plan exportable to Word.

## Tech stack

- **Frontend**: React 19, Vite 7, Tailwind CSS 4
- **API**: Vercel Serverless Functions (Node) calling the Claude API (Sonnet 4.6)
- **State**: React Context + `localStorage` (no database)
- **Export**: `docx` + `file-saver` for Word output
- **Hosting**: Vercel (auto-deploys from `master`)

## Local development

### 1. Prerequisites

- Node 20+
- An Anthropic API key. Get one at [console.anthropic.com](https://console.anthropic.com/) under **Settings -> API Keys**.
- Vercel CLI: `npm install -g vercel` (needed to run the `/api` routes locally)

### 2. Setup

```bash
git clone https://github.com/Coda1977/AI-Playbook.git
cd AI-Playbook
npm install
cp .env.example .env   # then paste your key into .env
```

### 3. Run

```bash
vercel dev    # runs Vite + the /api/* serverless functions on one port
```

Open the URL it prints (usually `http://localhost:3000`).

> **Important:** `npm run dev` runs Vite alone and the `/api/*` endpoints will 404. Always use `vercel dev` for full-stack local dev. The first run will prompt you to link the project to Vercel — pick **No** if you just want to run locally.

### 4. Build / lint

```bash
npm run build   # production build, must pass before any commit
npm run lint    # eslint
```

## Project structure

```
api/                              # Vercel serverless functions (Node)
  primitives-generate.js          #   Phase 2: initial use case generation
  playbook-generate.js            #   Phase 3: initial change strategy generation
  synthesis-generate.js           #   Phase 4: one-page plan synthesis
  chat.js                         #   ongoing chat for Phases 2 + 3
src/
  App.jsx                         # phase routing + top-level state
  components/
    views/                        # one component per phase
      IntakeView.jsx              #   Phase 1: 7-question form
      PrimitivesView.jsx          #   Phase 2: AI Use Cases
      PlaybookView.jsx            #   Phase 3: Change Strategy
      CommitmentView.jsx          #   Phase 4: Review
      SynthesisView.jsx           #   Phase 4: One-page plan
    primitives/                   # IdeaCard, CategorySection, AddIdeaInput
    playbook/                     # ActionCard, RuleSection
    shared/                       # Header, Toast, ConfirmModal, ChatDrawer, etc.
  config/                         # categories.js, rules.js, constants.js
  context/                        # AppContext, ToastContext, FlashContext
  utils/
    api.js                        # fetch wrappers for the /api routes
    export.js                     # Word export
    storage.js                    # localStorage helpers
docs/superpowers/                 # design docs and implementation plans
CLAUDE.md                         # project rules and AI behavior notes (also useful for humans)
```

## Architecture in one paragraph

State lives in `AppContext` and is persisted to `localStorage` after every change — there is no backend database. The four phases are linear: Intake -> Use Cases -> Change Strategy -> Review. The first three call serverless API endpoints under `/api/*`, which proxy the Claude API using the server-side `ANTHROPIC_API_KEY`. Chat in Phases 2 and 3 returns a dual-format response (prose + `---IDEAS---` separator + a JSON array of suggestions) that the client splits into conversational text and addable cards.

## Deployment

Pushes to `master` auto-deploy to Vercel. Set `ANTHROPIC_API_KEY` in **Vercel project -> Settings -> Environment Variables** for both Preview and Production. Function timeout is set to 60s in `vercel.json` (some Sonnet generations are slow).

## Conventions

- Feature branches + PRs. Don't push directly to `master`.
- `npm run build` must pass before committing.
- Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`).
- See `CLAUDE.md` for design-system constraints (typography, palette, copy rules) and notes on how the AI prompts are tuned.
