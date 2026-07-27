import axios from "axios";
import { describe, expect, test, vi } from "vitest";

import { apiClient, safeApiMessage } from "./client";

describe("safeApiMessage", () => {
  test("resolves relative feature paths under the single API base prefix", () => {
    const duplicatedPrefix = ["/api/v1", "api/v1"].join("/");
    expect(apiClient.getUri({ url: "/auth/csrf-token" })).toBe("/api/v1/auth/csrf-token");
    expect(apiClient.getUri({ url: "/centres/example" })).not.toContain(duplicatedPrefix);
  });

  test("uses a non-sensitive conflict message", () => {
    vi.spyOn(axios, "isAxiosError").mockReturnValueOnce(true);
    expect(
      safeApiMessage({
        response: {
          status: 409,
          data: { databaseConstraint: "Room_capacity_check" },
        },
      }),
    ).toBe("This record changed or conflicts with another update. Refresh and try again.");
  });
});
