import axios from "axios";

import { env } from "../app/env";
import { reportSafeError } from "../observability/error-reporter";

export const apiClient = axios.create({
  baseURL: env.VITE_API_BASE_URL,
  headers: {
    Accept: "application/json",
  },
  timeout: 10_000,
  withCredentials: true,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const requestId =
        typeof error.response?.headers["x-request-id"] === "string"
          ? error.response.headers["x-request-id"]
          : undefined;
      reportSafeError(
        error.response === undefined
          ? "network"
          : error.response.status >= 500
            ? "api-server"
            : "api-client",
        requestId,
      );
    } else {
      reportSafeError("api-client");
    }
    return Promise.reject(error instanceof Error ? error : new Error("API request failed."));
  },
);

type CsrfResponse = {
  csrfToken: string;
};

export async function postWithCsrf<T>(
  path: string,
  body: Record<string, unknown> = {},
): Promise<T> {
  const { data } = await apiClient.get<CsrfResponse>("/auth/csrf-token");
  const response = await apiClient.post<T>(path, body, {
    headers: { "X-CSRF-Token": data.csrfToken },
  });
  return response.data;
}

export async function mutateWithCsrf<T>(
  method: "post" | "put" | "patch" | "delete",
  path: string,
  body: Record<string, unknown> = {},
): Promise<T> {
  const { data } = await apiClient.get<CsrfResponse>("/auth/csrf-token");
  const response = await apiClient.request<T>({
    method,
    url: path,
    data: body,
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
    if (error.response?.status === 404) {
      return "The requested item is unavailable or you do not have access to it.";
    }
    if (error.response?.status === 409) {
      return "This record changed or conflicts with another update. Refresh and try again.";
    }
  }
  return "The request could not be completed. Check the details and try again.";
}
