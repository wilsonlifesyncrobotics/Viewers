# LifeSync Case Management Components

**Location:** `extensions/lifesync/src/components/CaseManagement/`
**Purpose:** Reusable case management UI components for the LifeSync surgical platform

---

## Components

### 1. CreateCaseDialog

**Purpose:** Dialog for creating new surgical cases

**File:** `CreateCaseDialog.tsx`

**Features:**
- ✅ Auto-generates Case ID (Snowflake ID)
- ✅ Auto-generates MRN if not provided
- ✅ Optional patient information (name, DOB)
- ✅ Success/error feedback
- ✅ Auto-refresh case list
- ✅ Auto-select newly created case

**Usage:**
```typescript
import { CreateCaseDialog } from '@ohif/extension-lifesync/src/components/CaseManagement';

<CreateCaseDialog
  isOpen={isCreateDialogOpen}
  onClose={() => setIsCreateDialogOpen(false)}
  onCreateCase={async (patientInfo) => {
    const newCase = await caseService.createCase(patientInfo);
    await loadCases(); // Refresh list
    return newCase;
  }}
  servicesManager={servicesManager}
/>
```

**Props:**
```typescript
interface CreateCaseDialogProps {
  isOpen: boolean;                           // Dialog visibility
  onClose: () => void;                       // Close handler
  onCreateCase: (patientInfo: any) => Promise<any>;  // Create handler
  servicesManager?: any;                     // Optional services
}
```

**Patient Info:**
```typescript
{
  mrn?: string;          // Patient MRN (auto-generated if empty)
  name?: string;         // Patient name (optional)
  dateOfBirth?: string;  // Patient DOB (optional)
}
```

---

### 2. EditCaseDialog

**Purpose:** Dialog for editing existing surgical cases

**File:** `EditCaseDialog.tsx`

**Features:**
- ✅ Edit patient information
- ✅ Update case status
- ✅ Only sends changed fields
- ✅ Success/error feedback

**Usage:**
```typescript
import { EditCaseDialog } from '@ohif/extension-lifesync/src/components/CaseManagement';

<EditCaseDialog
  isOpen={isEditDialogOpen}
  caseData={selectedCase}
  onClose={() => setIsEditDialogOpen(false)}
  onUpdate={async (updates) => {
    await caseService.updateCase(selectedCase.caseId, updates);
    await loadCases(); // Refresh list
  }}
/>
```

**Props:**
```typescript
interface EditCaseDialogProps {
  isOpen: boolean;
  caseData: {
    caseId: string;
    patientInfo: {
      mrn: string;
      name?: string;
      dateOfBirth?: string;
    };
    status?: string;
  };
  onClose: () => void;
  onUpdate: (updates: any) => Promise<void>;
}
```

---

## Architecture Benefits

### ✅ Separation of Concerns

**Before:** Case management UI mixed with WorkList platform code
```
platform/app/src/routes/WorkList/
├── WorkList.tsx (2000+ lines)
│   ├── CreateCaseDialog (inline component)
│   ├── EditCaseDialog (imported from extension)
│   └── WorkList logic
```

**After:** Clean separation with LifeSync extension
```
extensions/lifesync/src/components/CaseManagement/
├── CreateCaseDialog.tsx  ← LifeSync-specific
├── EditCaseDialog.tsx    ← LifeSync-specific
└── index.ts

platform/app/src/routes/WorkList/
└── WorkList.tsx
    └── Imports from @lifesync extension
```

### ✅ Reusability

Components can be used in multiple places:
- WorkList page
- Case details page
- Dashboard
- Any other view that needs case management

### ✅ Maintainability

- Single source of truth for case management UI
- Changes apply everywhere automatically
- Easier to test in isolation
- Clear ownership (LifeSync extension)

### ✅ Extensibility

Easy to add more case management components:
- `CaseDetailsPanel.tsx`
- `CaseListView.tsx`
- `CaseSearchDialog.tsx`
- `CaseExportDialog.tsx`

---

## Integration Pattern

### Step 1: Import from Extension
```typescript
import {
  CreateCaseDialog,
  EditCaseDialog
} from '@ohif/extension-lifesync/src/components/CaseManagement';
```

### Step 2: Use in Your Component
```typescript
function MyComponent({ servicesManager }) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const caseService = servicesManager.services.caseService;

  const handleCreateCase = async (patientInfo) => {
    const newCase = await caseService.createCase(patientInfo);
    // Handle success (refresh list, etc.)
    return newCase;
  };

  return (
    <>
      <button onClick={() => setIsCreateOpen(true)}>
        Create Case
      </button>

      <CreateCaseDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreateCase={handleCreateCase}
        servicesManager={servicesManager}
      />
    </>
  );
}
```

---

## Component Communication

### Data Flow

```
User Action
    ↓
Dialog Component (LifeSync Extension)
    ↓
onCreateCase/onUpdate callback
    ↓
CaseService (LifeSync Extension)
    ↓
SyncForge API
    ↓
Database
    ↓
Success Response
    ↓
Refresh UI
```

### Event Handling

**Create Case:**
1. User fills form
2. Dialog validates input
3. Calls `onCreateCase(patientInfo)`
4. Parent component handles API call
5. Dialog shows success message
6. Parent refreshes case list
7. Dialog auto-closes after 1.5s

**Edit Case:**
1. User modifies fields
2. Dialog tracks changes
3. Calls `onUpdate(changes)`
4. Parent component handles API call
5. Dialog shows success/error
6. Parent refreshes case list

---

## Styling

### Design System

Components use OHIF's design tokens:
- `bg-secondary-dark` - Dialog background
- `border-secondary-light` - Borders
- `text-primary-light` - Labels
- `bg-primary-dark` - Input backgrounds

### Color Coding

- **Success:** Green (`bg-green-500`)
- **Error:** Red (`bg-red-500`)
- **Info:** Blue (`bg-blue-500`)
- **Warning:** Yellow (`bg-yellow-500`)

### Responsive

- Mobile-friendly (max-width: 28rem)
- Touch-friendly buttons
- Accessible form inputs

---

## Testing

### Unit Tests (Recommended)

```typescript
describe('CreateCaseDialog', () => {
  it('should call onCreateCase with patient info', async () => {
    const onCreateCase = jest.fn().mockResolvedValue({ caseId: 123 });

    render(
      <CreateCaseDialog
        isOpen={true}
        onClose={jest.fn()}
        onCreateCase={onCreateCase}
      />
    );

    // Fill form
    fireEvent.change(screen.getByLabelText('Patient MRN'), {
      target: { value: 'MRN-001' }
    });

    // Submit
    fireEvent.click(screen.getByText('Create Case'));

    // Assert
    await waitFor(() => {
      expect(onCreateCase).toHaveBeenCalledWith({
        mrn: 'MRN-001',
        name: undefined,
        dateOfBirth: undefined
      });
    });
  });
});
```

---

## Future Enhancements

### Planned Features

1. **Validation:** Add form validation (MRN format, DOB range, etc.)
2. **Templates:** Pre-fill common case types
3. **Bulk Create:** Create multiple cases at once
4. **Import:** Import cases from CSV/Excel
5. **Duplicate:** Clone existing cases
6. **Archive:** Soft delete with restore option

### Integration Ideas

1. **Patient Search:** Search existing patients before creating
2. **DICOM Import:** Auto-create case from DICOM study
3. **Barcode Scanner:** Scan patient wristband for MRN
4. **Voice Input:** Voice-to-text for patient info
5. **AI Suggestions:** Auto-fill based on DICOM metadata

---

## Migration Guide

### For Developers

If you have inline case management dialogs in your code:

**Before:**
```typescript
// Inline component in your file
const CreateCaseDialog = ({ ... }) => { ... };

function MyComponent() {
  return <CreateCaseDialog ... />;
}
```

**After:**
```typescript
// Import from LifeSync extension
import { CreateCaseDialog } from '@ohif/extension-lifesync/src/components/CaseManagement';

function MyComponent() {
  return <CreateCaseDialog ... />;
}
```

**Benefits:**
- ✅ Less code in your component
- ✅ Automatic updates when dialog improves
- ✅ Consistent UI across the platform
- ✅ Easier to maintain

---

## Summary

✅ **CreateCaseDialog** - Create new cases with auto-generation
✅ **EditCaseDialog** - Edit existing cases
✅ **Located in LifeSync extension** - Proper separation of concerns
✅ **Reusable** - Use anywhere in the platform
✅ **Maintainable** - Single source of truth

**All case management UI components are now properly organized in the LifeSync extension!**

---

**Created:** 2025-11-13
**Location:** `extensions/lifesync/src/components/CaseManagement/`
**Exported:** `index.ts`
**Status:** ✅ Production Ready
