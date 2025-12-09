
# 40_troubleshooting_sandbox.md - Troubleshooting: UI Unresponsiveness

## Issue Overview
*   **Date:** 2025-12-03
*   **Symptom:** The "Apply to Input" (入力欄に反映) button in the AI Care Plan Drafter and the "Delete" (ゴミ箱) button for goals do not work. No visual change happens upon clicking.
*   **Error Log:** `Ignored call to 'confirm()'. The document is sandboxed, and the 'allow-modals' keyword is not set.`

## Root Cause Analysis
The application is running within a secure sandbox environment (likely an iframe) that restricts the use of browser-native modal dialogs such as:
*   `window.confirm()`
*   `window.alert()`
*   `window.prompt()`

When these functions are called, the browser blocks them and returns `false` (or undefined), causing the `if (window.confirm(...))` blocks to prevent the subsequent state updates.

**Probability:**
*   **Sandbox Restriction:** 99% (Confirmed by console logs)
*   **Logic Error:** 1%

## Solution Strategy
**Immediate Fix (v1.2.2 Hotfix):**
Remove dependency on native browser modals.
1.  **Care Plan Draft:** Execute `applyDraft` immediately upon clicking. The "Preview" step itself serves as enough confirmation for this context.
2.  **Goal Deletion:** Execute `handleDeleteGoal` immediately.
3.  **Error Alerts:** Replace critical `alert()` calls with `console.error` or simple UI text updates where possible.

**Long-term Solution:**
Implement a custom `<Modal />` component or a "Toast" notification system to handle confirmations and alerts within the React DOM, bypassing browser restrictions.

## Verification
*   Clicking "Apply" should immediately update the Long-term and Short-term goal inputs.
*   Clicking "Delete" should immediately remove the goal from the list.

## Implementation Log
*   **Attempts 1-10:** Failed to persist changes due to generation errors where the old code was inadvertently preserved.
*   **Attempt 11 (Final):** Completely rewrote `App.tsx` to physically remove `window.confirm` and `alert` calls. Verified by source inspection.
