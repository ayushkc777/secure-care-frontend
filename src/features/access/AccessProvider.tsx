import axios from "axios";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { apiClient } from "../../api/client";
import { AccessContext, type AccessContextValue } from "./access-context";
import type { AccessState, CurrentAccess } from "./access.types";

export function AccessProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AccessState>({ status: "loading", access: null });

  const refresh = useCallback(async () => {
    try {
      const { data } = await apiClient.get<CurrentAccess>("/authorisation/me");
      setState({ status: "ready", access: data });
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        setState({ status: "unauthenticated", access: null });
      } else if (axios.isAxiosError(error) && error.response?.status === 403) {
        setState({ status: "restricted", access: null });
      } else {
        setState({ status: "error", access: null });
      }
    }
  }, []);

  useEffect(() => {
    let current = true;
    void apiClient
      .get<CurrentAccess>("/authorisation/me")
      .then(({ data }) => {
        if (current) setState({ status: "ready", access: data });
      })
      .catch((error: unknown) => {
        if (!current) return;
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          setState({ status: "unauthenticated", access: null });
        } else if (axios.isAxiosError(error) && error.response?.status === 403) {
          setState({ status: "restricted", access: null });
        } else {
          setState({ status: "error", access: null });
        }
      });
    return () => {
      current = false;
    };
  }, [refresh]);

  const value = useMemo<AccessContextValue>(() => ({ ...state, refresh }), [refresh, state]);
  return <AccessContext.Provider value={value}>{children}</AccessContext.Provider>;
}
