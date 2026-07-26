import type { ReactNode } from "react";

export function AlertBanner({
  children,
  title,
  tone = "info",
}: {
  children: ReactNode;
  title: string;
  tone?: "info" | "success" | "warning";
}) {
  return (
    <div
      className={`alert-banner alert-banner-${tone}`}
      role={tone === "warning" ? "alert" : "status"}
    >
      <strong>{title}</strong>
      <div>{children}</div>
    </div>
  );
}
