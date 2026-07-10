# game (Next.js 15 + Phaser 4)

회사 바이브코딩 가이드의 배포 경로(**Cloudflare Pages → Next.js preset**)에 맞춘 웹게임 잼 스타터.
모노레포 서브폴더로 그대로 사용한다. (예: `C:\git\playgam\game`)

## 실행

```bash
npm install
npm run dev      # http://localhost:3000, 움직이는 사각형 뜨면 정상
```

## 구조

```
game/
├── app/
│   ├── layout.tsx        # 루트 레이아웃 + viewport (모바일 줌 차단)
│   ├── globals.css        # 캔버스 중앙 정렬 최소 스타일
│   └── page.tsx           # GameCanvas 렌더
├── components/
│   └── GameCanvas.tsx     # Phaser를 useEffect에서 클라이언트 전용 동적 로드
└── phaser/                # 프레임워크 무관 게임 엔진 코드
    ├── config.ts          # 해상도/색상 상수
    ├── createGame.ts      # Phaser.Game 생성 (물리/스케일/씬 등록)
    ├── core/
    │   ├── InputManager.ts   # 키보드/포인터/터치 → action 추상화
    │   ├── AudioManager.ts   # 사운드 + autoplay unlock + 음소거
    │   ├── ObjectPool.ts     # 총알/적/파티클 재사용 풀
    │   └── SaveManager.ts    # localStorage 하이스코어/설정
    └── scenes/
        ├── PreloadScene.ts   # 에셋 로드 + 진행률 바
        ├── MenuScene.ts      # 타이틀 화면
        └── GameScene.ts      # 게임 로직 (여기를 갈아엎으면 됨)
```

## 왜 이 구조인가

- Phaser는 import 시점에 `window`를 참조 → SSR에서 크래시.
  그래서 `GameCanvas.tsx`가 `useEffect` 안에서 `await import()`로 **클라이언트에서만** 로드한다.
- 게임은 서버 코드(API route / server action)가 전혀 없다 → Cloudflare의
  "Next.js" preset(next-on-pages/OpenNext)의 서버 런타임 제약에 걸리지 않는다.

## Cloudflare Pages 배포 (회사 가이드 경로)

1. 이 폴더를 모노레포 저장소에 커밋 & 푸시
2. Cloudflare 대시보드 → Workers & Pages → Create application → Pages → Git 연결
3. **빌드 설정 (가장 중요)**
   - Framework preset: **Next.js** (⚠️ `Next.js (Static)` 아님)
   - Root directory (Advanced): **`game`** (이 서브폴더 이름)
   - Build command / output은 preset 기본값 사용
4. `nodejs_compat` 호환성 플래그 추가 (배포 중 요구되면)
   - Settings → Functions → Compatibility flags 에 `nodejs_compat`
   - Compatibility date는 `2024-09-23` 이상
5. Save and Deploy → 이후 push마다 자동 재배포

## 테마 나오면 할 일

1. `phaser/config.ts`의 `GAME_WIDTH/HEIGHT` 조정 (세로 모바일이면 540x960)
2. 플랫포머면 `phaser/createGame.ts`의 arcade `gravity.y`를 800으로
3. 에셋은 `public/`에 넣고 `PreloadScene.preload()`에서 로드
4. `GameScene`을 게임에 맞게 구현 — 나머지 배관은 그대로 재사용
```

## 에셋 급할 때

- 도형(rectangle/circle/graphics)만으로 프로토타입 가능
- 무료 에셋: Kenney.nl (CC0), 효과음: jsfxr 
```
