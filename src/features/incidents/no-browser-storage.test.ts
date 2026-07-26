import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, test } from "vitest";

describe("incident browser-storage boundary", () => {
  test("incident modules do not persist records in browser storage", () => {
    const files = [
      "incident.schemas.ts",
      "incident.types.ts",
      "../../pages/IncidentsPage.tsx",
      "../../pages/IncidentWorkspacePage.tsx",
      "../../pages/IncidentDetailPage.tsx",
      "../../pages/SafeguardingPage.tsx",
    ];
    const source = files
      .map((file) => readFileSync(fileURLToPath(new URL(file, import.meta.url)), "utf8"))
      .join("\n");
    expect(source).not.toMatch(/\blocalStorage\b/u);
    expect(source).not.toMatch(/\bsessionStorage\b/u);
    expect(source).not.toMatch(/\bindexedDB\b/u);
  });
});
