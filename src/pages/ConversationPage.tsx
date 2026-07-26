import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useParams } from "react-router-dom";

import { apiClient, mutateWithCsrf, safeApiMessage } from "../api/client";
import { ErrorSummary, FieldError } from "../components/auth/FormFeedback";
import { useAccess } from "../features/access/useAccess";
import {
  amendmentFormSchema,
  replyFormSchema,
  type AmendmentForm,
  type ReplyForm,
} from "../features/communications/communication.schemas";
import {
  communicationControls,
  type Conversation,
  type Message,
} from "../features/communications/communication.types";

export function ConversationPage() {
  const { centreId = "", conversationId = "" } = useParams();
  const access = useAccess();
  const controls =
    access.status === "ready"
      ? communicationControls(access.access, centreId)
      : { canRead: false, canSend: false, canManage: false };
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [correcting, setCorrecting] = useState<Message | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const replyForm = useForm<ReplyForm>({
    resolver: zodResolver(replyFormSchema),
    defaultValues: { body: "", important: false },
  });
  const amendmentForm = useForm<AmendmentForm>({
    resolver: zodResolver(amendmentFormSchema),
    defaultValues: { correctedBody: "", reason: "" },
  });

  const load = useCallback(async () => {
    const { data } = await apiClient.get<{ conversation: Conversation }>(
      `/api/v1/centres/${centreId}/conversations/${conversationId}`,
    );
    setConversation(data.conversation);
  }, [centreId, conversationId]);

  useEffect(() => {
    let current = true;
    void Promise.resolve()
      .then(() => load())
      .catch((reason: unknown) => current && setError(safeApiMessage(reason)));
    return () => {
      current = false;
    };
  }, [load]);

  const reply = replyForm.handleSubmit(async (values) => {
    setError(null);
    try {
      await mutateWithCsrf(
        "post",
        `/api/v1/centres/${centreId}/conversations/${conversationId}/messages`,
        { ...values, clientRequestId: crypto.randomUUID() },
      );
      replyForm.reset();
      setStatus("Reply sent.");
      await load();
    } catch (reason) {
      setError(safeApiMessage(reason));
    }
  });

  const markRead = async (messageId: string) => {
    await mutateWithCsrf(
      "post",
      `/api/v1/centres/${centreId}/conversations/${conversationId}/messages/${messageId}/read`,
      {},
    );
    setStatus("Read receipt recorded.");
    await load();
  };

  const amend = amendmentForm.handleSubmit(async (values) => {
    if (correcting === null) return;
    try {
      await mutateWithCsrf(
        "post",
        `/api/v1/centres/${centreId}/conversations/${conversationId}/messages/${correcting.id}/amendments`,
        values,
      );
      setCorrecting(null);
      amendmentForm.reset();
      setStatus("Append-only correction recorded.");
      await load();
    } catch (reason) {
      setError(safeApiMessage(reason));
    }
  });

  const archive = async () => {
    if (conversation === null) return;
    try {
      await mutateWithCsrf(
        "post",
        `/api/v1/centres/${centreId}/conversations/${conversationId}/archive`,
        { version: conversation.version },
      );
      setStatus("Conversation archived.");
      await load();
    } catch (reason) {
      setError(safeApiMessage(reason));
    }
  };

  if (conversation === null) {
    return (
      <section className="content-card">
        <h1>Secure conversation</h1>
        <ErrorSummary message={error} />
        {error === null && <p role="status">Loading conversation…</p>}
      </section>
    );
  }

  return (
    <section className="content-card" aria-labelledby="conversation-title">
      <p className="eyebrow">Encrypted conversation thread</p>
      <h1 id="conversation-title">{conversation.subject ?? "Restricted metadata"}</h1>
      <nav className="section-navigation" aria-label="Conversation sections">
        <Link to={`/communications/centres/${centreId}`}>Back to secure inbox</Link>
      </nav>
      <ErrorSummary message={error} />
      <p aria-live="polite">{status}</p>
      <ol className="message-thread" aria-label="Messages in chronological order">
        {(conversation.messages ?? []).map((message) => (
          <li key={message.id}>
            <p className="message-meta">
              Sender {message.senderUserId} · {message.status}
              {message.important ? " · Important" : ""}
            </p>
            {message.body && <p className="message-body">{message.body}</p>}
            {message.amendments?.map((amendment) => (
              <aside key={amendment.id} className="warning-panel">
                <strong>Correction retained in audit history</strong>
                <p>{amendment.correctedBody}</p>
                <p>Reason: {amendment.reason}</p>
              </aside>
            ))}
            <div className="button-row">
              {controls.canRead && (
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => void markRead(message.id)}
                >
                  Mark read
                </button>
              )}
              {controls.canManage && (
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => setCorrecting(message)}
                >
                  Record correction
                </button>
              )}
            </div>
          </li>
        ))}
      </ol>

      {controls.canSend && conversation.status === "ACTIVE" && (
        <form className="auth-form" noValidate onSubmit={(event) => void reply(event)}>
          <h2>Secure reply</h2>
          <label htmlFor="reply-body">Plaintext message</label>
          <textarea id="reply-body" rows={5} {...replyForm.register("body")} />
          <FieldError message={replyForm.formState.errors.body?.message} />
          <label>
            <input type="checkbox" {...replyForm.register("important")} /> Mark important
          </label>
          <button className="primary-button" type="submit">
            Send reply
          </button>
        </form>
      )}

      {correcting && (
        <form className="auth-form" noValidate onSubmit={(event) => void amend(event)}>
          <h2>Record controlled correction</h2>
          <p>This appends a correction and does not overwrite the sent message.</p>
          <label htmlFor="corrected-body">Corrected plaintext</label>
          <textarea id="corrected-body" rows={5} {...amendmentForm.register("correctedBody")} />
          <FieldError message={amendmentForm.formState.errors.correctedBody?.message} />
          <label htmlFor="correction-reason">Correction reason</label>
          <textarea id="correction-reason" rows={3} {...amendmentForm.register("reason")} />
          <FieldError message={amendmentForm.formState.errors.reason?.message} />
          <div className="button-row">
            <button className="primary-button" type="submit">
              Save correction
            </button>
            <button className="secondary-button" type="button" onClick={() => setCorrecting(null)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {controls.canManage && conversation.status !== "ARCHIVED" && (
        <div className="danger-zone">
          <h2>Archive conversation</h2>
          <p>Recent MFA is required. The immutable message history remains available.</p>
          <button className="danger-button" type="button" onClick={() => void archive()}>
            Archive conversation
          </button>
        </div>
      )}
    </section>
  );
}
