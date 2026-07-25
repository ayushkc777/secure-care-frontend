import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useParams } from "react-router-dom";

import { apiClient, mutateWithCsrf, safeApiMessage } from "../api/client";
import { ErrorSummary, FieldError } from "../components/auth/FormFeedback";
import { ConfirmDialog } from "../components/feedback/ConfirmDialog";
import { hasPermission } from "../features/access/access-policy";
import { useAccess } from "../features/access/useAccess";
import { roomFormSchema, type RoomForm } from "../features/childcare/childcare.schemas";
import type { Room } from "../features/childcare/childcare.types";

export function RoomsPage() {
  const { centreId = "" } = useParams();
  const access = useAccess();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [editing, setEditing] = useState<Room | null>(null);
  const [archiving, setArchiving] = useState<Room | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const canManage =
    access.status === "ready" && hasPermission(access.access, "room.manage", centreId);
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
  } = useForm<RoomForm>({
    resolver: zodResolver(roomFormSchema),
    defaultValues: { capacity: 20 },
  });

  const load = useCallback(async () => {
    const { data } = await apiClient.get<{ rooms: Room[] }>(`/api/v1/centres/${centreId}/rooms`);
    setRooms(data.rooms);
  }, [centreId]);

  useEffect(() => {
    let current = true;
    void apiClient
      .get<{ rooms: Room[] }>(`/api/v1/centres/${centreId}/rooms`)
      .then(({ data }) => {
        if (current) setRooms(data.rooms);
      })
      .catch((error: unknown) => {
        if (current) setRequestError(safeApiMessage(error));
      });
    return () => {
      current = false;
    };
  }, [centreId]);

  const submit = handleSubmit(async (values) => {
    setRequestError(null);
    try {
      if (editing === null) {
        await mutateWithCsrf("post", `/api/v1/centres/${centreId}/rooms`, values);
      } else {
        await mutateWithCsrf("patch", `/api/v1/centres/${centreId}/rooms/${editing.id}`, {
          ...values,
          version: editing.version,
        });
      }
      setEditing(null);
      reset({ name: "", capacity: 20 });
      await load();
    } catch (error) {
      setRequestError(safeApiMessage(error));
    }
  });

  function edit(room: Room) {
    setEditing(room);
    reset({ name: room.name, capacity: room.capacity });
  }

  async function archive() {
    if (archiving === null) return;
    try {
      await mutateWithCsrf("post", `/api/v1/centres/${centreId}/rooms/${archiving.id}/archive`, {
        version: archiving.version,
      });
      setArchiving(null);
      await load();
    } catch (error) {
      setRequestError(safeApiMessage(error));
      setArchiving(null);
    }
  }

  return (
    <section className="content-card" aria-labelledby="rooms-title">
      <p className="eyebrow">Centre rooms</p>
      <h1 id="rooms-title">Rooms and capacity</h1>
      <ErrorSummary message={requestError} />
      {rooms.length === 0 ? (
        <p>No active rooms have been created.</p>
      ) : (
        <div className="responsive-table" tabIndex={0}>
          <table>
            <caption>Active room capacity</caption>
            <thead>
              <tr>
                <th scope="col">Room</th>
                <th scope="col">Places</th>
                {canManage && <th scope="col">Controls</th>}
              </tr>
            </thead>
            <tbody>
              {rooms.map((room) => (
                <tr key={room.id}>
                  <td>{room.name}</td>
                  <td>
                    {room.occupiedPlaces} of {room.capacity}
                  </td>
                  {canManage && (
                    <td>
                      <div className="table-actions">
                        <button
                          className="secondary-button"
                          onClick={() => edit(room)}
                          type="button"
                        >
                          Edit
                        </button>
                        <button
                          className="danger-button"
                          onClick={() => setArchiving(room)}
                          type="button"
                        >
                          Archive
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {canManage && (
        <>
          <h2 className="section-heading">{editing === null ? "Create room" : "Edit room"}</h2>
          <form className="auth-form" noValidate onSubmit={(event) => void submit(event)}>
            <label htmlFor="room-name">Room name</label>
            <input id="room-name" {...register("name")} />
            <FieldError message={errors.name?.message} />
            <label htmlFor="room-capacity">Capacity</label>
            <input
              id="room-capacity"
              min={1}
              max={200}
              type="number"
              {...register("capacity", { valueAsNumber: true })}
            />
            <FieldError message={errors.capacity?.message} />
            <button className="primary-button" disabled={isSubmitting} type="submit">
              {editing === null ? "Create room" : "Save room"}
            </button>
          </form>
        </>
      )}
      <ConfirmDialog
        confirmLabel="Archive room"
        description="The room can be archived only when it has no active child enrolments."
        onCancel={() => setArchiving(null)}
        onConfirm={() => void archive()}
        open={archiving !== null}
        title="Archive this room?"
      />
    </section>
  );
}
