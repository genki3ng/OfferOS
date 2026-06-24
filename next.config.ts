import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // /agenda 已并入 /timeline（合并日程 + 时间线为一页）；308 永久跳转，旧链接/书签不失效。
  async redirects() {
    return [{ source: "/agenda", destination: "/timeline", permanent: true }];
  },
  // 数据 = 仓库里的 markdown，构建时读取；push 到 main 后 Vercel 自动重建。
  outputFileTracingIncludes: {
    "/**": [
      "./HANDOFF.md",
      "./pipeline/**/*.md",
      "./strategy/**/*.md",
      "./prep/**/*.md",
      "./intel/**/*.md",
      "./profile/**/*.md",
      "./log/**/*.md",
      "./negotiation/**/*.md",
      "./summary/**/*.md",
      "./data/**/*.json",
    ],
  },
};

export default nextConfig;
