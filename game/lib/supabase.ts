import { createClient } from "@supabase/supabase-js";

// Supabase Project URL과 anon/publishable key.
// 이 두 값은 브라우저에 노출되어도 안전하도록 설계된 공개 값이라(그래서 이름이 "publishable"),
// Cloudflare Pages의 빌드 시점 환경변수 인식 이슈를 피하기 위해 기본값을 코드에 직접 넣어둔다.
// (.env.local / Cloudflare 대시보드 환경변수가 있으면 그 값이 우선 적용됨)
const FALLBACK_SUPABASE_URL = "https://mqxpcbwvmochivcuuoho.supabase.co";
const FALLBACK_SUPABASE_ANON_KEY = "sb_publishable_-xktcyl70x0MWFaN1Bbuqg_2NGdCeKv";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
