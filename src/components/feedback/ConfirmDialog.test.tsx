import { readFileSync } from "node:fs";

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";

import { ConfirmDialog } from "./ConfirmDialog";

describe("ConfirmDialog", () => {
  test("announces a modal confirmation with cancellable controls", () => {
    const html = renderToStaticMarkup(
      <ConfirmDialog
        confirmLabel="Archive child"
        description="This keeps historical records."
        onCancel={() => undefined}
        onConfirm={() => undefined}
        open
        title="Archive this child?"
      />,
    );
    expect(html).toContain('role="alertdialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('aria-labelledby="confirmation-title"');
    expect(html).toContain('aria-describedby="confirmation-description"');
    expect(html).toContain(">Cancel<");
    expect(html).toContain(">Archive child<");
  });

  test("implements Escape and focus restoration for keyboard users", () => {
    const source = readFileSync(new URL("./ConfirmDialog.tsx", import.meta.url), "utf8");
    expect(source).toContain('event.key === "Escape"');
    expect(source).toContain("previousFocusRef.current?.focus()");
    expect(source).toContain("cancelRef.current?.focus()");
  });
});
