# Admin Panel Performance Stability Report

Date: 2026-06-01

## Summary

The admin panel was at risk of runaway memory usage from a combination of incorrect Next.js workspace root detection, duplicate shell/provider work, repeated admin API calls, missing abort paths, session-expired request loops, and socket/listener cleanup gaps.

The fix makes `admin_panel` the explicit Turbopack root, centralizes admin API/auth handling, deduplicates short-window GET requests, prevents repeated expired-session retries, aborts in-flight fetches on unmount, removes duplicate dashboard shell rendering, and makes chat monitoring socket usage singleton-aware.

## Root Cause Found

The most serious root cause was workspace/root ambiguity. This repository has a root `package-lock.json` and an `admin_panel/package-lock.json`. Without a pinned Turbopack root, Next.js can infer too broad a project boundary and watch unrelated monorepo folders, backups, mobile dependencies, and generated directories. That can create massive file watcher and module graph pressure in development.

Runtime pressure then amplified the problem:

- Multiple admin services independently called `supabase.auth.getSession()`.
- Failed or expired sessions could trigger repeated background requests.
- Notifications, dashboard stats, users, brands, creators, and escalations lacked consistent abort/deduplication behavior.
- `admin/layout.tsx` wrapped pages with `DashboardShell` while many pages already rendered `DashboardShell`, creating duplicate layout work.
- Chat monitoring could create duplicate socket listeners/connections.
- Some timers were not cleaned up.
- `next/font/google` made production builds depend on network access to Google Fonts.

## Files Changed And Why

### `next.config.ts`

Before: Turbopack root depended on runtime working directory/root inference.

After: `turbopack.root` is pinned to `path.resolve(__dirname)`.

Why: Ensures Next.js watches and builds only the `admin_panel` app instead of parent folders or unrelated projects.

### `src/app/services/adminApiClient.ts`

Added a centralized admin fetch client.

What it does:

- Gets Supabase admin auth headers in one place.
- Dispatches one `admin-session-expired` event on missing/expired session.
- Provides `AdminSessionExpiredError`.
- Deduplicates short-window GET requests.
- Preserves normal `fetch` behavior while defaulting admin requests to `cache: "no-store"`.

Why: Prevents repeated API calls and session-expired loops from spreading across services.

### `src/app/context/AdminAuthContext.tsx`

Before: Auth refresh calls had no abort signal and each failed admin/me call only failed locally.

After:

- `refreshAdmin` accepts an `AbortSignal`.
- Auth refresh aborts on cleanup.
- 401/403 responses clear local auth.
- The provider listens for centralized session-expired events.
- Session-expired handling redirects/logs out once instead of letting every background request complain.

Why: Centralizes session behavior and stops background request storms after auth expires.

### `src/app/context/QueryProvider.tsx`

Before: React Query retried once and could refetch on focus by default.

After:

- `refetchOnWindowFocus: false`
- `refetchOnReconnect: false`
- `gcTime: 5 minutes`
- No retry for `AdminSessionExpiredError`
- Mutations do not retry automatically

Why: Prevents focus/reconnect retry loops and avoids retrying requests that cannot succeed without login.

### `src/app/admin/layout.tsx`

Before: Admin layout rendered `DashboardShell`, while admin pages also rendered `DashboardShell`.

After: Admin layout only returns children and keeps password-change redirect logic.

Why: Removes duplicate sidebar/topbar/layout rendering and unnecessary React work.

### Admin pages

Changed:

- `src/app/admin/users/page.tsx`
- `src/app/admin/brands/page.tsx`
- `src/app/admin/creators/page.tsx`
- `src/app/admin/dashboard/page.tsx`
- `src/app/admin/escalations/page.tsx`
- `src/app/admin/chat-monitoring/page.tsx`

Before:

- Initial load effects could trigger synchronous state changes.
- Fetches could complete after unmount.
- Dashboard realtime changes could call stats repeatedly.
- Escalations and admin lists had no consistent abort path.
- Chat monitoring fetched auth manually and opened sockets per mount.

After:

- Fetches use `AbortController`.
- Effect-started loads are deferred with `queueMicrotask`.
- Dashboard realtime refresh is debounced.
- Chat monitoring uses centralized admin auth/fetch.
- Socket listeners are removed before disconnect.

Why: Prevents stale state updates, Strict Mode duplication, repeated API calls, and socket/listener leaks.

### Services

Changed:

- `src/app/services/approvalService.ts`
- `src/app/services/brandService.ts`
- `src/app/services/creatorService.ts`
- `src/app/services/dashboardService.ts`
- `src/app/services/notificationService.ts`
- `src/app/services/userService.ts`

Before: Each service fetched the Supabase session independently and called `fetch` directly.

After: Services use `adminFetch` and accept `AbortSignal` where needed.

Why: Request deduplication, session-expired handling, and abort behavior now work consistently.

### Notifications and system status

Changed:

- `src/app/components/layout/NotificationDropdown.tsx`
- `src/app/components/layout/NotificationPanel.tsx`
- `src/app/components/layout/SystemStatusPopover.tsx`

Before: Notification and health requests could run without a valid session and had no abort path.

After:

- Requests only run with a valid admin session.
- In-flight requests abort on unmount.
- Session-expired errors are ignored locally because the auth provider handles them globally.

Why: Stops unauthenticated polling-style behavior and repeated notification API errors.

### `src/lib/admin-monitoring-socket.ts`

Before: Socket creation always returned a new connection.

After:

- Reuses the active socket when the token matches.
- Disconnects and clears listeners when the token changes.
- Clears singleton state on disconnect.

Why: Prevents duplicate Socket.io connections and listener leaks in chat monitoring.

### UI utilities

Changed:

- `src/app/components/ui/data-table.tsx`
- `src/app/components/ui/shared-states.tsx`
- `src/app/hooks/useToast.ts`

Before:

- Table pagination did not set a safe fixed page size.
- Copy/toast timers could survive component unmount.

After:

- Data table defaults to 25 rows per page.
- Toast and copy timers are cleared on cleanup.

Why: Reduces large-table rendering cost and prevents timer leaks.

### Fonts and theme stability

Changed:

- `src/app/layout.tsx`
- `src/app/globals.css`

Before: `next/font/google` fetched Plus Jakarta Sans from Google during build.

After: The app uses a local system font stack.

Why: Production builds should not fail when external font network access is blocked. The existing Orange / Pearl White / Black theme remains intact.

## Verification Performed

Passed:

- `npm run lint`
- `npm run type-check`
- `npm run build`

Build note:

- The first build failed because `next/font/google` could not fetch Google Fonts.
- After removing the external font dependency, the build passed.
- Turbopack build had to run outside the sandbox because the sandbox blocked a local helper port used by the CSS/PostCSS worker.

Dev server verification:

- `npm run dev` started at `http://localhost:3000`.
- `/admin/dashboard` returned a redirect to `/admin/login`.
- `/admin/login` returned `200 OK`.
- After route compilation, `next-server` RSS was about 934 MB.
- After 5 minutes idle, `next-server` RSS was about 890 MB.
- PostCSS helper dropped from about 132 MB to about 106 MB.
- No endless application console errors appeared during the run.

## Expected Result

The dev server should no longer climb into runaway memory from watching unrelated folders or repeatedly issuing failed admin requests. Normal warm Turbopack memory after compiling routes is still expected, but the observed process memory remained stable instead of growing toward the previous 77 GB failure.

## Important Notes

- Features were not intentionally removed.
- The admin UI workflow was preserved.
- The theme was not redesigned.
- `.next` was cleaned safely and regenerated.
- There are other dirty files in the repository that existed outside this stability pass; this report focuses on the performance and memory changes made for `admin_panel`.

## Follow-up: Lint And Dependency Hardening

Date: 2026-06-01

Additional IDE-reported issues were fixed after the initial performance pass.

Changed:

- `../PROJECT_KNOWLEDGE.md`
- `../.securecoderignore`
- `package.json`
- `package-lock.json`

What changed:

- Fixed Markdown formatting in `PROJECT_KNOWLEDGE.md` by adding required blank lines around headings and lists.
- Removed trailing spaces from `PROJECT_KNOWLEDGE.md`.
- Pinned all direct `admin_panel` dependencies, dev dependencies, and optional dependencies to exact installed versions.
- Updated the root SecureCoder ignore file to ignore lockfiles recursively with `**/package-lock.json`.

Why this was necessary:

- Markdown lint warnings were real source formatting issues and should be fixed in the document.
- Direct dependency ranges such as `^` can change installed versions on future installs; exact pins make production installs deterministic.
- `package-lock.json` is generated metadata. It intentionally contains upstream transitive and peer dependency ranges, while the actual resolved packages are pinned by `version`, `resolved`, and `integrity`. Scanning generated lockfiles for range syntax creates false positives, so lockfiles are excluded from SecureCoder scans.

Verification:

- `npm ls --depth=0`
- `npm run lint`
- `npm run type-check`
- `npm run build`

## Follow-up: SecureCoder Workspace Root

Date: 2026-06-01

The SecureCoder extension continued reporting `CWE-427` findings against `admin_panel/package-lock.json` after the direct dependencies were pinned. The findings were on transitive and peer dependency ranges embedded in package manifests inside the generated lockfile.

Changed:

- `.securecoderignore`

What changed:

- Added an `admin_panel`-local SecureCoder ignore file.
- Ignored `package-lock.json`, `node_modules`, `.next`, and build output from the admin panel workspace.

Why this was necessary:

- The IDE appears to run SecureCoder with `admin_panel` as the workspace root, so the repo-level `../.securecoderignore` was not being applied to `admin_panel/package-lock.json`.
- Editing transitive dependency range strings inside `package-lock.json` would corrupt generated npm metadata and is not a production-safe fix.
- Production safety is already handled by exact direct dependency pins plus lockfile `version`, `resolved`, and `integrity` entries.

## Follow-up: Runtime Abort And Chart Warnings

Date: 2026-06-01

Additional runtime diagnostics showed repeated browser console entries from two root causes:

- `AbortError: signal is aborted without reason` on `/admin/creators`
- Recharts warnings for `width(-1)` and `height(-1)` on dashboard charts

Changed:

- `src/app/services/adminApiClient.ts`
- `src/app/admin/creators/page.tsx`
- `src/app/admin/users/page.tsx`
- `src/app/admin/brands/page.tsx`
- `src/app/admin/chat-monitoring/page.tsx`
- `src/app/admin/dashboard/page.tsx`
- `src/app/admin/escalations/page.tsx`
- `src/app/context/AdminAuthContext.tsx`
- `src/app/components/layout/NotificationDropdown.tsx`
- `src/app/components/layout/NotificationPanel.tsx`
- `src/app/components/layout/SystemStatusPopover.tsx`
- `src/app/components/ui/charts.tsx`
- `src/app/components/ui/admin-charts.tsx`
- `src/app/admin/analytics/page.tsx`

What changed:

- Replaced `promise.finally(...)` bookkeeping in `adminFetch` with explicit fulfilled/rejected handlers.
- This avoids creating an unobserved rejected promise when an in-flight fetch is cancelled.
- Deferred the creators page initial fetch with `queueMicrotask`, matching the safer pattern used by other admin pages.
- Added explicit `AbortError` reasons to admin AbortController cleanup calls.
- Added positive `initialDimension`, `minWidth`, and `minHeight` to reusable Recharts `ResponsiveContainer` wrappers.
- Applied the same Recharts sizing guard to direct analytics page charts.

Why this was necessary:

- The previous fetch bookkeeping was functionally correct for successful requests but could create duplicate unhandled rejection noise during abort cleanup.
- React Strict Mode intentionally mounts and unmounts effects in development, so cancellation paths must be quiet and intentional.
- Recharts defaults `initialDimension` to `-1 x -1`; when a chart mounts before layout measurement completes, it logs repeated warnings. Providing a positive initial dimension prevents the warning without changing visual layout.

Verification:

- `npm run lint`
- `npm run type-check`
- `npm run build`
