# 04_business_logic.md - Compliance Logic

## 1. The "Golden Thread" Date Validation
In the 2025 operational guidance, the sequence of dates is audited strictly.

**Rule:**
`Assessment Date` ≦ `Draft Creation Date` ≦ `Service Meeting Date` ≦ `User Consent Date` ≦ `Plan Delivery Date`

*   **Error Level (Red):** Blocking. Cannot switch status to "Active".
    *   Ex: Meeting Date is before Draft Date.
*   **Warning Level (Yellow):** Allow with justification, but flag.
    *   Ex: Assessment Date is > 30 days old (Stale data).

## 2. Monitoring Logic
*   **Frequency:** Monitoring must occur at least once per calendar month (Operating Standard Article 13-13).
*   **Goal Linkage:** Monitoring records must explicitly reference the status of Short-Term Goals defined in the active Care Plan.
*   **Continuity:** If goals are "Achieved" or the user's condition changes significantly (e.g., Hospitalization), a "Plan Revision" suggestion must be triggered.

## 3. Appropriate Care Management Method (Logic Engine)
The system suggests assessment focus points based on key indicators (Disease, Condition).

### Rules Definition
*   **Condition: Cerebrovascular Disease (脳血管疾患)**
    *   **Suggestion:** Check for paralysis (hemiplegia), dysphagia (swallowing), and risk of recurrence (BP control).
    *   **Domain:** Health / ADL.
*   **Condition: Dementia (認知症)**
    *   **Suggestion:** Check for BPSD (wandering, fire risks), medication compliance, and family caregiver burden.
    *   **Domain:** Mental / Social.
*   **Condition: Heavy ADL Assistance (Toileting/Bathing)**
    *   **Suggestion:** Check for skin conditions (pressure ulcers/bedsores) and burden on caregivers.
    *   **Domain:** Health / Social.
*   **Condition: Living Alone + Poor IADL**
    *   **Suggestion:** Check for malnutrition risk, emergency contact availability, and social isolation.
    *   **Domain:** Social / IADL.

## 4. Privacy & Hospitality
*   "NG Words" (Topics to avoid) are highlighted in the UI whenever a care manager opens the record, ensuring psychological safety for the client.