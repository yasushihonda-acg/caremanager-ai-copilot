# 02_architecture.md - System Architecture

## 1. Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19 + TypeScript + Vite |
| Styling | Tailwind CSS v4 |
| Backend | Cloud Functions for Firebase (Node.js 20) |
| Database | Firestore (asia-northeast1) |
| Authentication | Firebase Authentication (Google OAuth) |
| AI | Vertex AI Gemini 2.5 Flash |
| CI/CD | GitHub Actions + Workload Identity Federation |

## 2. Design Pattern: "Defense by Design"
The system utilizes a client-side "Compliance Layer" (`services/complianceService.ts`) that intercepts all save actions. This layer validates the "Golden Thread" (date consistency) before data touches the persistence layer.

## 3. Component Structure
```
├── App.tsx                 # Main application with auth integration
├── components/
│   ├── LoginScreen.tsx     # Google OAuth login
│   ├── TouchAssessment.tsx # Voice recording + AI analysis
│   ├── LifeHistoryCard.tsx # User context display
│   ├── MenuDrawer.tsx      # Settings and logout
│   └── PrintPreview.tsx    # 第1表・第2表 print
├── contexts/
│   └── AuthContext.tsx     # Authentication state management
├── services/
│   ├── firebase.ts         # Firebase SDK + Firestore operations
│   ├── geminiService.ts    # Cloud Functions callable
│   └── complianceService.ts # Golden Thread validation
└── types.ts                # TypeScript definitions
```

## 4. Backend Architecture (Cloud Functions)
```
functions/src/
├── index.ts              # Entry point
└── vertexAi.ts           # Gemini 2.5 Flash integration
    ├── analyzeAssessment()       # Audio → 23 items extraction
    ├── refineCareGoal()          # Goal refinement with 自立支援
    └── generateCarePlanDraft()   # Care plan generation
```

## 5. Data Flow
```
User → Firebase Auth → App.tsx
                         ↓
              TouchAssessment (Voice Recording)
                         ↓
              Cloud Functions (analyzeAssessment)
                         ↓
              Vertex AI Gemini 2.5 Flash
                         ↓
              Firestore (users/{uid}/assessments)
```

## 6. Real-time Analysis Architecture (Phase 5)
*   **Polling Strategy:** The `TouchAssessment` component implements an interval-based recorder that slices audio chunks (blobs) without stopping the MediaRecorder stream.
*   **Context Injection:** Each API call includes the *current* JSON state of the assessment. This allows the AI (Gemini) to perform "Differential Updates" (Auto-Mapping) and provide "Context-Aware Advice" (Co-pilot) that evolves as the interview progresses.

## 7. Generative Care Plan Architecture (Phase 7)
*   **Context-Aware Generation:** The `generateCarePlanDraft` function aggregates:
    1.  **Structured Assessment Data:** The full 23-item JSON to ensure physical/mental constraints are respected.
    2.  **Manager's Intent:** A free-text instruction string to steer the direction (e.g., "Focus on family respite").
*   **Prompt Logic:** The Gemini model acts as a "Senior Care Manager" to translate raw data + intent into formal "Long-term" and "Short-term" goals adhering to 2025 standards (Self-Reliance Support).

## 8. Security Architecture
- **Authentication:** Firebase Auth with Google OAuth (required)
- **Authorization:** Firestore Security Rules enforce user isolation
- **API Protection:** Cloud Functions require authenticated callers
- **Secrets:** No API keys exposed to client (all via Cloud Functions)
