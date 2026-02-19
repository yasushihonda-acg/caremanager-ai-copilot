# ADR 0011: 期限アラート定義

## Status
Accepted (2026-02-19)

## Context

ケアマネの法定義務として、以下の期限管理が必須:

1. **認定更新**: 介護保険法 第28条 — 要介護認定の有効期限管理
2. **モニタリング月1回**: 指定居宅介護支援等の事業の人員及び運営に関する基準 第13条18号

パイロットユーザーのペルソナ:「担当者35名の期限をExcelで管理している。アプリが教えてくれるなら絶対使う」

## Decision

### 認定有効期限アラート

`utils/deadlineAlerts.ts` の `getCertificationDeadlineStatus()` で判定する。

| 条件 | urgency | 表示 | UI |
|------|---------|------|----|
| null / 空文字 / 不正値 | `unknown` | 非表示 | — |
| today > expiry（期限切れ） | `expired` | "期限切れ" | 赤バッジ |
| 0 ≤ days ≤ 30 | `critical` | "残りN日" | 赤バッジ |
| 31 ≤ days ≤ 60 | `warning` | "残りN日" | 黄バッジ |
| days > 60 | `safe` | 非表示 | — |

**設計方針**: 問題がある利用者だけが視覚的に目立つ（safe/unknown は非表示）。

**タイムゾーン**: `new Date(dateStr + 'T00:00:00')` でローカル解釈（既存 `useCarePlan.ts` の `dateToTs()` と同パターン）。

**0日（当日）の扱い**: `daysRemaining = 0` は critical 扱い。認定当日はまだ有効だが更新手続きが必要なため。

### モニタリング月次状況

`utils/deadlineAlerts.ts` の `getMonitoringStatus()` で判定する。

| 状態 | 表示 | UI |
|------|------|----|
| 今月に visitDate あり | "M月のモニタリング: 実施済み (M/D)" | 緑バナー |
| 今月に visitDate なし | "M月のモニタリング: 未実施" | 黄バナー |

**N+1 回避**: `ClientListView` では表示しない。個別利用者のモニタリングタブ内でのみ表示し、`listMonitoringRecords(userId, clientId, 5)` の単一クエリで実現。

## Consequences

### Positive
- ケアマネが期限切れ・期限間近を一目で把握できる
- 追加クエリ不要（`Client.certificationExpiry` は既存フィールド）
- モニタリング状況は N+1 を回避した設計

### Negative
- `safe`（60日超）は非表示のため、認定日が遠い利用者の期限は確認できない
  → 将来の #24 ダッシュボードで一覧表示予定

### Future Work
- **Phase 2 (#24)**: ダッシュボードで全利用者のモニタリング一括状況をバッチ取得で表示
- 通知機能（プッシュ通知・メール）は Phase 4 以降
