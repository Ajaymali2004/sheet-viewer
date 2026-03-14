export type ColType = "image" | "number" | "string";

const IMAGE_EXTENSIONS = /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i;
const URL_PATTERN = /^https?:\/\//i;
const DRIVE_PATTERN = /drive\.google\.com/i;

export function isImageUrl(value: string): boolean {
  if (!value || value.trim() === "") return false;
  if (IMAGE_EXTENSIONS.test(value)) return true;
  if (DRIVE_PATTERN.test(value)) return true;
  return false;
}

export function detectColumnType(col: string, rows: Record<string, string>[]): ColType {
  const colLower = col.toLowerCase();

  // Column name hints → image
  if (
    colLower.includes("img") ||
    colLower.includes("image") ||
    colLower.includes("photo") ||
    colLower.includes("pic") ||
    colLower.includes("thumbnail")
  ) {
    return "image";
  }

  const values = rows.map((r) => r[col]).filter((v) => v && v.trim() !== "");
  if (values.length === 0) return "string";

  // If majority of non-empty values are image URLs or drive links → image
  const imageCount = values.filter((v) => isImageUrl(v)).length;
  if (imageCount / values.length >= 0.5) return "image";

  // If column name has "url" but not image-like values → still string
  if (colLower.includes("url")) return "string";

  // All numbers → number
  if (values.every((v) => !isNaN(Number(v)) && v.trim() !== "")) return "number";

  return "string";
}