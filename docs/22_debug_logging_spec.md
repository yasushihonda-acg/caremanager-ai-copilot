# 22_debug_logging_spec.md - Debug Logging & Feedback Specification

## 1. Console Log Format
保守・デバッグを容易にするため、以下のフォーマットでログを出力する。

```text
[CFM-DEBUG] <ISO-Time> | Action: <ActionName> | Payload: <Details>
```

### Examples
*   `[CFM-DEBUG] 2025-11-21T10:00:00Z | Action: StartInterval | Interval: 30000ms`
*   `[CFM-DEBUG] 2025-11-21T10:00:30Z | Action: AnalyzeRequest | BlobSize: 450kb`
*   `[CFM-DEBUG] 2025-11-21T10:00:32Z | Action: AnalysisComplete | UpdatedFields: 3`

## 2. UI Feedback Specification
*   **Location:** 録音ステータスエリア内（マイクボタン周辺）。
*   **Content:** `最終更新: HH:mm:ss`
*   **Behavior:** `handleAnalysisResult` が正常に完了するたびに現在時刻で更新。

## 3. Data Handling Rule
*   **Summary Field:** **Always Overwrite**. The AI provides a holistic summary of the cumulative audio.
*   **Structured Data:** **Merge/Overwrite**. If AI returns a value, it updates the specific key.
*   **Advice:** **Overwrite**. The advice should be relevant to the *current* state of missing info.