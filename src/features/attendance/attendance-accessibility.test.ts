import { readFileSync } from "node:fs";

import { describe, expect, test } from "vitest";

describe("attendance accessibility", () => {
  test.each([
    "../../pages/AttendancePage.tsx",
    "../../pages/AttendanceWorkspacePage.tsx",
    "../../pages/AttendanceHistoryPage.tsx",
  ])("%s retains a labelled page heading", (relativePath) => {
    const source = readFileSync(new URL(relativePath, import.meta.url), "utf8");
    expect(source).toMatch(/aria-labelledby=/u);
    expect(source).toMatch(/<h1/u);
  });

  test("daily operations expose statuses, loading and confirmation states", () => {
    const source = readFileSync(
      new URL("../../pages/AttendanceWorkspacePage.tsx", import.meta.url),
      "utf8",
    );
    expect(source).toContain("<StatusBadge");
    expect(source).toContain("<Skeleton");
    expect(source).toContain("<EmptyState");
    expect(source).toContain("<ConfirmDialog");
    expect(source).toContain("<AlertBanner");
  });
});
