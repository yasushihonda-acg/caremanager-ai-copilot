# 16_phase5_design.md - Phase 5 Design: Real-time Co-pilot

## 1. コンセプト
「後から振り返るツール」から「今、横で支えてくれるパートナー」へ。
インタビュー中にAIが介入し、ケアマネジャーの「気づき」を支援する。

## 2. アーキテクチャ: Context-Aware Interval Analysis (Cumulative Strategy)

### A. データフロー (Updated)
1.  **Frontend:** `MediaRecorder` は継続して動作。
2.  **Interval Trigger:** 設定された時間（例: 30秒）ごとに `requestData()` を実行。
3.  **Data Accumulation:** 発火した `ondataavailable` イベントで、新しいチャンクを `chunksRef`（配列）に追加する。
4.  **API Request:** `analyzeAssessmentConversation(cumulativeBlob, currentAssessmentData)` をコール。
    *   `cumulativeBlob`: **録音開始から現在までの全データを結合したBlob** (WebMヘッダーを保持するため)。
    *   `currentAssessmentData`: 現在画面に入力されているデータ全体（JSON）。
5.  **AI Processing (Gemini):**
    *   Input: 現在のステータス + 累積音声。
    *   Logic: 音声全体を聞くが、`currentAssessmentData` と比較して**差分のみ**を抽出する。
6.  **State Update:**
    *   返却されたJSONでStateを更新（マージ）。
    *   Co-pilotのアドバイス欄を更新。

### B. プロンプトエンジニアリング (差分更新特化)
```text
あなたはアセスメントの記録係です。
【現在の入力状況】: ${JSON.stringify(currentData)}
【音声データ】: 会話の冒頭から現在までの全録音データ

指示:
1. 音声データ全体を踏まえつつ、現在の入力状況を**更新・補完**してください。
2. 既に正しく入力されている情報は、再出力しないでください（差分のみ）。
3. 音声の前半ですでに解決済みの内容を、重複して出力しないように注意してください。
4. まだ埋まっていない重要項目について、追加のアドバイスを生成してください。
```

### C. UI/UX デザイン
*   **ステータスインジケータ:**
    *   録音中: 赤いパルス。
    *   解析中: 青い回転アイコン（録音と共存）。
    *   アドバイス受信時: バナーがアニメーション更新。
*   **間隔設定 (Interval Selector):**
    *   デモ用途として、ユーザーが解析頻度を変更できるドロップダウンを用意（最短30秒）。

## 3. 実装フェーズ
1.  `geminiService` 改修: `currentData` 引数の追加とプロンプト変更（累積対応）。
2.  `TouchAssessment` 改修: `setInterval` ロジックの追加、累積Blob送信への変更。