import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from "../config";
import { InputManager } from "../core/InputManager";
import { AudioManager } from "../core/AudioManager";
import { SaveManager } from "../core/SaveManager";

/**
 * 실제 게임 로직이 들어갈 곳.
 * 지금은 매니저들이 어떻게 엮이는지 보여주는 최소 데모:
 *  - 방향키/WASD/터치로 움직이는 사각형 하나
 *  - 이동 시간에 따라 점수 증가
 *
 * 테마가 나오면 이 Scene을 게임에 맞게 갈아엎으면 된다.
 * 나머지 배관(입력/오디오/저장/씬 흐름)은 그대로 재사용.
 */
export class GameScene extends Phaser.Scene {
  private input_mgr!: InputManager;
  private audio!: AudioManager;

  private player!: Phaser.GameObjects.Rectangle;
  private score = 0;
  private scoreText!: Phaser.GameObjects.Text;

  private readonly SPEED = 300;

  constructor() {
    super("GameScene");
  }

  create(): void {
    // 매니저 초기화 (Scene마다 새로 생성)
    this.input_mgr = new InputManager(this);
    this.audio = new AudioManager(this);

    // 플레이어 대역: 도형만으로 프로토타입 (에셋 없이 즉시 시작 가능)
    this.player = this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      40,
      40,
      COLORS.primary
    );

    this.score = 0;
    this.scoreText = this.add.text(16, 16, "SCORE: 0", {
      fontFamily: "monospace",
      fontSize: "20px",
      color: COLORS.text,
    });

    // ESC로 메뉴 복귀
    this.input.keyboard?.on("keydown-ESC", () => {
      this.scene.start("MenuScene");
    });
  }

  update(_time: number, delta: number): void {
    const dt = delta / 1000; // 초 단위 (프레임 독립적 이동)

    // 입력 → 이동. 데스크탑(키보드)과 모바일(터치) 모두 처리
    if (this.input_mgr.isDown("left")) this.player.x -= this.SPEED * dt;
    if (this.input_mgr.isDown("right")) this.player.x += this.SPEED * dt;
    if (this.input_mgr.isDown("up")) this.player.y -= this.SPEED * dt;
    if (this.input_mgr.isDown("down")) this.player.y += this.SPEED * dt;

    // 터치: 누른 지점으로 이동
    if (this.input_mgr.pointerDown) {
      const dx = this.input_mgr.pointerX - this.player.x;
      const dy = this.input_mgr.pointerY - this.player.y;
      const len = Math.hypot(dx, dy);
      if (len > 4) {
        this.player.x += (dx / len) * this.SPEED * dt;
        this.player.y += (dy / len) * this.SPEED * dt;
      }
    }

    // 화면 밖으로 못 나가게 clamp
    this.player.x = Phaser.Math.Clamp(this.player.x, 20, GAME_WIDTH - 20);
    this.player.y = Phaser.Math.Clamp(this.player.y, 20, GAME_HEIGHT - 20);

    // 데모 점수: 시간에 비례
    this.score += Math.floor(delta);
    this.scoreText.setText(`SCORE: ${this.score}`);

    // InputManager는 update 끝에서 반드시 갱신 (justDown 리셋)
    this.input_mgr.update();
  }

  /** 게임 종료 시 호출할 예시 함수 */
  private gameOver(): void {
    const best = SaveManager.updateHighScore(this.score);
    console.log(`game over. score=${this.score}, best=${best}`);
    this.scene.start("MenuScene");
  }
}
