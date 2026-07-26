export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="brand-mark" aria-label="SecureCare">
      <span className="brand-symbol" aria-hidden="true">
        <svg viewBox="0 0 32 32" role="img">
          <path d="M16 3.5 27 8v7.4c0 6.2-4.3 11.7-11 13.1-6.7-1.4-11-6.9-11-13.1V8l11-4.5Z" />
          <path d="M11 16.2h10M16 11.2v10" />
        </svg>
      </span>
      {!compact && (
        <span className="brand-copy">
          <strong>SecureCare</strong>
          <small>Trusted childcare operations</small>
        </span>
      )}
    </span>
  );
}
