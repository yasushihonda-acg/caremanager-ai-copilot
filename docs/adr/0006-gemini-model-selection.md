# ADR-0006: Gemini 2.5 Flash Model Selection

## Status
Accepted

## Date
2026-01-25

## Context
音声解析・アセスメント抽出・ケアプラン生成には、高性能なGenerative AIモデルが必要である。Vertex AIで利用可能なGeminiモデルの中から最適なものを選定する必要がある。

### 要件
1. 日本語の音声/テキスト処理に優れていること
2. 構造化出力（JSON Schema）をサポート
3. レスポンス速度がリアルタイム解析に適切
4. コスト効率が良いこと
5. 安定版であること（本番運用のため）

### 検討したモデル

#### A. gemini-2.5-flash（採用）
- **Pros:**
  - 高速レスポンス（リアルタイム解析に適合）
  - 構造化出力（JSON Schema）サポート
  - 音声入力対応
  - 安定版リリース（2025年6月）
  - コスト効率が良い
- **Cons:**
  - Proモデルより推論精度が若干劣る可能性

#### B. gemini-2.5-pro
- **Pros:**
  - 最高レベルの推論精度
- **Cons:**
  - レスポンスが遅い
  - コストが高い
  - リアルタイム解析には不向き

#### C. gemini-2.5-flash-preview-05-20（以前使用）
- **Pros:**
  - 最新機能の早期アクセス
- **Cons:**
  - プレビュー版で不安定
  - 突然の廃止リスク（実際に404エラー発生）
  - 本番運用に不適切

## Decision
**gemini-2.5-flash**（安定版）を採用する。

### 理由
1. 30秒間隔のリアルタイム解析には高速レスポンスが必須
2. プレビュー版（05-20）が廃止され404エラーが発生した教訓
3. 構造化出力により23項目の確実な抽出が可能
4. 本番運用に耐える安定性

## Consequences

### Positive
- 安定した本番運用が可能
- リアルタイム解析のUXが向上
- 将来のモデル更新時も互換性維持が期待できる

### Negative
- 最新のプレビュー機能は利用不可
- モデル更新時は動作確認が必要

## Implementation

### Cloud Functions (vertexAi.ts)
```typescript
const MODEL_ID = 'gemini-2.5-flash';

const model = vertexAi.getGenerativeModel({
  model: MODEL_ID,
});
```

### 設定値
- **Region:** asia-northeast1
- **Memory:** 1GiB（音声解析用）
- **Timeout:** 120秒

## Migration Notes
2026-01-25に`gemini-2.5-flash-preview-05-20`から`gemini-2.5-flash`に移行。
移行理由：プレビュー版廃止による404 Not Foundエラー。

## References
- [Gemini Models Documentation](https://ai.google.dev/gemini-api/docs/models)
- [Vertex AI Gemini API](https://cloud.google.com/vertex-ai/docs/generative-ai/model-reference/gemini)
