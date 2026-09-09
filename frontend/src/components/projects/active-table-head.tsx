import { TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClockIcon, type IconProps } from "@/components/ui/icons";
import {
  CalendarIcon,
  DocIcon,
  FlagIcon,
  HashIcon,
  PersonIcon,
  TagIcon,
} from "@/components/ui/table-icons";

/*
 * The eight columns of the grouped table, in one place so the header row and
 * the `colSpan` of every group heading cannot drift apart.
 *
 * Each glyph is `aria-hidden` inside `Icon`, so the column's accessible name
 * is the word beside it and nothing is announced twice.
 */
const COLUMNS: ReadonlyArray<{
  key: string;
  label: string;
  Glyph: (props: IconProps) => React.ReactElement;
}> = [
  { key: "key", label: "Key", Glyph: HashIcon },
  { key: "name", label: "Project name", Glyph: DocIcon },
  { key: "status", label: "Status", Glyph: TagIcon },
  { key: "owner", label: "Owner", Glyph: PersonIcon },
  { key: "dates", label: "Dates", Glyph: CalendarIcon },
  { key: "priority", label: "Priority", Glyph: FlagIcon },
  { key: "createdAt", label: "Created", Glyph: ClockIcon },
];

/* The actions column has no header glyph and no visible label — it is a
   control, not an attribute of the project. The count below includes it so
   every `colSpan` still spans the whole table. */

export const ACTIVE_COLUMN_COUNT = COLUMNS.length + 1;

export function ActiveTableHead() {
  return (
    <TableHeader>
      <TableRow>
        {COLUMNS.map(({ key, label, Glyph }) => (
          <TableHead key={key}>
            <span className="flex items-center gap-1.5">
              <Glyph className="size-3.5 shrink-0" />
              {label}
            </span>
          </TableHead>
        ))}
        <TableHead>
          <span className="sr-only">Actions</span>
        </TableHead>
      </TableRow>
    </TableHeader>
  );
}
