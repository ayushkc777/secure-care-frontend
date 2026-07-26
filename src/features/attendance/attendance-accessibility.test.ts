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
});
