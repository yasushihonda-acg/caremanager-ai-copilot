# 26_bugfix_schema_enum.md - Bug Fix: Gemini API Schema Validation Error

## Issue Overview
*   **Date:** 2025-12-03
*   **Status:** Resolved
*   **Symptom:** Real-time analysis fails with `400 Bad Request` and message `enum[4]: cannot be empty`.
*   **Context:** Phase 5 Real-time Analysis (30s interval).

## Root Cause Analysis
In `services/geminiService.ts`, the JSON Schema defined for `structuredData` included an empty string `""` as a valid option for enum fields to represent "No Selection".
Example: `enum: ["Option A", "Option B", ""]`

**Technical Constraint:**
The Gemini API (and the underlying OpenAPI/Protobuf validation) does **not** support empty strings as valid values within an `enum` array definition. This causes the API request to be rejected as `INVALID_ARGUMENT`.

## Solution
1.  **Schema Update:** Remove `""` from all `enum` arrays in the `schema` object.
2.  **Prompt Engineering:** Update the system prompt to instruct the AI to **omit the key** from the JSON output if the topic is not mentioned, rather than returning an empty string.

## Verification Plan
*   Run the "30s Interval" recording again.
*   Verify that `[CFM-DEBUG]` logs show `Action: AnalysisResultReceived` instead of `AnalysisError`.
