import { describe, expect, it } from "vitest";

describe("Phase 11 sensitive browser storage boundary", () => {
  it("does not persist health or medication data in browser storage", () => {
    const sourceFiles = import.meta.glob<string>(
      [
        "./*.ts",
        "../../pages/HealthPage.tsx",
        "../../pages/HealthChildrenPage.tsx",
        "../../pages/HealthWorkspacePage.tsx",
      ],
      { eager: true, query: "?raw", import: "default" },
    );
    const source = Object.values(sourceFiles).join("\n");
    expect(source).not.toMatch(/\b(?:localStorage|sessionStorage|indexedDB)\b/u);
  });
});
