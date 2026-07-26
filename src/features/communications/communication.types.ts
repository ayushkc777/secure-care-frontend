import type { CurrentAccess } from "../access/access.types";
import { hasPermission } from "../access/access-policy";

export type Message = {
  id: string;
  senderUserId: string;
  status: "DRAFT" | "SENT" | "DELIVERED" | "READ" | "ACKNOWLEDGED" | "ARCHIVED";
  body?: string;
  important: boolean;
  sentAt: string | null;
  createdAt: string;
  receiptCount: number;
  amendmentCount: number;
  amendments?: MessageAmendment[];
};

export type MessageAmendment = {
  id: string;
  authorUserId: string;
  createdAt: string;
  correctedBody?: string;
  reason?: string;
};

export type Conversation = {
  id: string;
  centreId: string;
  roomId: string | null;
  childId: string | null;
  scope: "CENTRE" | "ROOM" | "CHILD" | "DIRECT";
  status: "ACTIVE" | "ARCHIVED";
  subject?: string;
  important: boolean;
  participantUserIds: string[];
  messageCount: number;
  messages?: Message[];
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
  version: number;
};

export type Announcement = {
  id: string;
  centreId: string;
  roomId: string | null;
  childId: string | null;
  scope: "CENTRE" | "ROOM" | "CHILD";
  status: "DRAFT" | "SENT" | "EXPIRED" | "ARCHIVED";
  title?: string;
  content?: string;
  important: boolean;
  requiresAcknowledgement: boolean;
  deliveryCount: number;
  acknowledgementCount: number;
  acknowledged: boolean;
  sentAt: string | null;
  expiresAt: string | null;
  archivedAt: string | null;
  createdAt: string;
  version: number;
};

export type Notification = {
  id: string;
  type: string;
  status: "PENDING" | "DELIVERED" | "READ" | "DISMISSED" | "FAILED" | "EXPIRED";
  title?: string;
  body?: string;
  important: boolean;
  sourceType: string | null;
  sourceId: string | null;
  deliveredAt: string | null;
  readAt: string | null;
  dismissedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
};

export type NotificationPreference = {
  id: string;
  type: string;
  inAppEnabled: boolean;
  emailEnabled: boolean;
  version: number;
};

export function communicationControls(access: CurrentAccess, centreId: string) {
  return {
    canRead: hasPermission(access, "communication.read", centreId),
    canSend: hasPermission(access, "communication.send", centreId),
    canManage: hasPermission(access, "communication.manage", centreId),
    canReadNotifications: hasPermission(access, "notification.read", centreId),
    canManagePreferences: hasPermission(access, "notification_preference.manage", centreId),
  };
}
