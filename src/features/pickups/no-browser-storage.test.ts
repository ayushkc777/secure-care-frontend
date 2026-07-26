import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, test } from "vitest";

describe("pickup browser storage boundary", () => {
  test("does not persist codes, child records, authorisations or verification state", () => {
    const sourceFiles = [
      "PickupCodeReveal.tsx",
      "../../pages/PickupPage.tsx",
      "../../pages/PickupWorkspacePage.tsx",
    ];
    for (const sourceFile of sourceFiles) {
      const source = readFileSync(join(import.meta.dirname, sourceFile), "utf8");
      expect(source).not.toMatch(/\b(?:localStorage|sessionStorage)\b/u);
    }
  });
});
