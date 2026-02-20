# ハンドオフメモ

**最終更新**: 2026-02-21（セッション21）

## 現在のステージ

**Stage 3: Pilot Deployment** - 3-5名のケアマネージャーへの実際の展開フェーズ

> Stage 2（Production Readiness）完了: AI精度90%実証・エラーハンドリング監査・CI/CD正常稼働を達成

## 直近の変更（セッション21: P2/P3 Issue全消化）

| コミット | 内容 |
|----------|------|
| 6cb85b7 | feat: 文例データベースのケアプランV2対応 (#33) |
| 599777f | feat: ケアプランPDF保存ガイドのUX改善 (#32) |
| d83b0ea | feat: インタビューコパイロット missingInfoAdvice 実装 (#28) |
| 5aba40c | feat: 保険者番号・被保険者番号のバリデーション追加 (#30) |
| 03a0f8b | feat: 未保存変更の保護とタブ dirty 表示 (#31) |
| 30a36d0 | feat: 支援経過記録に月次クイックボタン追加 (#27) |
| 67faa6c | feat: 非同期エラーハンドリング強化（#29） |
| fe4dd3f | feat: コンポーネントテスト追加（#39） |

### 対応済みIssue（全件クローズ済み）

| Issue | 内容 | コミット |
|-------|------|----------|
| #39 | コンポーネントテスト追加 | fe4dd3f ✅ |
| #29 | 非同期エラーハンドリング強化 | 67faa6c ✅ |
| #27 | 支援経過記録に月次クイックボタン追加 | 30a36d0 ✅ |
| #31 | 未保存変更の保護とタブ dirty 表示 | 03a0f8b ✅ |
| #30 | 保険者番号バリデーション | 5aba40c ✅ |
| #28 | インタビューコパイロット missingInfoAdvice | d83b0ea ✅ |
| #32 | ケアプランPDF保存ガイドUX改善 | 599777f ✅ |
| #33 | 定型文データベースV2対応 | 6cb85b7 ✅ |
| #36 | 本番ログイン修正（signInWithPopup + COOPヘッダー削除） | 6054a69 ✅ |
| #47/#48 | 本番ゲストデモモード実装 | d73842a ✅ |
| #40/#37/#38/#43 | テスト実装（E2E・FE/BE整合性・セキュリティルール） | ✅ |
| #26 | モバイル操作性最適化 | ✅ |
| #25 | ケアプランと関連記録の連携強化 | ✅ |

## 実装状況

| 機能 | 状態 | 備考 |
|------|------|------|
| 認証（Googleログイン） | ✅ | Firebase Auth / signInWithPopup |
| アセスメント（23項目） | ✅ | 保存・読込・履歴 |
| ケアプラン（第1表・第2表） | ✅ | AI生成・印刷プレビュー |
| ケアプラン履歴・ステータス管理 | ✅ | CarePlanSelector / CarePlanStatusBar |
| ケアプランV2編集 | ✅ | NeedEditor / CarePlanV2Editor |
| 第3表（週間サービス計画表） | ✅ | WeeklyScheduleEditor / Preview / 印刷対応 |
| モニタリング記録 | ✅ | 差分入力・履歴一覧 |
| 支援経過記録（第5表） | ✅ | 音声入力・月次クイックボタン対応 |
| サービス担当者会議（第4表） | ✅ | |
| 入院時情報連携シート | ✅ | 自動生成 |
| 複数利用者管理 | ✅ | Firestoreネスト方式 |
| Firebase Emulator環境 | ✅ | |
| アクセス制御（allowed_emails） | ✅ | Stage 3実装 |
| フィードバックFAB | ✅ | Stage 3実装 |
| 利用ログ・structured logging | ✅ | Stage 3実装 |
| 認定有効期限・モニタリング期限アラート | ✅ | #22 |
| 初回利用オンボーディング・操作ガイド | ✅ | #23 |
| ダッシュボード/業務サマリー画面 | ✅ | #24 |
| デモ環境1コマンド起動 | ✅ | #35 |
| モバイル操作性最適化 | ✅ | #26 |
| 本番ゲストデモモード | ✅ | #47/#48 |
| コンポーネントテスト | ✅ | #39 |
| E2Eテスト（Playwright） | ✅ | #37 |
| FE/BE整合性テスト | ✅ | #38 |
| Firestoreセキュリティルールテスト | ✅ | #40 |
| 非同期エラーハンドリング強化 | ✅ | #29 |
| インタビューコパイロット（missingInfoAdvice） | ✅ | #28 |
| 保険者番号バリデーション | ✅ | #30 |
| 未保存変更保護・タブ dirty 表示 | ✅ | #31 |
| ケアプランPDF保存ガイドUX改善 | ✅ | #32 |
| 定型文データベースV2対応 | ✅ | #33 |

## 次のアクション

| # | タスク | 状態 |
|---|--------|------|
| 1 | **パイロットユーザーのメールアドレス登録** | 🔲 手動作業 |
| 2 | **パイロットユーザーへの案内・展開** | 🔲 登録後 |
| 3 | フィードバック収集・分析 | 🔲 展開後 |

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
- `allowed_emails` コレクションへのクライアント書き込みは `firestore.rules` で禁止済み
- フィードバックは `feedback` コレクションに保存（閲覧はFirebaseコンソールまたは管理スクリプトで）
- `usage_logs` はケアプラン生成時のみ記録（最小限）
- ADR 0001-0011 作成済み（0011 = 期限アラート定義）
- CI（Deploy to Firebase）: 最新コミット 6cb85b7 が deploy 完了済み（前回確認時: success）
- オープンIssue: **0件**（全Issue対応完了）
