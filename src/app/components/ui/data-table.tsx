"use client";
"use no memo";

import React, { useMemo, useEffect } from "react";
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
  VisibilityState,
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
import { ChevronLeft, ChevronRight, Search, Loader2, LayoutPanelLeft } from "lucide-react";
import { cn } from "@/app/lib/utils";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";

export type DataTableProps<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: keyof TData;
  searchPlaceholder?: string;
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  enableColumnVisibility?: boolean;
  enablePagination?: boolean;
  pageSize?: number;
  onRowClick?: (row: TData) => void;
};

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = "Search...",
  isLoading = false,
  emptyTitle = "No results found",
  emptyDescription = "Try adjusting your filters.",
  enableColumnVisibility = true,
  enablePagination = true,
  pageSize = 10,
  onRowClick,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = React.useState<string>("");
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});

  const hasSearchKey = useMemo(() => {
    if (!searchKey) return false;
    return columns.some((col) => {
      const c = col as { accessorKey?: string; id?: string };
      return c.accessorKey === searchKey || c.id === searchKey;
    });
  }, [searchKey, columns]);

  // Merge the search key visibility hiding safely
  const initialVisibility = useMemo(() => {
    const visibility: VisibilityState = {};
    if (hasSearchKey && typeof searchKey === 'string') {
      visibility[searchKey] = false;
    }
    return visibility;
  }, [hasSearchKey, searchKey]);

  useEffect(() => {
    setColumnVisibility(prev => ({ ...prev, ...initialVisibility }));
  }, [initialVisibility]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: enablePagination ? getPaginationRowModel() : undefined,
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      columnVisibility,
    },
    initialState: {
      pagination: {
        pageSize: pageSize,
      },
    },
  });

  return (
    <div className="rounded-[28px] border border-white/70 bg-white/70 p-4 shadow-[0_20px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-4">
        {searchKey && hasSearchKey && (
          <div className="relative flex-1 max-w-sm group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary group-focus-within:text-primary transition-all duration-300" />
            <Input
              placeholder={searchPlaceholder}
              value={(table.getColumn(String(searchKey))?.getFilterValue() as string) ?? ""}
              onChange={(event) =>
                table.getColumn(String(searchKey))?.setFilterValue(event.target.value)
              }
              className="pl-10 bg-white/75 border-black/5 text-foreground rounded-full h-11 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background placeholder:text-text-secondary/60 text-sm font-medium transition-all duration-300 hover:bg-white"
            />
          </div>
        )}
        
        {!searchKey && (
          <div className="relative flex-1 max-w-sm group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary group-focus-within:text-primary transition-all duration-300" />
            <Input
              placeholder={searchPlaceholder}
              value={globalFilter ?? ""}
              onChange={(event) => setGlobalFilter(event.target.value)}
              className="pl-10 bg-white/75 border-black/5 text-foreground rounded-full h-11 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background placeholder:text-text-secondary/60 text-sm font-medium transition-all duration-300 hover:bg-white"
            />
          </div>
        )}

        {enableColumnVisibility && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-11 rounded-full bg-white/75 border-black/5 hover:bg-white text-sm font-semibold">
                <LayoutPanelLeft className="mr-2 h-4 w-4 text-text-secondary" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[180px] rounded-2xl p-2">
              {table
                .getAllColumns()
                .filter((column) => typeof column.accessorFn !== "undefined" && column.getCanHide() && column.id !== searchKey)
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize rounded-xl cursor-pointer"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="w-full overflow-x-auto rounded-[22px] border border-black/5 bg-white/60 custom-scrollbar relative">
        <Table className="min-w-[900px]">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent border-border">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="uppercase text-xs tracking-wide text-text-secondary font-bold bg-white/40">
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
                <TableCell colSpan={columns.length} className="h-64 text-center">
                  <div className="flex flex-col items-center space-y-4">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <span className="text-[11px] font-black text-text-secondary uppercase tracking-[0.2em]">Loading Records...</span>
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
                    "group hover:bg-white/80 transition-all duration-300 border-b border-black/5 last:border-0",
                    onRowClick && "cursor-pointer"
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-4">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-64 text-center">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="p-4 rounded-[22px] bg-white/50 border border-black/5 shadow-sm">
                      <Search className="w-8 h-8 text-foreground opacity-20" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground mb-1">{emptyTitle}</h3>
                      <p className="text-xs text-text-secondary">{emptyDescription}</p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {enablePagination && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 px-2">
          <p className="text-sm text-text-secondary">
            Displaying <span className="font-bold text-foreground">{table.getRowModel().rows.length}</span> of <span className="font-bold text-foreground">{data.length}</span> entries
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="rounded-full h-10 px-4 text-sm font-semibold transition-all disabled:opacity-30 border-black/5 bg-white/75 hover:bg-white hover:text-foreground"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="rounded-full h-10 px-4 text-sm font-semibold transition-all disabled:opacity-30 border-black/5 bg-white/75 hover:bg-white hover:text-foreground"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
