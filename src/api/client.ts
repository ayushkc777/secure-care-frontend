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
