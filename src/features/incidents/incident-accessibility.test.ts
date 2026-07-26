import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, test } from "vitest";

function source(file: string): string {
  return readFileSync(fileURLToPath(new URL(file, import.meta.url)), "utf8");
}

describe("incident accessibility structure", () => {
  test("forms use visible labels and lifecycle updates use live regions", () => {
    const workspace = source("../../pages/IncidentWorkspacePage.tsx");
    const detail = source("../../pages/IncidentDetailPage.tsx");
    expect(workspace).toContain('<label htmlFor="incident-description">');
    expect(workspace).toContain('<label htmlFor="incident-occurred-at">');
    expect(workspace).toContain('aria-live="polite"');
    expect(detail).toContain('<label htmlFor="acknowledgement-comment">');
    expect(detail).toContain('aria-live="polite"');
  });

  test("safeguarding pages keep sensitive values out of headings and URLs", () => {
    const safeguarding = source("../../pages/SafeguardingPage.tsx");
    expect(safeguarding).toContain(">Safeguarding concern<");
    expect(safeguarding).not.toContain("${concern.narrative}");
    expect(safeguarding).not.toContain("${concern.classification}");
  });
});
