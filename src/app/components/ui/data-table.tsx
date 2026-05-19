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
    state: {
      sorting,
      columnFilters,
    },
  });

  return (
    <div className="space-y-10">
      {searchKey && (
        <div className="flex items-center">
          <div className="relative flex-1 max-w-xl group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-[#F0F0FB]/20 group-focus-within:text-primary-blue transition-all duration-500" />
            <Input
              placeholder={placeholder}
              value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ""}
              onChange={(event) =>
                table.getColumn(searchKey)?.setFilterValue(event.target.value)
              }
              className="pl-16 bg-[#111827] border-white/[0.08] text-[#F0F0FB] rounded-[24px] h-16 focus-visible:ring-2 focus-visible:ring-primary-blue/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#030712] focus-visible:border-primary-blue/20 placeholder:text-[#F0F0FB]/20 text-xs font-semibold tracking-wide transition-all duration-500 group-hover:bg-[#111827]/80"
            />
          </div>
        </div>
      )}

      <div className="relative group overflow-x-auto custom-scrollbar">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary-blue/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-20" />
        <Table className="min-w-full">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent border-white/[0.08]">
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
                    <Loader2 className="w-10 h-10 animate-spin text-primary-blue opacity-50" />
                    <span className="text-[11px] font-black text-[#F0F0FB]/20 uppercase tracking-[0.4em]">Synchronizing Secure Data...</span>
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
                    "group hover:bg-white/[0.02] transition-all duration-300 border-white/[0.04] last:border-0",
                    onRowClick && "cursor-pointer"
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-8 py-6 text-[#F0F0FB]/80 font-medium">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-80 text-center text-[#F0F0FB]/20 italic font-black uppercase tracking-[0.4em] text-[11px]">
                  <div className="flex flex-col items-center space-y-6">
                    <div className="p-6 rounded-[28px] bg-white/[0.02] border border-white/[0.04] shadow-inner">
                      <Search className="w-10 h-10 opacity-20" />
                    </div>
                    <span>No matching operational data found.</span>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-8 py-2">
        <div className="flex flex-col space-y-1">
          <p className="text-[10px] font-black text-[#F0F0FB]/10 uppercase tracking-[0.4em]">Audit Ledger Controls</p>
          <p className="text-xs font-black text-[#F0F0FB]/40 uppercase tracking-widest">
            Displaying <span className="text-primary-blue">{table.getRowModel().rows.length}</span> of <span className="text-[#F0F0FB]/80">{data.length}</span> entries
          </p>
        </div>

        <div className="flex items-center space-x-5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="rounded-[20px] h-12 px-8 text-[11px] font-black uppercase tracking-[0.2em] transition-all disabled:opacity-10 border-white/[0.08] bg-[#111827] hover:bg-white/5 hover:text-[#F0F0FB]"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="rounded-[20px] h-12 px-8 text-[11px] font-black uppercase tracking-[0.2em] transition-all disabled:opacity-10 border-white/[0.08] bg-[#111827] hover:bg-white/5 hover:text-[#F0F0FB]"
          >
            Next
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

      </div>
    </div>
  );
}
