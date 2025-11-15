# Create Case Dialog - Visual Guide

## Dialog States

### 1. Initial State (Empty Form)
```
┌─────────────────────────────────────────────────────┐
│ Create New Case                              [X]    │
├─────────────────────────────────────────────────────┤
│                                                      │
│ ┌────────────────────────────────────────────────┐ │
│ │ ✨ Auto-Generation:                            │ │
│ │ • Case ID: Snowflake ID (numeric)              │ │
│ │ • MRN: LSR-{timestamp} (if not provided)       │ │
│ └────────────────────────────────────────────────┘ │
│                                                      │
│ Patient MRN (Auto-generated if empty)               │
│ ┌────────────────────────────────────────────────┐ │
│ │ Leave empty for LSR-{timestamp}                │ │
│ └────────────────────────────────────────────────┘ │
│                                                      │
│ Patient Name (Optional)                              │
│ ┌────────────────────────────────────────────────┐ │
│ │ e.g., John Doe                                 │ │
│ └────────────────────────────────────────────────┘ │
│                                                      │
│ Date of Birth (Optional)                             │
│ ┌────────────────────────────────────────────────┐ │
│ │ [Date Picker]                                  │ │
│ └────────────────────────────────────────────────┘ │
│                                                      │
│                         [ Cancel ]  [ Create Case ] │
└─────────────────────────────────────────────────────┘
```

### 2. Creating State (Loading)
```
┌─────────────────────────────────────────────────────┐
│ Create New Case                              [X]    │
├─────────────────────────────────────────────────────┤
│                                                      │
│ ┌────────────────────────────────────────────────┐ │
│ │ ✨ Auto-Generation:                            │ │
│ │ • Case ID: Snowflake ID (numeric)              │ │
│ │ • MRN: LSR-{timestamp} (if not provided)       │ │
│ └────────────────────────────────────────────────┘ │
│                                                      │
│ Patient MRN (Auto-generated if empty)               │
│ ┌────────────────────────────────────────────────┐ │
│ │ LSR-1699999999999                              │ │
│ └────────────────────────────────────────────────┘ │
│                                                      │
│ Patient Name (Optional)                              │
│ ┌────────────────────────────────────────────────┐ │
│ │ John Doe                                       │ │
│ └────────────────────────────────────────────────┘ │
│                                                      │
│ Date of Birth (Optional)                             │
│ ┌────────────────────────────────────────────────┐ │
│ │ 1990-01-01                                     │ │
│ └────────────────────────────────────────────────┘ │
│                                                      │
│                    [Cancel (disabled)] [Creating...]│
└─────────────────────────────────────────────────────┘
```

### 3. Success State ✅
```
┌─────────────────────────────────────────────────────┐
│ Create New Case                              [X]    │
├─────────────────────────────────────────────────────┤
│ ╔════════════════════════════════════════════════╗ │
│ ║ ✅ Success!                                    ║ │
│ ║    Case created successfully!                  ║ │
│ ║    ID: 1540331008                              ║ │
│ ╚════════════════════════════════════════════════╝ │
│ ^ ANIMATED PULSE - Green border, green background   │
│                                                      │
│ ┌────────────────────────────────────────────────┐ │
│ │ ✨ Auto-Generation:                            │ │
│ │ • Case ID: Snowflake ID (numeric)              │ │
│ │ • MRN: LSR-{timestamp} (if not provided)       │ │
│ └────────────────────────────────────────────────┘ │
│                                                      │
│ Patient MRN (Auto-generated if empty)               │
│ ┌────────────────────────────────────────────────┐ │
│ │ LSR-1699999999999                              │ │
│ └────────────────────────────────────────────────┘ │
│                                                      │
│ Patient Name (Optional)                              │
│ ┌────────────────────────────────────────────────┐ │
│ │ John Doe                                       │ │
│ └────────────────────────────────────────────────┘ │
│                                                      │
│ Date of Birth (Optional)                             │
│ ┌────────────────────────────────────────────────┐ │
│ │ 1990-01-01                                     │ │
│ └────────────────────────────────────────────────┘ │
│                                                      │
│                                          [ Close ]   │
│                                          ^ GREEN     │
└─────────────────────────────────────────────────────┘
```

### 4. Error State ❌
```
┌─────────────────────────────────────────────────────┐
│ Create New Case                              [X]    │
├─────────────────────────────────────────────────────┤
│ ╔════════════════════════════════════════════════╗ │
│ ║ ❌ Error                                       ║ │
│ ║    Failed to create case: Database connection  ║ │
│ ║    timeout                                     ║ │
│ ╚════════════════════════════════════════════════╝ │
│ ^ Red border, red background                         │
│                                                      │
│ ┌────────────────────────────────────────────────┐ │
│ │ ✨ Auto-Generation:                            │ │
│ │ • Case ID: Snowflake ID (numeric)              │ │
│ │ • MRN: LSR-{timestamp} (if not provided)       │ │
│ └────────────────────────────────────────────────┘ │
│                                                      │
│ Patient MRN (Auto-generated if empty)               │
│ ┌────────────────────────────────────────────────┐ │
│ │ LSR-1699999999999                              │ │
│ └────────────────────────────────────────────────┘ │
│                                                      │
│ Patient Name (Optional)                              │
│ ┌────────────────────────────────────────────────┐ │
│ │ John Doe                                       │ │
│ └────────────────────────────────────────────────┘ │
│                                                      │
│ Date of Birth (Optional)                             │
│ ┌────────────────────────────────────────────────┐ │
│ │ 1990-01-01                                     │ │
│ └────────────────────────────────────────────────┘ │
│                                                      │
│                         [ Cancel ]  [ Create Case ] │
└─────────────────────────────────────────────────────┘
```

## Key Visual Features

### Centering
- **Full screen overlay**: `fixed inset-0` covers entire viewport
- **Flexbox centering**: `flex items-center justify-center` centers dialog
- **Responsive**: `p-4` padding prevents edge-to-edge on mobile
- **Max width**: `max-w-md` keeps dialog readable on large screens

### Success Message
- **Color**: Green (#10b981)
- **Border**: 2px solid green border for emphasis
- **Background**: Semi-transparent green (20% opacity)
- **Animation**: Pulse effect to draw attention
- **Icon**: ✅ Large checkmark (text-lg)
- **Layout**: Flexbox with icon and text side-by-side
- **Typography**: Bold "Success!" heading + case ID details

### Error Message
- **Color**: Red (#ef4444)
- **Border**: 2px solid red border for emphasis
- **Background**: Semi-transparent red (20% opacity)
- **Icon**: ❌ Large X mark (text-lg)
- **Layout**: Flexbox with icon and text side-by-side
- **Typography**: Bold "Error" heading + error details

### Button States

#### Normal State
```
[ Cancel ]  [ Create Case ]
  ^ghost      ^blue bg
```

#### Creating State
```
[Cancel (disabled)]  [Creating...]
                      ^blue bg, disabled
```

#### Success State
```
                     [ Close ]
                      ^green bg
```

## Color Palette

### Success (Green)
- Background: `bg-green-500 bg-opacity-20` → rgba(16, 185, 129, 0.2)
- Border: `border-green-500` → #10b981
- Text: `text-green-200` → #a7f3d0
- Button: `bg-green-600` → #059669
- Button Hover: `hover:bg-green-700` → #047857

### Error (Red)
- Background: `bg-red-500 bg-opacity-20` → rgba(239, 68, 68, 0.2)
- Border: `border-red-500` → #ef4444
- Text: `text-red-200` → #fecaca

### Info (Blue)
- Background: `bg-blue-500 bg-opacity-20` → rgba(59, 130, 246, 0.2)
- Border: `border-blue-500/30` → rgba(59, 130, 246, 0.3)
- Text: `text-blue-300` → #93c5fd
- Button: `bg-blue-600` → #2563eb
- Button Hover: `hover:bg-blue-700` → #1d4ed8

### Dialog
- Background: `bg-secondary-dark`
- Border: `border-secondary-light`
- Shadow: `shadow-2xl`

## Responsive Design

### Desktop (> 768px)
- Dialog width: `max-w-md` (448px)
- Centered with padding: `p-4`
- Full form visible

### Mobile (< 768px)
- Dialog adapts to screen width
- Maintains `p-4` padding on all sides
- Form fields stack vertically
- Touch-friendly button sizes

## Animation Details

### Pulse Effect (Success Message)
```css
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: .8;
  }
}
```
- Duration: ~2 seconds
- Infinite loop
- Draws user's attention to success message

### Transitions
- Button hover: `hover:bg-*-700` (smooth color transition)
- Close icon: `hover:text-white transition-colors`

## Accessibility

### Keyboard Navigation
- Tab through form fields
- Enter to submit (when focused on inputs)
- Escape to close (handled by close button)

### Screen Readers
- Semantic HTML structure
- Clear labels for all inputs
- Error/success messages announced
- Button states clearly indicated

### Focus States
- All interactive elements have focus ring
- `focus:outline-none focus:ring-2 focus:ring-blue-500`

## User Flow Diagram

```
┌─────────────┐
│ Open Dialog │
└──────┬──────┘
       │
       v
┌─────────────────┐
│ Fill Form       │
│ (Optional)      │
└──────┬──────────┘
       │
       v
┌─────────────────┐
│ Click "Create"  │
└──────┬──────────┘
       │
       v
┌─────────────────┐
│ Show "Creating" │
│ (Disabled)      │
└──────┬──────────┘
       │
       ├─────────────┐
       │             │
       v             v
┌──────────┐   ┌──────────┐
│ SUCCESS  │   │  ERROR   │
└────┬─────┘   └────┬─────┘
     │              │
     v              v
┌──────────┐   ┌──────────┐
│ Show ✅  │   │ Show ❌  │
│ + Case ID│   │ + Error  │
└────┬─────┘   └────┬─────┘
     │              │
     v              v
┌──────────┐   ┌──────────┐
│ Green    │   │ Can      │
│ "Close"  │   │ Retry    │
└────┬─────┘   └──────────┘
     │
     v
┌──────────┐
│ Reset &  │
│ Close    │
└────┬─────┘
     │
     v
┌──────────┐
│ Refresh  │
│ Case List│
└──────────┘
```

## Testing Scenarios

### Happy Path
1. ✅ Open dialog → centered on screen
2. ✅ Leave all fields empty → auto-generate MRN
3. ✅ Click "Create Case" → shows "Creating..."
4. ✅ Success → shows green pulsing message with case ID
5. ✅ Click green "Close" → dialog closes, list refreshes

### Error Path
1. ✅ Open dialog → centered on screen
2. ✅ Fill in form
3. ✅ Click "Create Case" → shows "Creating..."
4. ✅ API fails → shows red error message
5. ✅ Can retry or cancel

### Edge Cases
1. ✅ Click X while creating → disabled
2. ✅ Click outside dialog → closes (if not creating)
3. ✅ Multiple rapid clicks → prevented by disabled state
4. ✅ Network timeout → shows error message
5. ✅ Very long error message → wraps properly

## Browser Compatibility

- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Performance

- **First Paint**: < 100ms (dialog appears immediately)
- **Animation**: 60fps (CSS animations, hardware accelerated)
- **API Call**: Shows loading state immediately
- **Success/Error**: Updates state without re-render of entire form
