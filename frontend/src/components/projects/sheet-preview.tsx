import { readSheetPreview } from "@/lib/sheet-preview";

/**
 * An `.xlsx` as a real table.
 *
 * A Server Component, and the parsing happens in `lib/sheet-preview.ts` before
 * this renders — so a spreadsheet preview costs the browser nothing at all,
 * unlike the PDF beside it. `exceljs` is ~700 KB and produces a static grid;
 * shipping the parser so a visitor can look at forty cells is the wrong trade.
 *
 * The first row is drawn as a header. That is a guess — a sheet is not obliged
 * to have one — but it is right far more often than it is wrong, and the
 * alternative is a table where nothing tells you what a column is. It is
 * styling only; no data is dropped by the assumption.
 *
 * `overflow-x-auto` on its own wrapper rather than on the card: a wide sheet
 * has to scroll sideways without the whole page doing it, which is the same
 * rule `table.tsx` follows.
 */
export async function SheetPreview({ storedName }: { storedName: string }) {
  const sheet = await readSheetPreview(storedName);

  if (!sheet || sheet.rows.length === 0) {
    return (
      <p className="px-3 py-4 text-sm text-text-subtle">
        This spreadsheet could not be previewed — open it to see the contents.
      </p>
    );
  }

  const [header, ...body] = sheet.rows;

  return (
    <div className="bg-canvas">
      <div className="max-h-96 overflow-auto">
        <table className="w-full border-collapse text-left text-xs">
          <caption className="sr-only">
            {sheet.sheetName}, the first {sheet.rows.length} rows
          </caption>
          <thead className="sticky top-0 bg-surface-sunken">
            <tr>
              {header.map((cell, index) => (
                <th
                  key={index}
                  scope="col"
                  className="border-b border-border px-2.5 py-1.5 font-semibold whitespace-nowrap text-text"
                >
                  {cell}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {body.map((row, rowIndex) => (
              <tr key={rowIndex} className="even:bg-surface-sunken/40">
                {header.map((_, cellIndex) => (
                  <td
                    key={cellIndex}
                    className="border-b border-border px-2.5 py-1.5 whitespace-nowrap text-text-muted"
                  >
                    {row[cellIndex] ?? ""}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(sheet.truncatedRows || sheet.truncatedColumns || sheet.otherSheets > 0) && (
        <p className="border-t border-border px-3 py-1.5 text-2xs text-text-subtle">
          Showing {sheet.sheetName}
          {sheet.truncatedRows && ", first 50 rows"}
          {sheet.truncatedColumns && ", first 12 columns"}
          {sheet.otherSheets > 0 &&
            ` — ${sheet.otherSheets} more sheet${sheet.otherSheets > 1 ? "s" : ""} in this file`}
          .
        </p>
      )}
    </div>
  );
}
