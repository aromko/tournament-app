import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import { FlatCompat } from "@eslint/eslintrc";
import reactHooks from "eslint-plugin-react-hooks";

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

export default [
  { files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"] },
  { languageOptions: { globals: globals.node } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
  ...compat.config({ extends: ["plugin:@next/next/core-web-vitals"] }),
  {
    settings: { react: { version: "detect" } },
    rules: { "react/jsx-uses-react": "off", "react/react-in-jsx-scope": "off" },
  },
  reactHooks.configs.flat.recommended,
];

