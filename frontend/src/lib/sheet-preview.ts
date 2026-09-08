import ExcelJS from "exceljs";
import { uploadUrl } from "@/lib/uploads";

/*
 * Reading an `.xlsx` into rows, on the server.
 *
 * Parsed HERE rather than in the browser, which is the whole reason this is a
 * separate module from the component that draws it: `exceljs` is ~700 KB and
 * the result is a static table. Shipping a spreadsheet parser to every visitor
 * so they can look at forty cells is the wrong trade, and a Server Component
 * can just hand down the strings.
 *
 * Only the FIRST worksheet, and only a corner of it. A workbook is allowed to
 * be a hundred sheets of ten thousand rows; a preview on a project page is a
 * glance, and the link beside it is the file.
 */
const MAX_ROWS = 50;
const MAX_COLUMNS = 12;

/** Ten megabytes of xlsx unzips to far more, and this runs during a page render. */
const MAX_SHEET_BYTES = 5 * 1024 * 1024;

export type SheetPreviewData = {
  sheetName: string;
  /** Row-major, already stringified — the component draws, it does not format. */
  rows: string[][];
  truncatedRows: boolean;
  truncatedColumns: boolean;
  /** More sheets exist than the one shown. */
  otherSheets: number;
};

/** One cell as text. `exceljs` hands back numbers, dates, formulas and rich text alike. */
function cellText(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "object") {
    if ("text" in value && typeof value.text === "string") return value.text;
    /* A formula cell carries both the formula and its last cached result. The
       result is what the spreadsheet SHOWS, so it is what a preview shows. */
    if ("result" in value) return cellText(value.result as ExcelJS.CellValue);
    if ("richText" in value) {
      return value.richText.map((part) => part.text).join("");
    }
    if ("hyperlink" in value) return String(value.text ?? value.hyperlink);
    return "";
  }
  return String(value);
}

export async function readSheetPreview(
  storedName: string,
): Promise<SheetPreviewData | null> {
  const url = uploadUrl(storedName);
  if (!url) return null;

  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) return null;

    const buffer = await response.arrayBuffer();
    if (buffer.byteLength > MAX_SHEET_BYTES) return null;

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const sheet = workbook.worksheets[0];
    if (!sheet) return null;

    const rows: string[][] = [];
    let truncatedColumns = false;

    /* `eachRow` skips empty rows entirely, so the cap is on what is COLLECTED
       rather than on the row number — a sheet whose first content is at row
       900 still previews. */
    sheet.eachRow((row) => {
      if (rows.length >= MAX_ROWS) return;

      const values = Array.isArray(row.values) ? row.values.slice(1) : [];
      if (values.length > MAX_COLUMNS) truncatedColumns = true;

      rows.push(values.slice(0, MAX_COLUMNS).map((cell) => cellText(cell as ExcelJS.CellValue)));
    });

    return {
      sheetName: sheet.name,
      rows,
      truncatedRows: sheet.rowCount > rows.length,
      truncatedColumns,
      otherSheets: Math.max(0, workbook.worksheets.length - 1),
    };
  } catch {
    /* A corrupt workbook, or one `exceljs` will not open. The row falls back
       to a download link, which is still the file. */
    return null;
  }
}
