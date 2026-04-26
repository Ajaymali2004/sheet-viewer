export const CONFIG_SHEET_ID = "1CiMgzPxZLg5rAC794IfxOqp_pNnKMs6AYwdrmwWhuJw";
export const CONFIG_SHEET_URL = `https://docs.google.com/spreadsheets/d/${CONFIG_SHEET_ID}/edit?gid=0#gid=0`;
export const SUBMIT_SHEET_GID = "529904349";

export function buildCsvUrl(sheetUrl: string): string {
    const sheetId = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)?.[1] ?? "";
    const gid = sheetUrl.match(/gid=(\d+)/)?.[1] ?? "0";
    return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
}

export function buildCsvUrlFromGid(sheetId: string, gid: string): string {
    return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
}

export function getFirstCell(csv: string): string {
    const firstLine = csv.split("\n").find((l) => l.trim() !== "") ?? "";
    const firstCell = (firstLine.match(/(".*?"|[^,\r\n]+)/)?.[0] ?? "")
        .trim()
        .replace(/^"|"$/g, "");
    return firstCell;
}