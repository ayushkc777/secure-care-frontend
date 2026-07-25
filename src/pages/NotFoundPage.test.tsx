import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, test } from "vitest";

import { NotFoundPage } from "./NotFoundPage";

describe("NotFoundPage", () => {
  test("renders a clear heading and recovery link", () => {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>,
    );
    expect(html).toContain("<h1");
    expect(html).toMatch(/not found/i);
    expect(html).toContain('href="/"');
  });
});
