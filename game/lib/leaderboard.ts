import { supabase } from "./supabase";

export interface LeaderboardEntry {
  name: string;
  score: number;
  created_at: string;
}

const TABLE = "leaderboard";
const NAME_MAX_LEN = 12;

/** 점수를 등록한다. 네트워크 실패해도 게임 흐름을 막지 않도록 에러는 던지지 않고 콘솔에만 남긴다. */
export async function submitScore(name: string, score: number): Promise<void> {
  const cleanName = name.trim().slice(0, NAME_MAX_LEN) || "익명";
  const { error } = await supabase.from(TABLE).insert({ name: cleanName, score: Math.max(0, Math.round(score)) });
  if (error) {
    console.error("[leaderboard] 점수 등록 실패:", error.message);
  }
}

/** 상위 N개 점수를 내림차순으로 가져온다. 실패 시 빈 배열을 반환한다. */
export async function fetchTopScores(limit = 10): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("name, score, created_at")
    .order("score", { ascending: false })
    .order("created_at", { ascending: true }) // 동점이면 먼저 세운 사람이 위
    .limit(limit);

  if (error) {
    console.error("[leaderboard] 랭킹 조회 실패:", error.message);
    return [];
  }
  return data ?? [];
}
