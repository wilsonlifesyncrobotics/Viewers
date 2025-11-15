# How to Add Edit Button to Case List

## Quick Integration Guide

Follow these steps to add the Edit Case functionality to the WorkList:

---

## Step 1: Add Import

At the top of `WorkList.tsx`, add:

```typescript
import { EditCaseDialog } from '@ohif/extension-lifesync/src/components/CaseManagement';
```

Add this after line 38, with the other imports.

---

## Step 2: Add State to WorkListCaseSelector

Find the `WorkListCaseSelector` component (around line 171) and add these state variables:

```typescript
const WorkListCaseSelector = ({ servicesManager, viewMode, setViewMode, cases, loadingCases }) => {
  const [localCases, setLocalCases] = React.useState([]);
  const [activeCaseId, setActiveCaseId] = React.useState(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);

  // ADD THESE TWO LINES:
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [selectedCase, setSelectedCase] = React.useState(null);

  const caseService = servicesManager?.services?.caseService;
```

---

## Step 3: Add Handler Function

Add this function inside `WorkListCaseSelector`, after the `loadCases` function:

```typescript
const handleUpdateCase = async (updates) => {
  if (!caseService || !selectedCase) return;

  try {
    await caseService.updateCase(selectedCase.caseId, updates);
    await loadCases(); // Reload cases list
    console.log(`✅ Case ${selectedCase.caseId} updated successfully`);
  } catch (err) {
    console.error('Failed to update case:', err);
    throw err; // Let EditCaseDialog show the error
  }
};
```

---

## Step 4: Add Edit Button

Find the "actions" section in the case row (around line 873-929). Add the Edit button between the "Add Study" button and the "Delete" button:

**BEFORE:**
```typescript
{
  key: 'actions',
  content: (
    <div className="flex items-center gap-2">
      {/* Add Study button */}
      <button
        onClick={...}
        className="hover:bg-green-900/50 flex items-center gap-1 rounded border border-green-500/30 bg-green-900/20 px-2 py-1 transition-colors"
        title="Add Study to Case"
      >
        <Icons.Add className="h-4 w-4 text-green-400" />
        <span className="text-xs text-green-300">Add Study</span>
      </button>

      {/* Delete button */}
      <button
        onClick={...}
        className="hover:bg-red-900/50 flex items-center gap-1 rounded border border-red-500/30 bg-red-900/20 px-2 py-1 transition-colors"
        title="Delete Case"
      >
        <Icons.Cancel className="h-4 w-4 text-red-400" />
        <span className="text-xs text-red-300">Delete</span>
      </button>
    </div>
  ),
  gridCol: 3,
},
```

**AFTER (with Edit button added):**
```typescript
{
  key: 'actions',
  content: (
    <div className="flex items-center gap-2">
      {/* Add Study button */}
      <button
        onClick={async (e) => {
          e.stopPropagation();
          setAddStudyToCaseId(caseItem.caseId);
          setShowAddStudyModal(true);
          setLoadingOrthancStudies(true);

          try {
            if (caseService) {
              const studies = await caseService.getAllOrthancStudies();
              setOrthancStudies(studies);
            }
          } catch (err) {
            console.error('Failed to load Orthanc studies:', err);
            alert('Failed to load studies from Orthanc');
          } finally {
            setLoadingOrthancStudies(false);
          }
        }}
        className="hover:bg-green-900/50 flex items-center gap-1 rounded border border-green-500/30 bg-green-900/20 px-2 py-1 transition-colors"
        title="Add Study to Case"
      >
        <Icons.Add className="h-4 w-4 text-green-400" />
        <span className="text-xs text-green-300">Add Study</span>
      </button>

      {/* NEW: Edit button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setSelectedCase(caseItem);
          setIsEditDialogOpen(true);
        }}
        className="hover:bg-blue-900/50 flex items-center gap-1 rounded border border-blue-500/30 bg-blue-900/20 px-2 py-1 transition-colors"
        title="Edit Case"
      >
        <Icons.Settings className="h-4 w-4 text-blue-400" />
        <span className="text-xs text-blue-300">Edit</span>
      </button>

      {/* Delete button */}
      <button
        onClick={async (e) => {
          e.stopPropagation();

          if (!confirm(`Delete case "${caseItem.caseId}"?\n\nThis will also delete ${caseItem.studyCount} enrolled study/studies.\n\nThis action cannot be undone.`)) {
            return;
          }

          try {
            if (caseService) {
              await caseService.deleteCase(caseItem.caseId);
              await loadCases();
              console.log(`✅ Case ${caseItem.caseId} deleted`);
            }
          } catch (err) {
            console.error('Failed to delete case:', err);
            alert(`Failed to delete case: ${err.message}`);
          }
        }}
        className="hover:bg-red-900/50 flex items-center gap-1 rounded border border-red-500/30 bg-red-900/20 px-2 py-1 transition-colors"
        title="Delete Case"
      >
        <Icons.Cancel className="h-4 w-4 text-red-400" />
        <span className="text-xs text-red-300">Delete</span>
      </button>
    </div>
  ),
  gridCol: 4,  // CHANGE FROM 3 to 4 to accommodate the new button
},
```

---

## Step 5: Add EditCaseDialog Component

Find where `CreateCaseDialog` is rendered (around line 260-280 in `WorkListCaseSelector`). Add the `EditCaseDialog` right after it:

```typescript
return (
  <>
    {/* Header with Create Case button */}
    <div className="flex items-center gap-4 px-4">
      {/* ... existing header content ... */}
    </div>

    {/* Existing CreateCaseDialog */}
    <CreateCaseDialog
      isOpen={isCreateDialogOpen}
      onClose={() => setIsCreateDialogOpen(false)}
      onCreateCase={handleCreateCase}
      servicesManager={servicesManager}
    />

    {/* NEW: Add EditCaseDialog */}
    <EditCaseDialog
      isOpen={isEditDialogOpen}
      caseData={selectedCase}
      onClose={() => setIsEditDialogOpen(false)}
      onUpdate={handleUpdateCase}
    />

    {/* ... rest of the component ... */}
  </>
);
```

---

## Complete Code Changes Summary

### 1. Import (at top of file)
```typescript
import { EditCaseDialog } from '@ohif/extension-lifesync/src/components/CaseManagement';
```

### 2. State (in WorkListCaseSelector)
```typescript
const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
const [selectedCase, setSelectedCase] = React.useState(null);
```

### 3. Handler (in WorkListCaseSelector)
```typescript
const handleUpdateCase = async (updates) => {
  if (!caseService || !selectedCase) return;
  try {
    await caseService.updateCase(selectedCase.caseId, updates);
    await loadCases();
    console.log(`✅ Case ${selectedCase.caseId} updated successfully`);
  } catch (err) {
    console.error('Failed to update case:', err);
    throw err;
  }
};
```

### 4. Edit Button (in actions section)
```typescript
<button
  onClick={(e) => {
    e.stopPropagation();
    setSelectedCase(caseItem);
    setIsEditDialogOpen(true);
  }}
  className="hover:bg-blue-900/50 flex items-center gap-1 rounded border border-blue-500/30 bg-blue-900/20 px-2 py-1 transition-colors"
  title="Edit Case"
>
  <Icons.Settings className="h-4 w-4 text-blue-400" />
  <span className="text-xs text-blue-300">Edit</span>
</button>
```

### 5. Dialog Component (in JSX return)
```typescript
<EditCaseDialog
  isOpen={isEditDialogOpen}
  caseData={selectedCase}
  onClose={() => setIsEditDialogOpen(false)}
  onUpdate={handleUpdateCase}
/>
```

---

## Testing

1. **Restart the frontend**:
   ```bash
   cd Viewers
   yarn dev
   ```

2. **Go to the Study List** (case list view)

3. **Find a case row** - you should see three buttons:
   - 🟢 **Add Study** (green)
   - 🔵 **Edit** (blue) ← NEW!
   - 🔴 **Delete** (red)

4. **Click the Edit button** - the EditCaseDialog should open

5. **Edit case information**:
   - Change patient MRN
   - Change patient name
   - Change case status
   - Click "Update Case"

6. **Verify** the case list refreshes with updated information

---

## Visual Preview

```
┌─────────────────────────────────────────────────────────────────┐
│ Case: 7234567890... │ MRN: LSR-123 │ 2 studies │ [Buttons]     │
└─────────────────────────────────────────────────────────────────┘
                                                     │
                                                     ▼
                          ┌──────────────────────────────┐
                          │ [+ Add] [⚙ Edit] [✕ Delete] │
                          └──────────────────────────────┘
                                      │
                                      │ Click Edit
                                      ▼
                          ┌────────────────────────┐
                          │  Edit Case          ✕  │
                          ├────────────────────────┤
                          │ Patient MRN            │
                          │ ┌──────────────────┐  │
                          │ │ LSR-123          │  │
                          │ └──────────────────┘  │
                          │                        │
                          │ Patient Name           │
                          │ ┌──────────────────┐  │
                          │ │ John Doe         │  │
                          │ └──────────────────┘  │
                          │                        │
                          │ Status                 │
                          │ ┌──────────────────┐  │
                          │ │ [v] Planned      │  │
                          │ └──────────────────┘  │
                          │                        │
                          │   [Cancel] [Update]    │
                          └────────────────────────┘
```

---

## Troubleshooting

### Edit button not appearing
- Check that you added the button in the correct location (line ~900)
- Verify `gridCol` changed from 3 to 4
- Check browser console for errors

### Dialog not opening
- Verify state variables are added
- Check that `selectedCase` is being set
- Verify import path is correct

### Update not working
- Check `handleUpdateCase` function is defined
- Verify `caseService.updateCase()` is being called
- Check browser console for API errors
- Verify backend API is running

---

**Ready to integrate!** Follow these 5 steps and you'll have edit functionality in your case list! 🎯
