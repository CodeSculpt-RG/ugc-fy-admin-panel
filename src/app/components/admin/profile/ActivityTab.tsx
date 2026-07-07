"use client";

import React, { useState } from "react";
import { useAdminActivity, ActivityFilter, ActivityLog } from "@/app/hooks/useAdminActivity";
import { Loader2, History, Search, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { formatDateTimeStable } from "@/lib/utils/formatDate";

export default function ActivityTab() {
  const [filter, setLocalFilter] = useState<ActivityFilter>({
    scope: "own",
    page: 1,
    pageSize: 10,
  });

  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
  const { data, pagination, permissions, loading, error, setFilter } = useAdminActivity(filter);

  const handleScopeChange = (newScope: "own" | "team" | "all") => {
    const newFilter = { ...filter, scope: newScope, page: 1 };
    setLocalFilter(newFilter);
    setFilter(newFilter);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    const newFilter = { ...filter, page: newPage };
    setLocalFilter(newFilter);
    setFilter(newFilter);
  };

  const handleModuleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newFilter = { ...filter, module: e.target.value || undefined, page: 1 };
    setLocalFilter(newFilter);
    setFilter(newFilter);
  };

  return (
    <div className="relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-foreground">Activity Logs</h3>
          <p className="text-sm text-text-secondary mt-1 max-w-xl">
            Track your recent actions, team operations, and system events based on your permissions.
          </p>
        </div>
        
        {/* Scope Selector */}
        <div className="flex items-center space-x-2 bg-surface-elevated p-1.5 rounded-xl border border-border shrink-0">
          <button
            onClick={() => handleScopeChange("own")}
            className={cn(
              "px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all",
              filter.scope === "own" ? "bg-background shadow-sm text-foreground" : "text-text-secondary hover:text-foreground"
            )}
          >
            My Activity
          </button>
          {permissions.canReadTeam && (
            <button
              onClick={() => handleScopeChange("team")}
              className={cn(
                "px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all",
                filter.scope === "team" ? "bg-background shadow-sm text-foreground" : "text-text-secondary hover:text-foreground"
              )}
            >
              Team Activity
            </button>
          )}
          {permissions.canReadAll && (
            <button
              onClick={() => handleScopeChange("all")}
              className={cn(
                "px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all",
                filter.scope === "all" ? "bg-background shadow-sm text-foreground" : "text-text-secondary hover:text-foreground"
              )}
            >
              All Activity
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 bg-surface-elevated p-4 rounded-2xl border border-border">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-text-secondary" />
          <input
            type="text"
            placeholder="Search action or entity..."
            className="w-full bg-transparent outline-none text-sm font-semibold text-foreground placeholder:text-text-secondary/50"
            onChange={(e) => {
              const newFilter = { ...filter, action: e.target.value || undefined, page: 1 };
              setLocalFilter(newFilter);
              setFilter(newFilter);
            }}
          />
        </div>
        <div className="h-6 w-px bg-border hidden sm:block" />
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-text-secondary" />
          <select 
            value={filter.module || ""}
            onChange={handleModuleChange}
            className="bg-transparent text-sm font-semibold text-foreground outline-none cursor-pointer"
          >
            <option value="">All Modules</option>
            <option value="profile">Profile</option>
            <option value="users">Users</option>
            <option value="moderation">Moderation</option>
            <option value="finance">Finance</option>
            <option value="support">Support</option>
            <option value="admin">Admin Management</option>
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="min-h-[300px]">
        {error ? (
          (error as unknown as { code?: string }).code === "ACTIVITY_TABLE_NOT_CONFIGURED" ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-warning/10 border border-warning/20 flex items-center justify-center text-warning mb-4 shadow-sm">
                <History className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-foreground">Setup Required</h3>
              <p className="text-sm text-text-secondary mt-1 max-w-sm">
                Admin activity logging is not configured yet. Run the admin activity SQL setup to enable this feature.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-error/10 border border-error/20 flex items-center justify-center text-error mb-4 shadow-sm">
                <History className="w-8 h-8" />
              </div>
              <p className="text-sm font-bold text-error">{error.message}</p>
              <button 
                onClick={() => setFilter({ ...filter })}
                className="mt-4 px-4 py-2 bg-surface-elevated border border-border rounded-lg text-sm font-bold hover:bg-background transition-all"
              >
                Retry
              </button>
            </div>
          )
        ) : loading && data.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-surface-elevated border border-border flex items-center justify-center mb-4">
              <History className="w-8 h-8 text-text-secondary" />
            </div>
            <h3 className="text-lg font-black text-foreground">No activity found</h3>
            <p className="text-sm text-text-secondary mt-1 max-w-sm">
              Try adjusting your filters or scope to see more results.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {data.map((log) => (
              <div 
                key={log.id} 
                onClick={() => setSelectedLog(log)}
                className="p-5 rounded-2xl bg-background border border-border hover:border-primary/20 transition-colors shadow-sm cursor-pointer"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded bg-primary/10 text-primary">
                        {log.module}
                      </span>
                      <span className="text-sm font-bold text-foreground">
                        {log.action}
                      </span>
                    </div>
                    {log.description && (
                      <p className="text-sm text-text-secondary mt-2">{log.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-4 text-[11px] font-black uppercase tracking-widest text-text-secondary/70">
                      <span>By: {log.actor_admin_id.slice(0, 8)}...</span>
                      <span>•</span>
                      <span>{formatDateTimeStable(log.created_at)}</span>
                    </div>
                  </div>
                  {/* Metadata Summary (optional) */}
                  {Object.keys(log.metadata || {}).length > 0 && (
                    <div className="sm:text-right">
                      <div className="inline-block p-3 rounded-xl bg-surface-elevated text-xs text-text-secondary font-mono">
                        {JSON.stringify(log.metadata, null, 2).slice(0, 100)}
                        {JSON.stringify(log.metadata).length > 100 ? "..." : ""}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Activity Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="bg-surface border border-border rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border flex justify-between items-center bg-surface-elevated">
              <h3 className="text-xl font-black text-foreground">Activity Details</h3>
              <button 
                onClick={() => setSelectedLog(null)}
                className="p-2 rounded-full hover:bg-background text-text-secondary transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-[10px] uppercase font-black text-text-secondary tracking-wider">Action</p>
                  <p className="font-bold text-foreground mt-1">{selectedLog.action}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-black text-text-secondary tracking-wider">Module</p>
                  <p className="font-bold text-foreground mt-1">{selectedLog.module}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-black text-text-secondary tracking-wider">Actor ID</p>
                  <p className="font-mono text-xs text-foreground mt-1">{selectedLog.actor_admin_id}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-black text-text-secondary tracking-wider">Timestamp</p>
                  <p className="font-mono text-xs text-foreground mt-1">{formatDateTimeStable(selectedLog.created_at)}</p>
                </div>
              </div>

              {selectedLog.description && (
                <div>
                  <p className="text-[10px] uppercase font-black text-text-secondary tracking-wider">Description</p>
                  <p className="text-sm text-foreground mt-1">{selectedLog.description}</p>
                </div>
              )}

              {Object.keys(selectedLog.metadata || {}).length > 0 && (
                <div>
                  <p className="text-[10px] uppercase font-black text-text-secondary tracking-wider mb-2">Metadata Details</p>
                  <pre className="p-4 rounded-xl bg-surface-elevated border border-border text-xs text-foreground font-mono overflow-x-auto">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-border bg-surface-elevated text-right">
              <button 
                onClick={() => setSelectedLog(null)}
                className="px-6 py-2 bg-foreground text-background font-bold text-sm rounded-xl hover:bg-foreground/90 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pagination */}
      {!error && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-6 border-t border-border">
          <p className="text-[11px] font-black uppercase tracking-wider text-text-secondary">
            Page {pagination.page} of {pagination.totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1 || loading}
              className="p-2 rounded-xl bg-surface-elevated border border-border text-foreground hover:bg-background disabled:opacity-50 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages || loading}
              className="p-2 rounded-xl bg-surface-elevated border border-border text-foreground hover:bg-background disabled:opacity-50 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
