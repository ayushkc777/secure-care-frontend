import { describe, expect, it } from "vitest";

describe("Phase 11 health workflow accessibility", () => {
  it("provides page headings, labelled navigation, live feedback, and labelled form controls", () => {
    const pages = import.meta.glob<string>(
      [
        "../../pages/HealthPage.tsx",
        "../../pages/HealthChildrenPage.tsx",
        "../../pages/HealthWorkspacePage.tsx",
      ],
      { eager: true, query: "?raw", import: "default" },
    );
    const source = Object.values(pages).join("\n");
    expect(source).toContain("<h1");
    expect(source).toContain('aria-label="Health record sections"');
    expect(source).toContain('aria-live="polite"');
    expect(source).toContain('htmlFor="allergy-severity"');
    expect(source).toContain('htmlFor="administration-outcome"');
  });
});
