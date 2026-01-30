# Arrow CRM - MVP Function Check

**Date:** 2026-01-30
**Status:** In Progress
**QA Run:** Started 2026-01-30

---

## QA Run Plan

### Test Order (P0 First)
1. **Authentication & Routing** - Login, session, logout
2. **Dashboard** - Main page load, modules
3. **Deals List** - Table, filters, create
4. **Deal Detail** - View, edit, sections
5. **Outreach Targets** - Status, activities
6. **Documents** - List, upload, preview

### Setup Required
- [ ] App open in browser at deployed URL
- [ ] DevTools open → Console tab visible
- [ ] DevTools → Network tab visible (filter: Fetch/XHR)
- [ ] Render dashboard open for backend logs (if needed)

### Failure Reporting Template
```
- Page URL:
- Action taken:
- Expected:
- Actual:
- Toast text:
- Console error (copy/paste):
- Network request (endpoint + status code + response snippet):
```

---

## Session Summary

### Completed This Session:
- [x] Created MVP function check document
- [x] Reviewed P0 flow code for guardrails
- [x] Fixed missing error toasts in:
  - Dashboard (`/src/app/page.tsx`)
  - Dashboard alternate (`/src/app/dashboard/page.tsx`)
  - Deals list (`/src/app/deals/page.tsx`)
  - Deal detail (`/src/app/deals/[id]/page.tsx`)
  - DealTargetsSection (6 error handlers)
- [x] TypeScript compilation verified

### Remaining Blockers:
1. ~~Backend migration must be run on Render before any API testing~~ ✅ Done

---

## Pre-Flight Checks

- [x] Backend migration run: `bin/rails db:migrate` ✅ Completed 2026-01-30
- [ ] Frontend deployed to Vercel
- [ ] Backend deployed to Render
- [ ] Environment variables configured

---

## P0 Flows (MVP Critical)

### 1. Authentication & Routing

| Test | Status | Notes |
|------|--------|-------|
| Login screen renders | ✅ PASS | |
| PIN entry accepts 6 digits | ✅ PASS | |
| Valid PIN authenticates | ✅ PASS | |
| Invalid PIN shows error | | |
| 10 failed attempts triggers lockout | | |
| Session persists across refresh | ✅ PASS | |
| Logout clears session | | |
| Protected routes redirect to login | | |
| Backend user ID resolved after login | | |

**Files:** `src/contexts/AuthContext.tsx`, `src/components/auth/AuthGate.tsx`, `src/components/auth/LoginScreen.tsx`

---

### 2. Dashboard

| Test | Status | Notes |
|------|--------|-------|
| Page loads without errors | ✅ PASS | No errors, 2 warnings (non-blocking) |
| Truth Bar displays metrics | ✅ PASS | Shows zeros (empty state) |
| Attention Module shows items | ✅ PASS | Empty state renders correctly |
| Active Deals Module loads | ✅ PASS | Empty state renders correctly |
| Capital Module renders (if data) | ✅ PASS | N/A - no data |
| Relationships Module loads | ✅ PASS | Empty state |
| Events Module loads | ✅ PASS | Empty state |
| Alerts Module shows (if alerts exist) | ✅ PASS | N/A - no alerts |
| Command palette opens (⌘K) | | |
| Preferences panel works | | |

**Files:** `src/app/page.tsx`, `src/app/dashboard/_components/*`

---

### 3. Deals List

| Test | Status | Notes |
|------|--------|-------|
| Page loads with deal data | ✅ PASS | Empty state renders correctly |
| KPI strip shows statistics | ✅ PASS | Shows zeros |
| Table view displays deals | ✅ PASS | Empty state |
| Flow view (Kanban) works | | |
| MindMap view renders | | |
| Column filtering works | | |
| Status filter works | | |
| Priority filter works | | |
| Risk flag filter works | | |
| Filters persist in localStorage | | |
| Create Deal modal opens | ✅ PASS | |
| Create Deal submits successfully | ✅ PASS | |
| Row expand shows details | | |
| Click navigates to deal detail | | |

**Files:** `src/app/deals/page.tsx`, `src/components/deals/*`

---

### 4. Deal Detail

| Test | Status | Notes |
|------|--------|-------|
| Page loads with deal data | ✅ PASS | After backend fix |
| Deal header shows name/status | ✅ PASS | |
| Editable details save inline | | |
| Round Details section loads | | |
| Primary Truth panel renders | | |
| Blocks section displays | | |
| Add Block modal works | | |
| Interests section displays | | |
| Add Interest modal works | | |
| Targets section displays | | |
| Activity feed loads | | |
| Sidebar tasks show | | |
| Status change works | | |
| Priority change works | | |

**Files:** `src/app/deals/[id]/page.tsx`, `src/app/deals/[id]/_components/*`

---

### 5. Outreach Targets

| Test | Status | Notes |
|------|--------|-------|
| Targets table renders | ✅ PASS | |
| Status badges display correctly | ✅ PASS | |
| Status change dropdown works | ✅ PASS | |
| Follow-up scheduling works | ✅ PASS | Task creation works, UI needs polish (P3) |
| Activity history shows | ✅ PASS | Events logged, shown on card + Events page |
| Add target modal works | ✅ PASS | |
| Target detail slide-out opens | ✅ PASS | Modal (not slide-out) with full edit capabilities |
| Stale contact warning shows | ✅ PASS | "1 stale" badge + "No contact yet" text |

**Files:** `src/app/deals/[id]/_components/DealTargetsSection.tsx`, `src/components/outreach/*`

---

### 6. Documents

| Test | Status | Notes |
|------|--------|-------|
| Page loads with documents | | |
| Search filters results | | |
| Category filter works | | |
| Type filter works | | |
| Status filter works | | |
| Sensitivity filter works | | |
| Upload dialog opens | | |
| File upload succeeds | | |
| Preview panel shows details | | |
| Document linking works | | |
| Download works | | |

**Files:** `src/app/documents/page.tsx`, `src/app/documents/_components/*`, `src/lib/documents-api.ts`

---

## P1 Flows (Important)

### 7. Risk Flags

| Test | Status | Notes |
|------|--------|-------|
| Risk indicators show in deals table | | |
| Tooltip shows risk details | | |
| Risk filter works | | |
| Risk panel in deal detail loads | | |
| Severity levels display correctly | | |

**Risk Types:**
- [ ] `pricing_stale` - Shows when pricing data outdated
- [ ] `coverage_low` - Shows when coverage below threshold
- [ ] `missing_docs` - Shows when required docs missing
- [ ] `deadline_risk` - Shows when close date at risk
- [ ] `stale_outreach` - Shows when targets not contacted
- [ ] `overdue_tasks` - Shows when tasks past due

**Files:** `src/components/deals/RiskFlagIndicator.tsx`, `src/components/deals/RiskFlagsPanel.tsx`

---

### 8. Entity Links

| Test | Status | Notes |
|------|--------|-------|
| Entity links section renders | | |
| Links grouped by relationship type | | |
| Add link modal works | | |
| Link deletion works | | |
| Navigation to linked entity works | | |

**Files:** `src/app/deals/[id]/_components/EntityLinksSection.tsx`

---

### 9. Demand Progress Bar

| Test | Status | Notes |
|------|--------|-------|
| Progress bar renders in deals table | | |
| Segments show correct proportions | | |
| Hover tooltip shows values | | |
| Legend displays currency amounts | | |
| Funnel view in deal detail works | | |

**Files:** `src/components/deals/DemandProgressBar.tsx`, `src/components/deals/DemandFunnel.tsx`

---

## P2 Flows (Secondary)

### 10. Organizations

| Test | Status | Notes |
|------|--------|-------|
| List page loads | | |
| Detail page loads | | |
| Create organization works | | |
| Edit organization works | | |

### 11. People

| Test | Status | Notes |
|------|--------|-------|
| List page loads | | |
| Detail page loads | | |
| Create person works | | |
| Edit person works | | |

### 12. Internal Entities

| Test | Status | Notes |
|------|--------|-------|
| List page loads | | |
| Detail panel opens | | |
| Entity links display | | |
| Bank accounts show | | |
| Signers list shows | | |

### 13. Tasks

| Test | Status | Notes |
|------|--------|-------|
| List page loads | | |
| Filter by status works | | |
| Filter by assignee works | | |
| Create task works | | |
| Complete task works | | |

### 14. Projects

| Test | Status | Notes |
|------|--------|-------|
| List page loads | | |
| Project detail works | | |

### 15. Events

| Test | Status | Notes |
|------|--------|-------|
| Calendar loads | | |
| Events display | | |
| Create event works | | |

### 16. Vault

| Test | Status | Notes |
|------|--------|-------|
| Vault list loads | | |
| Credential list loads | | |
| Create credential works | | |
| Reveal secret works | | |
| Members management works | | |

### 17. Capital Map

| Test | Status | Notes |
|------|--------|-------|
| Page loads | | |
| Entity hierarchy displays | | |
| Filters work | | |

---

## Guardrails Checklist

### Loading States

- [ ] Dashboard shows skeleton/loading during fetch
- [ ] Deals table shows loading indicator
- [ ] Deal detail shows loading state
- [ ] Documents list shows loading state
- [ ] Modals show loading during submit

### Empty States

- [ ] Deals table shows empty state when no deals
- [ ] Documents list shows empty state
- [ ] Targets section shows empty state
- [ ] Tasks list shows empty state
- [ ] Activity feed shows empty state

### Error Handling

- [ ] API errors show toast notifications
- [ ] Network errors handled gracefully
- [ ] 401/403 redirects to login
- [ ] Form validation errors display inline
- [ ] Error boundary catches render errors

---

## API Contract Issues

| Endpoint | Issue | Severity | Status |
|----------|-------|----------|--------|
| All endpoints | Pending migration blocks all calls | P0 | **FIXED** - Migration run locally |
| /api/entity_links | Route/controller missing | P1 | Missing feature - needs backend implementation |

---

## Bug Triage List

### P0 - Blockers

| Bug | Component | Status | Notes |
|-----|-----------|--------|-------|
| Pending migration blocks all API calls | Backend | **FIXED** | Migration run 2026-01-30 |
| GET /api/deals/:id returns 500 | Backend | **FIXED** | `documents.pluck(:kind)` → `pluck(:doc_type)` in Deal model. Pushed commit 05bfc88. |
| GET /api/blocks returns 500 | `blocks_controller.rb:126` | **FIXED** | `contact.title` → `contact.current_title` |
| GET /api/interests returns 500 | `interests_controller.rb:108` | **FIXED** | `contact.title` → `contact.current_title` |
| Local migration pending | Backend | **FIXED** | `20260130100001_make_document_legacy_fields_nullable.rb` run via psql |

### P1 - High Priority (Missing Error Toasts)

| Bug | Component | Status | Notes |
|-----|-----------|--------|-------|
| No toast on API error | `src/app/page.tsx` | **FIXED** | Dashboard load failure |
| No toast on API error | `src/app/dashboard/page.tsx` | **FIXED** | Dashboard load failure |
| No toast on API error | `src/app/deals/page.tsx` | **FIXED** | Deals load failure |
| No toast on API error | `src/app/deals/[id]/page.tsx` | **FIXED** | Deal detail load failure |
| No toast on status change error | `DealTargetsSection.tsx` | **FIXED** | `handleStatusChange` |
| No toast on notes save error | `DealTargetsSection.tsx` | **FIXED** | `saveNotes` |
| No toast on target delete error | `DealTargetsSection.tsx` | **FIXED** | `handleDelete` |
| No toast on task complete error | `DealTargetsSection.tsx` | **FIXED** | `TaskCheckboxItem` |
| No toast on log event error | `DealTargetsSection.tsx` | **FIXED** | `InlineLogEventForm` |
| No toast on add task error | `DealTargetsSection.tsx` | **FIXED** | `InlineAddTaskForm` |

### P1 - Medium Priority

| Bug | Component | Status | Notes |
|-----|-----------|--------|-------|
| Entity links 404 | `/api/entity_links` | Open | **MISSING FEATURE** - Backend controller doesn't exist. Frontend has full CRUD in `internal-entities-api.ts` |

### P2 - Low Priority (Non-critical error toasts)

| Bug | Component | Status | Notes |
|-----|-----------|--------|-------|
| Missing error toasts | Tasks page & components | Open | Multiple console.error without toast |
| Missing error toasts | Organizations pages | Open | Multiple console.error without toast |
| Missing error toasts | People pages | Open | Multiple console.error without toast |

### P3 - Low Priority

| Bug | Component | Status | Notes |
|-----|-----------|--------|-------|
| Add task inline form needs UI polish | `DealTargetsSection.tsx` | Open | Form layout/styling rough |

---

## Notes

- Backend URL: Set via `NEXT_PUBLIC_API_BASE_URL`
- Session stored in localStorage key: `arrow_session`
- Filter preferences persist in localStorage
- 3 hardcoded users with PIN authentication

---

## Sign-off

- [ ] All P0 flows pass
- [ ] All P1 flows pass
- [ ] Guardrails in place
- [ ] Bug triage complete
- [ ] Ready for production
