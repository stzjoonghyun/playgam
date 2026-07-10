import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from "../config";

// 게임에서 쓰는 블럭 색상. face_{color}.png, frag_{color}_{0..4}.png 와 대응된다.
export const BLOCK_COLORS = ["yellow", "blue", "green", "pink", "orange", "salmon", "purple"] as const;
export const FRAGS_PER_BLOCK = 5;

/**
 * 발바닥 블럭 스프라이트와 파편 조각들을 로드한다.
 * 에셋은 public/sprites/ 아래에 있고 사이트 루트(/sprites/...)로 서빙된다.
 */
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super("PreloadScene");
  }

  preload(): void {
    this.createProgressBar();

    this.load.image("bg", "/sprites/bg.jpg");
    this.load.audio("bgm", "/sprites/bgm.mp3");
    this.load.audio("sfx_block", "/sprites/sfx_block.mp3");
    this.load.image("bomb", "/sprites/bomb.png");

    for (const c of BLOCK_COLORS) {
      this.load.image(`face_${c}`, `/sprites/face_${c}.png`);
      for (let i = 0; i < FRAGS_PER_BLOCK; i++) {
        this.load.image(`frag_${c}_${i}`, `/sprites/frag_${c}_${i}.png`);
      }
    }
  }

  create(): void {
    this.scene.start("MenuScene");
  }

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
      .text(GAME_WIDTH / 2, y - 30, "LOADING...", { fontFamily: "monospace", fontSize: "18px", color: COLORS.text })
      .setOrigin(0.5);

    this.load.on("progress", (value: number) => {
      bar.clear();
      bar.fillStyle(COLORS.primary, 1);
      bar.fillRect(x, y, barWidth * value, barHeight);
    });
  }
}
