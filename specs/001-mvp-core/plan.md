# Implementation Plan: Writing Timeline Platform MVP

**Branch**: `001-mvp-core` | **Date**: 2025-10-18 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-mvp-core/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build a platform that captures and visualizes the writing process by recording every keystroke as events, replaying them as animated timelines, and comparing drafts. Core features:
1. **Smart Editor** - Captures writing events (insert/delete/replace) in real-time with offline support via IndexedDB
2. **Timeline Playback** - Replays writing process with condensed timing (10s+ delays compressed to 2-3s)
3. **Diff Viewer** - Side-by-side comparison of first draft vs final version

Technical approach: Event sourcing pattern with Next.js 14 + Supabase, using Zustand for client state (editor, local queue) and React Query for server sync.

## Technical Context

**Language/Version**: TypeScript (ES2022+) with Next.js 14.2+
**Primary Dependencies**:
- Frontend: Next.js 14 (App Router), React 18, Zustand 4.x, @tanstack/react-query 5.x
- Backend: Supabase JS SDK 2.x, @supabase/auth-helpers-nextjs
- Storage: Dexie.js 3.x (IndexedDB wrapper)
- UI: Tailwind CSS 3.x, Radix UI primitives
- Diff: diff-match-patch or myers-diff

**Storage**:
- Server: PostgreSQL 15+ (Supabase managed) - event sourcing tables
- Client: IndexedDB (via Dexie.js) - offline event queue

**Testing**:
- Unit: Vitest (Next.js compatible)
- Integration: Playwright (E2E)
- Contract: API route tests with MSW

**Target Platform**: Web (Chrome 100+, Firefox 100+, Safari 15+), Vercel deployment
**Project Type**: Web application (Next.js full-stack)
**Performance Goals**:
- Event capture latency < 100ms (P95)
- Playback at 60fps
- Page load < 2s (P95)
- Handle 100,000 events per document smoothly

**Constraints**:
- Maximum document length: 50,000 characters
- Zero data loss on network failures (constitution requirement)
- All documents private by default
- Event sourcing must be append-only (no event modification)

**Scale/Scope**:
- MVP: Single-user editor, basic playback, simple diff
- Expected: ~100 users, 1,000 documents, 10M events in first month

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### ✅ Event Sourcing First (NON-NEGOTIABLE)
- **Requirement**: All user actions captured as immutable events
- **Status**: ✅ PASS
- **Evidence**: Database schema includes `writing_events` table with append-only semantics, event replay engine planned

### ✅ Privacy by Default
- **Requirement**: All documents default to private, explicit consent for public
- **Status**: ✅ PASS
- **Evidence**: Database schema has `visibility VARCHAR(20) DEFAULT 'private'`

### ✅ Zero Data Loss
- **Requirement**: No data loss on network/browser failures
- **Status**: ✅ PASS
- **Evidence**: IndexedDB local queue planned, background sync strategy defined

### ✅ Performance Standards
- **Requirement**: < 100ms capture, 60fps playback, < 2s load
- **Status**: ✅ PASS
- **Evidence**: Performance goals explicitly defined, debouncing and batching strategies in spec

### ✅ Progressive Enhancement
- **Requirement**: Features built incrementally, core first
- **Status**: ✅ PASS
- **Evidence**: Phase-based development plan (Editor → Playback → Diff)

### Post-Phase 1 Re-check
*Completed: 2025-10-18*

✅ **Event Sourcing First**: data-model.md defines immutable `writing_events` table with triggers
✅ **Privacy by Default**: RLS policies enforce private-by-default in database layer
✅ **Zero Data Loss**: IndexedDB schema defined in data-model.md with `synced` flag
✅ **Performance Standards**: Compound indexes on (document_id, timestamp) for <50ms queries
✅ **Progressive Enhancement**: Project structure shows phased components (editor/ → playback/ → diff/)

**Result**: ✅ ALL PRINCIPLES SATISFIED

## Project Structure

### Documentation (this feature)

```
specs/001-mvp-core/
├── spec.md              # Feature specification (complete)
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (technology research)
├── data-model.md        # Phase 1 output (database schema details)
├── quickstart.md        # Phase 1 output (local dev setup)
├── contracts/           # Phase 1 output (API contracts)
│   ├── documents.yaml   # Document CRUD endpoints
│   ├── events.yaml      # Event storage/retrieval
│   └── auth.yaml        # Supabase auth flows
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```
# Next.js 14 App Router full-stack structure
app/
├── (auth)/
│   ├── login/
│   ├── signup/
│   └── magic-link/
├── (editor)/
│   ├── documents/
│   │   ├── [id]/
│   │   │   ├── page.tsx        # Editor page
│   │   │   └── playback/
│   │   │       └── page.tsx    # Playback mode
│   │   └── new/
│   │       └── page.tsx        # Create document
│   └── layout.tsx
├── (reader)/
│   └── read/
│       └── [id]/
│           └── page.tsx        # Public reading view
├── api/
│   ├── documents/
│   │   ├── route.ts            # POST /api/documents
│   │   └── [id]/
│   │       ├── route.ts        # GET, PATCH /api/documents/:id
│   │       ├── events/
│   │       │   └── route.ts    # POST, GET /api/documents/:id/events
│   │       └── versions/
│   │           └── route.ts    # GET /api/documents/:id/versions
│   └── auth/
│       └── callback/
│           └── route.ts        # Supabase auth callback
├── layout.tsx
└── page.tsx                    # Landing page

components/
├── editor/
│   ├── SmartEditor.tsx         # Main editor component
│   ├── EditorToolbar.tsx
│   └── CharacterCounter.tsx
├── playback/
│   ├── PlaybackPlayer.tsx
│   ├── PlaybackControls.tsx
│   └── TimelineSlider.tsx
├── diff/
│   ├── DiffViewer.tsx
│   └── DiffHighlight.tsx
└── ui/                         # Radix UI wrappers
    ├── Button.tsx
    ├── Input.tsx
    └── ...

lib/
├── supabase/
│   ├── client.ts               # Supabase client setup
│   ├── server.ts               # Server-side client
│   └── middleware.ts
├── db/
│   ├── indexeddb.ts            # Dexie.js setup
│   └── schema.ts               # IndexedDB schema
├── event-sourcing/
│   ├── capture.ts              # Event capture logic
│   ├── replay.ts               # Event replay engine
│   └── queue.ts                # Local queue management
├── diff/
│   └── myers-diff.ts           # Diff algorithm
└── utils/
    ├── debounce.ts
    └── time.ts

stores/
├── editorStore.ts              # Zustand: editor state
└── queueStore.ts               # Zustand: local event queue

hooks/
├── useEventCapture.ts
├── useEventSync.ts             # React Query: sync events
└── useDocuments.ts             # React Query: CRUD

types/
├── events.ts
├── documents.ts
└── api.ts

public/
└── ...

supabase/
├── migrations/
│   ├── 001_initial_schema.sql
│   └── 002_indexes.sql
└── config.toml

tests/
├── unit/
│   ├── event-sourcing/
│   │   ├── capture.test.ts
│   │   └── replay.test.ts
│   └── diff/
│       └── myers-diff.test.ts
├── integration/
│   └── api/
│       ├── documents.test.ts
│       └── events.test.ts
└── e2e/
    ├── editor.spec.ts
    ├── playback.spec.ts
    └── auth.spec.ts
```

**Structure Decision**:
Next.js 14 App Router full-stack structure chosen for:
- Colocation of routes and components (improved DX)
- Built-in API routes (no separate backend server)
- Server components for initial load performance
- Clear separation: (auth), (editor), (reader) route groups

## Complexity Tracking

*No constitution violations - all principles satisfied in design*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | N/A | N/A |

---

## Phase 0: Research & Technology Decisions ✅

*Output: research.md - COMPLETE (2025-10-18)*

### Research Tasks
1. ✅ IndexedDB wrapper library evaluation → **Dexie.js 3.x**
2. ✅ Diff algorithm selection → **diff-match-patch (Google)**
3. ✅ Event batching strategy → **Hybrid: time (500ms) + size (50 events) + checkpoints**
4. ✅ Next.js 14 App Router + Supabase integration → **@supabase/ssr package**
5. ✅ Playback animation performance → **React DOM (not Canvas)**

All decisions documented in [research.md](./research.md)

---

## Phase 1: Design & Contracts ✅

*Prerequisites: research.md complete ✅*

### Deliverables
1. ✅ **data-model.md** - Complete database schema with RLS policies, indexes, triggers
2. ✅ **contracts/** - OpenAPI specs:
   - `documents.yaml` - Document CRUD operations
   - `events.yaml` - Event storage/retrieval for playback
3. ✅ **quickstart.md** - Local development setup guide with migrations
4. ✅ **CLAUDE.md** - Agent context file updated

### Constitution Re-check
✅ All 5 core principles satisfied (see Post-Phase 1 Re-check above)

---

## Next Steps

✅ Phase 0 & Phase 1 complete

**Ready for Phase 2**: Run `/speckit.tasks` to generate implementation tasks
