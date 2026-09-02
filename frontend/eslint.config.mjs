import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  {
    // House rules from .claude/rules/ui-components.md, enforced rather than
    // merely documented.
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      // A component that outgrows 150 lines is doing more than one job.
      "max-lines": [
        "error",
        { max: 150, skipBlankLines: true, skipComments: true },
      ],
      // next/image only: raw <img> skips optimisation, lazy loading and CLS
      // protection. eslint-config-next warns; we fail the build on it.
      "@next/next/no-img-element": "error",
    },
  },

  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
