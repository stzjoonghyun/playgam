/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "export", // 정적 사이트로 빌드 → out/ 폴더 생성, 서버 런타임 불필요
  // 주의: output: "export" 를 넣지 않는다.
  // 회사 가이드가 Cloudflare Pages에서 "Static"이 아닌 "Next.js" preset을 쓰라고 했기 때문.
  // 게임은 100% 클라이언트 사이드라 서버 코드가 없어 이 경로로도 문제없이 배포된다.
};