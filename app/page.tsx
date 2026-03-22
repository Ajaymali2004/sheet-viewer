"use client";

import { useMemo, useState, useEffect } from "react";
import { useSheetData } from "@/hooks/useSheetData";
import { detectColumnType } from "@/utils/columnType";
import SheetTable from "@/components/SheetTable";
import StatusMessage from "@/components/StatusMessage";

const CONFIG_SHEET_URL =
  "https://docs.google.com/spreadsheets/d/1CiMgzPxZLg5rAC794IfxOqp_pNnKMs6AYwdrmwWhuJw/edit?gid=0#gid=0";

function buildCsvUrl(sheetUrl: string): string {
  const sheetId = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)?.[1] ?? "";
  const gid = sheetUrl.match(/gid=(\d+)/)?.[1] ?? "0";
  return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
}

function getFirstCell(csv: string): string {
  const firstLine = csv.split("\n").find((l) => l.trim() !== "") ?? "";
  const firstCell = (firstLine.match(/(".*?"|[^,\r\n]+)/)?.[0] ?? "")
    .trim()
    .replace(/^"|"$/g, "");
  return firstCell;
}
function ErrorCard({ icon, title, message }: { icon: string; title: string; message: string }) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="text-4xl">{icon}</div>
        <p className="text-red-400 text-lg font-medium">{title}</p>
        <p className="text-gray-500 text-sm max-w-sm">{message}</p>
      </div>
    </div>
  );
}
function SheetViewer({ sheetUrl }: { sheetUrl: string }) {
  const { columns, rows, error, loading } = useSheetData(sheetUrl);

  const columnTypes = useMemo(() => {
    const types: Record<string, ReturnType<typeof detectColumnType>> = {};
    columns.forEach((col) => {
      types[col] = detectColumnType(col, rows);
    });
    return types;
  }, [columns, rows]);

  const [filters, setFilters] = useState<
    Record<string, { text?: string; min?: string; max?: string }>
  >({});

  const filteredData = useMemo(() => {
    return rows.filter((row) =>
      columns.every((col) => {
        const filter = filters[col];
        const type = columnTypes[col];
        if (!filter) return true;
        if (type === "number") {
          const val = parseFloat(row[col]);
          if (filter.min !== undefined && filter.min !== "" && val < parseFloat(filter.min))
            return false;
          if (filter.max !== undefined && filter.max !== "" && val > parseFloat(filter.max))
            return false;
        } else if (type === "string") {
          if (filter.text && !row[col].toLowerCase().includes(filter.text.toLowerCase()))
            return false;
        }
        return true;
      })
    );
  }, [rows, filters, columns, columnTypes]);

  const handleFilterChange = (
    col: string,
    value: { text?: string; min?: string; max?: string }
  ) => {
    setFilters((prev) => ({ ...prev, [col]: value }));
  };

  const activeFilterCount = Object.values(filters).filter(
    (f) => f && (f.text || f.min || f.max)
  ).length;

  if (loading) return <StatusMessage loading={true} error={null} />;

  if (error) {
    if (error.toLowerCase().includes("403") || error.toLowerCase().includes("failed to fetch")) {
      return (
        <ErrorCard
          icon="🔒"
          title="Access Denied"
          message="You are not accessible to see this private sheet. Make sure the sheet is publicly shared."
        />
      );
    }
    return (
      <ErrorCard
        icon="⚠️"
        title="Something went wrong"
        message={error}
      />
    );
  }

  return (
    <>
      <div className="flex gap-4 mb-6 justify-center flex-wrap">
        <div className="bg-gray-900 border border-gray-700 rounded-xl px-5 py-3 text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Columns</p>
          <p className="text-2xl font-bold text-blue-400">{columns.length}</p>
        </div>
        <div className="bg-gray-900 border border-gray-700 rounded-xl px-5 py-3 text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Total Rows</p>
          <p className="text-2xl font-bold text-blue-400">{rows.length}</p>
        </div>
        <div className="bg-gray-900 border border-gray-700 rounded-xl px-5 py-3 text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Filtered</p>
          <p className="text-2xl font-bold text-green-400">{filteredData.length}</p>
        </div>
        {activeFilterCount > 0 && (
          <div className="bg-gray-900 border border-blue-700 rounded-xl px-5 py-3 text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Active Filters</p>
            <p className="text-2xl font-bold text-yellow-400">{activeFilterCount}</p>
          </div>
        )}
      </div>

      <SheetTable
        columns={columns}
        rows={filteredData}
        columnTypes={columnTypes}
        filters={filters}
        onFilterChange={handleFilterChange}
      />
    </>
  );
}
export default function Home() {
  const [sheetUrl, setSheetUrl] = useState<string | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);
  const [configLoading, setConfigLoading] = useState(true);

  useEffect(() => {
    fetch(buildCsvUrl(CONFIG_SHEET_URL))
      .then((res) => {
        if (!res.ok) throw new Error(`Config sheet fetch failed (HTTP ${res.status})`);
        return res.text();
      })
      .then((csv) => {
        const cell = getFirstCell(csv);
        if (!cell || !cell.includes("docs.google.com/spreadsheets")) {
          throw new Error("NO_VALID_URL");
        }
        setSheetUrl(cell);
      })
      .catch((err) => setConfigError(err.message))
      .finally(() => setConfigLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-gray-950 text-white px-6 py-8 relative" suppressHydrationWarning>
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold text-white tracking-tight">📊 SheetFlow</h1>
      </div>

      {configLoading && <StatusMessage loading={true} error={null} />}

      {!configLoading && configError === "NO_VALID_URL" && (
        <ErrorCard
          icon="📋"
          title="No valid sheet found"
          message="Cell A1 of the config sheet does not contain a valid Google Sheets URL."
        />
      )}

      {!configLoading && configError && configError !== "NO_VALID_URL" && (
        <ErrorCard
          icon="⚠️"
          title="Something went wrong"
          message={configError}
        />
      )}

      {!configLoading && !configError && sheetUrl && (
        <SheetViewer sheetUrl={sheetUrl} />
      )}

      <p className="fixed bottom-4 right-6 text-gray-600 text-xs">Made by Ajay</p>
    </main>
  );
}