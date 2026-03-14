export function transformSheetUrl(editUrl: string): string | null {
  const match = editUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!match) return null;

  const sheetId = match[1];
  const gidMatch = editUrl.match(/gid=(\d+)/);
  const gid = gidMatch ? gidMatch[1] : "0";

  return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
}