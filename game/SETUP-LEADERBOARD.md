# 랭킹 시스템 설정 (Supabase)

## 1. Supabase 프로젝트 생성
1. https://supabase.com 에서 무료 프로젝트 생성 (1분)
2. 대시보드 좌측 SQL Editor 열고 `supabase-leaderboard.sql` 내용 전체 실행
3. Project Settings → API 에서 `Project URL`, `anon public` 키 복사

## 2. 로컬 환경변수
`game/.env.local` 파일 생성 (없으면 새로 만들기):
```
NEXT_PUBLIC_SUPABASE_URL=여기에 Project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=여기에 anon public 키
```

## 3. 패키지 설치
```
cd game
npm install @supabase/supabase-js
```

## 4. Cloudflare Pages 배포 환경변수
Cloudflare 대시보드 → 해당 프로젝트 → Settings → Environment variables 에서
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` 를
production/preview 둘 다 동일하게 추가 (로컬 .env.local은 배포에 반영되지 않음).

## 5. 동작 방식
- 게임 종료(TIME'S UP) 화면에서 최종 점수가 0보다 크면 `window.prompt`로 이름을 물어봄
- 입력하면 Supabase `leaderboard` 테이블에 이름+점수 저장
- 곧바로 상위 10명 랭킹을 불러와 종료 화면에 표시
- 네트워크가 느리거나 실패해도 "탭/스페이스로 다시" 재시작은 그대로 동작 (랭킹 등록은 막지 않음)
- 이름은 브라우저 localStorage에 저장해서 다음 플레이 때 기본값으로 뜸

## 참고
- `anon` 키는 공개되어도 되는 키지만, insert 정책에 점수 상한(100000)을 걸어둔 정도라 완전한 부정행위 방지는 아님.
  사내 행사용으로는 충분하지만, 진짜 중요한 대회라면 서버 검증(Edge Function 등)을 추가하는 게 안전함.
