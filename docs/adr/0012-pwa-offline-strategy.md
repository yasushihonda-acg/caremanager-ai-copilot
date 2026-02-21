# ADR 0012: PWA・オフライン対応設計

## Status
Accepted (2026-02-21)

## Context

ケアマネージャーは利用者宅への訪問中にアプリを使用するため、電波が不安定な環境での動作が必須。
また、ホーム画面に追加して業務ツールとして使ってもらうため、PWA化が有効。

主な要件:
- オフライン時にも保存済みデータを閲覧できること
- Service Worker の手動実装を避け、保守コストを抑えること
- Firestore Emulator ではオフラインキャッシュが使えないため、環境を分離すること

## Decision

### PWA 実装

**`vite-plugin-pwa`（Workbox）** を採用。Service Worker の自動生成・キャッシュ戦略の定義を一任する。

```
vite.config.ts
  VitePWA({ registerType: 'autoUpdate', manifest: false })
```

- `registerType: 'autoUpdate'` — 新バージョンのデプロイ時に自動更新
- `manifest: false` — `public/manifest.json` を正式ソースとして使用（二重定義防止）

### Web App Manifest

```json
{
  "name": "ケアマネのミカタ",
  "display": "standalone",
  "theme_color": "#3B82F6",
  "lang": "ja"
}
```

### Firestore オフラインキャッシュ

`initializeFirestore` + `persistentLocalCache` + `persistentMultipleTabManager` を採用。

```typescript
// 本番: オフラインキャッシュ有効
initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
})

// Emulator: キャッシュ無効（persistentLocalCache はEmulatorで動作しない）
initializeFirestore(app, {})
```

環境判定は `VITE_USE_EMULATOR` フラグで分岐。

### オフライン通知 UI

- `hooks/useNetworkStatus.ts` — `navigator.onLine` + online/offline イベントを DRY に集約
- `components/common/OfflineBanner.tsx` — オフライン時のみ上部バナー表示（`z-[70]`）

## Consequences

### Positive
- オフライン時に保存済みの利用者・ケアプランデータを閲覧可能
- Service Worker 手書き不要（Workbox が自動生成）
- ホーム画面追加でネイティブアプリに近い UX
- `useNetworkStatus` フックの再利用で将来の機能拡張が容易

### Negative
- Firestore オフラインキャッシュはデバイスのローカルストレージを消費
- 古いブラウザ（Safari 15 以前）でマルチタブ同期の挙動が異なる場合あり
- Emulator 環境ではオフラインキャッシュをテストできない

### Future Work
- プッシュ通知（期限アラートの Service Worker 通知）は Phase 4 以降
