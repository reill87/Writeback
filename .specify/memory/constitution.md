<!--
Sync Impact Report:
- Version change: [initial] → 1.0.0
- Modified principles: N/A (initial version)
- Added sections: All core principles, Technical Constraints, Quality Standards, Governance
- Removed sections: None
- Templates requiring updates:
  ✅ .specify/memory/constitution.md (this file)
  ⚠ .specify/templates/plan-template.md (pending review)
  ⚠ .specify/templates/spec-template.md (pending review)
  ⚠ .specify/templates/tasks-template.md (pending review)
- Follow-up TODOs: None
-->

# Writing Timeline Platform Constitution

## Core Principles

### I. Event Sourcing First (NON-NEGOTIABLE)

Every user action MUST be captured as an immutable event. All document state changes
MUST be reconstructable by replaying events from the beginning.

**Rationale**: The core value proposition is showing the writing process. Without
complete event history, the playback and analysis features become impossible. This
is non-negotiable for the product to exist.

**Rules**:
- All text edits (insert, delete, replace) MUST be captured with timestamp and position
- Events MUST never be modified or deleted after creation
- Document state at any point MUST be derivable from event replay
- Event capture latency MUST be < 100ms (P95)

### II. Privacy by Default

All documents MUST default to private. Publishing requires explicit user consent with
clear understanding of what becomes public.

**Rationale**: Writers are sharing vulnerable creative process. Accidental exposure
could cause significant harm to user trust and adoption.

**Rules**:
- New documents MUST have `visibility: 'private'` on creation
- UI MUST require explicit action (button, toggle) to change to public
- Public URLs MUST only be accessible after explicit publication
- Draft/private content MUST never appear in public feeds or search

### III. Zero Data Loss

No user input SHALL be lost due to network issues, browser crashes, or server errors.

**Rationale**: Trust is paramount. Losing creative work destroys user confidence
and undermines the entire platform value.

**Rules**:
- Events MUST be queued locally before network transmission
- Browser close/refresh MUST trigger immediate local persistence
- Offline editing MUST be supported with background sync
- Failed network requests MUST retry with exponential backoff
- Local queue MUST persist across browser sessions

### IV. Performance Standards

The platform MUST feel responsive and not interfere with natural writing flow.

**Rationale**: Any lag or jank will make writers abandon the editor. The tracking
must be invisible to the creative process.

**Rules**:
- Event capture MUST have < 100ms latency (P95)
- Playback MUST maintain 60fps animation
- Editor typing response MUST feel native (no perceptible delay)
- Page load MUST complete in < 2 seconds (P95)
- Batch operations (1000+ events) MUST not block UI

### V. Progressive Enhancement

Features MUST be built incrementally. Core writing must work before advanced features.

**Rationale**: Scope control and rapid validation. MVP focus prevents over-engineering
features nobody wants.

**Rules**:
- Each feature MUST be independently deployable
- Basic editor + save MUST work before playback
- Playback MUST work before diff viewer
- Rich text formatting is Phase 2+ only
- Start with textarea, upgrade to ProseMirror/Slate only when needed

## Technical Constraints

**Technology Stack** (locked for MVP):
- Frontend: Next.js 14 (App Router) + TypeScript
- Database: PostgreSQL via Supabase
- Authentication: Supabase Auth
- Hosting: Vercel
- Styling: Tailwind CSS

**Rationale**: Optimized for rapid development, serverless deployment, and
real-time capabilities without infrastructure management.

**Database Architecture**:
- Event Sourcing pattern MUST be used for `writing_events` table
- Periodic snapshots (checkpoints) SHOULD be created to optimize playback of long documents
- Indexes MUST exist on `(document_id, timestamp)` for event replay queries

**API Design**:
- Batch event submission MUST be supported (reduce network overhead)
- Event endpoints MUST support pagination with timestamp cursors
- Public document endpoints MUST be cacheable (CDN-friendly)

## Quality Standards

**Testing Requirements**:
- Event capture logic MUST have unit tests
- Event replay engine MUST have integration tests
- Network failure scenarios MUST be tested (offline mode, retry logic)
- Cross-browser testing MUST include Chrome, Firefox, Safari

**Code Quality**:
- TypeScript strict mode MUST be enabled
- ESLint errors MUST block commits (CI enforcement)
- All components MUST be typed (no `any` except explicitly justified)
- Database queries MUST be reviewed for N+1 issues

**Security**:
- Private documents MUST have authorization checks on every API route
- SQL injection MUST be prevented (use parameterized queries only)
- XSS MUST be prevented (sanitize user input, use React auto-escaping)
- Rate limiting MUST be implemented on public endpoints

**Documentation**:
- README MUST include setup instructions and architecture overview
- API routes MUST have JSDoc comments describing parameters and returns
- Database schema MUST be documented with migration history
- Environment variables MUST be documented in `.env.example`

## Governance

**Amendment Process**:
1. Proposed changes MUST be documented with rationale
2. Breaking changes to principles require team discussion (or creator approval for solo projects)
3. Version bumps follow semantic versioning (MAJOR.MINOR.PATCH)

**Compliance**:
- All pull requests MUST verify compliance with Core Principles
- Violations MUST be flagged in code review
- Technical debt exceptions MUST be documented with remediation plan

**Version Control**:
- This constitution supersedes informal agreements or undocumented practices
- Changes to principles MUST update this document first, then code
- Last amended date MUST be updated on every content change

**Version**: 1.0.0 | **Ratified**: 2025-10-18 | **Last Amended**: 2025-10-18
