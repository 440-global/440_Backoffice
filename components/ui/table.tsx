"use client";
import { useState } from "react";
import Dropdown from "./dropdown";
import Pagination from "./pagination";

/** Base constraint: row must be an object with string keys */
type TableRow = Record<string, any>;

type TableProps<T extends TableRow> = {
  data: T[];
  selectable?: boolean;
  pagination?: boolean;
  actions?: boolean;
  excludedHeaders?: (keyof T)[];
  currency?: string;
};

function Tableu<T extends TableRow>({
  data,
  actions = false,
  excludedHeaders = [],
  currency = "₦",
}: TableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");

  /** Guard */
  if (!data || data.length === 0) {
    return <p className="text-center font-bold text-xl">No data available</p>;
  }

  /** Extract headers safely */
  const dataHeaders = (Object.keys(data[0]) as (keyof T)[]).filter(
    (header) => !excludedHeaders.includes(header)
  );

  /** Build final headers */
  const headers: (keyof T | "Actions")[] = actions
    ? [...dataHeaders, "Actions"]
    : [...dataHeaders];

  /** Filtering */
  const filteredData = data.filter((row) => {
    const firstKey = dataHeaders[0];
    const secondKey = dataHeaders[1];

    const col1 =
      firstKey && row[firstKey]
        ? row[firstKey].toString().toLowerCase()
        : "";

    const col2 =
      secondKey && row[secondKey]
        ? row[secondKey].toString().toLowerCase()
        : "";

    return (
      col1.includes(searchQuery.toLowerCase()) ||
      col2.includes(searchQuery.toLowerCase())
    );
  });

  const handlePageSizeChange = (value: string) => {
    setRowsPerPage(Number(value));
    setCurrentPage(1);
  };

  /** Pagination */
  const totalPages = Math.ceil(filteredData.length / rowsPerPage) || 1;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const visibleData = filteredData.slice(
    startIndex,
    startIndex + rowsPerPage
  );

  const prevDisable = currentPage === 1;
  const nextDisable = currentPage === totalPages;

  return (
    <>
      {/* Search */}
      <div className="my-4 flex flex-col md:flex-row gap-2 items-center justify-between">
        <input
          type="text"
          placeholder={`Search by ${String(dataHeaders[0])} or ${String(
            dataHeaders[1]
          )}`}
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          className="border border-gray-300 rounded-md px-3 py-2 w-64"
        />
        <div className="flex items-center gap-2">
          <span>Rows per page:</span>
          <Dropdown 
            value={String(rowsPerPage)}
            onChange={handlePageSizeChange}
            options={["5", "10", "15", "20", "30", "50"]}
          />
        </div>
      </div>

      {/* Table */}
      <div className="my-4 overflow-x-auto rounded-t-lg">
        <table className="min-w-full">
          <thead>
            <tr className="bg-slate-200">
              {headers.map((header) => (
                <th
                  key={String(header)}
                  className="p-2 md:p-3 text-left capitalize"
                >
                  {String(header)}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {visibleData.map((row, index) => (
              <tr
                key={index}
                className="hover:bg-slate-100 border-b border-b-(--table-border) transition-all"
              >
                {headers.map((header) => (
                  <td
                    key={String(header)}
                    className="p-2 md:p-3 capitalize"
                  >
                    {header === "Actions" ? (
                      <button className="text-blue-600 hover:underline">
                        View
                      </button>
                    ) : typeof row[header] === "number" &&
                      String(header).toLowerCase().includes("amount") ? (
                      `${currency}${row[header].toLocaleString()}`
                    ) : typeof row[header] === "boolean" ? (
                      row[header] ? "Yes" : "No"
                    ) : (
                      row[header]
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination 
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalPages={totalPages}
        prevDisable={prevDisable}
        nextDisable={nextDisable}
        prev={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
        next={() =>
          setCurrentPage((prev) => Math.min(prev + 1, totalPages))
        }
      />
    </>
  );
}

export default Tableu;
