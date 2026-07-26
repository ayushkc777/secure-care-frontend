import { readFileSync } from "node:fs";

import { describe, expect, test } from "vitest";

describe("application shell", () => {
  test("provides role-aware navigation, landmarks and mobile controls", () => {
    const shell = readFileSync(new URL("./AppShell.tsx", import.meta.url), "utf8");
    const navigation = readFileSync(new URL("./AppNavigation.tsx", import.meta.url), "utf8");

    expect(shell).toContain("<aside");
    expect(shell).toContain("<header");
    expect(shell).toContain("<main");
    expect(shell).toContain('aria-controls="primary-navigation"');
    expect(shell).toContain("aria-expanded={navigationOpen}");
    expect(shell).toContain("<Breadcrumbs");
    expect(navigation).toContain("visibleAccessNavigation(state.access)");
    expect(navigation).toContain('aria-label="Primary navigation"');
  });

  test("does not persist access state or protected records in browser storage", () => {
    const shell = readFileSync(new URL("./AppShell.tsx", import.meta.url), "utf8");
    expect(shell).not.toMatch(/localStorage|sessionStorage/u);
  });
});
