import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";

import { PickupCodeReveal } from "./PickupCodeReveal";

describe("PickupCodeReveal", () => {
  test("labels the spaced code for assistive technology and warns that it is shown once", () => {
    const html = renderToStaticMarkup(
      <PickupCodeReveal
        code="ABCD234567"
        expiresAt="2026-07-26T10:05:00.000Z"
        onClear={() => undefined}
      />,
    );
    expect(html).toContain('aria-label="Pickup code A B C D 2 3 4 5 6 7"');
    expect(html).toContain("shown once");
    expect(html).toContain("Copy code");
    expect(html).toContain('aria-live="polite"');
  });
});
