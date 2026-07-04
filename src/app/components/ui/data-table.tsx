"use client";
"use no memo";

import React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  getFilteredRowModel,
  ColumnFiltersState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { ChevronLeft, ChevronRight, Search, Loader2 } from "lucide-react";
import { cn } from "@/app/lib/utils";

const COPY = {
  synchronizing: "Synchronizing Secure Data...",
  noData: "No matching operational data found.",
  displaying: "Displaying",
  of: "of",
  entries: "entries",
  prev: "Prev",
  next: "Next",
} as const;

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  placeholder?: string;
  isLoading?: boolean;
  onRowClick?: (row: TData) => void;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  placeholder = "Search operational ledger...",
  isLoading = false,
  onRowClick,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = React.useState<string>("");

  const hasSearchKey = React.useMemo(() => {
    if (!searchKey) return false;
    return columns.some((col) => {
      const c = col as { accessorKey?: string; id?: string };
      return c.accessorKey === searchKey || c.id === searchKey;
    });
  }, [searchKey, columns]);

  // eslint-disable-next-line
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      columnVisibility: hasSearchKey && searchKey ? { [searchKey]: false } : {},
    },
    initialState: {
      pagination: {
        pageSize: 25,
      },
    },
  });

  return (
    <div className="space-y-10">
      {searchKey && (
        <div className="flex items-center">
          <div className="relative flex-1 max-w-xl group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/20 group-focus-within:text-primary transition-all duration-500" />
            <Input
              placeholder={placeholder}
              value={
                (hasSearchKey && searchKey
                  ? (table.getColumn(searchKey)?.getFilterValue() as string)
                  : globalFilter) ?? ""
              }
              onChange={(event) => {
                const value = event.target.value;
                const column = hasSearchKey && searchKey ? table.getColumn(searchKey) : undefined;
                if (column) {
                  column.setFilterValue(value);
                } else {
                  table.setGlobalFilter(value);
                }
              }}
              className="pl-16 bg-surface border-border text-foreground rounded-[24px] h-16 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:border-primary/20 placeholder:text-foreground/40 text-xs font-semibold tracking-wide transition-all duration-500 group-hover:bg-surface/80"
            />
          </div>
        </div>
      )}

      <div className="relative group overflow-x-auto custom-scrollbar">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-20" />
        <Table className="min-w-full">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent border-border">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-80 text-center">
                  <div className="flex flex-col items-center space-y-6">
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    <span className="text-[11px] font-black text-foreground uppercase tracking-[0.4em]">{COPY.synchronizing}</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  onClick={() => onRowClick && onRowClick(row.original)}
                  className={cn(
                    "group hover:bg-surface-elevated transition-all duration-300 border-b border-border last:border-0",
                    onRowClick && "cursor-pointer"
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-80 text-center italic font-black uppercase tracking-[0.4em] text-[11px]">
                  <div className="flex flex-col items-center space-y-6">
                    <div className="p-6 rounded-[28px] bg-surface-elevated border border-border shadow-inner">
                      <Search className="w-10 h-10 text-foreground opacity-30" />
                    </div>
                    <span className="text-foreground">{COPY.noData}</span>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-8 py-2">
        <div className="flex flex-col space-y-1">
          <p className="text-sm text-text-secondary">
            {COPY.displaying} <span className="font-bold text-foreground">{table.getRowModel().rows.length}</span> {COPY.of} <span className="font-bold text-foreground">{data.length}</span> {COPY.entries}
          </p>
        </div>

        <div className="flex items-center space-x-5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="rounded-xl h-10 px-4 text-sm font-semibold transition-all disabled:opacity-30 border-border bg-surface hover:bg-surface-elevated hover:text-foreground"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            {COPY.prev}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="rounded-xl h-10 px-4 text-sm font-semibold transition-all disabled:opacity-30 border-border bg-surface hover:bg-surface-elevated hover:text-foreground"
          >
            {COPY.next}
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

      </div>
    </div>
  );
}
