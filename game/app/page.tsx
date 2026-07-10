import GameCanvas from "@/components/GameCanvas";

// GameCanvas는 'use client'이고 Phaser를 useEffect 안에서 동적 로드하므로
// 이 페이지는 서버 컴포넌트로 둬도 SSR에서 Phaser가 실행되지 않는다.
export default function Home() {
  return (
    <main className="game-shell">
      <GameCanvas />
    </main>
  );
}
