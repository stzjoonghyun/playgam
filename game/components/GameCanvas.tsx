"use client";

import { useEffect, useRef } from "react";
import type Phaser from "phaser";

/**
 * Phaser 게임을 감싸는 React 컴포넌트.
 *
 * 핵심:
 *  - Phaser는 import 시점에 window/navigator를 참조하므로 SSR에서 터진다.
 *    → 정적 import 대신 useEffect 안에서 await import()로 클라이언트에서만 로드한다.
 *  - 언마운트 시 game.destroy()로 정리 (React StrictMode의 이중 마운트도 안전 처리).
 */
export default function GameCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // Phaser와 게임 부팅 코드를 클라이언트에서만 동적 로드
      const { createGame } = await import("@/phaser/createGame");
      if (cancelled || !containerRef.current) return;

      gameRef.current = createGame(containerRef.current);
    })();

    // cleanup: 컴포넌트가 사라지면 게임 인스턴스 파괴
    return () => {
      cancelled = true;
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  // Phaser가 이 div 안에 canvas를 주입한다
  return <div ref={containerRef} />;
}
