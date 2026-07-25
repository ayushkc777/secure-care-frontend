import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, test } from "vitest";

import { AccessDeniedPage } from "./AccessDeniedPage";

describe("AccessDeniedPage", () => {
  test("provides an accessible explanation and recovery link", () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <AccessDeniedPage />
      </MemoryRouter>,
    );

    expect(html).toContain('aria-labelledby="access-denied-title"');
    expect(html).toContain("<h1");
    expect(html).toContain("Access denied");
    expect(html).toContain('href="/access"');
    expect(html).toContain("Review my current access");
  });
});
