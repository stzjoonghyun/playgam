-- Supabase 대시보드 > SQL Editor 에서 그대로 실행하세요.

create table if not exists leaderboard (
  id bigint generated always as identity primary key,
  name text not null,
  score integer not null,
  created_at timestamptz not null default now()
);

-- 익명 클라이언트가 직접 insert/select 할 수 있도록 RLS를 켜고 정책을 명시적으로 연다.
alter table leaderboard enable row level security;

-- 누구나 랭킹을 읽을 수 있음
create policy "누구나 읽기 가능"
  on leaderboard for select
  using (true);

-- 누구나 점수를 등록할 수 있음 (단, 이름 길이/점수 범위를 최소한으로 검증)
-- score 상한(100000)은 정상적인 플레이로는 절대 나올 수 없는 값이라 넉넉히 잡았습니다.
-- 실제 게임 최고 점수 수준에 맞춰 낮춰서 명백한 조작 값만 걸러내는 용도입니다.
create policy "누구나 점수 등록 가능"
  on leaderboard for insert
  with check (
    char_length(name) between 1 and 12
    and score >= 0
    and score <= 100000
  );

-- (선택) 조회 성능을 위한 인덱스
create index if not exists leaderboard_score_idx on leaderboard (score desc);
