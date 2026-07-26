import { describe, expect, test } from "vitest";

describe("Phase 12 communication accessibility", () => {
  test("provides headings, labelled navigation, live status, and labelled controls", () => {
    const pages = import.meta.glob<string>(
      [
        "../../pages/CommunicationsPage.tsx",
        "../../pages/CommunicationWorkspacePage.tsx",
        "../../pages/ConversationPage.tsx",
        "../../pages/NotificationsPage.tsx",
        "../../pages/NotificationWorkspacePage.tsx",
      ],
      { eager: true, query: "?raw", import: "default" },
    );
    const source = Object.values(pages).join("\n");
    expect(source).toContain("<h1");
    expect(source).toContain('aria-label="Communication sections"');
    expect(source).toContain('aria-label="Conversation sections"');
    expect(source).toContain('aria-label="Notification sections"');
    expect(source).toContain('aria-live="polite"');
    expect(source).toContain('htmlFor="reply-body"');
    expect(source).toContain('htmlFor="notification-type"');
  });
});
