# 05_ui_ux_guidelines.md - UI/UX Guidelines

## 1. Design Philosophy: "Touch & Talk"
*   **Target Device:** iPad mini / Smartphone (Portrait mode).
*   **Interaction:** Primary input via large touch targets (Buttons). Secondary input via Voice. Keyboard is last resort.
*   **Japanese First:** All labels must use standard Japanese care terminology (e.g., "排泄" instead of "Toileting").

## 2. Standard 23 Items Assessment UI Strategy
To accommodate the mandatory 23 items defined by the MHLW without overwhelming the user on a small screen, we adopt a **Categorized Tab Navigation** strategy.

### Categories (Tabs)
1.  **健康・基本 (Health & Basic)**
2.  **生活機能 (ADL/IADL)**
3.  **認知・精神 (Mental)**
4.  **社会・環境 (Social & Env)**
5.  **全体サマリー (Summary)** - *New in Phase 3*

### Hybrid Input Component (New in Phase 3)
*   **Structure:**
    *   **Quick Options:** 4-6 large buttons for common states (e.g., "Independent", "Partial Assist").
    *   **Detail Input:** A text area or input field below the buttons to capture specifics (e.g., "Left side paralysis", "Dr. Sato at ... Hospital").
*   **Behavior:** The text area expands when "Other" or specific complex options are selected, but remains accessible for manual override.

## 3. Visual Hierarchy
*   **Primary Action:** Blue / High saturation.
*   **Destructive Action:** Red.
*   **Information/Read-only:** Stone/Gray.
*   **Alerts:** Amber/Red backgrounds with icons.
*   **Logic Suggestions:** Indigo/Purple backgrounds (indicating AI/System intelligence).

## 4. Accessibility
*   **Font Size:** Minimum 16px for body text.
*   **Contrast:** WCAG AA standard compliant (Text vs Background).
*   **Touch Target:** Minimum 44x44px.