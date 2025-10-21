# Implementation Tasks: Writing Timeline Platform MVP

**Feature**: `001-mvp-core`
**Branch**: `001-mvp-core`
**Total Tasks**: 67
**MVP Scope**: US1, US2, US5, US6, US7, US8 (6 user stories)

---

## Task Summary

| Phase | User Story | Task Count | Parallel Tasks |
|-------|-----------|------------|----------------|
| Phase 1 | Setup | 8 | 5 |
| Phase 2 | Foundational | 9 | 6 |
| Phase 3 | US1+US2: Writer Core | 14 | 8 |
| Phase 4 | US5: Reader View | 5 | 3 |
| Phase 5 | US6+US7: Playback | 12 | 7 |
| Phase 6 | US8: Diff Viewer | 6 | 4 |
| Phase 7 | Polish & Deploy | 13 | 8 |

---

## Dependencies & Execution Order

```
Phase 1 (Setup)
   ↓
Phase 2 (Foundational: Auth, DB)
   ↓
Phase 3 (US1+US2: Editor)  ← MUST complete first
   ↓
Phase 4 (US5: Reader) ← depends on US2 (published documents)
   ↓
Phase 5 (US6+US7: Playback) ← depends on US1 (events)
   ↓
Phase 6 (US8: Diff) ← depends on US1 (event history)
   ↓
Phase 7 (Polish)
```

**Independent Stories**: None (all depend on Phase 3)

**MVP Milestone**: Completing Phase 3 delivers a working editor with auto-save

---

## Phase 1: Setup & Project Initialization

**Goal**: Bootstrap Next.js project with all dependencies and folder structure

**Tasks**:

- [ ] T001 Initialize Next.js 14 project with TypeScript and App Router at project root
- [ ] T002 [P] Install core dependencies: zustand@4.x, @tanstack/react-query@5.x, dexie@3.x in package.json
- [ ] T003 [P] Install Supabase dependencies: @supabase/ssr@latest, @supabase/supabase-js@2.x in package.json
- [ ] T004 [P] Install UI dependencies: tailwindcss@3.x, @radix-ui/react-*primitives in package.json
- [ ] T005 [P] Install dev dependencies: vitest, playwright, @playwright/test in package.json
- [ ] T006 [P] Create folder structure per plan.md: app/, components/, lib/, stores/, hooks/, types/
- [ ] T007 Configure Tailwind CSS in tailwind.config.ts with design tokens
- [ ] T008 Create .env.local template with NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY placeholders

**Parallel Execution Example**:
```bash
# Run T002-T006 in parallel (independent package installs and folder creation)
```

---

## Phase 2: Foundational Infrastructure

**Goal**: Set up authentication and database schema (blocking prerequisites for all user stories)

**Database Tasks**:

- [ ] T009 Create Supabase project and copy API credentials to .env.local
- [ ] T010 [P] Create supabase/migrations/001_initial_schema.sql with profiles, documents, writing_events, checkpoints tables per data-model.md
- [ ] T011 [P] Create supabase/migrations/002_indexes.sql with compound indexes per data-model.md
- [ ] T012 [P] Create supabase/migrations/003_rls_policies.sql with RLS policies per data-model.md
- [ ] T013 Run migrations: Apply 001, 002, 003 to Supabase via Dashboard SQL Editor

**Authentication Tasks**:

- [ ] T014 [P] Create lib/supabase/client.ts with browser Supabase client setup per research.md @supabase/ssr pattern
- [ ] T015 [P] Create lib/supabase/server.ts with server Supabase client setup per research.md @supabase/ssr pattern
- [ ] T016 Create middleware.ts with Supabase auth session refresh logic
- [ ] T017 Create types/supabase.ts with database schema types (generate from Supabase CLI or manual)

**Parallel Execution Example**:
```bash
# T010-T012 can run in parallel (separate migration files)
# T014-T015 can run in parallel (different files)
```

---

## Phase 3: US1+US2 - Writer Core (Editor + Document Management)

**User Stories**:
- **US1** (P1): 평소처럼 글을 쓰면 자동으로 모든 변경사항이 기록된다
- **US2** (P1): 글을 저장하고 공개/비공개를 선택할 수 있다

**Independent Test**: Writer can create document, type content, see events stored in IndexedDB, publish document

**IndexedDB Setup**:

- [ ] T018 [P] [US1] Create lib/db/indexeddb.ts with Dexie database setup per data-model.md client schema
- [ ] T019 [P] [US1] Create lib/db/schema.ts with IndexedDB table definitions (events, documents)

**Event Sourcing Core**:

- [ ] T020 [P] [US1] Create types/events.ts with WritingEvent interface per spec.md section 3.1
- [ ] T021 [P] [US1] Create lib/event-sourcing/capture.ts with debounced event capture logic per spec.md section 5.3
- [ ] T022 [P] [US1] Create lib/event-sourcing/queue.ts with local queue management and IndexedDB persistence
- [ ] T023 [US1] Create lib/utils/debounce.ts with debounce utility (500ms)

**State Management**:

- [ ] T024 [P] [US1] Create stores/editorStore.ts with Zustand store for editor state (content, cursor position)
- [ ] T025 [P] [US1] Create stores/queueStore.ts with Zustand store for local event queue state

**Hooks**:

- [ ] T026 [US1] Create hooks/useEventCapture.ts combining editorStore + capture.ts logic
- [ ] T027 [US1] Create hooks/useEventSync.ts with React Query mutation for batch event upload

**API Routes**:

- [ ] T028 [P] [US2] Create app/api/documents/route.ts implementing POST (create) and GET (list) per contracts/documents.yaml
- [ ] T029 [P] [US1] Create app/api/documents/[id]/route.ts implementing GET and PATCH per contracts/documents.yaml
- [ ] T030 [P] [US1] Create app/api/documents/[id]/events/route.ts implementing POST and GET per contracts/events.yaml
- [ ] T031 [US2] Create hooks/useDocuments.ts with React Query hooks for document CRUD operations

**UI Components**:

- [ ] T032 [P] [US1] Create components/editor/SmartEditor.tsx with textarea, event listeners, and useEventCapture integration
- [ ] T033 [P] [US1] Create components/editor/CharacterCounter.tsx showing remaining characters (50,000 limit)
- [ ] T034 [P] [US2] Create components/editor/EditorToolbar.tsx with save and publish buttons
- [ ] T035 [US1] Create app/(editor)/documents/new/page.tsx for creating new document
- [ ] T036 [US1] Create app/(editor)/documents/[id]/page.tsx integrating SmartEditor component

**Parallel Execution Example**:
```bash
# T018-T022 (event sourcing files) can run in parallel
# T024-T025 (stores) can run in parallel
# T028-T030 (API routes) can run in parallel
# T032-T034 (UI components) can run in parallel
```

---

## Phase 4: US5 - Reader View (Public Document Reading)

**User Story**:
- **US5** (P1): 공개된 글의 최종본을 읽을 수 있다

**Independent Test**: Reader can visit public document URL and read final content without authentication

**Tasks**:

- [ ] T037 [P] [US5] Create components/reader/DocumentContent.tsx displaying final_content with typography styling
- [ ] T038 [P] [US5] Create components/reader/DocumentHeader.tsx showing title, author, writing duration
- [ ] T039 [P] [US5] Create components/reader/ViewModeToggle.tsx with buttons: "최종본", "타임라인 재생", "비교"
- [ ] T040 [US5] Create app/(reader)/read/[id]/page.tsx fetching public document and rendering reader components
- [ ] T041 [US5] Update app/api/documents/[id]/route.ts to allow unauthenticated GET for public documents (check RLS)

**Parallel Execution Example**:
```bash
# T037-T039 can run in parallel (separate component files)
```

---

## Phase 5: US6+US7 - Timeline Playback

**User Stories**:
- **US6** (P1): "타임라인 재생" 버튼을 눌러 글이 써지는 과정을 볼 수 있다
- **US7** (P1): 재생 속도를 조절할 수 있다 (0.5x, 1x, 2x, 4x)

**Independent Test**: Reader can click playback button, see typing animation, and adjust speed

**Event Replay Engine**:

- [ ] T042 [P] [US6] Create lib/event-sourcing/replay.ts with replayEvents generator function per spec.md section 5.3
- [ ] T043 [P] [US6] Create lib/utils/time.ts with calculateDelay function implementing condensed strategy per research.md
- [ ] T044 [US6] Create hooks/usePlayback.ts managing playback state (playing, paused, speed, current time)

**Playback UI**:

- [ ] T045 [P] [US6] Create components/playback/PlaybackPlayer.tsx displaying animated text content during replay
- [ ] T046 [P] [US7] Create components/playback/PlaybackControls.tsx with play/pause/stop buttons
- [ ] T047 [P] [US7] Create components/playback/SpeedSelector.tsx with speed dropdown (0.5x, 1x, 2x, 4x)
- [ ] T048 [P] [US6] Create components/playback/TimelineSlider.tsx with scrubber for jumping to specific time
- [ ] T049 [P] [US6] Create components/playback/TimeDisplay.tsx showing "0:45 / 2:30" format
- [ ] T050 [US6] Create app/(editor)/documents/[id]/playback/page.tsx integrating playback components
- [ ] T051 [US6] Update app/(reader)/read/[id]/page.tsx to add playback route link
- [ ] T052 [US6] Create app/api/documents/[id]/events/route.ts GET handler with checkpoint optimization per data-model.md
- [ ] T053 [US6] Test playback with 1000+ events, verify 60fps performance and condensed timing

**Parallel Execution Example**:
```bash
# T042-T043 (replay engine) can run in parallel
# T045-T049 (playback UI components) can run in parallel
```

---

## Phase 6: US8 - Diff Viewer (First vs Final Comparison)

**User Story**:
- **US8** (P1): 초고와 최종본을 나란히 비교할 수 있다

**Independent Test**: Reader can click "비교" button and see side-by-side diff with highlighted changes

**Diff Algorithm**:

- [ ] T054 [P] [US8] Install diff-match-patch library per research.md decision
- [ ] T055 [P] [US8] Create lib/diff/myers-diff.ts wrapping diff-match-patch with semantic cleanup
- [ ] T056 [US8] Create hooks/useDiff.ts fetching first/final versions via /api/documents/:id/versions

**Diff UI**:

- [ ] T057 [P] [US8] Create components/diff/DiffViewer.tsx with side-by-side layout (first vs final)
- [ ] T058 [P] [US8] Create components/diff/DiffHighlight.tsx rendering diff spans with color coding (green, red, yellow)
- [ ] T059 [US8] Create app/(reader)/read/[id]/diff/page.tsx integrating diff viewer
- [ ] T060 [US8] Create app/api/documents/[id]/versions/route.ts implementing GET per contracts/documents.yaml

**Parallel Execution Example**:
```bash
# T054-T055 (diff logic) can run in parallel
# T057-T058 (diff UI components) can run in parallel
```

---

## Phase 7: Polish & Cross-Cutting Concerns

**Goal**: Error handling, loading states, responsive design, deployment

**Error Handling**:

- [ ] T061 [P] Create components/ui/ErrorBoundary.tsx for React error boundaries
- [ ] T062 [P] Create components/ui/LoadingSpinner.tsx for loading states
- [ ] T063 [P] Add error handling to all API routes with proper status codes and error messages
- [ ] T064 Add try-catch blocks to event capture and replay logic with user-friendly error messages

**Responsive Design**:

- [ ] T065 [P] Update all components with Tailwind responsive classes (sm:, md:, lg:)
- [ ] T066 [P] Test mobile layout for editor, reader, playback on viewport <768px

**Deployment**:

- [ ] T067 [P] Create vercel.json with deployment configuration
- [ ] T068 [P] Set up environment variables in Vercel dashboard
- [ ] T069 Deploy to Vercel and verify production build
- [ ] T070 [P] Update Supabase project URL allowlist with Vercel production domain
- [ ] T071 [P] Test end-to-end workflow in production: signup → write → publish → playback → diff
- [ ] T072 Set up Vercel Analytics and monitoring
- [ ] T073 Create README.md with project overview, setup instructions, and architecture diagram

**Parallel Execution Example**:
```bash
# T061-T063 (error handling components) can run in parallel
# T065-T066 (responsive design) can run in parallel
# T067-T070 (deployment setup) can run in parallel
```

---

## Implementation Strategy

### MVP First Approach

**Minimum Viable Product** = Phase 3 complete:
- Writer can create document
- Events auto-captured to IndexedDB
- Events synced to Supabase
- Document can be published

This delivers US1+US2 and proves core architecture works.

### Incremental Delivery

1. **Week 1**: Phase 1-2 (Setup + Foundation)
2. **Week 2**: Phase 3 (Writer Core) ← **MVP Milestone**
3. **Week 3**: Phase 4-5 (Reader + Playback)
4. **Week 4**: Phase 6 (Diff Viewer)
5. **Week 5**: Phase 7 (Polish + Deploy)

### Parallel Work Opportunities

- **Phase 3**: 8 tasks can run in parallel
- **Phase 5**: 7 tasks can run in parallel
- **Phase 7**: 8 tasks can run in parallel

**Total parallelizable**: 41 out of 73 tasks (56%)

---

## Testing Strategy (Optional - TDD Not Requested)

Tests are **optional** for MVP. If implementing tests:

- **Unit Tests**: lib/event-sourcing/*, lib/diff/* (Vitest)
- **Integration Tests**: API routes with MSW (Mock Service Worker)
- **E2E Tests**: Critical paths with Playwright
  1. Signup → Login → Create Document → Type → Auto-save
  2. Publish Document → View as Reader → Playback
  3. View Diff

---

## Task Checklist Validation

✅ All tasks follow format: `- [ ] [T###] [P?] [US#?] Description with file path`
✅ Task IDs sequential (T001-T073)
✅ [P] marker for parallelizable tasks
✅ [US#] label for user story phases
✅ File paths specified for each task
✅ Dependencies documented in execution order diagram

---

## Next Steps

1. ✅ Tasks generated (73 total)
2. ⏭️ Run `/speckit.implement` to start execution
3. ⏭️ Or manually execute tasks starting from T001

**Suggested first command**:
```bash
# Start with Phase 1
/speckit.implement T001-T008
```
