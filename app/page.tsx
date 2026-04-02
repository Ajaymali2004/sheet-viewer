"use client";

import { useState, useEffect } from "react";
import SheetViewer from "@/components/SheetViewer";
import StatusMessage from "@/components/StatusMessage";
import ErrorCard from "@/components/ErrorCard";
import {
  CONFIG_SHEET_ID,
  CONFIG_SHEET_URL,
  SUBMIT_SHEET_GID,
  buildCsvUrl,
  buildCsvUrlFromGid,
  getFirstCell,
} from "@/utils/configSheet";

export default function Home() {
  const [sheetUrl, setSheetUrl] = useState<string | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [submitUrl, setSubmitUrl] = useState<string | null>(null);

  useEffect(() => {
    // Fetch main data sheet URL from Sheet 1
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

    // Fetch View/Submit URL from Sheet 2
    fetch(buildCsvUrlFromGid(CONFIG_SHEET_ID, SUBMIT_SHEET_GID))
      .then((res) => {
        if (!res.ok) return null;
        return res.text();
      })
      .then((csv) => {
        if (!csv) return;
        const cell = getFirstCell(csv);
        if (cell && cell.startsWith("http")) {
          setSubmitUrl(cell);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <main
      className="min-h-screen bg-gray-950 text-white px-6 py-8 relative"
      suppressHydrationWarning
    >
      <div className="mb-6 flex items-center justify-center">
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
        <SheetViewer sheetUrl={sheetUrl} submitUrl={submitUrl} />
      )}

      <p className="fixed bottom-4 right-6 text-gray-600 text-xs">Made by Ajay</p>
    </main>
  );
}