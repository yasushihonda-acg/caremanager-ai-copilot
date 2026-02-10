# ハンドオフメモ

**最終更新**: 2026-02-10

## 現在のフェーズ

Phase 2 - 複数利用者管理基盤の構築

## 直近の変更

| 日付 | PR | 内容 |
|------|-----|------|
| 2026-02-10 | #6 | 利用者データベース（複数利用者管理・Firestoreネスト方式） |
| 2026-02-09 | #5 | モニタリング履歴一覧・編集機能 |
| 2026-02-08 | #4 | サービス担当者会議記録（第4表）UI実装 |

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

### MOCK_USER完全削除

`App.tsx`からハードコードされた`MOCK_USER`を削除。`useClient()`フックによる動的利用者選択に置換。

## MVP実装状況

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

## 次のアクション候補

1. **AI抽出精度の実地テスト** - 実際のケアマネ業務での精度検証
2. **給付管理サポート機能** - Phase 4の主要機能
3. **本番デプロイ** - PR #6のデプロイ（`firebase deploy`）
4. **ADR 0008作成** - Firestoreネスト方式の技術判断記録

## デモ環境

- アプリ: https://caremanager-ai-copilot.web.app
- ドキュメント: https://yasushihonda-acg.github.io/caremanager-ai-copilot/
- GCPプロジェクト: `caremanager-ai-copilot`

## 注意事項

- `firestore.rules`に旧パスの後方互換ルールを残している（将来削除可能）
- 旧パスの既存データは自動移行されない（デモ段階で少量のため手動対応）
- ADR 0004（旧スキーマ）は0008で更新予定
