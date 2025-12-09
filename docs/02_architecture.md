# 02_architecture.md - System Architecture

## 1. Tech Stack
*   **Frontend:** React 18+ (TypeScript)
*   **Styling:** Tailwind CSS (Utility-first for rapid mobile adaptation)
*   **State Management:** React Context API + Hooks (Simple, maintainable for SPA)
*   **AI Integration:** Google Gemini API (via @google/genai) for text summarization, goal refinement, and real-time audio analysis.

## 2. Design Pattern: "Defense by Design"
The system utilizes a client-side "Compliance Layer" (`services/complianceService.ts`) that intercepts all save actions. This layer validates the "Golden Thread" (date consistency) before data touches the persistence layer.

## 3. Component Structure
*   `services/`: Pure TS logic for compliance and API calls.
*   `components/`: Reusable UI parts (Buttons, Cards).
*   `views/`: Business logic aggregates (Assessment View, Plan View).

## 4. PWA Readiness
Designed with offline-first capabilities in mind (local storage sync patterns would be implemented here in production).

## 5. Real-time Analysis Architecture (Phase 5)
*   **Polling Strategy:** The `TouchAssessment` component implements an interval-based recorder that slices audio chunks (blobs) without stopping the MediaRecorder stream.
*   **Context Injection:** Each API call includes the *current* JSON state of the assessment. This allows the AI (Gemini) to perform "Differential Updates" (Auto-Mapping) and provide "Context-Aware Advice" (Co-pilot) that evolves as the interview progresses.

## 6. Generative Care Plan Architecture (Phase 7)
*   **Context-Aware Generation:** The `generateCarePlanDraft` function aggregates:
    1.  **Structured Assessment Data:** The full 23-item JSON to ensure physical/mental constraints are respected.
    2.  **Manager's Intent:** A free-text instruction string to steer the direction (e.g., "Focus on family respite").
*   **Prompt Logic:** The Gemini model acts as a "Senior Care Manager" to translate raw data + intent into formal "Long-term" and "Short-term" goals adhering to 2025 standards (Self-Reliance Support).