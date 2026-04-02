"use client";

import { useMemo, useState } from "react";
import { useSheetData } from "@/hooks/useSheetData";
import { detectColumnType } from "@/utils/columnType";
import SheetTable from "@/components/SheetTable";
import StatusMessage from "@/components/StatusMessage";
import ErrorCard from "@/components/ErrorCard";

interface SheetViewerProps {
    sheetUrl: string | null;
    submitUrl: string | null;
}

export default function SheetViewer({ sheetUrl, submitUrl }: SheetViewerProps) {
    const { columns, rows, error, loading } = useSheetData(sheetUrl ?? "");

    const columnTypes = useMemo(() => {
        const types: Record<string, ReturnType<typeof detectColumnType>> = {};
        columns.forEach((col) => {
            types[col] = detectColumnType(col, rows);
        });
        return types;
    }, [columns, rows]);

    const [filters, setFilters] = useState<Record<string, { text?: string; min?: string; max?: string }>>(
        {}
    );

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
        return <ErrorCard icon="⚠️" title="Something went wrong" message={error} />;
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

            {/* View / Submit Button */}
            {submitUrl && (
                <a
                    href={submitUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="fixed top-4 right-6 z-50 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl border border-blue-500 transition-colors shadow-lg"
                >
                    View / Submit ↗
                </a>
            )}

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