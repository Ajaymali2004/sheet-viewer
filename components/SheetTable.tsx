"use client";

import { ColType } from "@/utils/columnType";
import { useState, useEffect } from "react";
import { toDirectImageUrl } from "@/utils/driveUrl";

interface SheetTableProps {
  columns: string[];
  rows: Record<string, string>[];
  columnTypes: Record<string, ColType>;
  filters: Record<string, { text?: string; min?: string; max?: string }>;
  onFilterChange: (col: string, value: { text?: string; min?: string; max?: string }) => void;
}

const PAGE_SIZE_OPTIONS = [10, 20, 40, 50, 100];
const DUMMY_IMAGE = "https://lh3.googleusercontent.com/d/152ATCZC2c6maKu1uSriSF4laC4IiFNDm";

export default function SheetTable({ columns, rows, columnTypes, filters, onFilterChange }: SheetTableProps) {
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [openFilters, setOpenFilters] = useState<Set<string>>(new Set());

  // Reset to page 1 when rows or pageSize changes
  useEffect(() => {
    setCurrentPage(1);
  }, [rows, pageSize]);

  const totalPages = Math.ceil(rows.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const visibleRows = rows.slice(startIndex, endIndex);

  const hasBuiltInSerial = columns.some((col) => {
    const lower = col.toLowerCase();
    if (["sr", "sr.", "s.no", "serial", "no"].includes(lower)) {
      const values = rows.map((r) => r[col]).filter(Boolean);
      return values.every((v, i) => parseInt(v) === i + 1);
    }
    return false;
  });

  const hasActiveFilter = (col: string) => {
    const f = filters[col];
    if (!f) return false;
    return !!(f.text || f.min || f.max);
  };

  const toggleFilter = (col: string) => {
    setOpenFilters((prev) => {
      const next = new Set(prev);
      if (next.has(col)) next.delete(col);
      else next.add(col);
      return next;
    });
  };

  const clearFilter = (col: string) => {
    onFilterChange(col, {});
    setOpenFilters((prev) => {
      const next = new Set(prev);
      next.delete(col);
      return next;
    });
  };

  const isFilterVisible = (col: string) => openFilters.has(col) || hasActiveFilter(col);

  return (
    <div className="w-full flex flex-col items-center pb-16 gap-4">

      {/* Table */}
      <div
        className="overflow-x-auto rounded-xl border border-gray-700"
        style={{ minWidth: "50%", maxWidth: "100%", width: "fit-content" }}
      >
        <table className="text-sm text-left border-collapse" style={{ minWidth: "50vw" }}>
          <thead>
            <tr className="bg-gray-900 border-b border-gray-700">
              {!hasBuiltInSerial && (
                <th className="px-4 py-3 text-gray-500 font-mono text-xs w-10 align-top">#</th>
              )}
              {columns.map((col, colIndex) => {
                const type = columnTypes[col];
                const active = hasActiveFilter(col);
                const filterVisible = isFilterVisible(col);

                return (
                  <th key={`${col}-${colIndex}`} className="px-4 py-2 whitespace-nowrap align-top">
                    <div className="flex items-center gap-1.5">
                      <span className="text-blue-400 font-semibold tracking-wide">{col}</span>
                      {type !== "image" && (
                        <button
                          onClick={() => toggleFilter(col)}
                          className={`text-xs px-1 py-0.5 rounded border transition-all ${
                            active
                              ? "border-blue-500 text-blue-400 bg-blue-500/10"
                              : "border-gray-600 text-gray-500 hover:border-gray-400 hover:text-gray-300"
                          }`}
                        >
                          {active ? "●" : "⌄"}
                        </button>
                      )}
                    </div>

                    {filterVisible && type !== "image" && (
                      <div className="mt-2">
                        {type === "number" ? (
                          <div className="flex gap-1 items-center">
                            <input
                              type="number"
                              placeholder="Min"
                              value={filters[col]?.min ?? ""}
                              onChange={(e) => onFilterChange(col, { ...filters[col], min: e.target.value })}
                              className="w-20 px-2 py-1 bg-gray-800 border border-gray-600 rounded-lg text-white text-xs focus:outline-none focus:border-blue-500"
                            />
                            <input
                              type="number"
                              placeholder="Max"
                              value={filters[col]?.max ?? ""}
                              onChange={(e) => onFilterChange(col, { ...filters[col], max: e.target.value })}
                              className="w-20 px-2 py-1 bg-gray-800 border border-gray-600 rounded-lg text-white text-xs focus:outline-none focus:border-blue-500"
                            />
                            {active && (
                              <button onClick={() => clearFilter(col)} className="text-gray-400 hover:text-gray-200 text-sm font-bold leading-none">✕</button>
                            )}
                          </div>
                        ) : (
                          <div className="flex gap-1 items-center">
                            <input
                              type="text"
                              placeholder="Search..."
                              value={filters[col]?.text ?? ""}
                              onChange={(e) => onFilterChange(col, { ...filters[col], text: e.target.value })}
                              className="w-32 px-2 py-1 bg-gray-800 border border-gray-600 rounded-lg text-white text-xs focus:outline-none focus:border-blue-500"
                            />
                            {active && (
                              <button onClick={() => clearFilter(col)} className="text-gray-400 hover:text-gray-200 text-sm font-bold leading-none">✕</button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-b border-gray-800 hover:bg-gray-900 transition-colors">
                {!hasBuiltInSerial && (
                  <td className="px-4 py-3 text-gray-600 font-mono text-xs">{startIndex + rowIndex + 1}</td>
                )}
                {columns.map((col, colIndex) => {
                  const type = columnTypes[col];
                  const value = row[col];

                  if (type === "image") {
                    const imgSrc = value && value.trim() !== "" ? toDirectImageUrl(value) : DUMMY_IMAGE;
                    return (
                      <td key={`${col}-${colIndex}`} className="px-4 py-2">
                        <img
                          src={imgSrc}
                          alt={col}
                          className="h-14 w-14 object-cover rounded-lg border border-gray-700"
                          onError={(e) => { (e.target as HTMLImageElement).src = DUMMY_IMAGE; }}
                        />
                      </td>
                    );
                  }

                  if (type === "number") {
                    return (
                      <td key={`${col}-${colIndex}`} className="px-4 py-3 text-right text-green-400 font-mono">
                        {value || <span className="text-gray-600">—</span>}
                      </td>
                    );
                  }

                  return (
                    <td
                      key={`${col}-${colIndex}`}
                      className="px-4 py-3 text-gray-200"
                      style={{ maxWidth: "220px", wordBreak: "break-word", whiteSpace: "normal" }}
                    >
                      {value || <span className="text-gray-600">—</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        {rows.length === 0 && (
          <div className="text-center py-16 text-gray-500">No results match your filters</div>
        )}
      </div>

      {/* Pagination Controls */}
      {rows.length > 0 && (
        <div className="flex items-center gap-4 text-sm text-gray-400">

          {/* Rows per page */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="bg-gray-800 border border-gray-600 text-white text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-blue-500"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>

          {/* Page info */}
          <span className="text-xs text-gray-500">
            {startIndex + 1}–{Math.min(endIndex, rows.length)} of {rows.length}
          </span>

          {/* Prev / Next */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-gray-800 border border-gray-600 rounded-lg text-xs hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              ← Prev
            </button>

            {/* Page numbers */}
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .reduce<(number | string)[]>((acc, p, i, arr) => {
                  if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push("...");
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  p === "..." ? (
                    <span key={`ellipsis-${i}`} className="px-2 py-1 text-gray-600 text-xs">...</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p as number)}
                      className={`px-3 py-1 rounded-lg text-xs border transition-colors ${
                        currentPage === p
                          ? "bg-blue-600 border-blue-500 text-white"
                          : "bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700"
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}
            </div>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 bg-gray-800 border border-gray-600 rounded-lg text-xs hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}