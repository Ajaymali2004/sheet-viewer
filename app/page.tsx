"use client";

import { useMemo, useState, useEffect } from "react";
import { useSheetData } from "@/hooks/useSheetData";
import { detectColumnType } from "@/utils/columnType";
import SheetTable from "@/components/SheetTable";
import StatusMessage from "@/components/StatusMessage";

const CONFIG_SHEET_URL = "https://docs.google.com/spreadsheets/d/1CiMgzPxZLg5rAC794IfxOqp_pNnKMs6AYwdrmwWhuJw/edit?gid=0#gid=0";

export default function Home() {
  const [sheetUrl, setSheetUrl] = useState<string>("");
  const [configError, setConfigError] = useState<string | null>(null);
  const [configLoading, setConfigLoading] = useState(true);

  // On mount, fetch the config sheet and extract the target URL
  useEffect(() => {
    const csvUrl = CONFIG_SHEET_URL
      .replace(/\/edit.*$/, "/export?format=csv&gid=0");

    fetch(csvUrl)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch config sheet");
        return res.text();
      })
      .then((csv) => {
        // Grab the first non-empty cell value from the sheet (skip header row)
        const lines = csv.split("\n").filter(Boolean);
        // Try row index 1 (second row) first, then row 0 if only one row
        const targetLine = lines[1] ?? lines[0];
        if (!targetLine) throw new Error("Config sheet is empty");

        const firstCell = targetLine.split(",")[0].trim().replace(/^"|"$/g, "");
        if (!firstCell || !firstCell.includes("docs.google.com/spreadsheets")) {
          throw new Error("No valid sheet URL found in config sheet");
        }
        setSheetUrl(firstCell);
      })
      .catch((err) => setConfigError(err.message))
      .finally(() => setConfigLoading(false));
  }, []);

  const { columns, rows, error, loading } = useSheetData(sheetUrl);

  const columnTypes = useMemo(() => {
    const types: Record<string, ReturnType<typeof detectColumnType>> = {};
    columns.forEach((col) => {
      types[col] = detectColumnType(col, rows);
    });
    return types;
  }, [columns, rows]);

  const [filters, setFilters] = useState<Record<string, { text?: string; min?: string; max?: string }>>({});

  const filteredData = useMemo(() => {
    return rows.filter((row) => {
      return columns.every((col) => {
        const filter = filters[col];
        const type = columnTypes[col];
        if (!filter) return true;
        if (type === "number") {
          const val = parseFloat(row[col]);
          if (filter.min !== undefined && filter.min !== "" && val < parseFloat(filter.min)) return false;
          if (filter.max !== undefined && filter.max !== "" && val > parseFloat(filter.max)) return false;
        } else if (type === "string") {
          if (filter.text && !row[col].toLowerCase().includes(filter.text.toLowerCase())) return false;
        }
        return true;
      });
    });
  }, [rows, filters, columns, columnTypes]);

  const handleFilterChange = (col: string, value: { text?: string; min?: string; max?: string }) => {
    setFilters((prev) => ({ ...prev, [col]: value }));
  };

  const activeFilterCount = Object.values(filters).filter(
    (f) => f && (f.text || f.min || f.max)
  ).length;

  const isLoading = configLoading || loading;
  const errorMsg = configError || error;

  return (
    <main className="min-h-screen bg-gray-950 text-white px-6 py-8 relative">

      {/* Header */}
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold text-white tracking-tight">
          📊 SheetFlow
        </h1>
      </div>

      {/* Loading / Error */}
      {(isLoading || errorMsg) && (
        <StatusMessage loading={isLoading} error={errorMsg} />
      )}

      {/* Main Content */}
      {!isLoading && !errorMsg && (
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
      )}

      {/* Made by Ajay */}
      <p className="fixed bottom-4 right-6 text-gray-600 text-xs">Made by Ajay</p>
    </main>
  );
}