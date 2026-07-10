import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from "./config";
import { PreloadScene } from "./scenes/PreloadScene";
import { MenuScene } from "./scenes/MenuScene";
import { GameScene } from "./scenes/GameScene";

/**
 * 주어진 DOM 요소를 parent로 하여 Phaser 게임을 생성한다.
 * GameCanvas 컴포넌트가 useEffect에서 호출한다.
 */
export function createGame(parent: HTMLElement): Phaser.Game {
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO, // WebGL 우선, 실패 시 Canvas fallback
    parent,
    backgroundColor: COLORS.bg,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    scale: {
      // 비율 유지하며 창에 맞춤. 데스크탑/모바일 모두 대응
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
      default: "arcade",
      arcade: {
        gravity: { x: 0, y: 0 }, // 플랫포머면 y: 800 정도로 변경
        debug: false,
      },
    },
    // 등록 순서 = 실행 순서. 첫 Scene이 자동 시작
    scene: [PreloadScene, MenuScene, GameScene],
  };

  return new Phaser.Game(config);
}
