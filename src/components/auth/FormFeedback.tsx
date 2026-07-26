import { useEffect, useRef } from "react";

export function ErrorSummary({ message }: { message: string | null }) {
  const summaryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (message !== null) summaryRef.current?.focus();
  }, [message]);

  if (message === null) return null;
  return (
    <div className="error-summary" ref={summaryRef} role="alert" tabIndex={-1}>
      <strong>There is a problem</strong>
      <p>{message}</p>
    </div>
  );
}

export function FieldError({ message }: { message?: string }) {
  if (message === undefined) return null;
  return (
    <span className="field-error" role="alert">
      {message}
    </span>
  );
}
