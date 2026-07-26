import { useEffect, useState } from "react";

export function PickupCodeReveal({
  code,
  expiresAt,
  onClear,
}: {
  code: string;
  expiresAt: string;
  onClear: () => void;
}) {
  const [copyStatus, setCopyStatus] = useState("");

  useEffect(() => onClear, [onClear]);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      setCopyStatus("Code copied.");
    } catch {
      setCopyStatus("Copy failed. Select and copy the code manually.");
    }
  }

  return (
    <section className="success-panel" aria-labelledby="pickup-code-title">
      <h2 id="pickup-code-title">One-time pickup code</h2>
      <p>
        This code is shown once and expires at <time dateTime={expiresAt}>{expiresAt}</time>. If it
        is lost, generate a new code; the old code will stop working.
      </p>
      <output className="pickup-code" aria-label={`Pickup code ${code.split("").join(" ")}`}>
        {code}
      </output>
      <div className="button-row">
        <button className="secondary-button" type="button" onClick={() => void copyCode()}>
          Copy code
        </button>
        <button className="secondary-button" type="button" onClick={onClear}>
          Hide code
        </button>
      </div>
      <p aria-live="polite">{copyStatus}</p>
    </section>
  );
}
