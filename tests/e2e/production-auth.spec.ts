import { createHmac } from "node:crypto";

import { expect, test, type APIRequestContext } from "@playwright/test";

const mailpitUrl = process.env.E2E_MAILPIT_URL ?? "http://127.0.0.1:18025";
const password = "Canopy!Silver7-Compass-River";
const nextPassword = "Lantern!Cobalt8-Meadow-Bridge";

function currentTotp(secret: string): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const character of secret.replaceAll(" ", "").toUpperCase()) {
    bits += alphabet.indexOf(character).toString(2).padStart(5, "0");
  }
  const key = Buffer.from(
    bits
      .match(/.{8}/gu)
      ?.map((byte) => String.fromCharCode(Number.parseInt(byte, 2)))
      .join("") ?? "",
    "binary",
  );
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30_000)));
  const digest = createHmac("sha1", key).update(counter).digest();
  const offset = digest.at(-1)! & 0x0f;
  const value = (digest.readUInt32BE(offset) & 0x7fffffff) % 1_000_000;
  return value.toString().padStart(6, "0");
}

async function latestLink(
  request: APIRequestContext,
  email: string,
  path: "verify-email" | "reset-password",
): Promise<string> {
  let captured: string | null = null;
  await expect
    .poll(
      async () => {
        const response = await request.get(`${mailpitUrl}/api/v1/messages`);
        if (!response.ok()) return null;
        const payload = (await response.json()) as {
          messages?: Array<{ ID?: string; To?: Array<{ Address?: string }> }>;
        };
        const message = payload.messages?.find((item) =>
          item.To?.some((recipient) => recipient.Address === email),
        );
        if (message?.ID === undefined) return null;
        const detail = await request.get(`${mailpitUrl}/api/v1/message/${message.ID}`);
        captured =
          (await detail.text())
            .replaceAll("&amp;", "&")
            .match(new RegExp(`https?://[^\\s"<>]+/${path}\\?token=[^\\s"<>]+`, "u"))?.[0] ?? null;
        return captured;
      },
      { timeout: 20_000 },
    )
    .not.toBeNull();
  if (captured === null) throw new Error("Mailpit did not capture the expected link.");
  return captured;
}

test("built frontend uses one API prefix and completes verification and reset", async ({
  page,
  request,
}) => {
  const email = `browser-${Date.now()}@example.test`;
  const requestedPaths: string[] = [];
  page.on("request", (outgoing) => {
    if (outgoing.url().includes("/api/")) requestedPaths.push(new URL(outgoing.url()).pathname);
  });

  await page.goto("/register");
  await page.getByRole("textbox", { name: "Email address" }).fill(email);
  await page.locator("#register-password").fill(password);
  await page.getByLabel("Confirm password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByRole("status")).toContainText("verification instructions");

  const verificationLink = await latestLink(request, email, "verify-email");
  await page.goto(new URL(verificationLink).pathname + new URL(verificationLink).search);
  await page.getByRole("button", { name: "Verify email" }).click();
  await expect(page.getByRole("status")).toContainText("verified");

  await page.goto("/forgot-password");
  await page.getByRole("textbox", { name: "Email address" }).fill(email);
  await page.getByRole("button", { name: "Send reset instructions" }).click();
  await expect(page.getByRole("status")).toContainText("reset instructions");

  const resetLink = await latestLink(request, email, "reset-password");
  await page.goto(new URL(resetLink).pathname + new URL(resetLink).search);
  await page.locator("#reset-password").fill(nextPassword);
  await page.getByLabel("Confirm new password").fill(nextPassword);
  await page.getByRole("button", { name: "Reset password" }).click();
  await expect(page).toHaveURL(/\/mfa\/required$/u);

  await page.getByRole("link", { name: "Set up authenticator" }).click();
  await page.getByRole("button", { name: "Begin authenticator setup" }).click();
  const manualSecret = (await page.locator(".manual-secret code").textContent())?.trim();
  expect(manualSecret).toBeTruthy();
  await page.getByLabel("Six-digit code").fill(currentTotp(manualSecret!));
  await page.getByRole("button", { name: "Activate MFA" }).click();
  await expect(page).toHaveURL(/\/mfa\/recovery-codes$/u);
  await page.getByRole("button", { name: "I have saved the codes" }).click();
  await page.getByRole("link", { name: "Session & MFA" }).click();
  await expect(page.getByRole("heading", { name: "Active session status" })).toBeVisible();
  await expect(page.getByText("MFA AUTHENTICATED")).toBeVisible();
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login$/u);

  expect(requestedPaths).toContain("/api/v1/auth/csrf-token");
  expect(requestedPaths.some((path) => path.includes("/api/v1/api/v1"))).toBe(false);
});
