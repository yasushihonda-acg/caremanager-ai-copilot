
# 30_future_roadmap.md - Future Development Roadmap

## Phase 6: Refinement & Stability (Completed)
*   [x] **サマリー表の日本語化:** 英語IDから日本語ラベルへの変換実装。
*   [x] **誤操作防止ロック:** AI解析中のボタン無効化。
*   [x] **23項目完全準拠 (v1.1.0):** 欠落項目の追加とデータ構造の刷新。

## Phase 7: AI Care Plan Drafter (Completed)
*   [x] **第2表ドラフト生成 (v1.2.0):** アセスメントデータと意図に基づく目標案の提示。
*   [x] **Human-in-the-Loop UI:** AI提案のプレビューと承認フローの実装。

## Phase 8: Production Readiness (Current Focus)
**目標:** 実データを用いた運用に耐えうるセキュリティと機能を実装する。

### v1.2.1 Maintenance (Completed)
*   [x] **要約ロジック改修:** リアルタイム解析時の要約生成を停止し、録音終了時のみ生成するように変更（UX改善）。
*   [x] **エラーハンドリング強化:** ケアプラン生成時のAPIエラー対策とイベント制御の修正。

### v1.2.2 Sandbox Compatibility Hotfix (Immediate)
*   [x] **モーダル削除:** サンドボックス環境でブロックされる `window.confirm/alert` を削除し、ボタン操作を即時反映させるように修正。

### Future Tasks
*   [ ] **Custom Modal UI:** ネイティブアラートに依存しない、Reactベースの確認ダイアログ実装（安全性向上のため必須）。
*   [ ] **PWA オフライン対応:** Service Workerによるキャッシュ戦略の実装（電波の悪い利用者宅対応）。
*   [ ] **データ暗号化:** LocalStorage保存時のAES暗号化の実装。
*   [ ] **PDF出力/帳票印刷:** 第1表・第2表の正式な帳票レイアウトでの印刷機能。
*   [ ] **クラウド同期 (Optional):** 複数デバイス間でのデータ共有（要バックエンド実装）。

---
**Approved by:** Project Leader
