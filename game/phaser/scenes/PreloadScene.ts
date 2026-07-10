import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from "../config";

/**
 * 모든 에셋을 여기서 로드하고 진행률 바를 그린다.
 * 로딩 완료되면 MenuScene으로 전환.
 *
 * 잼에서 에셋 추가는 preload()에 한 줄씩:
 *   this.load.image("player", "sprites/player.png");
 *   this.load.spritesheet("run", "sprites/run.png", { frameWidth: 32, frameHeight: 32 });
 *   this.load.audio("bgm", "audio/bgm.mp3");
 * 파일은 public/ 폴더에 넣으면 된다.
 */
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super("PreloadScene");
  }

  preload(): void {
    this.createProgressBar();

    // === 여기에 에셋 로드 추가 ===
    // 지금은 에셋이 없으므로 비어있음. 도형만으로도 프로토타입 가능.
  }

  create(): void {
    this.scene.start("MenuScene");
  }

  /** 로딩 진행률 바를 도형으로 직접 그린다 (에셋 불필요) */
  private createProgressBar(): void {
    const barWidth = 320;
    const barHeight = 24;
    const x = (GAME_WIDTH - barWidth) / 2;
    const y = GAME_HEIGHT / 2 - barHeight / 2;

    const box = this.add.graphics();
    box.fillStyle(0x000000, 0.5);
    box.fillRect(x - 4, y - 4, barWidth + 8, barHeight + 8);

    const bar = this.add.graphics();

    this.add
      .text(GAME_WIDTH / 2, y - 30, "LOADING...", {
        fontFamily: "monospace",
        fontSize: "18px",
        color: COLORS.text,
      })
      .setOrigin(0.5);

    // Loader 이벤트로 진행률 반영
    this.load.on("progress", (value: number) => {
      bar.clear();
      bar.fillStyle(COLORS.primary, 1);
      bar.fillRect(x, y, barWidth * value, barHeight);
    });
  }
}
