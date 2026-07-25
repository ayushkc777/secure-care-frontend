import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";

import { apiClient, mutateWithCsrf, safeApiMessage } from "../api/client";
import { ErrorSummary, FieldError } from "../components/auth/FormFeedback";
import { ConfirmDialog } from "../components/feedback/ConfirmDialog";
import { hasPermission } from "../features/access/access-policy";
import { useAccess } from "../features/access/useAccess";
import {
  childFormSchema,
  enrolmentFormSchema,
  relationshipFormSchema,
  type ChildForm,
  type EnrolmentForm,
  type RelationshipForm,
} from "../features/childcare/childcare.schemas";
import type { ChildDetails, ParentRelationship, Room } from "../features/childcare/childcare.types";

type Enrolment = {
  roomId: string | null;
  version: number;
  room: Room | null;
};

export function ChildRecordPage() {
  const { centreId = "", childId = "" } = useParams();
  const navigate = useNavigate();
  const access = useAccess();
  const [child, setChild] = useState<ChildDetails | null>(null);
  const [relationships, setRelationships] = useState<ParentRelationship[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [enrolment, setEnrolment] = useState<Enrolment | null>(null);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [revoking, setRevoking] = useState<ParentRelationship | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const readyAccess = access.status === "ready" ? access.access : null;
  const canUpdate = readyAccess !== null && hasPermission(readyAccess, "child.update", centreId);
  const canArchive = readyAccess !== null && hasPermission(readyAccess, "child.archive", centreId);
  const canReadRelationships =
    readyAccess !== null && hasPermission(readyAccess, "relationship.read", centreId);
  const canManageRelationships =
    readyAccess !== null && hasPermission(readyAccess, "relationship.manage", centreId);
  const canManageEnrolment =
    readyAccess !== null && hasPermission(readyAccess, "enrolment.manage", centreId);

  const childForm = useForm<ChildForm>({ resolver: zodResolver(childFormSchema) });
  const relationshipForm = useForm<RelationshipForm>({
    resolver: zodResolver(relationshipFormSchema),
    defaultValues: {
      relationshipType: "LEGAL_GUARDIAN",
      isLegalGuardian: true,
      mayAuthorizePickup: false,
      mayViewIncidents: true,
    },
  });
  const enrolmentForm = useForm<EnrolmentForm>({
    resolver: zodResolver(enrolmentFormSchema),
  });

  const load = useCallback(async () => {
    const childResponse = await apiClient.get<{ child: ChildDetails }>(
      `/api/v1/centres/${centreId}/children/${childId}`,
    );
    setChild(childResponse.data.child);
    childForm.reset({
      externalReference: childResponse.data.child.externalReference ?? "",
      firstName: childResponse.data.child.firstName ?? "",
      lastName: childResponse.data.child.lastName ?? "",
      preferredName: childResponse.data.child.preferredName ?? "",
      dateOfBirth: childResponse.data.child.dateOfBirth ?? "",
      careNotes: childResponse.data.child.careNotes ?? "",
      enrolledAt: childResponse.data.child.enrolledAt?.slice(0, 10) ?? "",
    });
    if (canReadRelationships) {
      const response = await apiClient.get<{ relationships: ParentRelationship[] }>(
        `/api/v1/centres/${centreId}/children/${childId}/relationships`,
      );
      setRelationships(response.data.relationships);
    }
    const [roomResponse, enrolmentResponse] = await Promise.all([
      apiClient.get<{ rooms: Room[] }>(`/api/v1/centres/${centreId}/rooms`),
      apiClient.get<{ enrolment: Enrolment }>(
        `/api/v1/centres/${centreId}/children/${childId}/enrolment`,
      ),
    ]);
    setRooms(roomResponse.data.rooms);
    setEnrolment(enrolmentResponse.data.enrolment);
    if (enrolmentResponse.data.enrolment.roomId !== null) {
      enrolmentForm.reset({ roomId: enrolmentResponse.data.enrolment.roomId });
    }
  }, [canReadRelationships, centreId, childForm, childId, enrolmentForm]);

  useEffect(() => {
    void Promise.resolve()
      .then(() => load())
      .catch((error: unknown) => setRequestError(safeApiMessage(error)));
  }, [load]);

  const updateChild = childForm.handleSubmit(async (values) => {
    if (child === null) return;
    setRequestError(null);
    try {
      await mutateWithCsrf("patch", `/api/v1/centres/${centreId}/children/${childId}`, {
        ...values,
        preferredName: values.preferredName || null,
        careNotes: values.careNotes || null,
        enrolledAt: values.enrolledAt || null,
        version: child.version,
      });
      await load();
    } catch (error) {
      setRequestError(safeApiMessage(error));
    }
  });

  const addRelationship = relationshipForm.handleSubmit(async (values) => {
    setRequestError(null);
    try {
      const lookup = await apiClient.get<{ parents: { userId: string }[] }>(
        `/api/v1/centres/${centreId}/eligible-parents`,
        { params: { query: values.parentEmail } },
      );
      const parent = lookup.data.parents[0];
      if (parent === undefined) {
        setRequestError("No eligible Parent account matched that email.");
        return;
      }
      await mutateWithCsrf(
        "post",
        `/api/v1/centres/${centreId}/children/${childId}/relationships`,
        {
          parentUserId: parent.userId,
          relationshipType: values.relationshipType,
          isLegalGuardian: values.isLegalGuardian,
          mayAuthorizePickup: values.mayAuthorizePickup,
          mayViewIncidents: values.mayViewIncidents,
        },
      );
      relationshipForm.reset({
        parentEmail: "",
        relationshipType: "LEGAL_GUARDIAN",
        isLegalGuardian: true,
        mayAuthorizePickup: false,
        mayViewIncidents: true,
      });
      await load();
    } catch (error) {
      setRequestError(safeApiMessage(error));
    }
  });

  const setRoom = enrolmentForm.handleSubmit(async ({ roomId }) => {
    if (enrolment === null) return;
    try {
      await mutateWithCsrf("put", `/api/v1/centres/${centreId}/children/${childId}/enrolment`, {
        roomId,
        version: enrolment.version,
      });
      await load();
    } catch (error) {
      setRequestError(safeApiMessage(error));
    }
  });

  async function archiveChild() {
    if (child === null) return;
    try {
      await mutateWithCsrf("post", `/api/v1/centres/${centreId}/children/${childId}/archive`, {
        version: child.version,
      });
      await navigate(`/care/centres/${centreId}/children`, { replace: true });
    } catch (error) {
      setRequestError(safeApiMessage(error));
      setArchiveOpen(false);
    }
  }

  async function revokeRelationship() {
    if (revoking === null) return;
    try {
      await mutateWithCsrf(
        "delete",
        `/api/v1/centres/${centreId}/children/${childId}/relationships/${revoking.id}`,
        { version: revoking.version },
      );
      setRevoking(null);
      await load();
    } catch (error) {
      setRequestError(safeApiMessage(error));
      setRevoking(null);
    }
  }

  return (
    <section className="content-card" aria-labelledby="child-record-title">
      <p className="eyebrow">Sensitive childcare record</p>
      <h1 id="child-record-title">{child?.displayName ?? "Loading child record"}</h1>
      <p>Only fields authorised for your current role are returned by the server.</p>
      <ErrorSummary message={requestError} />
      {child !== null && (
        <dl className="detail-list">
          <div>
            <dt>Date of birth</dt>
            <dd>{child.dateOfBirth ?? "Not recorded"}</dd>
          </div>
          <div>
            <dt>Care information</dt>
            <dd>{child.careNotes ?? "No care information recorded"}</dd>
          </div>
          <div>
            <dt>Room</dt>
            <dd>{enrolment?.room?.name ?? "Not assigned"}</dd>
          </div>
        </dl>
      )}

      {canUpdate && child !== null && (
        <>
          <h2 className="section-heading">Edit child record</h2>
          <form className="auth-form" noValidate onSubmit={(event) => void updateChild(event)}>
            <label htmlFor="record-reference">Centre reference</label>
            <input id="record-reference" {...childForm.register("externalReference")} />
            <FieldError message={childForm.formState.errors.externalReference?.message} />
            <label htmlFor="record-first-name">First name</label>
            <input id="record-first-name" {...childForm.register("firstName")} />
            <FieldError message={childForm.formState.errors.firstName?.message} />
            <label htmlFor="record-last-name">Last name</label>
            <input id="record-last-name" {...childForm.register("lastName")} />
            <FieldError message={childForm.formState.errors.lastName?.message} />
            <label htmlFor="record-preferred-name">Preferred name</label>
            <input id="record-preferred-name" {...childForm.register("preferredName")} />
            <label htmlFor="record-date-of-birth">Date of birth</label>
            <input id="record-date-of-birth" type="date" {...childForm.register("dateOfBirth")} />
            <FieldError message={childForm.formState.errors.dateOfBirth?.message} />
            <label htmlFor="record-enrolled-at">Enrolment date</label>
            <input id="record-enrolled-at" type="date" {...childForm.register("enrolledAt")} />
            <label htmlFor="record-care-notes">Care information</label>
            <textarea id="record-care-notes" rows={4} {...childForm.register("careNotes")} />
            <button className="primary-button" type="submit">
              Save child record
            </button>
          </form>
        </>
      )}

      {canReadRelationships && (
        <>
          <h2 className="section-heading">Parents and guardians</h2>
          {relationships.length === 0 ? (
            <p>No active relationships are visible.</p>
          ) : (
            <ul className="metadata-list">
              {relationships.map((relationship) => (
                <li key={relationship.id}>
                  <strong>{relationship.relationshipType.replaceAll("_", " ")}</strong>
                  <span>{relationship.status}</span>
                  {canManageRelationships && (
                    <button
                      className="danger-button"
                      onClick={() => setRevoking(relationship)}
                      type="button"
                    >
                      Revoke relationship
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {canManageRelationships && (
        <>
          <h2 className="section-heading">Add parent or guardian</h2>
          <form className="auth-form" noValidate onSubmit={(event) => void addRelationship(event)}>
            <label htmlFor="parent-email">Parent account email</label>
            <input id="parent-email" type="email" {...relationshipForm.register("parentEmail")} />
            <FieldError message={relationshipForm.formState.errors.parentEmail?.message} />
            <label htmlFor="relationship-type">Relationship</label>
            <select id="relationship-type" {...relationshipForm.register("relationshipType")}>
              <option value="MOTHER">Mother</option>
              <option value="FATHER">Father</option>
              <option value="LEGAL_GUARDIAN">Legal guardian</option>
              <option value="FOSTER_CARER">Foster carer</option>
              <option value="OTHER">Other</option>
            </select>
            <label>
              <input type="checkbox" {...relationshipForm.register("isLegalGuardian")} /> Legal
              guardian
            </label>
            <label>
              <input type="checkbox" {...relationshipForm.register("mayViewIncidents")} /> May view
              incidents
            </label>
            <label>
              <input type="checkbox" {...relationshipForm.register("mayAuthorizePickup")} /> May
              authorise pickup
            </label>
            <button className="primary-button" type="submit">
              Add relationship
            </button>
          </form>
        </>
      )}

      {canManageEnrolment && enrolment !== null && (
        <>
          <h2 className="section-heading">Room enrolment</h2>
          <form className="auth-form" noValidate onSubmit={(event) => void setRoom(event)}>
            <label htmlFor="room-selector">Active room</label>
            <select id="room-selector" {...enrolmentForm.register("roomId")}>
              <option value="">Choose a room</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name} ({room.occupiedPlaces}/{room.capacity})
                </option>
              ))}
            </select>
            <FieldError message={enrolmentForm.formState.errors.roomId?.message} />
            <button className="primary-button" type="submit">
              {enrolment.roomId === null ? "Enrol in room" : "Move to selected room"}
            </button>
          </form>
        </>
      )}

      {canArchive && (
        <div className="danger-zone">
          <h2>Archive child record</h2>
          <p>This removes the child from active listings without erasing history.</p>
          <button className="danger-button" onClick={() => setArchiveOpen(true)} type="button">
            Archive child
          </button>
          <p>
            Archival requires <Link to="/mfa/step-up">recent identity confirmation</Link>.
          </p>
        </div>
      )}
      <ConfirmDialog
        confirmLabel="Archive child"
        description="The child will leave active lists and their current room assignment will end."
        onCancel={() => setArchiveOpen(false)}
        onConfirm={() => void archiveChild()}
        open={archiveOpen}
        title="Archive this child record?"
      />
      <ConfirmDialog
        confirmLabel="Revoke relationship"
        description="The parent will lose access on their next request. Historical records remain."
        onCancel={() => setRevoking(null)}
        onConfirm={() => void revokeRelationship()}
        open={revoking !== null}
        title="Revoke this relationship?"
      />
    </section>
  );
}
