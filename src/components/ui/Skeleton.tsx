export function Skeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="skeleton-card" aria-label="Loading content" role="status">
      <span className="sr-only">Loading…</span>
      {Array.from({ length: lines }, (_, index) => (
        <span className="skeleton-line" key={index} aria-hidden="true" />
      ))}
    </div>
  );
}
