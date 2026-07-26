import { describe, expect, test } from "vitest";

describe("Phase 13 report accessibility", () => {
  test("provides labelled filters, textual chart equivalent and accessible table", () => {
    const pages = import.meta.glob<string>(
      ["../../pages/ReportsPage.tsx", "../../pages/ReportDashboardPage.tsx"],
      { eager: true, query: "?raw", import: "default" },
    );
    const source = Object.values(pages).join("\n");
    expect(source).toContain("<h1");
    expect(source).toContain('aria-label="Report sections"');
    expect(source).toContain('aria-live="polite"');
    expect(source).toContain('htmlFor="report-type"');
    expect(source).toContain("<caption>");
    expect(source).toContain('role="img"');
    expect(source).toContain("Displayed");
  });
});
