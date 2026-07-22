-- ============================================================
--  공유 메모판 — Supabase 최초 1회 설정
--  supabase.com → 프로젝트 생성 → SQL Editor 에 붙여넣고 실행(Run).
--  실행 후 Project Settings → API 의 URL·anon key 를 memo.js 상단에 입력.
-- ============================================================

-- 메모 테이블
create table if not exists public.memos (
  id         uuid primary key default gen_random_uuid(),
  author     text        default '익명',
  body       text        default '',
  color      text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 행 수준 보안 켜기
alter table public.memos enable row level security;

-- 로그인 없는(anon) 전체 읽기·쓰기 허용.
--  사이트에서 이 페이지 메뉴 자체가 관리자(GitHub 토큰)에게만 노출되므로 익명 전체 허용으로 둔다.
drop policy if exists "memos anon all" on public.memos;
create policy "memos anon all" on public.memos
  for all
  to anon
  using (true)
  with check (true);

-- 실시간(Realtime) 브로드캐스트 대상에 테이블 등록
alter publication supabase_realtime add table public.memos;
