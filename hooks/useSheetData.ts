"use client";

import { useEffect, useState } from "react";
import { transformSheetUrl } from "@/utils/urlTransformer";
import { parseCSV, SheetData } from "@/utils/sheetParser";

interface UseSheetDataResult {
  columns: string[];
  rows: Record<string, string>[];
  error: string | null;
  loading: boolean;
}

export function useSheetData(editUrl: string): UseSheetDataResult {
  const [data, setData] = useState<SheetData>({ columns: [], rows: [] });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    
    if (!editUrl || editUrl.trim() === "") {
      setData({ columns: [], rows: [] });
      setError(null);
      setLoading(false);
      return;
    }

    const csvUrl = transformSheetUrl(editUrl);

    if (!csvUrl) {
      setError("Given URL is not valid");
      setLoading(false);
      return;
    }

    
    setLoading(true);
    setError(null);
    setData({ columns: [], rows: [] });

    fetch(csvUrl)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.text();
      })
      .then((csv) => {
        const parsed = parseCSV(csv);
        if (parsed.columns.length === 0) {
          setError("Can't fetch the data from the sheet");
        } else {
          setData(parsed);
        }
      })
      .catch(() => setError("Can't fetch the data from the sheet"))
      .finally(() => setLoading(false));
  }, [editUrl]);

  return { columns: data.columns, rows: data.rows, error, loading };
}