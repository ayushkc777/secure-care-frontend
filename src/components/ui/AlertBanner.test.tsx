import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";

import { AlertBanner } from "./AlertBanner";

describe("AlertBanner", () => {
  test("announces routine feedback without interrupting the user", () => {
    const html = renderToStaticMarkup(
      <AlertBanner title="Attendance updated" tone="success">
        The check-in was recorded.
      </AlertBanner>,
    );
    expect(html).toContain('role="status"');
    expect(html).toContain("Attendance updated");
  });

  test("uses assertive semantics for warnings", () => {
    const html = renderToStaticMarkup(
      <AlertBanner title="Capacity warning" tone="warning">
        Review room capacity.
      </AlertBanner>,
    );
    expect(html).toContain('role="alert"');
  });
});
