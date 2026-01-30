# Arrow CRM - Smoke Test Checklist

A quick checklist to verify error handling and core functionality after deployment.

## Error Boundary Test

1. **Trigger Error Boundary** (Dev only)
   - Open browser console and run: `window.__triggerError()`
   - Or temporarily add `throw new Error('test')` to a component
   - **Expected**: "Something went wrong" page appears
   - **Verify**: "Reload Page" button works
   - **Verify**: "Copy Error Details" copies structured error info

## API Error Handling Tests

### Deals
1. Create a new deal with invalid data (empty name)
   - **Expected**: Toast notification appears: "Couldn't create deal"
   - **Expected**: Error message from server is displayed

2. Edit a deal and save
   - **Expected**: Success toast on save
   - **Expected**: If server error, toast shows "Couldn't save deal"

### Blocks
1. Navigate to a deal and create a new block
   - **Expected**: Success toast on create
   - **Expected**: If validation error, toast shows "Couldn't create block" with server message

2. Delete a block
   - **Expected**: Confirmation prompt appears
   - **Expected**: Success toast on delete

### Interests
1. Add an interest to a deal
   - **Expected**: Success toast on create

2. Update interest status/amount
   - **Expected**: Changes save, success toast appears

### Tasks
1. Create a new task from the Tasks page
   - **Expected**: Success toast on create

2. Complete/uncomplete a task
   - **Expected**: Task toggles with visual feedback

### Documents
1. Upload a document
   - **Expected**: Upload progress indicator
   - **Expected**: Success toast when complete
   - **Expected**: If upload fails, toast shows "Couldn't create document"

2. Edit document metadata (title, category, etc.)
   - **Expected**: Changes save inline
   - **Expected**: Toast on error with rollback

## Network Error Simulation

1. In DevTools Network tab, set "Offline" mode
2. Try to save any entity
3. **Expected**: Toast shows error message (not silent failure)
4. **Expected**: No unhandled promise rejection in console

## Console Verification

After running tests, check browser console:
- **Development**: Should see `[API Error]` logs with structured details
- **Production**: No sensitive error details exposed
- **No unhandled promise rejections**

## Quick Validation Script

```javascript
// Run in browser console on any page
(async () => {
  console.log('Testing error handling...');

  // This should trigger a 404 and show a toast
  try {
    const res = await fetch('/api/nonexistent-endpoint');
    console.log('Status:', res.status);
  } catch (e) {
    console.log('Network error:', e);
  }

  console.log('Done - check for toast notification');
})();
```

## Expected Behavior Summary

| Scenario | User Sees | Console (Dev) |
|----------|-----------|---------------|
| API 4xx error | Toast with server message | `[API Error]` log |
| API 5xx error | Toast "An unexpected error occurred" | `[API Error]` log |
| Network error | Toast with error message | `[API Error]` log |
| Component crash | Error boundary UI | `[ErrorBoundary]` log |

---

Last updated: January 2026
