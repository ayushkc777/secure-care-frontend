import { env } from "../app/env";

export type SafeErrorReport = Readonly<{
  classification: "api-client" | "api-server" | "network" | "render";
  release: string;
  route: string;
  requestId?: string;
  runtime: "browser";
}>;

export interface ErrorReporter {
  capture(report: SafeErrorReport): void;
}

const noOpReporter: ErrorReporter = { capture: () => undefined };
let reporter: ErrorReporter = noOpReporter;

function currentRoute(): string {
  return typeof window === "undefined" ? "unknown" : window.location.pathname;
}

export function configureErrorReporter(next: ErrorReporter): void {
  reporter = next;
}

export function reportSafeError(
  classification: SafeErrorReport["classification"],
  requestId?: string,
): void {
  reporter.capture({
    classification,
    release: env.VITE_APP_VERSION,
    route: currentRoute(),
    runtime: "browser",
    ...(requestId === undefined ? {} : { requestId }),
  });
}
