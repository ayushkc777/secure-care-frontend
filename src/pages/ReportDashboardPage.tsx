import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useParams } from "react-router-dom";

import { apiClient, safeApiMessage } from "../api/client";
import { ErrorSummary, FieldError } from "../components/auth/FormFeedback";
import { hasPermission } from "../features/access/access-policy";
import { useAccess } from "../features/access/useAccess";
import {
  reportFilterSchema,
  type ReportFilter,
  type ReportFilterInput,
} from "../features/reporting/reporting.schemas";
import {
  reportCatalogue,
  type ReportResponse,
  type ReportType,
} from "../features/reporting/reporting.types";

function dateInput(date: Date): string {
  return date.toISOString().slice(0, 10);
}

const initialReportTo = new Date();
const initialReportFrom = new Date(initialReportTo.getTime() - 30 * 24 * 60 * 60 * 1_000);

function queryFrom(values: ReportFilter, page: number): URLSearchParams {
  const query = new URLSearchParams({
    from: `${values.from}T00:00:00.000Z`,
    to: `${values.to}T23:59:59.999Z`,
    page: String(page),
    pageSize: String(values.pageSize),
    sort: "occurredAt",
    order: "desc",
  });
  if (values.roomId) query.set("roomId", values.roomId);
  if (values.childId) query.set("childId", values.childId);
  if (values.status) query.set("status", values.status);
  return query;
}

export function ReportDashboardPage() {
  const { centreId = "" } = useParams();
  const access = useAccess();
  const catalogue = access.status === "ready" ? reportCatalogue(access.access, centreId) : [];
  const canExport =
    access.status === "ready" && hasPermission(access.access, "report.export", centreId);
  const [reportType, setReportType] = useState<ReportType | null>(catalogue[0] ?? null);
  const selectedReportType = reportType ?? catalogue[0] ?? null;
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [activeFilters, setActiveFilters] = useState<ReportFilter | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<ReportFilterInput, unknown, ReportFilter>({
    resolver: zodResolver(reportFilterSchema),
    defaultValues: {
      from: dateInput(initialReportFrom),
      to: dateInput(initialReportTo),
      roomId: "",
      childId: "",
      status: "",
      pageSize: 25,
    },
  });

  const runReport = async (values: ReportFilter, page = 1) => {
    if (selectedReportType === null) return;
    setError(null);
    try {
      const { data } = await apiClient.get<ReportResponse>(
        `/api/v1/centres/${centreId}/reports/${selectedReportType}?${queryFrom(values, page).toString()}`,
      );
      setReport(data);
      setActiveFilters(values);
      setStatus(`Report generated with ${data.summary.returnedRows} displayed rows.`);
    } catch (reason) {
      setError(safeApiMessage(reason));
    }
  };

  const submit = handleSubmit((values) => runReport(values));

  const exportCsv = async () => {
    if (selectedReportType === null || activeFilters === null) return;
    setError(null);
    try {
      const response = await apiClient.get<Blob>(
        `/api/v1/centres/${centreId}/reports/${selectedReportType}/export.csv?${queryFrom(activeFilters, report?.pagination.page ?? 1).toString()}`,
        { responseType: "blob" },
      );
      const url = URL.createObjectURL(response.data);
      const link = document.createElement("a");
      const disposition = String(response.headers["content-disposition"] ?? "");
      const filename = /filename="([^"]+)"/u.exec(disposition)?.[1] ?? "securecare-report.csv";
      link.href = url;
      link.download = filename;
      document.body.append(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setStatus("Secure CSV export downloaded.");
    } catch (reason) {
      setError(safeApiMessage(reason));
    }
  };

  const columns = useMemo(
    () => [...new Set((report?.rows ?? []).flatMap((row) => Object.keys(row)))],
    [report],
  );

  return (
    <section className="content-card report-page" aria-labelledby="report-dashboard-title">
      <p className="eyebrow">Authorised centre reporting</p>
      <h1 id="report-dashboard-title">Operational report catalogue</h1>
      <nav className="section-navigation" aria-label="Report sections">
        <Link to="/reports">All available centres</Link>
      </nav>
      <ErrorSummary message={error} />
      <p aria-live="polite">{status}</p>

      <form
        className="auth-form report-filter-grid"
        noValidate
        onSubmit={(event) => void submit(event)}
      >
        <label htmlFor="report-type">Report</label>
        <select
          id="report-type"
          value={selectedReportType ?? ""}
          onChange={(event) => {
            setReportType(event.currentTarget.value as ReportType);
            setReport(null);
          }}
        >
          {catalogue.map((type) => (
            <option key={type} value={type}>
              {type.replaceAll("_", " ")}
            </option>
          ))}
        </select>
        <label htmlFor="report-from">From</label>
        <input id="report-from" type="date" {...register("from")} />
        <FieldError message={errors.from?.message} />
        <label htmlFor="report-to">To</label>
        <input id="report-to" type="date" {...register("to")} />
        <FieldError message={errors.to?.message} />
        <label htmlFor="report-room">Room ID, optional</label>
        <input id="report-room" {...register("roomId")} />
        <FieldError message={errors.roomId?.message} />
        <label htmlFor="report-child">Child ID, required for Parent reports</label>
        <input id="report-child" {...register("childId")} />
        <FieldError message={errors.childId?.message} />
        <label htmlFor="report-status">Status, optional</label>
        <select id="report-status" {...register("status")}>
          <option value="">All statuses</option>
          {[
            "ACTIVE",
            "ARCHIVED",
            "EXPECTED",
            "CHECKED_IN",
            "CHECKED_OUT",
            "ABSENT",
            "APPROVED",
            "SENT",
            "DELIVERED",
            "READ",
            "FAILED",
            "EXPIRED",
            "ADMINISTERED",
            "MISSED",
            "REFUSED",
          ].map((value) => (
            <option key={value} value={value}>
              {value.replaceAll("_", " ")}
            </option>
          ))}
        </select>
        <label htmlFor="report-page-size">Rows per page</label>
        <input id="report-page-size" type="number" min="1" max="100" {...register("pageSize")} />
        <FieldError message={errors.pageSize?.message} />
        <button
          className="primary-button"
          disabled={isSubmitting || selectedReportType === null}
          type="submit"
        >
          Generate report
        </button>
      </form>

      {report && (
        <>
          <section className="summary-card-grid" aria-label="Report summary">
            <article>
              <span>Total matching rows</span>
              <strong>{report.summary.totalRows}</strong>
            </article>
            <article>
              <span>Rows on this page</span>
              <strong>{report.summary.returnedRows}</strong>
            </article>
            <article>
              <span>Data freshness</span>
              <strong>{new Date(report.generatedAt).toLocaleString()}</strong>
            </article>
          </section>

          <figure className="report-chart" aria-labelledby="report-chart-title">
            <figcaption id="report-chart-title">Text-equivalent report volume chart</figcaption>
            <div
              className="report-bar"
              role="img"
              aria-label={`${report.summary.returnedRows} of ${report.summary.totalRows} matching rows displayed`}
            >
              <span
                style={{
                  width: `${Math.min(100, (report.summary.returnedRows / Math.max(1, report.summary.totalRows)) * 100)}%`,
                }}
              />
            </div>
            <p>
              Displayed {report.summary.returnedRows} of {report.summary.totalRows} matching rows.
            </p>
          </figure>

          {report.rows.length === 0 ? (
            <p>No records match the selected filters.</p>
          ) : (
            <div className="responsive-table">
              <table>
                <caption>
                  {report.reportType.replaceAll("_", " ")} details, generated{" "}
                  {new Date(report.generatedAt).toLocaleString()}
                </caption>
                <thead>
                  <tr>
                    {columns.map((column) => (
                      <th key={column} scope="col">
                        {column.replaceAll(/([A-Z])/gu, " $1")}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {report.rows.map((row, index) => (
                    <tr key={`${report.reportType}-${index}`}>
                      {columns.map((column) => (
                        <td key={column}>{String(row[column] ?? "—")}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="button-row report-actions">
            <button className="secondary-button" type="button" onClick={() => window.print()}>
              Print view
            </button>
            {canExport && (
              <button className="primary-button" type="button" onClick={() => void exportCsv()}>
                Export secure CSV
              </button>
            )}
            {report.pagination.page > 1 && activeFilters && (
              <button
                className="secondary-button"
                type="button"
                onClick={() => void runReport(activeFilters, report.pagination.page - 1)}
              >
                Previous page
              </button>
            )}
            {report.pagination.page * report.pagination.pageSize < report.pagination.total &&
              activeFilters && (
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => void runReport(activeFilters, report.pagination.page + 1)}
                >
                  Next page
                </button>
              )}
          </div>
        </>
      )}
    </section>
  );
}
