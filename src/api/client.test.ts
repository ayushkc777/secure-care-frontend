import axios from "axios";
import { describe, expect, test, vi } from "vitest";

import { safeApiMessage } from "./client";

describe("safeApiMessage", () => {
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
