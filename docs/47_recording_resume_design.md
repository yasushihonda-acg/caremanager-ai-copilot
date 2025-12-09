
# 47_recording_resume_design.md - Recording Resume & Context Injection Design

## 1. 目的
*   **課題:** 訪問介護の現場では、電話対応や利用者の離席などでインタビューが中断することがある。現状の仕様では録音を停止するとデータがリセットされるため、再開できない。
*   **要望:** 既存の入力内容を維持したまま、録音を再開（追記）したい。また、終了時に不足情報を確認したい。

## 2. アーキテクチャ: Context-Injection Resume Strategy

従来の「累積バッファ（全音声を常に送る）」方式は、長時間の録音でメモリを圧迫し、かつ中断・再開の管理が困難であるため、**「コンテキスト注入方式」**に変更・拡張する。

### データフロー
1.  **Resume Action:** ユーザーが「続きから録音」を押す。
2.  **State Preservation:** フロントエンドは `assessment` (JSON) と `generatedText` (要約) をクリアせずに保持する。
3.  **New Session:** `MediaRecorder` は新しいストリームとして開始する（音声データはリセット）。
4.  **API Request:**
    *   `audioBlob`: **今回のセッション**の音声データ。
    *   `currentData`: 現在のJSONデータ（コンテキスト）。
    *   `currentSummary`: 現在の要約テキスト（コンテキスト）。**[New]**
5.  **AI Processing:**
    *   プロンプト指示: 「提供された音声は**追加の会話**です。既存のデータ (`currentData`) と要約 (`currentSummary`) をベースに、新しい情報を**統合・追記**してください。」

## 3. UI/UX 仕様
*   **初期状態:** 「録音・分析開始」ボタンのみ。
*   **録音停止後:**
    *   **Primary Button:** 「続きから録音」 (既存データを維持して再開)
    *   **Secondary Button:** 「データをクリアして新規」 (リセットして開始)
*   **終了時フィードバック:**
    *   不足情報アドバイス (`missingInfoAdvice`) を、録音停止後の画面でも維持・表示し、次回の録音（再開）で何を聞くべきかを明確にする。

## 4. 変更対象
*   `services/geminiService.ts`: `analyzeAssessmentConversation` に `currentSummary` 引数を追加。プロンプトを「追記モード」に対応させる。
*   `components/TouchAssessment.tsx`: 録音状態管理 (`hasRecorded`) の追加と、ボタン分岐の実装。
