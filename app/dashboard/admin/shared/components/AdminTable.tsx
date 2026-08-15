"use client";

import { ReactNode } from "react";

export type AdminColumn<T> = {
  title: string;
  field?: keyof T;
  width?: string;
  align?: "left" | "center" | "right";
  sortable?: boolean;
  render?: (row: T) => ReactNode;
};

type Props<T> = {
  columns: AdminColumn<T>[];
  rows: T[];

  sortField?: keyof T | "";

  sortDirection?: "asc" | "desc";

  onSort?: (field: keyof T) => void;
};

export default function AdminTable<T extends { id: string }>({
  columns,
  rows,
  sortField,
  sortDirection,
  onSort,
}: Props<T>) {
  return (
    <div
      className="dark-card"
      style={{
        overflowX: "auto",
      }}
    >
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
        }}
      >
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.title}
                style={{
                  cursor:
                    column.sortable && column.field
                      ? "pointer"
                      : "default",

                  textAlign: column.align ?? "left",

                  width: column.width,

                  padding: "14px",

                  borderBottom:
                    "1px solid rgba(255,255,255,.12)",
                }}
                onClick={() => {
                  if (
                    column.sortable &&
                    column.field &&
                    onSort
                  ) {
                    onSort(column.field);
                  }
                }}
              >
                {column.title}

                {sortField === column.field && (
                  <span
                    style={{
                      marginLeft: 6,
                    }}
                  >
                    {sortDirection === "asc"
                      ? "▲"
                      : "▼"}
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              {columns.map((column) => (
                <td
                  key={column.title}
                  style={{
                    padding: 14,
                    borderBottom:
                      "1px solid rgba(255,255,255,.06)",

                    textAlign:
                      column.align ?? "left",
                  }}
                >
                  {column.render
                    ? column.render(row)
                    : String(
                        row[
                          column.field as keyof T
                        ] ?? ""
                      )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}