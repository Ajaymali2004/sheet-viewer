export interface SheetData {
  columns: string[];
  rows: Record<string, string>[];
}

// Parse a CSV line respecting quoted fields
function parseCSVLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        insideQuotes = !insideQuotes;
      }
    } else if (char === "," && !insideQuotes) {
      // Cell separator
      cells.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  // Add last cell
  cells.push(current.trim());
  return cells;
}

export function parseCSV(csv: string): SheetData {
  const lines = csv.split("\n").filter(Boolean);
  if (lines.length === 0) return { columns: [], rows: [] };

  const headerCells = parseCSVLine(lines[0]);
  
  const columns: string[] = [];
  for (const cell of headerCells) {
    const trimmed = cell.replace(/^"|"$/g, "");
    if (trimmed === "") break;
    columns.push(trimmed);
  }

  const rows = lines.slice(1).map((line) => {
    const cells = parseCSVLine(line);
    const row: Record<string, string> = {};
    columns.forEach((col, i) => {
      row[col] = (cells[i] ?? "").replace(/^"|"$/g, "");
    });
    return row;
  });

  return { columns, rows };
}