import { createClient } from "@supabase/supabase-js";

// .env.local에 아래 두 값을 넣어야 함 (Supabase 대시보드 > Project Settings > API 에서 확인)
// NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
// NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
// Cloudflare Pages에도 동일한 두 값을 Settings > Environment variables에 추가해야
// 배포된 사이트에서도 랭킹이 동작한다.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // 빌드는 되지만 런타임에 명확한 에러를 남겨서 설정 누락을 바로 알 수 있게 한다.
  console.warn(
    "[supabase] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY가 설정되지 않았습니다. 랭킹 기능이 동작하지 않습니다."
  );
}

export const supabase = createClient(supabaseUrl ?? "", supabaseAnonKey ?? "");
