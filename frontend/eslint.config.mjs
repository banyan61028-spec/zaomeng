import nextCoreVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextCoreVitals,
  ...nextTypescript,
  {
    ignores: [".next/**", "out/**", "build/**", "next-env.d.ts"],
  },
  {
    rules: {
      // Workflow artifacts are provider-defined JSON. Tightening these types is
      // tracked separately from release-blocking lint checks.
      "@typescript-eslint/no-explicit-any": "warn",
      // These React compiler checks identify refactor candidates in the current
      // orchestration UI, while Next's production type/build checks still run.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/refs": "warn",
    },
  },
];

export default eslintConfig;
