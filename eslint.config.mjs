import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  globalIgnores([
    ".next/**",
    "node_modules/**",
    "build/**",
    "dist/**",
    "out/**",
    "scratch/**",
    "eslint-*.txt",
    "**/D:\\Projects/**",
    "**/*.d.ts",
  ]),
  ...nextVitals,
  ...nextTs,
]);

export default eslintConfig;
