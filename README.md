# Writing Timeline Platform

작가의 창작 과정을 투명하게 공유하는 플랫폼입니다. 문서의 작성 과정을 실시간으로 기록하고, 독자들이 작가의 사고 과정과 창작 여정을 체험할 수 있도록 합니다.

## 🌟 주요 기능

### 📝 실시간 편집기 (US1+US2)
- **실시간 이벤트 캡처**: 타이핑, 삭제, 수정 등 모든 편집 과정을 밀리초 단위로 기록
- **자동 저장**: 로컬 및 클라우드 동기화로 작업 내용 보호
- **세션 관리**: 작업 세션별로 구분된 편집 기록

### 📖 독자 뷰 (US5)
- **깔끔한 읽기 화면**: 최종 완성된 문서를 위한 최적화된 독서 환경
- **공개/비공개 설정**: 작가가 원하는 시점에 문서 공개
- **반응형 디자인**: 데스크톱, 태블릿, 모바일 최적화

### 🎬 타임라인 재생 (US6+US7)
- **실시간 재생**: 작가의 작성 과정을 영화처럼 재생
- **재생 컨트롤**: 재생/일시정지/정지, 속도 조절 (0.5x~4x)
- **타임라인 스크럽**: 원하는 시점으로 바로 이동
- **압축된 타이밍**: 긴 휴식 시간은 자동으로 압축하여 시청 편의성 향상

### 📊 변경사항 비교 (US8)
- **초고 vs 최종본**: 첫 번째 버전과 최종 버전의 나란히 비교
- **시각적 하이라이트**: 추가/삭제/변경 내용을 색상으로 구분
- **통계 정보**: 변경량, 유사도 등 정량적 분석

## 🏗️ 기술 스택

- **Frontend**: Next.js 14, React 18, TypeScript
- **Backend**: Next.js API Routes, Supabase
- **Database**: PostgreSQL (Supabase)
- **실시간 동기화**: Supabase Realtime
- **로컬 저장소**: Dexie (IndexedDB)
- **스타일링**: Tailwind CSS
- **배포**: Vercel

## 🏛️ 아키텍처

### 이벤트 소싱 (Event Sourcing)
모든 편집 작업을 이벤트로 저장하여 완전한 기록을 유지합니다.

```typescript
interface WritingEvent {
  id: string;
  document_id: string;
  session_id: string;
  timestamp: number;
  event_type: 'insert' | 'delete' | 'replace';
  position: number;
  content?: string;
  content_before?: string;
}
```

### 3-Layer 데이터 동기화
1. **Local First**: IndexedDB를 이용한 즉시 반응
2. **Optimistic Updates**: UI 즉시 업데이트
3. **Background Sync**: Supabase로 백그라운드 동기화

```
User Input → Local Storage → UI Update → Cloud Sync
     ↓            ↓            ↓            ↓
   즉시         즉시        즉시      백그라운드
```

## 🚀 시작하기

### 필수 요구사항
- Node.js 18.0 이상
- npm 또는 yarn
- Supabase 계정

### 설치 및 실행

1. **저장소 클론**
   ```bash
   git clone https://github.com/your-username/writeback.git
   cd writeback
   ```

2. **의존성 설치**
   ```bash
   npm install
   ```

3. **환경 변수 설정**
   ```bash
   cp .env.example .env.local
   ```
   
   `.env.local` 파일에 Supabase 설정 추가:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

4. **데이터베이스 설정**
   
   Supabase 프로젝트에서 다음 SQL 스크립트 실행:
   ```sql
   -- 1. 테이블 생성
   \i supabase/migrations/001_schema.sql
   
   -- 2. 인덱스 생성
   \i supabase/migrations/002_indexes.sql
   
   -- 3. RLS 정책 설정
   \i supabase/migrations/003_rls.sql
   ```

5. **개발 서버 실행**
   ```bash
   npm run dev
   ```

6. **브라우저에서 확인**
   
   http://localhost:3000 접속

### 배포 (Vercel)

1. **Vercel 계정 연결**
   ```bash
   npm install -g vercel
   vercel login
   ```

2. **프로젝트 배포**
   ```bash
   vercel
   ```

3. **환경 변수 설정**
   
   Vercel 대시보드에서 환경 변수 추가:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

## 📁 프로젝트 구조

```
writeback/
├── app/                          # Next.js App Router
│   ├── (editor)/                 # 편집기 페이지 그룹
│   │   └── documents/[id]/
│   │       └── playback/         # 재생 페이지
│   ├── (reader)/                 # 독자 페이지 그룹
│   │   └── read/[id]/
│   │       └── diff/             # 비교 페이지
│   ├── api/                      # API 라우트
│   │   └── documents/[id]/
│   │       └── events/           # 이벤트 API
│   └── globals.css               # 전역 스타일
├── components/                   # React 컴포넌트
│   ├── editor/                   # 편집기 컴포넌트
│   ├── reader/                   # 독자 뷰 컴포넌트
│   ├── playback/                 # 재생 컴포넌트
│   ├── diff/                     # 비교 컴포넌트
│   └── ui/                       # 공통 UI 컴포넌트
├── hooks/                        # React 훅
│   ├── usePlayback.ts            # 재생 상태 관리
│   ├── useDiff.ts                # 비교 기능
│   └── use-documents.ts          # 문서 관리
├── lib/                          # 핵심 라이브러리
│   ├── event-sourcing/           # 이벤트 소싱 엔진
│   ├── diff/                     # 차이점 계산
│   ├── db/                       # 로컬 데이터베이스
│   ├── supabase/                 # Supabase 클라이언트
│   └── utils/                    # 유틸리티 함수
├── supabase/                     # 데이터베이스 마이그레이션
│   └── migrations/
├── types/                        # TypeScript 타입 정의
└── stores/                       # 상태 관리 (Zustand)
```

## 🔧 개발 가이드

### 타입 체크 및 린트
```bash
npm run type-check    # TypeScript 타입 체크
npm run lint          # ESLint 실행
npm run format        # Prettier 포맷팅
```

### 테스트
```bash
npm run test          # 단위 테스트 (Vitest)
npm run test:e2e      # E2E 테스트 (Playwright)
```

### 빌드
```bash
npm run build         # 프로덕션 빌드
npm run start         # 프로덕션 서버 실행
```

## 🔐 보안 고려사항

- **Row Level Security (RLS)**: Supabase에서 사용자별 데이터 접근 제어
- **JWT 인증**: Supabase Auth를 통한 안전한 사용자 인증
- **API 라우트 보호**: 모든 API 엔드포인트에 인증 검사
- **환경 변수**: 민감한 정보는 환경 변수로 관리

## 🎯 사용자 여정

### 작가 워크플로우
1. **가입 및 로그인**
2. **새 문서 생성**
3. **실시간 작성** (모든 과정이 자동 기록됨)
4. **문서 공개 설정**
5. **독자와 공유**

### 독자 워크플로우
1. **공개된 문서 접근**
2. **최종본 읽기**
3. **타임라인 재생으로 작성 과정 체험**
4. **초고와 최종본 비교 분석**

## 🚧 향후 계획

- [ ] **협업 기능**: 다중 작가 동시 편집
- [ ] **코멘트 시스템**: 독자 피드백 기능
- [ ] **분석 대시보드**: 작성 패턴 분석
- [ ] **export 기능**: PDF, EPUB 등 다양한 형식 지원
- [ ] **AI 인사이트**: 작성 스타일 분석 및 제안

## 🤝 기여하기

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 라이선스

MIT License - 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 📞 문의

- **이메일**: your-email@example.com
- **GitHub Issues**: [이슈 생성](https://github.com/your-username/writeback/issues)
- **Discord**: [커뮤니티 참여](https://discord.gg/your-invite)

---

**Writing Timeline Platform**은 작가와 독자 사이의 새로운 소통 방식을 제안합니다. 단순히 완성된 결과물을 공유하는 것이 아니라, 창작의 전 과정을 투명하게 공개함으로써 더 깊은 이해와 공감을 만들어갑니다.