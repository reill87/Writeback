# Quickstart Guide - Writing Timeline Platform

**Last Updated**: 2025-10-18
**Target Audience**: Developers setting up local environment

## Prerequisites

- **Node.js** 18.17+
- **npm** 9+ or **pnpm** 8+
- **Git**
- **Supabase CLI** (optional, for local database)

## 1. Clone Repository

```bash
git clone https://github.com/reill87/Writeback.git
cd Writeback
```

## 2. Install Dependencies

```bash
npm install
# or
pnpm install
```

## 3. Supabase Setup

### Option A: Use Supabase Cloud (Recommended for MVP)

1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Go to Settings → API
4. Copy these values:
   - **Project URL** (e.g., `https://abcdefgh.supabase.co`)
   - **Anon Key** (public key)

### Option B: Local Supabase (Advanced)

```bash
# Install Supabase CLI
npm install -g supabase

# Start local Supabase
supabase init
supabase start
```

## 4. Environment Variables

Create `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key # For server operations

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**.env.local** is already in `.gitignore`.

## 5. Database Migrations

### Option A: Supabase Cloud

1. Go to Supabase Dashboard → SQL Editor
2. Run migrations in order:

**Migration 001: Initial Schema**

```sql
-- Copy from: supabase/migrations/001_initial_schema.sql
-- (Run all CREATE TABLE statements from data-model.md)
```

**Migration 002: Indexes**

```sql
-- Copy from: supabase/migrations/002_indexes.sql
-- (Run all CREATE INDEX statements from data-model.md)
```

**Migration 003: RLS Policies**

```sql
-- Copy from: supabase/migrations/003_rls_policies.sql
-- (Run all RLS policies from data-model.md)
```

### Option B: Local Supabase

```bash
# Apply migrations
supabase db push
```

## 6. Verify Database

Check that these tables exist:
- `profiles`
- `documents`
- `writing_events`
- `checkpoints`

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';
```

## 7. Run Development Server

```bash
npm run dev
# or
pnpm dev
```

Visit: [http://localhost:3000](http://localhost:3000)

## 8. Test Authentication

1. Navigate to `/signup`
2. Create account with email/password
3. Check email for verification link (if email enabled)
4. Login at `/login`

## 9. Test Editor

1. After login, create new document
2. Start typing
3. Open browser DevTools → Application → IndexedDB
4. Check `WritingTimelineDB` → `events` table
5. Events should appear locally before syncing to server

## 10. Verify Event Sync

```sql
-- Check if events are being saved
SELECT COUNT(*), document_id
FROM writing_events
GROUP BY document_id;
```

## Project Structure Overview

```
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth routes
│   ├── (editor)/          # Editor routes
│   ├── (reader)/          # Reader routes
│   └── api/               # API routes
├── components/            # React components
├── lib/                   # Core logic
│   ├── supabase/         # Supabase clients
│   ├── event-sourcing/   # Event capture/replay
│   └── db/               # IndexedDB setup
├── stores/                # Zustand stores
├── hooks/                 # Custom React hooks
├── types/                 # TypeScript types
└── supabase/             # Database migrations
```

## Common Issues

### Issue: "Invalid JWT"

**Solution**: Check that `.env.local` has correct `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

### Issue: Events not syncing

**Solution**:
1. Check browser console for errors
2. Verify RLS policies allow insert for authenticated user
3. Check IndexedDB has `synced: false` events

### Issue: "Row Level Security" error

**Solution**:
```sql
-- Ensure user is authenticated
SELECT auth.uid(); -- Should return UUID, not NULL
```

## Development Workflow

### 1. Feature Development

```bash
# Create feature branch
git checkout -b 002-new-feature

# Make changes
# ...

# Run tests
npm test

# Commit
git add .
git commit -m "feat: add new feature"
```

### 2. Database Changes

```bash
# Create new migration
supabase migration new add_new_table

# Edit migration file
# ...

# Apply locally
supabase db push

# Push to cloud (after testing)
# (Go to Supabase Dashboard → SQL Editor → paste migration)
```

### 3. Testing

```bash
# Unit tests
npm run test:unit

# Integration tests (requires DB)
npm run test:integration

# E2E tests
npm run test:e2e
```

## Useful Commands

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Format code
npm run format

# Build for production
npm run build

# Start production server
npm start
```

## API Documentation

OpenAPI specs available at:
- **Documents API**: `specs/001-mvp-core/contracts/documents.yaml`
- **Events API**: `specs/001-mvp-core/contracts/events.yaml`

View with [Swagger Editor](https://editor.swagger.io/) or install Swagger UI:

```bash
npm install -g @apidevtools/swagger-cli
swagger-cli serve specs/001-mvp-core/contracts/documents.yaml
```

## Debugging

### Enable Verbose Logging

```typescript
// lib/utils/logger.ts
export const DEBUG = process.env.NODE_ENV === 'development';

// Usage
if (DEBUG) console.log('Event captured:', event);
```

### Inspect Supabase Realtime

```typescript
// In browser console
supabaseClient.channel('public:writing_events')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'writing_events'
  }, (payload) => console.log('New event:', payload))
  .subscribe();
```

### Check IndexedDB State

```typescript
// Browser console
const db = await Dexie.getDatabaseNames();
console.log('Databases:', db);

// Inspect events
const events = await db.events.toArray();
console.log('Pending events:', events.filter(e => !e.synced));
```

## Next Steps

1. ✅ Local environment running
2. ⏭️ Read [data-model.md](./data-model.md) for schema details
3. ⏭️ Review [plan.md](./plan.md) for architecture
4. ⏭️ Run `/speckit.tasks` to generate implementation tasks
5. ⏭️ Start with Phase 1: Core Foundation tasks

## Resources

- [Next.js 14 Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Zustand Guide](https://docs.pmnd.rs/zustand)
- [React Query Docs](https://tanstack.com/query/latest)
- [Dexie.js Docs](https://dexie.org/)

## Support

- GitHub Issues: https://github.com/reill87/Writeback/issues
- Spec-kit Docs: https://github.com/github/spec-kit
