import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { apiClient, safeApiMessage } from "../api/client";
import { ErrorSummary } from "../components/auth/FormFeedback";
import { hasPermission } from "../features/access/access-policy";
import { useAccess } from "../features/access/useAccess";
import type { Centre } from "../features/childcare/childcare.types";
import type { ReportResponse } from "../features/reporting/reporting.types";

const comparisonTo = new Date();
const comparisonFrom = new Date(comparisonTo.getTime() - 30 * 24 * 60 * 60 * 1_000);
const dateInput = (date: Date) => date.toISOString().slice(0, 10);

export function ReportsPage() {
  const access = useAccess();
  const [centres, setCentres] = useState<Centre[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedCentres, setSelectedCentres] = useState<string[]>([]);
  const [from, setFrom] = useState(dateInput(comparisonFrom));
  const [to, setTo] = useState(dateInput(comparisonTo));
  const [comparison, setComparison] = useState<ReportResponse | null>(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (access.status !== "ready") return;
    let current = true;
    void apiClient
      .get<{ centres: Centre[] }>("/api/v1/centres")
      .then(({ data }) => {
        if (current) {
          setCentres(
            data.centres.filter(({ id }) => hasPermission(access.access, "report.read", id)),
          );
        }
      })
      .catch((reason: unknown) => current && setError(safeApiMessage(reason)));
    return () => {
      current = false;
    };
  }, [access]);

  const canCompare =
    access.status === "ready" && access.access.platformPermissions.includes("report.cross_centre");

  const comparisonQuery = () =>
    new URLSearchParams({
      from: `${from}T00:00:00.000Z`,
      to: `${to}T23:59:59.999Z`,
      centreIds: selectedCentres.join(","),
    });

  const runComparison = async () => {
    setError(null);
    try {
      const { data } = await apiClient.get<ReportResponse>(
        `/api/v1/platform/reports/centre-comparison?${comparisonQuery().toString()}`,
      );
      setComparison(data);
      setStatus(`Comparison generated for ${data.rows.length} centres.`);
    } catch (reason) {
      setError(safeApiMessage(reason));
    }
  };

  const exportComparison = async () => {
    setError(null);
    try {
      const response = await apiClient.get<Blob>(
        `/api/v1/platform/reports/centre-comparison/export.csv?${comparisonQuery().toString()}`,
        { responseType: "blob" },
      );
      const url = URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = "securecare-centre-comparison.csv";
      document.body.append(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setStatus("Centre comparison CSV downloaded.");
    } catch (reason) {
      setError(safeApiMessage(reason));
    }
  };

  return (
    <section className="content-card" aria-labelledby="reports-title">
      <p className="eyebrow">Privacy-safe operational insight</p>
      <h1 id="reports-title">Reports and analytics</h1>
      <p>
        Choose an authorised centre. Report data is bounded, generated on demand and not retained in
        browser storage.
      </p>
      <ErrorSummary message={error} />
      <p aria-live="polite">{status}</p>
      {centres.length === 0 && error === null ? (
        <p>No reports are available through your current permissions.</p>
      ) : (
        <ul className="record-grid">
          {centres.map((centre) => (
            <li key={centre.id}>
              <h2>{centre.name}</h2>
              <Link to={`/reports/centres/${centre.id}`}>Open report catalogue</Link>
            </li>
          ))}
        </ul>
      )}
      {canCompare && (
        <section aria-labelledby="centre-comparison-title">
          <h2 id="centre-comparison-title">Administrator centre comparison</h2>
          <p>Select between one and twenty centres. Recent MFA is required.</p>
          <fieldset>
            <legend>Centres to compare</legend>
            {centres.map((centre) => (
              <label key={centre.id}>
                <input
                  type="checkbox"
                  checked={selectedCentres.includes(centre.id)}
                  onChange={(event) =>
                    setSelectedCentres((current) =>
                      event.currentTarget.checked
                        ? [...current, centre.id].slice(0, 20)
                        : current.filter((id) => id !== centre.id),
                    )
                  }
                />
                {centre.name}
              </label>
            ))}
          </fieldset>
          <div className="report-filter-grid">
            <label htmlFor="comparison-from">From</label>
            <input
              id="comparison-from"
              type="date"
              value={from}
              onChange={(event) => setFrom(event.currentTarget.value)}
            />
            <label htmlFor="comparison-to">To</label>
            <input
              id="comparison-to"
              type="date"
              value={to}
              onChange={(event) => setTo(event.currentTarget.value)}
            />
          </div>
          <div className="button-row">
            <button
              className="primary-button"
              type="button"
              disabled={selectedCentres.length === 0}
              onClick={() => void runComparison()}
            >
              Compare centres
            </button>
            <button
              className="secondary-button"
              type="button"
              disabled={comparison === null}
              onClick={() => void exportComparison()}
            >
              Export comparison CSV
            </button>
          </div>
          {comparison && (
            <div className="responsive-table">
              <table>
                <caption>
                  Centre comparison generated {new Date(comparison.generatedAt).toLocaleString()}
                </caption>
                <thead>
                  <tr>
                    {Object.keys(comparison.rows[0] ?? {}).map((column) => (
                      <th key={column} scope="col">
                        {column.replaceAll(/([A-Z])/gu, " $1")}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comparison.rows.map((row) => (
                    <tr key={String(row.centreId)}>
                      {Object.keys(comparison.rows[0] ?? {}).map((column) => (
                        <td key={column}>{String(row[column] ?? "—")}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </section>
  );
}
