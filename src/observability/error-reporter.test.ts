import { afterEach, describe, expect, test } from "vitest";

import { configureErrorReporter, reportSafeError, type SafeErrorReport } from "./error-reporter";

afterEach(() => configureErrorReporter({ capture: () => undefined }));

describe("privacy-safe error reporting", () => {
  test("captures only allowlisted operational metadata", () => {
    const reports: SafeErrorReport[] = [];
    configureErrorReporter({ capture: (report) => reports.push(report) });

    reportSafeError("api-server", "72d2fae8-ef72-48ef-8aa8-4df4e680503a");

    expect(reports).toHaveLength(1);
    expect(reports[0]).toEqual({
      classification: "api-server",
      release: "0.2.0",
      route: "/",
      requestId: "72d2fae8-ef72-48ef-8aa8-4df4e680503a",
      runtime: "browser",
    });
    expect(JSON.stringify(reports[0])).not.toMatch(
      /password|token|cookie|authorization|child|narrative/iu,
    );
  });
});
// @vitest-environment jsdom
