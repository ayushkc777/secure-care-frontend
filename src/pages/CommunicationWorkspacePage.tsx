import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useParams } from "react-router-dom";

import { apiClient, mutateWithCsrf, safeApiMessage } from "../api/client";
import { ErrorSummary, FieldError } from "../components/auth/FormFeedback";
import { useAccess } from "../features/access/useAccess";
import {
  announcementFormSchema,
  conversationFormSchema,
  type AnnouncementForm,
  type ConversationForm,
  type ConversationFormInput,
} from "../features/communications/communication.schemas";
import {
  communicationControls,
  type Announcement,
  type Conversation,
} from "../features/communications/communication.types";

export function CommunicationWorkspacePage() {
  const { centreId = "" } = useParams();
  const access = useAccess();
  const controls =
    access.status === "ready"
      ? communicationControls(access.access, centreId)
      : {
          canRead: false,
          canSend: false,
          canManage: false,
          canReadNotifications: false,
          canManagePreferences: false,
        };
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const conversationForm = useForm<ConversationFormInput, unknown, ConversationForm>({
    resolver: zodResolver(conversationFormSchema),
    defaultValues: {
      childId: "",
      participantUserIds: "",
      subject: "",
      body: "",
      important: false,
    },
  });
  const announcementForm = useForm<AnnouncementForm>({
    resolver: zodResolver(announcementFormSchema),
    defaultValues: {
      scope: "CENTRE",
      scopeId: "",
      title: "",
      content: "",
      important: false,
      requiresAcknowledgement: false,
    },
  });

  const load = useCallback(async () => {
    const [conversationResponse, announcementResponse] = await Promise.all([
      apiClient.get<{ conversations: Conversation[] }>(`/api/v1/centres/${centreId}/conversations`),
      apiClient.get<{ announcements: Announcement[] }>(`/api/v1/centres/${centreId}/announcements`),
    ]);
    setConversations(conversationResponse.data.conversations);
    setAnnouncements(announcementResponse.data.announcements);
  }, [centreId]);

  useEffect(() => {
    let current = true;
    void Promise.resolve()
      .then(() => load())
      .catch((reason: unknown) => current && setError(safeApiMessage(reason)));
    return () => {
      current = false;
    };
  }, [load]);

  const createConversation = conversationForm.handleSubmit(async (values) => {
    setError(null);
    try {
      await mutateWithCsrf("post", `/api/v1/centres/${centreId}/conversations`, {
        scope: "CHILD",
        childId: values.childId,
        participantUserIds: values.participantUserIds,
        subject: values.subject,
        body: values.body,
        important: values.important,
        clientRequestId: crypto.randomUUID(),
      });
      conversationForm.reset();
      setStatus("Secure conversation created.");
      await load();
    } catch (reason) {
      setError(safeApiMessage(reason));
    }
  });

  const createAnnouncement = announcementForm.handleSubmit(async (values) => {
    setError(null);
    try {
      await mutateWithCsrf("post", `/api/v1/centres/${centreId}/announcements`, {
        scope: values.scope,
        ...(values.scope === "ROOM" ? { roomId: values.scopeId } : {}),
        ...(values.scope === "CHILD" ? { childId: values.scopeId } : {}),
        title: values.title,
        content: values.content,
        important: values.important,
        requiresAcknowledgement: values.requiresAcknowledgement,
      });
      announcementForm.reset();
      setStatus("Announcement draft created. A recent MFA check is required before sending.");
      await load();
    } catch (reason) {
      setError(safeApiMessage(reason));
    }
  });

  const announcementAction = async (
    announcement: Announcement,
    action: "send" | "acknowledge" | "archive",
  ) => {
    setError(null);
    try {
      await mutateWithCsrf(
        "post",
        `/api/v1/centres/${centreId}/announcements/${announcement.id}/${action}`,
        action === "acknowledge" ? {} : { version: announcement.version },
      );
      setStatus(`Announcement ${action} action completed.`);
      await load();
    } catch (reason) {
      setError(safeApiMessage(reason));
    }
  };

  return (
    <section className="content-card" aria-labelledby="communication-workspace-title">
      <p className="eyebrow">Centre-scoped inbox</p>
      <h1 id="communication-workspace-title">Secure communications</h1>
      <nav className="section-navigation" aria-label="Communication sections">
        <Link to="/communications">All available centres</Link>
        {controls.canReadNotifications && (
          <Link to={`/notifications/centres/${centreId}`}>Notification centre</Link>
        )}
      </nav>
      <ErrorSummary message={error} />
      <p aria-live="polite">{status}</p>

      <h2 className="section-heading">Conversation threads</h2>
      {conversations.length === 0 ? (
        <p>No conversations are available.</p>
      ) : (
        <ul className="record-grid">
          {conversations.map((conversation) => (
            <li key={conversation.id}>
              <h3>{conversation.subject ?? "Restricted conversation metadata"}</h3>
              <p>
                {conversation.scope} · {conversation.status} · {conversation.messageCount} messages
              </p>
              <Link to={`/communications/centres/${centreId}/conversations/${conversation.id}`}>
                Open conversation
              </Link>
            </li>
          ))}
        </ul>
      )}

      <h2 className="section-heading">Announcements</h2>
      {announcements.length === 0 ? (
        <p>No announcements are available.</p>
      ) : (
        <ul className="record-grid">
          {announcements.map((announcement) => (
            <li key={announcement.id}>
              <h3>{announcement.title ?? "Restricted announcement metadata"}</h3>
              <p>
                {announcement.scope} · {announcement.status} · {announcement.acknowledgementCount}{" "}
                acknowledgements
              </p>
              {announcement.content && <p>{announcement.content}</p>}
              <div className="button-row">
                {controls.canManage && announcement.status === "DRAFT" && (
                  <button
                    className="primary-button"
                    type="button"
                    onClick={() => void announcementAction(announcement, "send")}
                  >
                    Send announcement
                  </button>
                )}
                {!controls.canManage &&
                  announcement.requiresAcknowledgement &&
                  !announcement.acknowledged && (
                    <button
                      className="secondary-button"
                      type="button"
                      onClick={() => void announcementAction(announcement, "acknowledge")}
                    >
                      Acknowledge
                    </button>
                  )}
                {controls.canManage && announcement.status !== "ARCHIVED" && (
                  <button
                    className="danger-button"
                    type="button"
                    onClick={() => void announcementAction(announcement, "archive")}
                  >
                    Archive
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {controls.canSend && (
        <>
          <h2 className="section-heading">Start child-specific conversation</h2>
          <form
            className="auth-form"
            noValidate
            onSubmit={(event) => void createConversation(event)}
          >
            <label htmlFor="conversation-child">Child record ID</label>
            <input id="conversation-child" {...conversationForm.register("childId")} />
            <FieldError message={conversationForm.formState.errors.childId?.message} />
            <label htmlFor="conversation-participants">
              Participant user IDs, separated by commas
            </label>
            <input
              id="conversation-participants"
              {...conversationForm.register("participantUserIds")}
            />
            <FieldError message={conversationForm.formState.errors.participantUserIds?.message} />
            <label htmlFor="conversation-subject">Subject</label>
            <input id="conversation-subject" {...conversationForm.register("subject")} />
            <FieldError message={conversationForm.formState.errors.subject?.message} />
            <label htmlFor="conversation-body">Initial plaintext message</label>
            <textarea id="conversation-body" rows={5} {...conversationForm.register("body")} />
            <FieldError message={conversationForm.formState.errors.body?.message} />
            <label>
              <input type="checkbox" {...conversationForm.register("important")} /> Mark important
            </label>
            <button className="primary-button" type="submit">
              Create conversation
            </button>
          </form>
        </>
      )}

      {controls.canManage && (
        <>
          <h2 className="section-heading">Create announcement draft</h2>
          <form
            className="auth-form"
            noValidate
            onSubmit={(event) => void createAnnouncement(event)}
          >
            <label htmlFor="announcement-scope">Audience scope</label>
            <select id="announcement-scope" {...announcementForm.register("scope")}>
              <option value="CENTRE">Centre</option>
              <option value="ROOM">Room</option>
              <option value="CHILD">Child</option>
            </select>
            <label htmlFor="announcement-scope-id">Room or child ID when applicable</label>
            <input id="announcement-scope-id" {...announcementForm.register("scopeId")} />
            <label htmlFor="announcement-title">Title</label>
            <input id="announcement-title" {...announcementForm.register("title")} />
            <FieldError message={announcementForm.formState.errors.title?.message} />
            <label htmlFor="announcement-content">Plaintext announcement</label>
            <textarea
              id="announcement-content"
              rows={5}
              {...announcementForm.register("content")}
            />
            <FieldError message={announcementForm.formState.errors.content?.message} />
            <label>
              <input type="checkbox" {...announcementForm.register("important")} /> Mark important
            </label>
            <label>
              <input type="checkbox" {...announcementForm.register("requiresAcknowledgement")} />{" "}
              Require acknowledgement
            </label>
            <button className="primary-button" type="submit">
              Save draft
            </button>
          </form>
        </>
      )}
    </section>
  );
}
