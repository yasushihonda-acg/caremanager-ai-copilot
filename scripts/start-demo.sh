#!/bin/bash
set -e

echo "🎬 デモ環境を起動します..."

# Emulatorをバックグラウンドで起動
firebase emulators:start &
EMULATOR_PID=$!

# Ctrl+C / 終了時にEmulatorを停止
trap "echo ''; echo '🛑 デモ環境を停止します...'; kill $EMULATOR_PID 2>/dev/null; exit" SIGINT SIGTERM

echo "⏳ Emulator起動待ち..."
until curl -sf http://localhost:9099 > /dev/null 2>&1; do
  sleep 1
done

echo "🌱 シードデータを投入します..."
npm run dev:seed

echo "🚀 Viteを起動します ( http://localhost:5173 )"
npm run dev

# Vite終了後にEmulatorも停止
kill $EMULATOR_PID 2>/dev/null
