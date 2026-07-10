/**
 * 게임 전역 설정값.
 * 장르가 정해지면 여기 GAME_WIDTH/HEIGHT부터 조정하면 된다.
 * (세로 모바일 게임이면 예: 540 x 960)
 */
export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;

// 자주 쓰는 색상 팔레트 (잼에서 에셋 없이 도형으로 프로토타입할 때 유용)
export const COLORS = {
  bg: 0x14141c,
  primary: 0x4cc9f0,
  accent: 0xf72585,
  text: "#ffffff",
} as const;

// SaveManager에서 쓸 localStorage 키 prefix. 잼마다 바꿔서 충돌 방지
export const SAVE_PREFIX = "jam:";
