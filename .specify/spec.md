# Writing Timeline Platform - Product Specification

## 1. Overview

### Vision
작가의 창작 과정을 투명하게 공유하여, 글쓰기를 "완성품 소비"가 아닌 "창작 여정 경험"으로 전환하는 플랫폼

### Core Value Proposition
- 작가: 자신의 창작 패턴을 분석하고, 과정의 가치를 독자와 공유
- 독자: 완성된 글 뒤의 사고 과정과 고민을 경험하며 작가와 더 깊은 연결

### MVP Scope
Phase 1에서는 핵심 3가지 기능에 집중:
1. 글쓰기 과정 자동 기록
2. 타임라인 재생 (Playback)
3. 초고-최종본 비교 뷰

---

## 2. User Stories

### 작가 (Writer)
- [ ] 평소처럼 글을 쓰면 자동으로 모든 변경사항이 기록된다
- [ ] 글을 저장하고 공개/비공개를 선택할 수 있다
- [ ] 내 글쓰기 패턴을 분석한 인사이트를 볼 수 있다 (Phase 2)
- [ ] 특정 버전을 "중요 체크포인트"로 표시할 수 있다

### 독자 (Reader)
- [ ] 공개된 글의 최종본을 읽을 수 있다
- [ ] "타임라인 재생" 버튼을 눌러 글이 써지는 과정을 볼 수 있다
- [ ] 재생 속도를 조절할 수 있다 (0.5x, 1x, 2x, 4x)
- [ ] 초고와 최종본을 나란히 비교할 수 있다
- [ ] 작가가 오래 고민한 부분을 시각적으로 확인할 수 있다

---

## 3. Feature Specifications

### 3.1 Smart Editor (글쓰기 에디터)

**Requirements**
- 일반 텍스트 에디터처럼 자연스러운 UX
- 모든 타이핑, 삭제, 붙여넣기 이벤트 캡처
- 변경사항을 실시간으로 로컬/서버에 저장
- 네트워크 끊김 시에도 로컬에 임시 저장

**Technical Details**
```typescript
interface WritingEvent {
  id: string;
  documentId: string;
  timestamp: number; // Unix timestamp in ms
  type: 'insert' | 'delete' | 'replace';
  position: number; // Cursor position
  content: string; // Changed content
  contentBefore?: string; // For delete/replace
  sessionId: string; // 같은 세션 구분용
}
```

**Edge Cases**
- 대량 붙여넣기 (1000+ 글자)
- 빠른 연속 타이핑 (디바운싱 필요)
- 브라우저 탭 닫기 전 저장
- Undo/Redo 처리

### 3.2 Timeline Playback (재생 기능)

**Requirements**
- 저장된 이벤트를 시간 순서대로 재현
- 재생/일시정지/정지 컨트롤
- 속도 조절 (0.5x, 1x, 2x, 4x, 최대속도)
- 타임라인 스크러버로 특정 시점 이동
- 현재 재생 시점의 시간 표시

**UI Components**
```
[재생 컨트롤바]
◀ ⏸ ▶   [========●====] 0:45 / 2:30   [1x ▼]

[에디터 뷰 - 애니메이션]
타이핑이 실시간처럼 재현됨
```

**Performance Considerations**
- 1000+ 이벤트 시 렌더링 최적화
- 100ms 이내 이벤트는 배치 처리
- Virtual scrolling for long documents

### 3.3 Diff Viewer (비교 뷰)

**Requirements**
- 초고(첫 버전) vs 최종본 나란히 표시
- 추가/삭제/변경 부분 색상 하이라이트
  - 초록: 추가된 내용
  - 빨강: 삭제된 내용  
  - 노랑: 변경된 내용
- 문단 단위/문장 단위/단어 단위 비교 토글

**Algorithm**
- Myers diff algorithm 사용
- 단어 토큰화로 의미 단위 비교

### 3.4 Hesitation Map (망설임 지도) - Phase 1.5

**Requirements**
- 작가가 10초 이상 타이핑을 멈춘 위치 표시
- 고민 시간에 따라 색상 구분
  - 10-30초: 연한 노랑
  - 30-60초: 진한 노랑
  - 60초+: 주황/빨강
- 마우스 오버 시 정확한 고민 시간 툴팁

---

## 4. Data Model

### 4.1 Database Schema

```sql
-- Documents table
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'draft', -- draft, published, archived
  visibility VARCHAR(20) DEFAULT 'private', -- private, public, unlisted
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  published_at TIMESTAMP,
  final_content TEXT,
  first_version_content TEXT
);

-- Writing events (이벤트 소싱)
CREATE TABLE writing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  session_id UUID NOT NULL,
  timestamp BIGINT NOT NULL, -- Unix timestamp in milliseconds
  event_type VARCHAR(20) NOT NULL, -- insert, delete, replace
  position INTEGER NOT NULL,
  content TEXT,
  content_before TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_events_document_timestamp ON writing_events(document_id, timestamp);

-- Checkpoints (중요 버전 표시)
CREATE TABLE checkpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  timestamp BIGINT NOT NULL,
  label VARCHAR(100),
  content_snapshot TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Users table (simplified)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 4.2 Event Sourcing Pattern

모든 변경사항을 이벤트로 저장하고, 특정 시점의 문서 상태는 이벤트를 리플레이하여 재구성

**Benefits**
- 완벽한 히스토리 추적
- 타임 트래블 가능
- 분석 및 인사이트 추출 용이

**Challenges**
- 이벤트가 많아질 경우 성능
- 주기적 스냅샷으로 해결 (checkpoints)

---

## 5. Technical Architecture

### 5.1 Tech Stack

**Frontend**
- Framework: Next.js 14 (App Router)
- Language: TypeScript
- Styling: Tailwind CSS
- State Management: Zustand or React Query
- Editor Base: Textarea with custom event handling (나중에 ProseMirror/Slate 고려)

**Backend**
- Database: PostgreSQL (Supabase)
- Auth: Supabase Auth
- API: Next.js API Routes
- Real-time: Supabase Realtime (optional)

**Infrastructure**
- Hosting: Vercel
- Database: Supabase
- Storage: Supabase Storage (미래 파일 첨부용)

### 5.2 System Architecture

```
┌─────────────┐
│   Browser   │
│             │
│  ┌───────┐  │
│  │Editor │  │ ──── Writing Events ────┐
│  └───────┘  │                         │
│             │                         ▼
│  ┌───────┐  │                    ┌─────────┐
│  │Player │  │ ◄─── Event Stream ─│   API   │
│  └───────┘  │                    │ Routes  │
│             │                    └─────────┘
│  ┌───────┐  │                         │
│  │ Diff  │  │ ◄───── Versions ────────┘
│  └───────┘  │                         │
└─────────────┘                         ▼
                                   ┌──────────┐
                                   │PostgreSQL│
                                   │(Supabase)│
                                   └──────────┘
```

### 5.3 Key Algorithms

**Event Capture**
```typescript
// 디바운스로 너무 빠른 입력은 하나로 묶기
const captureEvent = debounce((event: WritingEvent) => {
  localQueue.push(event);
  if (localQueue.length >= BATCH_SIZE || Date.now() - lastFlush > FLUSH_INTERVAL) {
    flushToServer(localQueue);
  }
}, 50);
```

**Playback Engine**
```typescript
function* replayEvents(events: WritingEvent[]) {
  let content = '';
  for (const event of events) {
    yield applyEvent(content, event);
    await sleep(calculateDelay(event, nextEvent));
  }
}
```

---

## 6. API Specifications

### 6.1 Endpoints

**POST /api/documents**
- Create a new document
- Request: `{ title: string }`
- Response: `{ id: string, title: string, created_at: string }`

**GET /api/documents/:id**
- Get document details
- Response: `Document` object

**POST /api/documents/:id/events**
- Save writing events (batch)
- Request: `{ events: WritingEvent[] }`
- Response: `{ saved: number }`

**GET /api/documents/:id/events**
- Get all events for playback
- Query params: `?from=timestamp&to=timestamp`
- Response: `{ events: WritingEvent[] }`

**GET /api/documents/:id/versions**
- Get first and final versions
- Response: `{ first: string, final: string, checkpoints: Checkpoint[] }`

**PATCH /api/documents/:id**
- Update document metadata
- Request: `{ title?, status?, visibility? }`

---

## 7. UI/UX Specifications

### 7.1 Editor Page

```
┌─────────────────────────────────────────────────┐
│  [← Back]    제목 입력...         [저장] [공개]  │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │                                         │   │
│  │  글을 입력하세요...                      │   │
│  │                                         │   │
│  │                                         │   │
│  │  [커서 깜빡임]                           │   │
│  │                                         │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  자동 저장됨 • 방금 전                           │
└─────────────────────────────────────────────────┘
```

### 7.2 Reader Page (Published Document)

```
┌─────────────────────────────────────────────────┐
│  [← 목록]                        by @username   │
├─────────────────────────────────────────────────┤
│  제목: 어느 봄날의 단상                           │
│  작성: 2시간 47분 소요 • 2025.10.18              │
│                                                 │
│  [최종본 보기] [타임라인 재생 ▶] [비교 보기]      │
├─────────────────────────────────────────────────┤
│                                                 │
│  최종본 내용이 여기 표시됨...                     │
│                                                 │
│                                                 │
└─────────────────────────────────────────────────┘
```

### 7.3 Playback Mode

```
┌─────────────────────────────────────────────────┐
│  [✕ 닫기]                    재생 중...          │
├─────────────────────────────────────────────────┤
│                                                 │
│  어느 봄날의 단상                                │
│                                                 │
│  창문을 열자 봄바람이 들어왔다                    │
│  [타이핑 애니메이션...]                          │
│                                                 │
├─────────────────────────────────────────────────┤
│  ⏮ ⏸ ⏭  [=====●========]  1:23 / 2:47          │
│                                      [1x ▼]     │
└─────────────────────────────────────────────────┘
```

---

## 8. MVP Development Plan

### Phase 1: Core Foundation (Week 1-2)
- [x] Project setup (Next.js + TypeScript + Supabase)
- [ ] Database schema & migrations
- [ ] Basic authentication (Supabase Auth)
- [ ] Simple editor with event capture
- [ ] Event storage API

### Phase 2: Playback (Week 3)
- [ ] Event replay engine
- [ ] Playback UI controls
- [ ] Speed adjustment
- [ ] Timeline scrubber

### Phase 3: Comparison (Week 4)
- [ ] Diff algorithm implementation
- [ ] Side-by-side diff viewer
- [ ] Highlight additions/deletions

### Phase 4: Polish & Deploy (Week 5)
- [ ] Responsive design
- [ ] Performance optimization
- [ ] Error handling
- [ ] Deploy to Vercel

---

## 9. Success Metrics

### Technical Metrics
- Event capture latency < 100ms
- Playback smoothness (60fps target)
- Page load time < 2s
- Zero data loss on network issues

### User Metrics (Post-launch)
- % of writers who enable playback sharing
- Average playback watch time
- Return visit rate
- Time spent in diff viewer

---

## 10. Future Enhancements (Post-MVP)

### Phase 2 Features
- [ ] 망설임 지도 (Hesitation Map)
- [ ] 작가 음성 메모 / 코멘트
- [ ] 중요 체크포인트 표시
- [ ] 글쓰기 패턴 분석 대시보드

### Phase 3 Features
- [ ] 협업 글쓰기 (동시 편집)
- [ ] 편집자-작가 핑퐁 기록
- [ ] 평행 우주 모드 (삭제된 버전 탐색)
- [ ] 모바일 앱

### Experimental
- [ ] AI 분석: "이 작가는 도입부를 평균 7번 수정합니다"
- [ ] 글쓰기 스타일 비교
- [ ] 창작 과정 공유 커뮤니티

---

## 11. Risk & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| 대량 이벤트로 인한 성능 저하 | High | 이벤트 배치 처리, 주기적 스냅샷 |
| 네트워크 끊김 시 데이터 손실 | High | 로컬 큐잉, 재연결 시 자동 동기화 |
| 프라이버시 우려 | Medium | 기본 비공개, 명확한 공개 동의 |
| 에디터 호환성 이슈 | Medium | 점진적 기능 향상, Fallback UI |

---

## 12. Open Questions

- [ ] 어떤 형식의 글(블로그, 소설, 에세이)에 집중할 것인가?
- [ ] 리치 텍스트(볼드, 이탤릭 등) 지원 범위는?
- [ ] 최대 문서 길이 제한은?
- [ ] 재생 시 실제 타이핑 속도 vs 정규화된 속도?
- [ ] 이미지/링크 첨부는 언제 지원?

---

## Appendix: Claude Code Development Guide

이 spec을 Claude Code로 개발할 때 권장하는 프롬프트 패턴:

```bash
# 1. 초기 설정
claude code "Initialize a Next.js 14 project with TypeScript, Tailwind, 
and Supabase. Set up the basic folder structure following this spec."

# 2. 기능별 개발
claude code "Implement the WritingEvent capture logic in the editor component. 
Follow the schema and debouncing strategy in section 3.1 and 5.3"

# 3. 반복 개선
claude code --file src/components/Editor.tsx 
"Add error handling for network failures. Events should queue locally 
and retry on reconnection."

# 4. 성능 최적화
claude code "The playback is slow with 2000+ events. 
Implement the batching strategy from section 5.3"
```
