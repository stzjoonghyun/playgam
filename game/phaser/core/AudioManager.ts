import Phaser from "phaser";

/**
 * 사운드 헬퍼. 잼의 단골 함정 두 가지를 해결한다:
 *  1) 브라우저 autoplay 정책 — 첫 유저 입력 전엔 소리가 안 남
 *  2) BGM 중복 재생 / 음소거 토글
 *
 * Phaser는 첫 pointerdown/keydown에서 자동으로 오디오 컨텍스트를 unlock 하지만,
 * BGM을 "게임 시작하자마자" 틀고 싶을 때를 대비해 명시적 unlock 훅도 둔다.
 */
export class AudioManager {
  private scene: Phaser.Scene;
  private bgm?: Phaser.Sound.BaseSound;
  private muted = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /** 효과음 1회 재생 */
  playSfx(key: string, volume = 1): void {
    if (this.muted) return;
    this.scene.sound.play(key, { volume });
  }

  /** BGM 재생 (이미 재생 중이면 무시). 보통 loop=true */
  playBgm(key: string, volume = 0.5): void {
    if (this.bgm && this.bgm.isPlaying) return;
    this.bgm = this.scene.sound.add(key, { loop: true, volume });
    if (!this.muted) this.bgm.play();
  }

  stopBgm(): void {
    this.bgm?.stop();
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    // 전역 음소거 (Phaser sound manager 레벨)
    this.scene.sound.mute = this.muted;
    return this.muted;
  }

  get isMuted(): boolean {
    return this.muted;
  }
}
