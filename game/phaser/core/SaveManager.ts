import { SAVE_PREFIX } from "../config";

/**
 * localStorage 래퍼. 하이스코어, 설정, 진행도 저장용.
 * JSON 직렬화 + 예외 처리를 포함한다 (사파리 프라이빗 모드 등에서 throw 가능).
 *
 * static 메서드로 어디서든 SaveManager.get(...) 호출.
 */
export class SaveManager {
  /** 값 저장. 실패해도 게임이 죽지 않도록 조용히 무시 */
  static set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(SAVE_PREFIX + key, JSON.stringify(value));
    } catch {
      // 저장 불가 환경 (프라이빗 모드, 용량 초과 등) — 무시
    }
  }

  /** 값 로드. 없거나 파싱 실패 시 fallback 반환 */
  static get<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(SAVE_PREFIX + key);
      return raw === null ? fallback : (JSON.parse(raw) as T);
    } catch {
      return fallback;
    }
  }

  /** 하이스코어 갱신 헬퍼 (기존보다 높을 때만 저장) */
  static updateHighScore(score: number): number {
    const best = SaveManager.get<number>("highscore", 0);
    if (score > best) {
      SaveManager.set("highscore", score);
      return score;
    }
    return best;
  }
}
