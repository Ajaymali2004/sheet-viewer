"use client";

import { useMemo, useState, useEffect } from "react";
import { useSheetData } from "@/hooks/useSheetData";
import { detectColumnType } from "@/utils/columnType";
import SheetTable from "@/components/SheetTable";
import StatusMessage from "@/components/StatusMessage";

// ─── Config ────────────────────────────────────────────────────────────────────
const CONFIG_SHEET_URL =
  "https://docs.google.com/spreadsheets/d/1CiMgzPxZLg5rAC794IfxOqp_pNnKMs6AYwdrmwWhuJw/edit?gid=0#gid=0";

// ─── Helpers ───────────────────────────────────────────────────────────────────
function buildCsvUrl(sheetUrl: string): string {
  const sheetId = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)?.[1] ?? "";
  const gid = sheetUrl.match(/gid=(\d+)/)?.[1] ?? "0";
  return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
}

function extractSheetUrls(csv: string): { label: string; url: string }[] {
  const results: { label: string; url: string }[] = [];
  const lines = csv.split("\n").filter(Boolean);

  for (const line of lines) {
    const cells = line.match(/(".*?"|[^,\r\n]+)/g) ?? [];
    for (const raw of cells) {
      const cell = raw.trim().replace(/^"|"$/g, "");
      if (cell.includes("docs.google.com/spreadsheets")) {
        results.push({ label: "", url: cell });
      }
    }
  }

  return results.map((r, i) => ({ ...r, label: `Sheet ${i + 1}` }));
}

// ─── Sub-components ────────────────────────────────────────────────────────────
interface TabBarProps {
  tabs: { label: string }[];
  activeIndex: number;
  onChange: (i: number) => void;
}

function TabBar({ tabs, activeIndex, onChange }: TabBarProps) {
  return (
    <div className="flex gap-2 justify-center flex-wrap mb-6">
      {tabs.map((tab, i) => (
        <button
          key={i}
          onClick={() => onChange(i)}
          className={`px-5 py-2 rounded-xl text-sm font-medium border transition-all ${
            i === activeIndex
              ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20"
              : "bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-200"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

interface SheetViewerProps {
  sheetUrl: string;
}

function SheetViewer({ sheetUrl }: SheetViewerProps) {
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

  // Reset filters when sheet changes
  useEffect(() => {
    setFilters({});
  }, [sheetUrl]);

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

  if (loading || error) {
    return <StatusMessage loading={loading} error={error} />;
  }

  return (
    <>
      {/* Stats */}
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

      {/* Table */}
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

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function Home() {
  const [tabs, setTabs] = useState<{ label: string; url: string }[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [configError, setConfigError] = useState<string | null>(null);
  const [configLoading, setConfigLoading] = useState(true);

  useEffect(() => {
    fetch(buildCsvUrl(CONFIG_SHEET_URL))
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch config sheet");
        return res.text();
      })
      .then((csv) => {
        const found = extractSheetUrls(csv);
        if (found.length === 0) throw new Error("No sheet URLs found in config sheet");
        setTabs(found);
        setActiveIndex(0);
      })
      .catch((err) => setConfigError(err.message))
      .finally(() => setConfigLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-gray-950 text-white px-6 py-8 relative">
      {/* Header */}
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold text-white tracking-tight">📊 SheetFlow</h1>
      </div>

      {/* Config loading / error */}
      {(configLoading || configError) && (
        <StatusMessage loading={configLoading} error={configError} />
      )}

      {/* Tabs + Sheet */}
      {!configLoading && !configError && tabs.length > 0 && (
        <>
          {tabs.length > 1 && (
            <TabBar tabs={tabs} activeIndex={activeIndex} onChange={setActiveIndex} />
          )}
          {/* key= forces SheetViewer to remount on tab switch, resetting all state */}
          <SheetViewer key={tabs[activeIndex].url} sheetUrl={tabs[activeIndex].url} />
        </>
      )}

      <p className="fixed bottom-4 right-6 text-gray-600 text-xs">Made by Ajay</p>
    </main>
  );
}