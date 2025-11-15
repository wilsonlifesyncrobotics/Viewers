# Edit Button - Quick Reference

Copy and paste these code snippets into `WorkList.tsx`

---

## 1. Import (Line ~38)

```typescript
import { EditCaseDialog } from '@ohif/extension-lifesync/src/components/CaseManagement';
```

---

## 2. State Variables (Line ~171, in WorkListCaseSelector)

```typescript
const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
const [selectedCase, setSelectedCase] = React.useState(null);
```

---

## 3. Handler Function (After loadCases function)

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

---

## 4. Edit Button (Insert after "Add Study" button, before "Delete" button, Line ~900)

```typescript
{/* Edit button */}
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

**IMPORTANT:** Change `gridCol: 3` to `gridCol: 4` in the actions section!

---

## 5. Dialog Component (After CreateCaseDialog, Line ~260)

```typescript
<EditCaseDialog
  isOpen={isEditDialogOpen}
  caseData={selectedCase}
  onClose={() => setIsEditDialogOpen(false)}
  onUpdate={handleUpdateCase}
/>
```

---

## Done! 🎉

Test by:
1. Restarting frontend: `yarn dev`
2. Go to Study List
3. Click blue "Edit" button on any case
4. Modify information
5. Click "Update Case"
