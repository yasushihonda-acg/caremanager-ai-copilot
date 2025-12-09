# 03_database_schema.md - ER & Relations

## 1. Key Entities

### Users (Clients)
*   `id`: UUID
*   `basic_info`: JSONB (Name, Level, DOB)
*   `life_history`: JSONB (Narrative data)
*   `medical_alerts`: Array<String>

### Assessments (Updated for 23 Items Compliance v1.1.0)
*   `id`: UUID
*   `user_id`: FK -> Users.id
*   `date`: Date
*   `content`: JSONB
    *   **Structure:**
        *   `basic`: { serviceHistory, healthStatus, pastHistory, skinCondition, oralHygiene, fluidIntake }
        *   `adl`: { transfer, eating, toileting, bathing, dressing }
        *   `iadl`: { cooking, cleaning, shopping, money_management, medication }
        *   `cognitive`: { cognition, communication }
        *   `social`: { socialParticipation, residence, familySituation }
        *   `special`: { maltreatmentRisk }
        *   `other`: { environment (Special Notes) }

### CarePlans
*   `id`: UUID
*   `user_id`: FK -> Users.id
*   `assessment_id`: FK -> Assessments.id (Enforces: No Plan without Assessment)
*   `dates`: { assessment, draft, meeting, consent, delivery }
*   `status`: Enum (Draft, Active, Archived)
*   `long_term_goal`: String
*   `short_term_goals`: Array<{ id, content, status }>

### Monitoring
*   `id`: UUID
*   `plan_id`: FK -> CarePlans.id
*   `date`: Date (Must be > Plan.consentDate usually)
*   `goal_status`: Array<{ goal_id, status }>

## 2. Golden Thread Enforcement (Relation Logic)
*   **Strict Temporal Coupling:** A `CarePlan` record cannot exist unless linked to an `Assessment` record where `Assessment.date <= CarePlan.dates.draft`.
*   **Event Driven:** Updating a `CarePlan` date triggers a validation check against linked `Monitoring` logs to prevent orphanage of logs.