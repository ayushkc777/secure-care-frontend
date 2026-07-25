import axios from "axios";

import { env } from "../app/env";

export const apiClient = axios.create({
  baseURL: env.VITE_API_BASE_URL,
  headers: {
    Accept: "application/json",
  },
  timeout: 10_000,
  withCredentials: true,
});

type CsrfResponse = {
  csrfToken: string;
};

export async function postWithCsrf<T>(
  path: string,
  body: Record<string, unknown> = {},
): Promise<T> {
  const { data } = await apiClient.get<CsrfResponse>("/api/v1/auth/csrf-token");
  const response = await apiClient.post<T>(path, body, {
    headers: { "X-CSRF-Token": data.csrfToken },
  });
  return response.data;
}

export function safeApiMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 429) {
      return "Too many attempts. Wait a few minutes before trying again.";
    }
    if (error.response?.status === 403) {
      return "This action needs a fully verified session.";
    }
  }
  return "The request could not be completed. Check the details and try again.";
}
