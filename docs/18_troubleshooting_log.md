# 18_troubleshooting_log.md - Troubleshooting Record

## Issue: Phase 5 Real-time Analysis Failure
*   **Date:** 2025-11-19
*   **Status:** Resolved
*   **Reporter:** Project Leader

### 1. Symptom
When "30s Interval" (Demo mode) is selected, the "AI Thinking" indicator appears, but no result (Auto-mapping or Advice) comes back. The API call seems to fail silently or return empty results.

### 2. Root Cause Analysis
*   **Investigation:**
    *   The `MediaRecorder.requestData()` method correctly triggers the `ondataavailable` event with a new `Blob` (Chunk).
    *   However, in the WebM format, only the **first chunk** contains the file header (Metadata, Codec info).
    *   **Subsequent chunks** sent to Gemini API were raw stream data without headers.
    *   Gemini API could not decode these header-less audio blobs, resulting in errors or "silence" interpretation.

### 3. Solution: Cumulative Buffer Strategy
Instead of sending just the *new* slice of audio, we must construct a valid file every time.
*   **Old Logic:** Send `e.data` (Current Chunk) -> Fail.
*   **New Logic:**
    1.  Push `e.data` to `chunksRef` (Accumulator).
    2.  Create a new `Blob` from **ALL** chunks in `chunksRef`.
    3.  Send this cumulative Blob to Gemini.
    *   *Note:* Gemini 1.5/2.5 Flash has a large context window, so sending cumulative audio (up to ~1 hour) is acceptable and ensures context is preserved.

### 4. Implementation Changes
*   **Component:** `TouchAssessment.tsx` updated to blob the entire `chunksRef.current`.
*   **Service:** `geminiService.ts` prompt updated to inform AI that the audio is "from the beginning" and it should focus on *differential* updates relative to the provided JSON context.