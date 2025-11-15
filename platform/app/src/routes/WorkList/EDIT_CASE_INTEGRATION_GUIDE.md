# Edit Case Integration Guide for WorkList

## Overview

This guide shows how to add edit functionality to the case list page, allowing users to edit patient information like MRN, name, date of birth, and case status.

**Component Location**: `extensions/lifesync/src/components/CaseManagement/EditCaseDialog.tsx`

> **Note**: This is a LifeSync-specific component and is located in the lifesync extension, not in the core OHIF platform.

---

## Step 1: Import EditCaseDialog

In `WorkList.tsx`, add the import from the lifesync extension:

```typescript
import { EditCaseDialog } from '@ohif/extension-lifesync/src/components/CaseManagement';
```

Or if the extension exports are configured:

```typescript
import { EditCaseDialog } from '@ohif/extension-lifesync';
```

---

## Step 2: Add State Management

Add state for managing the edit dialog in the `WorkListCaseSelector` or main `WorkList` component:

```typescript
const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
const [selectedCase, setSelectedCase] = React.useState(null);
```

---

## Step 3: Add Edit Handler Function

```typescript
const handleEditCase = (caseItem) => {
  setSelectedCase(caseItem);
  setIsEditDialogOpen(true);
};

const handleUpdateCase = async (caseId, updates) => {
  if (!caseService) return;

  try {
    await caseService.updateCase(caseId, updates);
    await loadCases(); // Reload case list
    console.log(`✅ Case ${caseId} updated successfully`);
  } catch (error) {
    console.error('Failed to update case:', error);
    throw error; // Re-throw so EditCaseDialog can show error
  }
};
```

---

## Step 4: Add Edit Button to Case Row

In the `createTableDataSource` function where case rows are created, add an Edit button next to the Delete button:

```typescript
{
  key: 'actions',
  content: (
    <div className="flex items-center gap-2">
      {/* Add Study Button */}
      <button
        onClick={async (e) => {
          e.stopPropagation();
          // ... existing add study logic ...
        }}
        className="hover:bg-green-900/50 flex items-center gap-1 rounded border border-green-500/30 bg-green-900/20 px-2 py-1 transition-colors"
        title="Add Study to Case"
      >
        <Icons.Add className="h-4 w-4 text-green-400" />
        <span className="text-xs text-green-300">Add Study</span>
      </button>

      {/* NEW: Edit Button */}
      <button
        onClick={async (e) => {
          e.stopPropagation();
          handleEditCase(caseItem);
        }}
        className="hover:bg-blue-900/50 flex items-center gap-1 rounded border border-blue-500/30 bg-blue-900/20 px-2 py-1 transition-colors"
        title="Edit Case"
      >
        <Icons.Settings className="h-4 w-4 text-blue-400" />
        <span className="text-xs text-blue-300">Edit</span>
      </button>

      {/* Delete Button */}
      <button
        onClick={async (e) => {
          e.stopPropagation();
          // ... existing delete logic ...
        }}
        className="hover:bg-red-900/50 flex items-center gap-1 rounded border border-red-500/30 bg-red-900/20 px-2 py-1 transition-colors"
        title="Delete Case"
      >
        <Icons.Cancel className="h-4 w-4 text-red-400" />
        <span className="text-xs text-red-300">Delete</span>
      </button>
    </div>
  ),
  gridCol: 4,  // Increase from 3 to accommodate edit button
},
```

---

## Step 5: Add EditCaseDialog Component

At the end of your component's JSX (next to CreateCaseDialog):

```typescript
return (
  <>
    {/* Existing content */}
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

    {/* NEW: EditCaseDialog */}
    <EditCaseDialog
      isOpen={isEditDialogOpen}
      caseData={selectedCase}
      onClose={() => setIsEditDialogOpen(false)}
      onUpdate={(updates) => handleUpdateCase(selectedCase.caseId, updates)}
    />
  </>
);
```

---

## Step 6: Alternative - Add Edit Menu to Row Click

Instead of a separate button, you could add an edit option to a context menu:

```typescript
const handleCaseRowClick = (caseItem, event) => {
  // If right-click, show context menu
  if (event.button === 2) {
    event.preventDefault();
    showContextMenu(caseItem, event.clientX, event.clientY);
  } else {
    // Left-click expands the row
    handleCaseExpansion(caseItem.caseId, !isCaseExpanded);
  }
};
```

---

## API Reference

### PUT /api/cases/:caseId

**Request Body:**
```json
{
  "patientInfo": {
    "mrn": "NEW-MRN-123",
    "name": "John Doe",
    "dateOfBirth": "1980-01-01"
  },
  "status": "planned"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Case updated successfully",
  "case": {
    "caseId": "7234567890123456789",
    "patientInfo": {
      "mrn": "NEW-MRN-123",
      "name": "John Doe",
      "dateOfBirth": "1980-01-01"
    },
    "status": "planned",
    "studyCount": 2,
    "createdAt": "2025-11-14T00:00:00.000Z",
    "updatedAt": "2025-11-14T01:30:00.000Z"
  }
}
```

---

## Frontend CaseService Usage

```typescript
import { servicesManager } from '@ohif/core';

const caseService = servicesManager.services.caseService;

// Update case
try {
  const updatedCase = await caseService.updateCase(
    caseId,
    {
      patientInfo: {
        mrn: 'NEW-MRN',
        name: 'Updated Name'
      },
      status: 'planned'
    }
  );

  console.log('Updated:', updatedCase);
} catch (error) {
  console.error('Update failed:', error.message);
}
```

---

## Updatable Fields

| Field | Type | Description | Stored in DB |
|-------|------|-------------|--------------|
| `patientInfo.mrn` | String | Patient MRN | ✅ Yes (patient_mrn) |
| `patientInfo.name` | String | Patient name | ❌ Not yet (returned only) |
| `patientInfo.dateOfBirth` | String | Date of birth | ❌ Not yet (returned only) |
| `status` | String | Case status | ✅ Yes |

**Note**: Currently only MRN and status are stored in the database. Name and DOB are returned but not persisted.

---

## Status Values

Valid status values:
- `created` - Initial state
- `planned` - Planning complete
- `registered` - Registration complete
- `in_progress` - Surgery in progress
- `completed` - Surgery completed
- `archived` - Case archived

---

## Example: Complete Integration

```typescript
// WorkList.tsx or WorkListCaseSelector component

import React from 'react';
import { EditCaseDialog } from '@ohif/extension-lifesync/src/components/CaseManagement';

function WorkListCaseSelector({ servicesManager, viewMode, setViewMode, cases, loadingCases }) {
  const [localCases, setLocalCases] = React.useState([]);
  const [activeCaseId, setActiveCaseId] = React.useState(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [selectedCase, setSelectedCase] = React.useState(null);

  const caseService = servicesManager?.services?.caseService;

  const loadCases = async () => {
    if (!caseService) return;
    try {
      const fetchedCases = await caseService.getCases();
      setLocalCases(fetchedCases);
    } catch (err) {
      console.warn('Failed to load cases:', err);
    }
  };

  const handleEditCase = (caseItem) => {
    setSelectedCase(caseItem);
    setIsEditDialogOpen(true);
  };

  const handleUpdateCase = async (updates) => {
    if (!caseService || !selectedCase) return;

    try {
      await caseService.updateCase(selectedCase.caseId, updates);
      await loadCases(); // Reload cases
      console.log(`✅ Case ${selectedCase.caseId} updated`);
    } catch (error) {
      console.error('Failed to update case:', error);
      throw error;
    }
  };

  return (
    <>
      {/* Your existing case list UI */}

      <EditCaseDialog
        isOpen={isEditDialogOpen}
        caseData={selectedCase}
        onClose={() => setIsEditDialogOpen(false)}
        onUpdate={handleUpdateCase}
      />
    </>
  );
}
```

---

## Testing the Integration

1. **Restart Backend** (to use updated handleUpdateCase):
   ```bash
   cd AsclepiusPrototype/00_SyncForgeAPI/api
   node server.js
   ```

2. **Restart Frontend**:
   ```bash
   cd Viewers
   yarn dev
   ```

3. **Test Edit Flow**:
   - Go to Case List
   - Click "Edit" button on a case
   - Modify patient information
   - Click "Update Case"
   - Verify changes appear in case list

---

## Error Handling

```typescript
const handleUpdateCase = async (updates) => {
  try {
    await caseService.updateCase(selectedCase.caseId, updates);
    await loadCases();
  } catch (error) {
    if (error.message.includes('not found')) {
      alert('Case not found. It may have been deleted.');
    } else {
      alert(`Failed to update case: ${error.message}`);
    }
    throw error; // Let EditCaseDialog show error too
  }
};
```

---

## UI Preview

```
┌─────────────────────────────────────┐
│  Edit Case                     ✕    │
├─────────────────────────────────────┤
│  ℹ️ Editing Case: 723456789...     │
│  Only modified fields will be       │
│  updated                            │
├─────────────────────────────────────┤
│  Patient MRN                        │
│  ┌──────────────────────────────┐  │
│  │ MRN-12345                    │  │
│  └──────────────────────────────┘  │
│                                     │
│  Patient Name                       │
│  ┌──────────────────────────────┐  │
│  │ John Doe                     │  │
│  └──────────────────────────────┘  │
│                                     │
│  Date of Birth                      │
│  ┌──────────────────────────────┐  │
│  │ 1980-01-01                   │  │
│  └──────────────────────────────┘  │
│                                     │
│  Status                             │
│  ┌──────────────────────────────┐  │
│  │ [v] Planned                  │  │
│  └──────────────────────────────┘  │
│                                     │
│          [Cancel]  [Update Case]    │
└─────────────────────────────────────┘
```

---

## Next Steps

1. Add the EditCaseDialog component
2. Integrate into WorkList with edit button
3. Test the functionality
4. Consider adding more fields (if needed):
   - Surgeon name
   - Surgery date
   - Procedure type
   - Notes

---

**Status**: ✅ Ready to integrate
**API**: ✅ Tested and working
**Component**: ✅ Created
**Documentation**: ✅ Complete
