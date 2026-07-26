import { describe, expect, test } from "vitest";

import type { CurrentAccess } from "../access/access.types";
import {
  announcementFormSchema,
  conversationFormSchema,
  replyFormSchema,
} from "./communication.schemas";
import { communicationControls } from "./communication.types";

const id = "00000000-0000-4000-8000-000000000001";

describe("Phase 12 communication policy and validation", () => {
  test("rejects HTML and unknown properties", () => {
    expect(
      replyFormSchema.safeParse({
        body: "<script>alert(1)</script>",
        important: false,
      }).success,
    ).toBe(false);
    expect(
      replyFormSchema.safeParse({
        body: "Safe plaintext",
        important: false,
        status: "READ",
      }).success,
    ).toBe(false);
    expect(
      conversationFormSchema.safeParse({
        childId: id,
        participantUserIds: id,
        subject: "Safe subject",
        body: "Safe plaintext",
        important: false,
      }).success,
    ).toBe(true);
    expect(
      announcementFormSchema.safeParse({
        scope: "CENTRE",
        scopeId: "",
        title: "Unsafe title",
        content: "<strong>unsafe</strong>",
        important: false,
        requiresAcknowledgement: false,
      }).success,
    ).toBe(false);
  });

  test("derives controls only from server-provided permissions", () => {
    const access: CurrentAccess = {
      userId: id,
      authenticationState: "MFA_AUTHENTICATED",
      platformPermissions: [],
      centres: [
        {
          centreId: id,
          permissions: ["communication.read", "communication.send", "notification.read"],
        },
      ],
      assignments: [{ id, roleCode: "PARENT", scope: "CENTRE", centreId: id }],
    };
    expect(communicationControls(access, id)).toEqual({
      canRead: true,
      canSend: true,
      canManage: false,
      canReadNotifications: true,
      canManagePreferences: false,
    });
  });
});
