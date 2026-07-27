// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";

import { ConfirmDialog } from "./ConfirmDialog";

describe("ConfirmDialog", () => {
  test("announces a modal confirmation with cancellable controls", () => {
    render(
      <ConfirmDialog
        confirmLabel="Archive child"
        description="This keeps historical records."
        onCancel={() => undefined}
        onConfirm={() => undefined}
        open
        title="Archive this child?"
      />,
    );
    const dialog = screen.getByRole("alertdialog", { name: "Archive this child?" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAccessibleDescription("This keeps historical records.");
    expect(screen.getByRole("button", { name: "Cancel" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Archive child" })).toBeVisible();
  });

  test("implements Escape and focus restoration for keyboard users", async () => {
    const user = userEvent.setup();
    const trigger = document.createElement("button");
    trigger.textContent = "Open";
    document.body.append(trigger);
    trigger.focus();
    let open = true;
    const { rerender } = render(
      <ConfirmDialog
        confirmLabel="Archive"
        description="Confirmation"
        onCancel={() => {
          open = false;
        }}
        onConfirm={() => undefined}
        open={open}
        title="Archive?"
      />,
    );

    expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();
    await user.keyboard("{Escape}");
    rerender(
      <ConfirmDialog
        confirmLabel="Archive"
        description="Confirmation"
        onCancel={() => undefined}
        onConfirm={() => undefined}
        open={open}
        title="Archive?"
      />,
    );
    expect(trigger).toHaveFocus();
    trigger.remove();
  });
});
