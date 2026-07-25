export function PageLoader() {
  return (
    <div className="page-loader" role="status" aria-live="polite">
      <span className="loading-indicator" aria-hidden="true" />
      <span>Loading SecureCare…</span>
    </div>
  );
}
