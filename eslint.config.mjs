import { FlatCompat } from "@eslint/eslintrc";
import { createRequire } from "node:module";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const baseDirectory = dirname(fileURLToPath(import.meta.url));
const nextConfigDirectory = dirname(require.resolve("eslint-config-next/package.json"));

const compat = new FlatCompat({
  baseDirectory,
  resolvePluginsRelativeTo: nextConfigDirectory
});

const config = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "coverage/**",
      ".pnpm-home/**",
      ".home/**",
      "next-env.d.ts"
    ]
  },
  ...compat.extends("next/core-web-vitals", "next/typescript")
];

export default config;
