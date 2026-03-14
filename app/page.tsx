"use client";

import { useMemo, useState, useEffect } from "react";
import { useSheetData } from "@/hooks/useSheetData";
import { detectColumnType } from "@/utils/columnType";
import SheetTable from "@/components/SheetTable";
import StatusMessage from "@/components/StatusMessage";

const STORAGE_KEY = "sheetflow_url";

function isValidSheetUrl(url: string): boolean {
  const trimmed = url.trim();
  console.log("Checking URL:", trimmed);
  console.log("Includes spreadsheets:", trimmed.includes("docs.google.com/spreadsheets/d/"));
  return trimmed.includes("docs.google.com/spreadsheets/d/");
}

export default function Home() {
  const [sheetUrl, setSheetUrl] = useState<string>("");
  const [inputValue, setInputValue] = useState<string>("");
  const [inputError, setInputError] = useState<string | null>(null);
  const [showInput, setShowInput] = useState<boolean>(false);

  // On mount, load from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setSheetUrl(stored);
      setInputValue(stored);
    } else {
      setShowInput(true); // No URL stored → show input by default
    }
  }, []);

  const { columns, rows, error, loading } = useSheetData(sheetUrl);

  const columnTypes = useMemo(() => {
    const types: Record<string, ReturnType<typeof detectColumnType>> = {};
    columns.forEach((col) => {
      types[col] = detectColumnType(col, rows);
    });
    return types;
  }, [columns, rows]);

  const filteredRows = useMemo(() => rows, [rows]);

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

  const handleSubmit = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) {
      setInputError("Please enter a URL");
      return;
    }
    if (!isValidSheetUrl(trimmed)) {
      setInputError("Given URL is not a valid Google Sheet URL");
      return;
    }
    setInputError(null);
    localStorage.setItem(STORAGE_KEY, trimmed);
    setSheetUrl(trimmed);
    setFilters({});
    setShowInput(false);
  };

  const handleClear = () => {
    localStorage.removeItem(STORAGE_KEY);
    setSheetUrl("");
    setInputValue("");
    setInputError(null);
    setFilters({});
    setShowInput(true);
  };

  const activeFilterCount = Object.values(filters).filter(
    (f) => f && (f.text || f.min || f.max)
  ).length;

  return (
    <main className="min-h-screen bg-gray-950 text-white px-6 py-8 relative">

      {/* Header */}
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold text-white tracking-tight">
          📊 SheetFlow
        </h1>
      </div>

      {/* URL Input Section */}
      {showInput ? (
        <div className="max-w-2xl mx-auto mb-8">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 flex flex-col gap-4">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Google Sheet URL</label>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  setInputError(null);
                }}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="https://docs.google.com/spreadsheets/d/..."
                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-600 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 placeholder-gray-600"
              />
              {inputError && (
                <p className="text-red-400 text-xs mt-1.5">⚠ {inputError}</p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSubmit}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                Load Sheet
              </button>
              {sheetUrl && (
                <button
                  onClick={() => setShowInput(false)}
                  className="px-5 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-xl transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Collapsed URL bar — always visible when data is loaded */
        <div className="max-w-2xl mx-auto mb-6 flex items-center gap-3">
          <div className="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-xl text-gray-400 text-xs truncate">
            {sheetUrl}
          </div>
          <button
            onClick={() => setShowInput(true)}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 text-white text-xs rounded-xl transition-colors whitespace-nowrap"
          >
            ✎ Change URL
          </button>
          <button
            onClick={handleClear}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 text-gray-400 text-xs rounded-xl transition-colors"
          >
            ✕
          </button>
        </div>
      )}

      {/* No URL state */}
      {!sheetUrl && !showInput && (
        <div className="text-center text-gray-500 mt-20">
          <p className="text-4xl mb-4">📋</p>
          <p className="text-lg">No sheet loaded yet</p>
          <p className="text-sm mt-1">Enter a Google Sheet URL above to get started</p>
        </div>
      )}

      {/* Loading / Error */}
      {sheetUrl && (loading || error) && (
        <StatusMessage loading={loading} error={error} />
      )}

      {/* Main Content */}
      {sheetUrl && !loading && !error && (
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