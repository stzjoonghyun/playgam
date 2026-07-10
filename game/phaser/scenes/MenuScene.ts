import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from "../config";
import { SaveManager } from "../core/SaveManager";

/**
 * 타이틀 화면. 클릭/터치/스페이스로 게임 시작.
 * 첫 유저 입력이 여기서 발생하므로 오디오 unlock도 자연스럽게 처리된다.
 */
export class MenuScene extends Phaser.Scene {
  constructor() {
    super("MenuScene");
  }

  create(): void {
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60, "GAME JAM", {
        fontFamily: "monospace",
        fontSize: "56px",
        color: COLORS.text,
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    const best = SaveManager.get<number>("highscore", 0);
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 10, `BEST: ${best}`, {
        fontFamily: "monospace",
        fontSize: "20px",
        color: "#4cc9f0",
      })
      .setOrigin(0.5);

    const prompt = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 70, "CLICK / TAP / SPACE TO START", {
        fontFamily: "monospace",
        fontSize: "18px",
        color: COLORS.text,
      })
      .setOrigin(0.5);

    // 깜빡이는 트윈 (살아있는 느낌)
    this.tweens.add({
      targets: prompt,
      alpha: 0.2,
      duration: 700,
      yoyo: true,
      repeat: -1,
    });

    // 어떤 입력이든 게임 시작
    this.input.once("pointerdown", () => this.startGame());
    this.input.keyboard?.once("keydown-SPACE", () => this.startGame());
  }

  private startGame(): void {
    this.scene.start("GameScene");
  }
}
