import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const childcareSources = [
  "../../pages/CareIndexPage.tsx",
  "../../pages/CentreWorkspacePage.tsx",
  "../../pages/RoomsPage.tsx",
  "../../pages/CareChildrenPage.tsx",
  "../../pages/ChildRecordPage.tsx",
].map((path) => readFileSync(new URL(path, import.meta.url), "utf8"));

describe("childcare browser storage", () => {
  test("does not persist child records in browser storage", () => {
    expect(childcareSources.join("\n")).not.toMatch(/localStorage|sessionStorage/u);
  });
});
