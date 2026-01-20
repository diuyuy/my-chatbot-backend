import { config } from "dotenv";
import path from "path";
import { defineConfig } from "vitest/config";

config({ path: ".env.test" });

export default defineConfig({
  test: {
    // 전역 설정 (모든 프로젝트에 공통 적용)
    globals: true,
    setupFiles: ["./tests/setup.ts"],

    // coverage는 프로젝트 레벨에서 설정 불가, 루트에서만 설정
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/", "dist/", "**/*.config.{js,ts}", "**/*.d.ts"],
    },

    // 프로젝트 정의
    projects: [
      {
        // extends: true로 위의 전역 설정 상속
        extends: true,
        test: {
          name: "unit",
          environment: "node",
          include: ["**/*.test.ts"],
          exclude: [
            "**/*.integration.test.ts",
            "**/node_modules/**",
            "**/dist/**",
          ],
          // 단위 테스트는 병렬 실행
          pool: "threads",
          sequence: {
            groupOrder: 1,
          },
        },
      },
      {
        extends: true,
        test: {
          name: "integration",
          environment: "node",
          include: ["**/*.integration.test.ts"],
          exclude: ["**/node_modules/**", "**/dist/**"],
          // 통합 테스트는 DB 공유로 순차 실행
          pool: "forks",
          maxWorkers: 1,
          isolate: true,
          sequence: {
            groupOrder: 2,
          },
        },
      },
    ],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
