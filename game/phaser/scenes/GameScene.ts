import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from "../config";
import { ObjectPool } from "../core/ObjectPool";
import { SaveManager } from "../core/SaveManager";
import { BLOCK_COLORS, FRAGS_PER_BLOCK } from "./PreloadScene";
import { submitScore, fetchTopScores, type LeaderboardEntry } from "../../lib/leaderboard";

// === 게임 튜닝 상수 ===
const GAME_DURATION = 30; // 총 플레이 시간(초)
const HIT_RADIUS = 46; // 기준 슬라이스 판정 반경 (BLOCK_SCALE_BASE 기준, 블럭별로 크기에 비례해 스케일됨)
const BLOCK_SCALE_BASE = 0.78; // 반경 스케일링 계산 기준값
// 캐릭터(색상)별 블럭 크기. 곰(blue)을 기준으로 비율 조정 (테스트 도구에서 내보낸 값)
const BLOCK_SCALE_BY_COLOR: Record<string, number> = {
  pink: BLOCK_SCALE_BASE * 1.5, // 토끼
  orange: BLOCK_SCALE_BASE * 1.25, // 몽키
  blue: BLOCK_SCALE_BASE * 1.2, // 곰
  purple: BLOCK_SCALE_BASE * 1.0, // 고양이
  green: BLOCK_SCALE_BASE * 0.9, // 개구리
  salmon: BLOCK_SCALE_BASE * 0.85, // 돼지
  yellow: BLOCK_SCALE_BASE * 0.7, // 병아리
};
const BOMB_SCALE = 0.6; // 폭탄 크기(독립 상수)
const GRAVITY = 900; // 아래로 당기는 가속도(px/s^2)
const BOMB_CHANCE = 0.1; // 폭탄 등장 확률(개별 후보 기준. 한 번에 생성되는 그룹당 최대 1개로 제한됨)
const BLOCK_SCORE = 10; // 블럭 기본 점수 (색상별 지정이 없을 때 사용하는 기본값)
// 블록 색상별 점수. 필요한 색만 다르게 주면 되고, 나머지는 BLOCK_SCORE 기본값을 씀.
const BLOCK_SCORE_BY_COLOR: Record<string, number> = {
  pink: 10, // 토끼
  orange: 13, // 몽키
  blue: 15, // 곰
  purple: 18, // 고양이
  green: 20, // 개구리
  salmon: 23, // 돼지
  yellow: 30, // 병아리
};
const BOMB_PENALTY = 20; // 폭탄 감점(0 밑으론 안 내려감)
const COMBO_BONUS = 10; // 한 번의 연속 슬라이스 동안 2번째 블럭부터 추가로 붙는 보너스
const BLOCK_DEPTH = 1; // 블럭 렌더 깊이
const BOMB_DEPTH = 2; // 폭탄 렌더 깊이 (블럭보다 항상 위에 그려지도록)
const SFX_BLOCK_VOLUME = 0.9; // 블록 슬라이스 효과음 볼륨 (0~1). 작게 느껴지면 이 값을 올리면 됨
const SFX_BLOCK_DELAY = 0; // 효과음 재생 딜레이(초). 싱크가 안 맞으면 +값(늦게)/음수는 안 됨 → 파일 자체를 더 잘라야 함

// 날아다니는 블럭/폭탄
interface Entity {
  obj: Phaser.GameObjects.Image;
  vx: number;
  vy: number;
  spin: number; // 회전 속도(도/초)
  kind: "block" | "bomb";
  color: string; // 파편 색 매칭용
  sliced: boolean;
  radius: number; // 실제 표시 크기에 맞춘 슬라이스 판정 반경
}

// 흩어지는 파편
interface Frag {
  obj: Phaser.GameObjects.Image;
  vx: number;
  vy: number;
  spin: number;
  life: number; // 경과 시간(초)
}

const FRAG_LIFETIME = 0.8;

export class GameScene extends Phaser.Scene {
  private pool!: ObjectPool<Phaser.GameObjects.Image>;
  private entities: Entity[] = [];
  private frags: Frag[] = [];

  private bladeGfx!: Phaser.GameObjects.Graphics;
  private trail: { x: number; y: number }[] = [];

  private score = 0;
  private scoreText!: Phaser.GameObjects.Text;
  private timeLeft = GAME_DURATION;
  private timeText!: Phaser.GameObjects.Text;

  private spawnTimer?: Phaser.Time.TimerEvent;
  private isOver = false;
  private swipeHits = 0; // 현재 진행 중인 스와이프(포인터 down~up)에서 벤 블럭 수
  private pointerWasDown = false;

  constructor() {
    super("GameScene");
  }

  create(): void {
    this.isOver = false;
    this.score = 0;
    this.timeLeft = GAME_DURATION;
    this.entities = [];
    this.frags = [];
    this.trail = [];

    // 종료 화면(순위 팝업)에서 멈춰뒀던 BGM을 새 라운드 시작 시 다시 이어서 재생
    const bgm = this.sound.get("bgm");
    if (bgm && bgm.isPaused) {
      bgm.resume();
    }

    // 배경 (가장 뒤에 깔림)
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, "bg").setDisplaySize(GAME_WIDTH, GAME_HEIGHT).setDepth(-10);

    // 블럭 스프라이트 재사용 풀. acquire 시 텍스처/틴트만 갈아끼운다.
    this.pool = new ObjectPool<Phaser.GameObjects.Image>(
      () => {
        const obj = this.add.image(-100, -100, `face_${BLOCK_COLORS[0]}`);
        obj.setActive(false).setVisible(false);
        return obj;
      },
      (obj) => {
        obj.setActive(false).setVisible(false);
        obj.clearTint();
        obj.setAngle(0);
        obj.setScale(1);
        obj.setPosition(-100, -100);
      }
    );

    this.bladeGfx = this.add.graphics().setDepth(10);

    this.scoreText = this.add
      .text(16, 12, "SCORE 0", { fontFamily: "monospace", fontSize: "24px", color: COLORS.text, fontStyle: "bold" })
      .setDepth(20);
    this.timeText = this.add
      .text(GAME_WIDTH - 16, 12, `TIME ${this.timeLeft}`, { fontFamily: "monospace", fontSize: "24px", color: COLORS.text, fontStyle: "bold" })
      .setOrigin(1, 0)
      .setDepth(20);

    this.scheduleSpawn();
    this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        if (this.isOver) return;
        this.timeLeft -= 1;
        this.timeText.setText(`TIME ${Math.max(0, this.timeLeft)}`);
      },
    });
    this.time.delayedCall(GAME_DURATION * 1000, () => this.endGame());
  }

  update(_time: number, delta: number): void {
    const dt = delta / 1000;

    // 1) 칼날: 포인터가 눌린 동안만 궤적을 쌓고 슬라이스 판정
    const p = this.input.activePointer;
    if (!this.isOver && p.isDown) {
      if (!this.pointerWasDown) {
        this.swipeHits = 0; // 새 스와이프 시작 -> 콤보 카운트 초기화
      }
      this.trail.push({ x: p.worldX, y: p.worldY });
      if (this.trail.length > 12) this.trail.shift();
      if (this.trail.length >= 2) {
        this.checkSlice(this.trail[this.trail.length - 2], this.trail[this.trail.length - 1]);
      }
    } else {
      this.trail.length = 0;
    }
    this.pointerWasDown = !this.isOver && p.isDown;
    this.drawBlade();

    // 2) 블럭 이동(중력 적분) + 회전 + 화면 아래로 지나간 것 회수
    for (let i = this.entities.length - 1; i >= 0; i--) {
      const e = this.entities[i];
      e.vy += GRAVITY * dt;
      e.obj.x += e.vx * dt;
      e.obj.y += e.vy * dt;
      e.obj.angle += e.spin * dt;
      if (e.obj.y > GAME_HEIGHT + HIT_RADIUS * 3 && e.vy > 0) {
        this.recycle(i);
      }
    }

    // 3) 파편 이동 + 수명에 따라 페이드 후 제거
    for (let i = this.frags.length - 1; i >= 0; i--) {
      const f = this.frags[i];
      f.life += dt;
      f.vy += GRAVITY * dt;
      f.obj.x += f.vx * dt;
      f.obj.y += f.vy * dt;
      f.obj.angle += f.spin * dt;
      f.obj.alpha = Math.max(0, 1 - f.life / FRAG_LIFETIME);
      if (f.life >= FRAG_LIFETIME) {
        f.obj.destroy();
        this.frags.splice(i, 1);
      }
    }
  }

  private scheduleSpawn(): void {
    if (this.isOver) return;
    this.spawnTimer = this.time.delayedCall(Phaser.Math.Between(610, 1060), () => {
      if (this.isOver) return;
      const count = Phaser.Math.Between(2, 3); // 1회 생성 개수: 최소 2개
      let bombSpawned = false; // 한 번에 생성되는 그룹 안에서 폭탄은 최대 1개만
      const placedX: number[] = []; // 이번 그룹에서 이미 정한 x좌표들 (겹침 방지용)
      for (let i = 0; i < count; i++) {
        const wantsBomb = Math.random() < BOMB_CHANCE;
        const isBomb = wantsBomb && !bombSpawned;
        if (isBomb) bombSpawned = true;
        const x = this.pickSpawnX(placedX, isBomb);
        placedX.push(x);
        this.spawn(isBomb, x);
      }
      this.scheduleSpawn();
    });
  }

  /**
   * 같은 배치 안에서 생성되는 다른 블럭들과 x좌표가 너무 겹치지 않는 위치를 고른다.
   * 폭탄은 더 넓게 띄운다(같은 크기라도 헷갈리지 않게). 범위가 좁아 도저히 못 띄우면
   * 그나마 가장 멀리 떨어진 후보를 사용한다.
   */
  private pickSpawnX(existing: number[], isBomb: boolean): number {
    const spawnMinX = GAME_WIDTH * 0.4;
    const spawnMaxX = GAME_WIDTH * 0.7;
    const minGap = isBomb ? 150 : 100;

    if (existing.length === 0) {
      return Phaser.Math.Between(spawnMinX, spawnMaxX);
    }

    let best = Phaser.Math.Between(spawnMinX, spawnMaxX);
    let bestMinDist = -Infinity;
    for (let attempt = 0; attempt < 12; attempt++) {
      const candidate = Phaser.Math.Between(spawnMinX, spawnMaxX);
      const minDist = Math.min(...existing.map((x) => Math.abs(x - candidate)));
      if (minDist >= minGap) return candidate;
      if (minDist > bestMinDist) {
        bestMinDist = minDist;
        best = candidate;
      }
    }
    return best; // 범위가 좁아 완전히 못 띄워도 제일 멀리 떨어진 위치는 사용
  }

  private spawn(isBomb: boolean, x: number): void {
    const color = BLOCK_COLORS[Phaser.Math.Between(0, BLOCK_COLORS.length - 1)];

    const obj = this.pool.acquire();
    let radius: number;
    let scale: number;

    if (isBomb) {
      scale = BOMB_SCALE;
      obj.setTexture("bomb");
      obj.clearTint();
      obj.setScale(scale);
      obj.setDepth(BOMB_DEPTH); // 블럭과 겹쳐도 항상 위에 그려짐
      radius = HIT_RADIUS * (scale / BLOCK_SCALE_BASE); // 폭탄 크기에 비례해 판정 반경도 스케일
    } else {
      scale = BLOCK_SCALE_BY_COLOR[color] ?? BLOCK_SCALE_BASE;
      obj.setTexture(`face_${color}`);
      obj.clearTint();
      obj.setScale(scale);
      obj.setDepth(BLOCK_DEPTH);
      radius = HIT_RADIUS * (scale / BLOCK_SCALE_BASE); // 크기에 비례해 판정 반경도 스케일
    }

    obj.setPosition(x, GAME_HEIGHT + HIT_RADIUS);
    obj.setAngle(Phaser.Math.Between(0, 360));
    obj.setActive(true).setVisible(true);

    this.entities.push({
      obj,
      vx: Phaser.Math.Between(-160, 160),
      vy: Phaser.Math.Between(-980, -770),
      spin: Phaser.Math.Between(-180, 180),
      kind: isBomb ? "bomb" : "block",
      color,
      sliced: false,
      radius,
    });
  }

  private checkSlice(a: { x: number; y: number }, b: { x: number; y: number }): void {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    if (dx * dx + dy * dy < 16) return; // 거의 안 움직이면 칼날 아님

    const line = new Phaser.Geom.Line(a.x, a.y, b.x, b.y);

    for (let i = this.entities.length - 1; i >= 0; i--) {
      const e = this.entities[i];
      if (e.sliced) continue;
      if (Phaser.Geom.Intersects.LineToCircle(line, new Phaser.Geom.Circle(e.obj.x, e.obj.y, e.radius))) {
        e.sliced = true;
        if (e.kind === "bomb") {
          this.onBomb(e.obj.x, e.obj.y);
        } else {
          this.onBlock(e.obj.x, e.obj.y, e.color);
        }
        this.recycle(i);
      }
    }
  }

  private onBlock(x: number, y: number, color: string): void {
    const score = BLOCK_SCORE_BY_COLOR[color] ?? BLOCK_SCORE;
    this.addScore(score);
    this.spawnFrags(x, y, color);
    this.popup(x, y, `+${score}`, "#ffffff");
    this.sound.play("sfx_block", { volume: SFX_BLOCK_VOLUME, delay: SFX_BLOCK_DELAY });

    // 콤보: 같은 스와이프(포인터 down~up) 안에서 1개 이상 베면 이어서 카운트됨
    this.swipeHits++;
    if (this.swipeHits >= 2) {
      this.addScore(COMBO_BONUS);
      this.centerPopup(`COMBO x${this.swipeHits}  +${COMBO_BONUS}`, "#ffd32a");
    }
  }

  private onBomb(x: number, y: number): void {
    this.addScore(-BOMB_PENALTY);
    this.cameras.main.flash(200, 255, 0, 0);
    this.cameras.main.shake(150, 0.012);
    this.popup(x, y, `-${BOMB_PENALTY}`, "#ff5252");
  }

  private addScore(delta: number): void {
    this.score = Math.max(0, this.score + delta);
    this.scoreText.setText(`SCORE ${this.score}`);
  }

  /** 같은 색 파편 5조각을 벤 지점에서 흩뿌린다. */
  private spawnFrags(x: number, y: number, color: string): void {
    for (let i = 0; i < FRAGS_PER_BLOCK; i++) {
      const obj = this.add.image(x, y, `frag_${color}_${i}`).setDepth(5).setScale(1.4);
      this.frags.push({
        obj,
        vx: Phaser.Math.Between(-240, 240),
        vy: Phaser.Math.Between(-360, -120),
        spin: Phaser.Math.Between(-360, 360),
        life: 0,
      });
    }
  }

  private popup(x: number, y: number, text: string, color: string): void {
    const t = this.add.text(x, y, text, { fontFamily: "monospace", fontSize: "22px", color }).setOrigin(0.5).setDepth(15);
    this.tweens.add({ targets: t, y: y - 50, alpha: 0, duration: 600, onComplete: () => t.destroy() });
  }

  private centerPopup(text: string, color: string): void {
    const t = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40, text, { fontFamily: "monospace", fontSize: "30px", color, fontStyle: "bold" })
      .setOrigin(0.5)
      .setDepth(25);
    this.tweens.add({ targets: t, scale: 1.3, alpha: 0, duration: 700, onComplete: () => t.destroy() });
  }

  private drawBlade(): void {
    this.bladeGfx.clear();
    for (let i = 1; i < this.trail.length; i++) {
      const alpha = i / this.trail.length;
      this.bladeGfx.lineStyle(2 + alpha * 8, 0xffffff, alpha);
      this.bladeGfx.beginPath();
      this.bladeGfx.moveTo(this.trail[i - 1].x, this.trail[i - 1].y);
      this.bladeGfx.lineTo(this.trail[i].x, this.trail[i].y);
      this.bladeGfx.strokePath();
    }
  }

  private recycle(i: number): void {
    this.pool.release(this.entities[i].obj);
    this.entities.splice(i, 1);
  }

  private async endGame(): Promise<void> {
    if (this.isOver) return;
    this.isOver = true;
    this.spawnTimer?.remove();
    this.trail.length = 0;
    this.bladeGfx.clear();

    // 순위 팝업(종료 화면)에서는 BGM을 멈춘다. 다음 라운드 시작 시 create()에서 이어서 재생됨.
    const bgm = this.sound.get("bgm");
    if (bgm && bgm.isPlaying) {
      bgm.pause();
    }

    const prevBest = SaveManager.get<number>("highscore", 0);
    const best = SaveManager.updateHighScore(this.score);
    const isNewBest = this.score > prevBest && this.score > 0;
    const finalScore = this.score;

    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.7).setDepth(30);
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 155, "TIME'S UP", { fontFamily: "monospace", fontSize: "38px", color: "#ffffff", fontStyle: "bold" })
      .setOrigin(0.5)
      .setDepth(31);
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 105, `SCORE ${finalScore}`, { fontFamily: "monospace", fontSize: "26px", color: "#4cc9f0" })
      .setOrigin(0.5)
      .setDepth(31);
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 75, isNewBest ? "★ NEW BEST ★" : `BEST ${best}`, {
        fontFamily: "monospace",
        fontSize: "17px",
        color: isNewBest ? "#ffd32a" : "#ffffff",
      })
      .setOrigin(0.5)
      .setDepth(31);

    // 랭킹 영역: 처음엔 "등록 중" 표시, 등록/조회가 끝나면 텍스트를 갈아끼운다.
    const rankingText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40, "랭킹 등록 중...", {
        fontFamily: "monospace",
        fontSize: "14px",
        color: "#aaaaaa",
        align: "center",
        lineSpacing: 4,
      })
      .setOrigin(0.5, 0)
      .setDepth(31);

    const prompt = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 34, "탭 / 스페이스로 다시", { fontFamily: "monospace", fontSize: "16px", color: "#ffffff" })
      .setOrigin(0.5)
      .setDepth(31);
    this.tweens.add({ targets: prompt, alpha: 0.2, duration: 700, yoyo: true, repeat: -1 });

    // 랭킹 등록/조회는 네트워크가 걸려도 재시작을 막지 않도록 별도로 진행한다.
    this.submitAndShowRanking(finalScore, rankingText);

    this.time.delayedCall(700, () => {
      this.input.once("pointerdown", () => this.scene.restart());
      this.input.keyboard?.once("keydown-SPACE", () => this.scene.restart());
    });
  }

  /** 이름 입력 → 점수 등록 → 상위 랭킹 조회 → 텍스트 갱신. */
  private async submitAndShowRanking(finalScore: number, rankingText: Phaser.GameObjects.Text): Promise<void> {
    const NAME_KEY = "pang_playerName";
    try {
      if (finalScore > 0 && typeof window !== "undefined") {
        let lastName = "";
        try {
          lastName = window.localStorage.getItem(NAME_KEY) ?? "";
        } catch {
          /* localStorage 접근 불가 시 무시 */
        }
        const input = window.prompt("이름을 입력하세요 (랭킹 등록)", lastName)?.trim();
        if (input) {
          try {
            window.localStorage.setItem(NAME_KEY, input);
          } catch {
            /* 저장 실패해도 등록은 계속 진행 */
          }
          await submitScore(input, finalScore);
        }
      }
    } catch (err) {
      console.error("[leaderboard] 등록 중 오류:", err);
    }

    const top = await fetchTopScores(10);
    rankingText.setText(this.formatRanking(top));
  }

  private formatRanking(entries: LeaderboardEntry[]): string {
    if (entries.length === 0) return "랭킹 정보를 불러올 수 없습니다";
    const lines = ["=== TOP 10 ==="];
    entries.forEach((e, i) => {
      const rank = String(i + 1).padStart(2, " ");
      const name = e.name.padEnd(10, " ");
      lines.push(`${rank}. ${name} ${e.score}`);
    });
    return lines.join("\n");
  }
}
