export function ErrorSummary({ message }: { message: string | null }) {
  if (message === null) return null;
  return (
    <div className="error-summary" role="alert" tabIndex={-1}>
      <strong>There is a problem</strong>
      <p>{message}</p>
    </div>
  );
}

export function FieldError({ message }: { message?: string }) {
  if (message === undefined) return null;
  return <span className="field-error">{message}</span>;
}
