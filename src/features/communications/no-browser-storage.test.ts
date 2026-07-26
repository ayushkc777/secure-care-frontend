import { describe, expect, test } from "vitest";

describe("communication browser-storage boundary", () => {
  test("does not persist messages or notifications in browser storage", () => {
    const files = import.meta.glob<string>(
      [
        "./*.ts",
        "../../pages/CommunicationsPage.tsx",
        "../../pages/CommunicationWorkspacePage.tsx",
        "../../pages/ConversationPage.tsx",
        "../../pages/NotificationsPage.tsx",
        "../../pages/NotificationWorkspacePage.tsx",
      ],
      { eager: true, query: "?raw", import: "default" },
    );
    const source = Object.values(files).join("\n");
    expect(source).not.toMatch(/\blocalStorage\b/u);
    expect(source).not.toMatch(/\bsessionStorage\b/u);
    expect(source).not.toMatch(/\bindexedDB\b/u);
  });
});
