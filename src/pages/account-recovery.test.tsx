import axe from "axe-core";
import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { ForgotPasswordPage } from "./ForgotPasswordPage";
import { LoginPage } from "./LoginPage";
import { RegisterPage } from "./RegisterPage";
import { VerifyEmailPage } from "./VerifyEmailPage";
import { AccessContext } from "../features/access/access-context";
import { AuthFlowProvider } from "../features/auth/AuthFlowContext";

const postWithCsrf = vi.fn<(path: string, body?: Record<string, unknown>) => Promise<unknown>>();
vi.mock("../api/client", () => ({
  postWithCsrf: (path: string, body?: Record<string, unknown>) => postWithCsrf(path, body),
  safeApiMessage: () => "The request could not be completed.",
}));

beforeEach(() => postWithCsrf.mockReset());

function renderAuthPage(page: ReactNode, entry = "/") {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <AuthFlowProvider>
        <AccessContext.Provider
          value={{
            status: "unauthenticated",
            access: null,
            refresh: () => Promise.resolve(),
          }}
        >
          {page}
        </AccessContext.Provider>
      </AuthFlowProvider>
    </MemoryRouter>,
  );
}

describe("account recovery pages", () => {
  test("announces validation and submits the generic forgot-password flow by keyboard", async () => {
    const user = userEvent.setup();
    postWithCsrf.mockResolvedValue({});
    const { container } = render(
      <MemoryRouter>
        <ForgotPasswordPage />
      </MemoryRouter>,
    );

    await user.tab();
    await user.tab();
    await user.type(screen.getByRole("textbox", { name: "Email address" }), "invalid");
    await user.tab();
    await user.keyboard("{Enter}");
    expect(await screen.findByRole("alert")).toHaveTextContent("Enter a valid email address.");

    await user.clear(screen.getByRole("textbox", { name: "Email address" }));
    await user.type(screen.getByRole("textbox", { name: "Email address" }), "parent@example.com");
    await user.click(screen.getByRole("button", { name: "Send reset instructions" }));
    expect(postWithCsrf).toHaveBeenCalledWith("/auth/password/forgot", {
      email: "parent@example.com",
    });
    expect(await screen.findByRole("status")).toHaveTextContent("If the account can be processed");
    expect(
      (await axe.run(container, { rules: { "color-contrast": { enabled: false } } })).violations,
    ).toEqual([]);
  });

  test("rejects incomplete verification links without sending a token", async () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/verify-email?token=short"]}>
        <VerifyEmailPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("verification link is incomplete");
    expect(screen.getByRole("button", { name: "Verify email" })).toBeDisabled();
    expect(postWithCsrf).not.toHaveBeenCalled();
    expect(
      (await axe.run(container, { rules: { "color-contrast": { enabled: false } } })).violations,
    ).toEqual([]);
  });
});

describe("primary authentication forms", () => {
  test("submits login and routes an MFA challenge without exposing credentials", async () => {
    const user = userEvent.setup();
    postWithCsrf.mockResolvedValue({
      authenticationState: "MFA_REQUIRED",
      challengeToken: "a".repeat(64),
      expiresAt: "2026-07-27T12:00:00.000Z",
    });
    renderAuthPage(<LoginPage />, "/login");

    await user.type(screen.getByRole("textbox", { name: "Email address" }), "parent@example.com");
    await user.type(screen.getByLabelText("Password"), "incorrect-password");
    await user.click(screen.getByRole("button", { name: "Continue securely" }));

    expect(postWithCsrf).toHaveBeenCalledWith("/auth/login", {
      email: "parent@example.com",
      password: "incorrect-password",
    });
  });

  test("validates and completes registration with anti-enumeration messaging", async () => {
    const user = userEvent.setup();
    postWithCsrf.mockResolvedValue({});
    renderAuthPage(<RegisterPage />, "/register");

    await user.type(screen.getByRole("textbox", { name: "Email address" }), "parent@example.com");
    await user.type(screen.getByLabelText("Password", { selector: "#register-password" }), "weak");
    await user.type(screen.getByLabelText("Confirm password"), "weak");
    await user.click(screen.getByRole("button", { name: "Create account" }));
    expect(await screen.findAllByRole("alert")).not.toHaveLength(0);
    expect(postWithCsrf).not.toHaveBeenCalled();

    await user.clear(screen.getByLabelText("Password", { selector: "#register-password" }));
    await user.type(
      screen.getByLabelText("Password", { selector: "#register-password" }),
      "Meadow!Quartz7-River-Care",
    );
    await user.clear(screen.getByLabelText("Confirm password"));
    await user.type(screen.getByLabelText("Confirm password"), "Meadow!Quartz7-River-Care");
    await user.click(screen.getByRole("button", { name: "Create account" }));
    expect(await screen.findByRole("status")).toHaveTextContent(
      "If the registration can be processed",
    );
  });
});
// @vitest-environment jsdom
