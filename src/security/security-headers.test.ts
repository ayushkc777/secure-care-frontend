import { readFileSync } from "node:fs";

import { describe, expect, test } from "vitest";

const nginx = readFileSync(new URL("../../nginx.conf", import.meta.url), "utf8");
const headers = readFileSync(new URL("../../nginx-security-headers.conf", import.meta.url), "utf8");

describe("production document security headers", () => {
  test("defines CSP, framing, content type, privacy and capability restrictions", () => {
    expect(nginx.match(/include \/etc\/nginx\/security-headers\.conf/gu)).toHaveLength(5);
    expect(headers).toContain("Content-Security-Policy");
    expect(headers).toContain("frame-ancestors 'none'");
    expect(headers).toContain("object-src 'none'");
    expect(headers).toContain('X-Content-Type-Options "nosniff"');
    expect(headers).toContain('X-Frame-Options "DENY"');
    expect(headers).toContain('Referrer-Policy "no-referrer"');
    expect(headers).toContain("Permissions-Policy");
    expect(headers).toContain("Cross-Origin-Opener-Policy");
    expect(headers).toContain("Cross-Origin-Resource-Policy");
  });
});
