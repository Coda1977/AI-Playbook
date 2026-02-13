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
- **Aesthetic**: Warm editorial minimalism (Matemática del Alma inspired)
- **Typography**: DM Serif Display (headings) + DM Sans (body)

### Color Palette
```css
--color-cream: #F5F0E8        /* Background */
--color-ink: #1A1A1A          /* Primary text */
--color-accent: #D97706       /* Orange accent */
--color-accent-glow: #FBBF24  /* Starred items */
--color-muted: #78716C        /* Secondary text */
--color-card: #FFFDF9         /* Card backgrounds */
--color-border: #DDD6CA       /* Borders */
```

### Design Principles
- Paper grain texture overlay for warmth
- Generous whitespace and breathing room
- Smooth fade-in animations (no jarring transitions)
- Star system for prioritization (⭐ = priorities)
- Minimal, editorial aesthetic (not generic AI-looking)

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
- `glowPulse` - CTA button pulse (2s infinite)

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

### Empty States
- Show helpful nudges when sections are empty
- Gate buttons disabled with opacity until requirements met
- Clear messaging about what's needed to proceed

### Validation
- Real-time feedback with color-coded hints (orange → green)
- Shake animation on invalid submit attempts
- Scroll to first error field automatically

## File Export

### PDF Export
- Uses browser's `window.print()` function
- Print-specific CSS in `@media print` block
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

## Git Workflow

- Use clear, concise commit messages (see git history for style)
- Always include `Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>`
- Build before committing (`npm run build`)
- Push to `master` branch (deploys to Vercel automatically)

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
**AI Assistant**: Claude Sonnet 4.5
