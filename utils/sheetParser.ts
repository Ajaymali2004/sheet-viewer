export interface SheetData {
  columns: string[];
  rows: Record<string, string>[];
}

export function parseCSV(csv: string): SheetData {
  const lines = csv.split("\n").filter(Boolean);
  if (lines.length === 0) return { columns: [], rows: [] };

  const headerRow = lines[0].split(",");

  // Stop at first empty header cell → dynamic column detection
  const columns: string[] = [];
  for (const cell of headerRow) {
    const trimmed = cell.trim().replace(/^"|"$/g, "");
    if (trimmed === "") break;
    columns.push(trimmed);
  }

  const rows = lines.slice(1).map((line) => {
    const cells = line.split(",");
    const row: Record<string, string> = {};
    columns.forEach((col, i) => {
      row[col] = (cells[i] ?? "").trim().replace(/^"|"$/g, "");
    });
    return row;
  });

  return { columns, rows };
}