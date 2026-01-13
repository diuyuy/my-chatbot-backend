import baseConfig from "@hono/eslint-config";

export default [
  ...baseConfig,
  {
    // TypeScript 파일들에만 이 설정을 적용합니다.
    files: ["**/*.ts", "**/*.tsx"],

    languageOptions: {
      parserOptions: {
        // TypeScript 설정 파일의 위치를 지정합니다.
        project: "./tsconfig.json",
        // 현재 작업 디렉토리를 루트로 설정합니다.
        tsconfigRootDir: process.cwd(),
      },
    },
  },
];
