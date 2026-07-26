import { describe, expect, test } from "vitest";

describe("report browser-storage boundary", () => {
  test("does not persist reports or exports in browser storage", () => {
    const files = import.meta.glob<string>(
      ["./*.ts", "../../pages/ReportsPage.tsx", "../../pages/ReportDashboardPage.tsx"],
      { eager: true, query: "?raw", import: "default" },
    );
    const source = Object.values(files).join("\n");
    expect(source).not.toMatch(/\blocalStorage\b/u);
    expect(source).not.toMatch(/\bsessionStorage\b/u);
    expect(source).not.toMatch(/\bindexedDB\b/u);
  });
});
