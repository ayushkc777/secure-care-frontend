import { useEffect, useRef } from "react";

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (open) cancelRef.current?.focus();
  }, [open]);
  if (!open) return null;
  return (
    <div className="dialog-backdrop">
      <section aria-describedby="confirmation-description" aria-modal="true" role="alertdialog">
        <h2>{title}</h2>
        <p id="confirmation-description">{description}</p>
        <div className="table-actions">
          <button className="secondary-button" onClick={onCancel} ref={cancelRef} type="button">
            Cancel
          </button>
          <button className="danger-button" onClick={onConfirm} type="button">
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
