import type { NextConfig } from "next";
const isPages = process.env.GITHUB_ACTIONS === "true";
const basePath = isPages ? "/ritual-portfolio" : "";
const config: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath,
  assetPrefix: basePath,
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};
export default config;
