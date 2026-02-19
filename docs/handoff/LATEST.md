# ハンドオフメモ

**最終更新**: 2026-02-19（セッション13）

## 現在のステージ

**Stage 3: Pilot Deployment** - 3-5名のケアマネージャーへの実際の展開フェーズ

> Stage 2（Production Readiness）完了: AI精度90%実証・エラーハンドリング監査・CI/CD正常稼働を達成

## 直近の変更（セッション13: 法定要件フィールド・互換性・実用性修正）

| 日付 | コミット | 内容 |
|------|----------|------|
| 2026-02-19 | 2915ac9 | feat(#21): Safari/iPhone音声入力互換性対応 |
| 2026-02-19 | 1f75f91 | feat(#20): ケアマネ情報のFirestore管理移行 |
| 2026-02-19 | 67dde36 | feat(#18): 第2表「目標期間」フィールド追加（V1/V2両対応） |
| 2026-02-19 | c6a67c6 | feat(#19): 第1表「本人・家族等の意向」フィールド追加 |
| 2026-02-19 | c78f74d | feat: Tier 1 ケアプラン管理基盤・V2編集・第3表実装 |
| 2026-02-19 | f6788c3 | feat: Stage 3 Pilot Deployment（アクセス制御・フィードバック・モニタリング） |

### セッション13で対応したIssue

| Issue | 内容 | コミット |
|-------|------|----------|
| #18 | 第2表「長期・短期目標期間（開始日〜終了日）」フィールド追加（V1/V2両対応） | 67dde36 |
| #19 | 第1表「本人・家族等の生活に対する意向」フィールド追加 | c6a67c6 |
| #20 | ケアマネジャー・事業所情報をFirestore管理移行（ハードコード解消） | 1f75f91 |
| #21 | Safari/iPhone音声入力互換性（MediaRecorder + Whisper API フォールバック実装） | 2915ac9 |

## 実装状況

| 機能 | 状態 | 備考 |
|------|------|------|
| 認証（Googleログイン） | ✅ | Firebase Auth |
| アセスメント（23項目） | ✅ | 保存・読込・履歴 |
| ケアプラン（第1表・第2表） | ✅ | AI生成・印刷プレビュー |
| ケアプラン履歴・ステータス管理 | ✅ | CarePlanSelector / CarePlanStatusBar |
| ケアプランV2編集 | ✅ | NeedEditor / CarePlanV2Editor |
| 第3表（週間サービス計画表） | ✅ | WeeklyScheduleEditor / Preview / 印刷対応 |
| モニタリング記録 | ✅ | 差分入力・履歴一覧 |
| 支援経過記録（第5表） | ✅ | 音声入力対応 |
| サービス担当者会議（第4表） | ✅ | |
| 入院時情報連携シート | ✅ | 自動生成 |
| 複数利用者管理 | ✅ | Firestoreネスト方式 |
| Firebase Emulator環境 | ✅ | PR #11 |
| ニーズ→目標の整合性チェック | ✅ | PR #15 |
| アクセス制御（allowed_emails） | ✅ | Stage 3実装（f6788c3） |
| フィードバックFAB | ✅ | Stage 3実装（f6788c3） |
| 利用ログ・structured logging | ✅ | Stage 3実装（f6788c3） |
| 第1表「本人・家族等の意向」 | ✅ | #19（c6a67c6） |
| 第2表「目標期間」フィールド | ✅ | #18（67dde36） |
| ケアマネ情報Firestore管理 | ✅ | #20（1f75f91） |
| Safari/iPhone音声入力互換 | ✅ | #21（2915ac9） |

## 次のアクション

| # | タスク | 状態 | 依存 |
|---|--------|------|------|
| 1 | **feature/tier1-careplan-management のPR作成・CIパス確認** | 🔲 | なし |
| 2 | **本番デプロイ（Tier 1 + Stage 3 + #18-21修正）** | 🔲 | PRマージ後 |
| 3 | Issue #18-21 をPRでCloses指定してクローズ | 🔲 | PR作成時 |
| 4 | **パイロットユーザーのメールアドレス登録** | 🔲 手動 | デプロイ後 |
| 5 | パイロットユーザーへの案内 | 🔲 | 登録後 |
| 6 | P1残タスク判断（パイロットフィードバック後） | 🔲 | パイロット完了後 |

### 未対応のオープンIssue（パイロット後に優先検討）

| Issue | 優先 | タイトル |
|-------|------|----------|
| #22 | P1 | 認定有効期限・モニタリング期限アラート |
| #23 | P1 | 初回利用オンボーディング |
| #24 | P1 | ダッシュボード/業務サマリー画面 |
| #25 | P1 | ケアプランと関連記録の連携強化 |
| #26 | P1 | モバイル操作性最適化 |
| #29 | P2 | 非同期エラーハンドリング改善 |

### Stage 3 退出基準チェックリスト

- [ ] パイロットユーザー3-5名が実際に使用
- [ ] 満足度80%以上
- [ ] 重大バグ0件（1ヶ月間）
- [ ] フィードバックの集計・分析完了

### パイロットユーザー登録方法

```bash
# Firebaseコンソールから手動で登録
# allowed_emails コレクション → ドキュメントID = メールアドレス
# フィールド: { createdAt: <Timestamp>, note: <説明> }
```

## デモ環境

- アプリ: https://caremanager-ai-copilot-486212.web.app
- ドキュメント: https://yasushihonda-acg.github.io/caremanager-ai-copilot/
- GCPプロジェクト: `caremanager-ai-copilot-486212`
- GCPオーナー: `yasushi.honda@aozora-cg.com`

## ローカル開発（Emulator）

```bash
# Emulator起動（Auth:9099, Firestore:8080, Functions:5001）
npm run dev:emulator

# Vite起動（自動でEmulator接続、テストユーザー自動ログイン）
npm run dev

# シードデータ投入（allowed_emails含む）
npm run dev:seed
```

環境変数: `.env.development` の `VITE_USE_EMULATOR=true`

## 注意事項

- Emulator環境では `checkEmailAllowed` は常に `true` を返す（バイパス済み）
- `allowed_emails` コレクションへのクライアント書き込みは `firestore.rules` で禁止済み（`allow write: if false`）
- フィードバックは `feedback` コレクションに保存（閲覧はFirebaseコンソールまたは管理スクリプトで）
- `usage_logs` はケアプラン生成時のみ記録（最小限）
- feature/tier1-careplan-management ブランチはmainから6コミット先行（PRが必要）
- ADR 0008（Clientネストスキーマ）、ADR 0009（ステージベース開発モデル）、ADR 0010（GCPプロジェクト移行）作成済み
