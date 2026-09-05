import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = defineConfig([
  ...nextVitals,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // Disabled: this rule incorrectly flags the valid pattern of calling
      // useCallback-wrapped async fetch functions inside useEffect bodies.
      "react-hooks/set-state-in-effect": "off",
      // Disabled: anonymous default exports are used in i18n translation files.
      "import/no-anonymous-default-export": "off",
    },
  },
]);

export default eslintConfig;
