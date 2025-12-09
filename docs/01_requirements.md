
# 01_requirements.md - CareFlow Master 2025 (CFM25) Requirements

## 1. Project Overview
**Name:** ケアマネのミカタ 2025 (CareFlow Master 2025)
**Context:** Compliant with 2025 Long-Term Care Insurance Act amendments & Operational Guidance. Focus on BCP, LIFE integration, and audit readiness.

## 2. Target User
Care Managers (Kyotaku Kaigo Shien).

## 3. Core Concepts
*   **Golden Thread Enforcement:** Systemic guarantee of consistency from Assessment to Monitoring.
*   **Defense by Design:** Proactive error prevention for legal date logic (e.g., Assessment <= Draft).
*   **Touch & Talk:** Mobile-first UI optimized for one-handed operation during client visits.
*   **Japanese First Policy:** All UI/UX must use standard Japanese nursing/care terminology preferred by veteran practitioners.

## 4. Functional Requirements
### A. Smart Assessment (Compliance Update v1.1.0)
*   **Standard 23 Items Full Compliance:** The data structure strictly adheres to the "Standard Items for Needs Analysis" (課題分析標準項目) defined by the MHLW.
    *   **Key Additions (v1.1.0):** Distinct input fields for **Skin Condition (皮膚・褥瘡)**, **Oral Hygiene (口腔)**, **Fluid Intake (水分)**, **Dressing (着脱)**, and **Service History (サービス利用状況)**.
*   **Appropriate Care Management Method:** The system supports "Appropriate Care Management Method" (適切なケアマネジメント手法) by suggesting assessment points based on the user's basic disease/condition (Logic Engine).
*   **Summary View:** A holistic view of all 22 specific input items + header info to ensure no data points are missed before planning. Items are numbered 1-22 for clarity.
*   **AI Auto-Assessment (Phase 4):** Automatically maps conversation audio to the structured data (checkboxes/selection), reducing manual input during interviews.
*   **Interview Co-pilot (Phase 4):** Analyzes the conversation to provide real-time suggestions on missing information or recommended follow-up questions.
*   **Real-time Interval Analysis (Phase 5 - Updated v1.2.1):** The system performs AI analysis periodically (polling) during recording.
    *   *Update:* During recording, ONLY structured data (checkboxes) and Advice are updated.
    *   *Update:* The text **Summary (特記事項)** is generated ONLY after the recording is stopped (Final Analysis) to prevent user confusion and duplicate entries.

### B. Care Plan Creation (The Fortress)
*   **Date Logic Lock:** Strict validation: Assessment Date <= Draft Date <= Meeting Date <= Consent Date.
*   **Short-Term Goal Editor:** Ability to add/edit/delete specific short-term goals (Table 2).
*   **AI Suggest:** Refinement of goals towards "Self-Reliance Support" (Jiritsu Shien).
*   **AI Plan Drafter (Phase 7):** Generates a draft of Long/Short term goals based on the completed Assessment data and Care Manager's intent.

### C. Progress Record (Monitoring & SOAP)
*   **Timeline View:** Visual history of monthly monitoring visits.
*   **Goal Tracking:** Direct evaluation (Achieved/In-Progress/Not-Achieved) against the active Care Plan's short-term goals.
*   **Continuity Check:** Explicit decision making on whether to "Continue", "Modify", or "End" the current plan.
*   Structured S/O/A/P input.

### D. Hospitality & Risk Management
*   **Life History Card:** Visualization of hobbies, NG words, and background.
*   **Medical Alert System:** Critical medical info (Pacemakers, Allergies, Infections) must be visible immediately via visual badges in the header or top section.

### E. Global Menu & Settings (The Demo Experience)
*   **Accessibility Control:** Toggle for "Large Text" mode to support older care managers.
*   **Data Reset:** Ability to restore the demo environment to its initial clean state.
*   **Print Preview:** Mock functionality to demonstrate form output capabilities.

## 5. Non-Functional Requirements
*   Mobile First (Tablet optimized).
*   Offline capability (PWA architecture).
*   High contrast / Dark mode support.

## 6. Demonstration Policy & Privacy
*   **Anonymity:** All data displayed in this application must be strictly fictional (dummy data). No real patient/client data shall be used during development or demonstration.
*   **Visual Indicators:** The UI must prominently display that it is a "Demo Version" to prevent confusion with production medical systems.

## 7. Expert Review Feedback (Veteran Care Manager)
> "The 'Golden Thread' enforcement is excellent. However, the assessment was too simple. **It is critical to cover all 23 Standard Items** (e.g., Communication, Residence, Special Situations) to pass audits (運営指導). Also, refer to the 'Appropriate Care Management Method' for logical consistency."

## 8. Phase 2 Review Feedback
> "Tabs are good for input, but I lost the 'Whole Picture'. I need a summary view. Also, buttons are not enough for complex medical history. I need to type details."

## 9. Phase 4 Request (Integration)
> "I want the system to check the boxes automatically based on the recording so I can focus on Eye Contact. Also, give me advice if I miss something."

## 10. Phase 5 Real-time Update
> "I need the advice *during* the conversation, not after. Please enable periodic AI checks (e.g., every 5 minutes) to guide me while I'm still at the client's home."

## 11. Phase 6 Compliance Fix
> "There are missing items from the 23 Standards (Skin, Oral, Fluid, Dressing, Service History). These must be added for legal compliance." (Implemented in v1.1.0)

## 12. Phase 7 AI Drafter Feedback
> "AI needs to draft the plan based on the assessment, but human review is mandatory. Don't let it overwrite data without confirmation." (Implemented in v1.2.0)
