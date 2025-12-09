# 13_phase4_design.md - Phase 4 Design: Auto-Mapping & Co-pilot

## 1. 目的
ケアマネジャーが画面操作（入力）から解放され、利用者との対話（傾聴・観察）に集中できる環境を構築する。
音声データを解析し、構造化データ（選択肢）への自動変換と、不足情報の能動的サジェストを行う。

## 2. 機能設計

### A. AI Auto-Mapping Engine
*   **Input:** 音声データ (Blob)
*   **Process:** Gemini API (Multimodal)
*   **Output:** `AssessmentData` 型の部分更新データ (JSON) + 要約テキスト
*   **Prompt Strategy:**
    *   23項目の各フィールドに対して、定義された選択肢（例：自立, 一部介助, 全介助）の中から、会話内容に最も合致するものを選ばせる。
    *   判断材料がない場合は `null` または `""` を返し、既存データを上書きしないようにする。
    *   **"Confidence Threshold":** AIが確信を持てない場合は選択せず、テキスト記述（備考）のみに残すよう指示する。

### B. Interview Co-pilot (Advice Engine)
*   **Trigger:** 音声解析完了時
*   **Logic:**
    1.  AIが自動マッピングした結果と、未入力項目を比較する。
    2.  重要項目（虐待リスク、金銭管理、服薬など）が「未入力」のままである場合、それを「聞き漏らし」として特定する。
    3.  「適切なケアマネジメント手法」ロジックを参照し、疾患ベースで聞くべきこと（例：脳梗塞なら麻痺の有無）が話題に出たかチェックする。
*   **Output:** 3つ以内の「次に聞くべき質問（Next Best Actions）」リスト。

## 3. データスキーマ設計 (Gemini Response Schema)
Geminiに返却させるJSON構造の定義。

```json
{
  "structuredData": {
    "adlTransfer": "自立 | 見守りが必要 | 一部介助 | 全介助",
    "adlToileting": "自立 | ...",
    "medication": "...",
    "socialParticipation": "..."
    // ... 他の23項目
  },
  "summary": "特記事項用の要約テキスト...",
  "missingInfoAdvice": [
    "金銭管理の状況について言及がありませんでした。確認してください。",
    "ご家族の介護負担について確認することをお勧めします。"
  ]
}
```

## 4. UI/UXへの反映
*   **Loading State:** 「AIが会話を分析中...」という明確なフィードバック。
*   **Feedback Loop:**
    *   AIによって自動選択された項目は、一時的に青枠やアイコン（✨）で強調表示し、ユーザーが「AIがここを変えたんだな」と認識できるようにする。
    *   Co-pilotのアドバイスは、画面上部の「アシスタントエリア」に即座に表示する。

## 5. 実装プラン
1.  `services/geminiService.ts`: `analyzeAssessmentConversation` 関数の実装。Structured Outputの設定。
2.  `components/TouchAssessment.tsx`: 録音完了後の処理フローを変更。自動入力されたデータをStateにマージするロジックの実装。