import type { ReactNode } from 'react';

/* ------------------------------------------------------------------ */
/*  DataTable — generic, typed, reusable table component              */
/*                                                                    */
/*  Designed for easy extension:                                      */
/*    • Sort-ready: column headers can be wired to sort callbacks     */
/*    • Filter-ready: parent controls the `data` array                */
/*    • Pagination-ready: parent slices `data` and adds controls      */
/* ------------------------------------------------------------------ */

export interface DataTableColumn<T> {
  /** Unique column identifier. Also used as data key when no `render` is provided. */
  key: string;
  /** Column header content (text or JSX for sortable headers). */
  header: string | ReactNode;
  /** Custom cell renderer. Falls back to `String(row[key])` when omitted. */
  render?: (row: T) => ReactNode;
  /** Additional CSS classes for both <th> and <td>. */
  className?: string;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  /** Property used as the React key for each row. */
  keyField: keyof T;
}

export default function DataTable<T extends object>({
  columns,
  data,
  keyField,
}: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-gray-200 sticky top-0 bg-white z-10">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 text-[12px] font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap ${col.className ?? ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr
              key={String(row[keyField])}
              className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/80 transition-colors group"
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`px-4 py-2.5 text-[13px] text-gray-600 whitespace-nowrap ${col.className ?? ''}`}
                >
                  {col.render
                    ? col.render(row)
                    : String((row as Record<string, unknown>)[col.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td
                colSpan={columns.length}
                className="px-5 py-10 text-center text-sm text-gray-400"
              >
                No data available.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
