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
    // 배경 (가장 뒤에 깔림)
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, "bg").setDisplaySize(GAME_WIDTH, GAME_HEIGHT).setDepth(-10);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 90, "FRUIT SLICE", {
        fontFamily: "monospace",
        fontSize: "56px",
        color: COLORS.text,
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    // 규칙 한 줄 안내
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40, "드래그로 과일을 베고 폭탄은 피하세요 · 60초", {
        fontFamily: "monospace",
        fontSize: "16px",
        color: "#aaaaaa",
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
    // 브라우저 autoplay 정책 때문에 첫 유저 입력(여기)에서 사운드를 unlock하며 시작한다.
    // MenuScene은 세션당 한 번만 지나가므로, 이후 GameScene을 몇 번을 재시작해도 BGM은 끊기지 않고 계속 이어진다.
    if (!this.sound.get("bgm")) {
      this.sound.play("bgm", { loop: true, volume: 0.5 });
    }
    this.scene.start("GameScene");
  }
}
