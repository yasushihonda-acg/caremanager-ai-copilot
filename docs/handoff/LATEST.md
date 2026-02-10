# ハンドオフメモ

**最終更新**: 2026-02-10（セッション3）

## 現在のステージ

**Stage 2: Production Readiness** - パイロット投入に向けた品質保証・精度検証フェーズ

> 開発モデルをPhase（機能カテゴリ別）からStage（開発ステージ別）に移行。詳細: [ADR 0009](../adr/0009-stage-based-development-model.md)

## 直近の変更

| 日付 | PR/コミット | 内容 |
|------|------------|------|
| 2026-02-10 | (本セッション) | ロードマップ再構成（Stage-based）、ADR 0009 |
| 2026-02-10 | 2a3b463 | デモ用シードデータスクリプト追加（3名分の利用者データ） |
| 2026-02-10 | aca5ea9 | clientsコレクションの複合インデックス追加（isActive+kana） |
| 2026-02-10 | #7 | UX改善バッチ（検索フィルタ・進捗バー・定型文テンプレート） |
| 2026-02-10 | #6 | 利用者データベース（複数利用者管理・Firestoreネスト方式） |
| 2026-02-09 | #5 | モニタリング履歴一覧・編集機能 |

## アーキテクチャ変更（重要）

### Firestoreスキーマのネスト化（PR #6）

**旧パス**: `users/{uid}/assessments/{id}`
**新パス**: `users/{uid}/clients/{clientId}/assessments/{id}`

- 全データが利用者（Client）単位で分離
- `services/firebase.ts`の全関数に`clientId`パラメータ追加
- `clientPath()`ヘルパーでDRYなパス構築
- 旧パスはfirestore.rulesで後方互換を維持

### 新規コンポーネント

| ファイル | 説明 |
|---------|------|
| `contexts/ClientContext.tsx` | Client CRUD + 選択管理 |
| `components/clients/ClientListView.tsx` | 利用者一覧（検索付き） |
| `components/clients/ClientForm.tsx` | 利用者登録・編集 |
| `components/clients/ClientContextBar.tsx` | 選択中利用者バー |

## MVP実装状況（Stage 1 完了）

| 機能 | 状態 | 備考 |
|------|------|------|
| 認証（Googleログイン） | ✅ | Firebase Auth |
| アセスメント（23項目） | ✅ | 保存・読込・履歴 |
| ケアプラン（第1表・第2表） | ✅ | AI生成・印刷プレビュー |
| モニタリング記録 | ✅ | 差分入力・履歴一覧 |
| 支援経過記録（第5表） | ✅ | 音声入力対応 |
| サービス担当者会議（第4表） | ✅ | |
| 入院時情報連携シート | ✅ | 自動生成 |
| 複数利用者管理 | ✅ | Firestoreネスト方式 |

## 次のアクション（Stage 2 P0 - 依存順）

| # | タスク | 依存 | 見積 |
|---|--------|------|------|
| 1 | ADC再認証（`gcloud auth application-default login`） | なし | 10分 |
| 2 | エラーハンドリング監査 | なし | 2日 |
| 3 | AI精度の実地テスト（Cloud Functions連携テスト） | #1 | 2-3日 |
| 4 | 抽出ルール最適化（弱点4項目） | #3 | 3-5日 |

### Stage 2 退出基準チェックリスト

- [ ] P0タスク全完了
- [ ] AI抽出精度85%以上を実データで実証
- [ ] エラーハンドリング監査完了（transient/permanent分類済み）
- [ ] 重大バグ0件

## デモ環境

- アプリ: https://caremanager-ai-copilot.web.app
- ドキュメント: https://yasushihonda-acg.github.io/caremanager-ai-copilot/
- GCPプロジェクト: `caremanager-ai-copilot`

## シードデータ再投入

```bash
npx tsx scripts/seed.ts bapgVkGOXVep8Tm2vbkxml1vz3D2
```
- gcloud CLIのアクティブアカウント（`hy.unimail.11@gmail.com`）のトークンを使用
- ADCは別アカウント（`yasushi-honda@tadakayo.jp`）のため使用不可

## 注意事項

- `firestore.rules`に旧パスの後方互換ルールを残している（将来削除可能）
- 旧パスの既存データは自動移行されない（デモ段階で少量のため手動対応）
- ADR 0008（Clientネストスキーマ）作成済み
- ADR 0009（ステージベース開発モデル）作成済み
