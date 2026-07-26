import { readFileSync } from "node:fs";

import { describe, expect, test } from "vitest";

const styles = readFileSync(new URL("../../styles/global.css", import.meta.url), "utf8");

describe("SecureCare design system", () => {
  test("defines semantic visual tokens and reusable states", () => {
    expect(styles).toContain("--color-accent:");
    expect(styles).toContain("--color-success:");
    expect(styles).toContain("--color-warning:");
    expect(styles).toContain("--color-danger:");
    expect(styles).toContain(".status-badge");
    expect(styles).toContain(".alert-banner");
    expect(styles).toContain(".empty-state");
    expect(styles).toContain(".skeleton");
  });

  test("defines deliberate tablet and mobile layouts", () => {
    expect(styles).toContain("@media (max-width: 56rem)");
    expect(styles).toContain("@media (max-width: 40rem)");
    expect(styles).toContain(".app-sidebar-open");
    expect(styles).toContain(".mobile-menu-button");
  });

  test("supports keyboard focus and reduced motion", () => {
    expect(styles).toContain(":focus-visible");
    expect(styles).toContain("@media (prefers-reduced-motion: reduce)");
    expect(styles).toContain("animation-duration: 0.01ms");
  });
});
