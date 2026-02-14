# AI Playbook - Project Guidelines

## Project Overview

**AI Playbook** is a workshop tool that helps managers discover personalized AI use cases and build change management strategies. It combines AI-powered discovery with behavioral science principles.

### Purpose
- Phase 1: Intake (7-question form about role, team, fluency, risks, vision)
- Phase 2: AI Use Cases (discover 6 categories of AI applications)
- Phase 3: Change Strategy (5 behavioral science rules for adoption)
- Phase 4: Review & Export (PDF/Word download)

## Tech Stack

- **React 19** with hooks (useState, useEffect, useContext, useReducer)
- **Vite 7** for build tooling
- **Tailwind CSS 4** via `@tailwindcss/vite`
- **Claude Sonnet 4.5 API** for AI generation
- **Vercel Serverless Functions** for API routes
- **docx** library for Word export
- **localStorage** for state persistence (no backend database)

## Design System

### Brand Identity
- **App Name**: "AI Playbook" (not "AI Primitives + Playbook")
- **Aesthetic**: Bold modern -- high contrast black/white/red, magazine editorial feel
- **Typography**: Montserrat (headings, body, and UI -- single font family, weights 400-700)
- **No Roboto Condensed** -- fully removed as of Feb 2026 redesign

### Color Palette
```css
--color-black: #000000        /* Primary backgrounds, text */
--color-charcoal: #222222     /* Secondary dark surfaces */
--color-white: #ffffff         /* Card backgrounds, main bg */
--color-red: #e30613          /* Primary accent, CTAs, stars */
--color-red-hover: #c00510    /* Hover state */
--color-red-light: #fff2f3    /* Starred item backgrounds */
--color-electric-blue: #00a3e0 /* Category badges, secondary accent */
--color-surface: #f5f5f5      /* Subtle backgrounds */
--color-light-gray: #cccccc   /* Borders */
```

### Design Principles
- High contrast black/white with red accent (no paper grain -- disabled)
- Generous whitespace and breathing room
- Smooth fade-in animations (no jarring transitions)
- Star system for prioritization (red stars = priorities)
- Bold, editorial aesthetic with dark hero sections and card-based layout
- Sticky navigation elements (header, category nav, gate bar, intake progress)

## Phase Naming Convention

**CRITICAL**: Use consistent naming across the app:
- Phase 2: "**AI Use Cases**" (not "Discovery" or "Primitives")
- Phase 3: "**Change Strategy**" (not "Playbook" or "Change Management")

This clarity helps users understand:
- Step 2 = What AI can do (implementation)
- Step 3 = How to get teams to adopt it (change management)

## State Management

- **Context**: `AppContext` (global state) + `ToastContext` (notifications)
- **Storage**: Auto-saves to `localStorage` on every state change
- **Structure**:
  ```javascript
  {
    phase: "intake" | "primitives" | "playbook" | "commitment",
    intake: { role, helpWith, responsibilities, ... },
    primitives: { content: [], automation: [], research: [], data: [], coding: [], ideation: [] },
    plan: { destination: [], safe: [], script: [], small: [], visible: [] }
  }
  ```

## API Routes (Vercel Functions)

Located in `/api/`:
- `primitives-generate.js` - Generates 2-3 AI use cases per category
- `playbook-generate.js` - Generates 2-3 actions per rule
- `chat.js` - "Go Deeper" conversational AI (not yet implemented in this example)

### Important API Notes
- All routes use **Claude Sonnet 4.5** (`claude-sonnet-4-5-20250929`)
- Requires `ANTHROPIC_API_KEY` environment variable
- Prompts are carefully crafted - preserve tone and structure when modifying
- Error handling returns user-friendly messages (not technical errors)

### Chat Brevity Constraints (`api/chat.js`)
Chat system prompts enforce strict brevity to prevent verbose AI responses:
- **60-word hard limit** on conversational text (before `---IDEAS---` separator)
- **Banned patterns**: no preamble ("Great question!"), no recap of user input, no filler
- **"Count them" self-check** at end of each system prompt (recency bias enforcement)
- **max_tokens: 512** (down from 1024) to physically cap output length
- Persona-level brevity: AI is positioned as "direct, practical expert" not a verbose peer
- When modifying chat prompts, preserve these constraints -- verbosity creep is the #1 issue

## Code Style & Conventions

### Component Organization
```
src/
  components/
    shared/         # Reusable (Header, Toast, Modal, etc.)
    primitives/     # Phase 2 specific (IdeaCard, CategorySection)
    playbook/       # Phase 3 specific (ActionCard, RuleSection)
    views/          # Full-page views (IntakeView, PrimitivesView, etc.)
  config/           # Categories, Rules, Constants
  context/          # React Context providers
  utils/            # Storage, API helpers
```

### Naming Conventions
- Components: PascalCase (e.g., `IdeaCard.jsx`)
- Files: Match component name exactly
- CSS classes: kebab-case (e.g., `action-card`, `gate-counter`)
- State actions: SCREAMING_SNAKE_CASE (e.g., `ADD_PRIMITIVE`, `TOGGLE_STAR`)

### React Patterns
- Prefer functional components with hooks
- Use `useCallback` for callbacks passed to children
- Use `useRef` for DOM refs and mutable values that don't trigger re-renders
- Keep components focused (single responsibility)
- Extract complex logic into custom hooks when needed

## Animation Guidelines

### Existing Animations
- `fadeInUp` - Main entrance animation (0.45s ease-out)
- `slideUp` - Toast notifications (0.3s ease-out)
- `starPop` - Star button click (0.4s with rotation)
- `counterPulse` - Number counter update (0.6s scale + color)
- `bloomBg` - Background flash when starring (0.5s)
- `glowPulse` - CTA button pulse (2s infinite), also used on active gen step icons
- `pillSelect` - Help chip selection bounce (0.25s scale)
- `scaleIn` - Modal/ready-check entrance (0.4s)

### Animation Principles
- **Subtle, not showy** - Enhance UX without being distracting
- **Performance** - Use `transform` and `opacity` (GPU accelerated)
- **Consistent timing** - Most animations 0.3-0.5s
- **Stagger delays** - Use `animationDelay` for sequential reveals

## User Experience Patterns

### Micro-Interactions
- ⭐ **Starring**: Click → pop animation → toast notification → counter pulse
- ✏️ **Editing**: Inline editing with auto-focus and Enter/Escape shortcuts
- 🗑️ **Deleting**: Two-click confirmation (3-second timeout)
- 💬 **Chat drawer**: Slides in from right, backdrop click to close

### Form Controls
- **Help pills**: Multi-select with check icon + scale animation on selection
- **Fluency selector**: Custom radio dots (not checkbox icons) with scale-in transition
- **Loading screen**: Step-by-step progress with percentage bar, active step glow

### Empty States
- Show helpful nudges when sections are empty
- Gate buttons disabled with opacity until requirements met
- Clear messaging about what's needed to proceed

### Review Page (CommitmentView)
- Flow: Hero -> Stats -> Priorities box (starred only) -> Full detail by category -> Full detail by rule -> Buttons
- No redundant 2-column overview -- priorities box replaces it

### Navigation & Progress
- **Sticky intake progress**: "X of 7 complete" bar at top of intake form with red fill
- **Sticky category nav**: Horizontal tabs on PrimitivesView, IntersectionObserver tracks active section
- **Sticky gate bar**: Stays at bottom of viewport with progress text ("2 of 3 starred -- star 1 more")
- **Regeneration guard**: ConfirmModal warns before replacing existing primitives

### Validation
- Word-count based feedback (not character count): 0/5/15/16+ word thresholds
- Color-coded hints (amber for short, green for detailed)
- Shake animation on invalid submit attempts
- Scroll to first error field automatically

## File Export

### PDF Export
- Uses browser's `window.print()` function
- Print-specific CSS in `@media print` block with `@page { margin: 0.75in }`
- Forces white backgrounds on dark elements (hero, stats, card headers)
- Global `* { color: black !important }` with exceptions for red stars
- `page-break-inside: avoid` on rules and priorities
- Hides UI chrome (buttons, header, `.no-print` class)
- Shows print-only elements (`.commitment-header-print`)

### Word (.docx) Export
- Uses `docx` library + `file-saver`
- Separate exports for "AI Use Cases" and "Change Strategy"
- Preserves starred priorities at top
- Includes role context and date

## Development Workflow

### Local Development
```bash
npm install
vercel dev          # Runs local dev with API routes
```

### Environment Variables
Create `.env` file:
```
ANTHROPIC_API_KEY=sk-ant-...
```

### Build & Deploy
```bash
npm run build       # Vite production build
vercel deploy       # Deploy to Vercel
```

### Testing Checklist
Before committing changes:
1. ✅ Run `npm run build` (must succeed)
2. ✅ Test all 4 phases end-to-end
3. ✅ Verify localStorage persistence (refresh page)
4. ✅ Test star/unstar with toast notifications
5. ✅ Test PDF export (print preview)
6. ✅ Test Word export (both files download)

## Behavioral Science Framework

The 5 rules are grounded in research:
1. **Start at the End** (Destination + Emotional Resonance)
2. **Make It Safe** (Psychological Safety - Amy Edmondson)
3. **Script the Steps** (Concrete Instructions - Heath Brothers)
4. **Start Small** (Small Wins - Karl Weick)
5. **Make Progress Visible** (Communication - Kotter)

**Important**: Don't dilute the science. The prompts in `playbook-generate.js` are carefully calibrated to generate specific, actionable advice based on these principles.

## Common Pitfalls to Avoid

❌ **Don't** change phase names back to "Discovery" or "Playbook"
✅ **Do** use "AI Use Cases" and "Change Strategy" consistently

❌ **Don't** add generic placeholder content
✅ **Do** ensure all AI-generated content is personalized to the user's role

❌ **Don't** break the 4-phase linear flow
✅ **Do** maintain the progression: Intake → Use Cases → Strategy → Review

❌ **Don't** add complex state management (Redux, etc.)
✅ **Do** keep it simple with Context + localStorage

❌ **Don't** over-animate or add flashy effects
✅ **Do** keep animations subtle and purposeful

❌ **Don't** add `transition: all` to flex containers (breaks layout on chat panel close)
✅ **Do** transition specific properties only, or omit transition on `.canvas-rules`

❌ **Don't** use Roboto Condensed or any font besides Montserrat
✅ **Do** use `var(--font-ui)` / `var(--font-heading)` / `var(--font-sans)` (all Montserrat)

## Git Workflow

- Use clear, concise commit messages (see git history for style)
- Always include `Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>`
- Build before committing (`npm run build`)
- Always work on a feature branch and open a PR -- never push directly to `master`
- `master` deploys to Vercel automatically

## Future Enhancements (Ideas)

- Full chat/conversation AI for "Go Deeper" feature
- Team collaboration (multi-user sessions)
- Save/load multiple playbooks
- Email delivery of exported documents
- Analytics/tracking (adoption metrics over time)
- Template library (pre-built use cases by role)

---

**Last Updated**: February 2026
**Maintainer**: Yonat
**AI Assistant**: Claude Opus 4.6 (development) / Claude Sonnet 4.5 (API generation)
