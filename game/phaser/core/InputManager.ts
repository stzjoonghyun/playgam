import Phaser from "phaser";

/**
 * 입력을 물리적 키가 아니라 논리적 "action" 단위로 다루는 매니저.
 * 장르가 바뀌어도 action 이름만 재해석하면 되고,
 * 키보드/포인터/터치를 한 곳에서 통합 처리한다.
 *
 * 사용 예:
 *   this.input_mgr = new InputManager(this);
 *   if (this.input_mgr.isDown("left")) { ... }
 *   if (this.input_mgr.justPressed("action")) { ... }
 */
export class InputManager {
  private scene: Phaser.Scene;
  private keys: Record<string, Phaser.Input.Keyboard.Key> = {};

  // 터치/포인터용 상태
  public pointerDown = false;
  public pointerJustDown = false;
  public pointerX = 0;
  public pointerY = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    const kb = scene.input.keyboard;
    if (kb) {
      // 기본 매핑. 장르에 맞게 자유롭게 추가/수정
      this.keys = {
        left: kb.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
        right: kb.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
        up: kb.addKey(Phaser.Input.Keyboard.KeyCodes.UP),
        down: kb.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
        action: kb.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
        pause: kb.addKey(Phaser.Input.Keyboard.KeyCodes.ESC),
      };
      // WASD도 방향키에 매핑 (원하면)
      this.keys.wLeft = kb.addKey(Phaser.Input.Keyboard.KeyCodes.A);
      this.keys.wRight = kb.addKey(Phaser.Input.Keyboard.KeyCodes.D);
      this.keys.wUp = kb.addKey(Phaser.Input.Keyboard.KeyCodes.W);
      this.keys.wDown = kb.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    }

    // 포인터(마우스+터치 통합). justDown은 매 프레임 리셋 필요
    scene.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
      this.pointerDown = true;
      this.pointerJustDown = true;
      this.pointerX = p.worldX;
      this.pointerY = p.worldY;
    });
    scene.input.on("pointerup", () => {
      this.pointerDown = false;
    });
    scene.input.on("pointermove", (p: Phaser.Input.Pointer) => {
      this.pointerX = p.worldX;
      this.pointerY = p.worldY;
    });
  }

  /** 키가 눌린 상태인지 (연속 입력) */
  isDown(action: string): boolean {
    switch (action) {
      case "left":
        return this.keys.left?.isDown || this.keys.wLeft?.isDown || false;
      case "right":
        return this.keys.right?.isDown || this.keys.wRight?.isDown || false;
      case "up":
        return this.keys.up?.isDown || this.keys.wUp?.isDown || false;
      case "down":
        return this.keys.down?.isDown || this.keys.wDown?.isDown || false;
      default:
        return this.keys[action]?.isDown || false;
    }
  }

  /** 이번 프레임에 막 눌렸는지 (단발 입력: 점프, 확인 등) */
  justPressed(action: string): boolean {
    const key = this.keys[action];
    return key ? Phaser.Input.Keyboard.JustDown(key) : false;
  }

  /**
   * Scene의 update() 맨 끝에서 반드시 호출.
   * 포인터의 justDown 플래그를 리셋한다.
   */
  update(): void {
    this.pointerJustDown = false;
  }
}
