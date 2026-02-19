/**
 * 音声互換ユーティリティ
 * Safari/iOS対応のためのブラウザ検出とMIMEタイプフォールバック
 */

/**
 * MediaRecorderで使用可能な音声MIMEタイプを返す
 * webm → mp4 → ogg の順で対応を確認
 */
export function getSupportedAudioMimeType(): string {
  const candidates = ['audio/webm', 'audio/mp4', 'audio/ogg'];
  for (const mime of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(mime)) {
      return mime;
    }
  }
  return ''; // フォールバック: MediaRecorder のデフォルト
}

/** Safari ブラウザかどうかを判定 */
export function isSafari(): boolean {
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
}

/** iOS デバイスかどうかを判定 */
export function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;
}

export interface SpeechRecognitionSupport {
  isSupported: boolean;
  supportsContinuous: boolean;
}

/**
 * SpeechRecognition の利用可否と continuous モードのサポートを判定
 * Safari では continuous=true が不安定なため false を返す
 */
export function getSpeechRecognitionSupport(): SpeechRecognitionSupport {
  const hasSpeechRecognition =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  if (!hasSpeechRecognition) {
    return { isSupported: false, supportsContinuous: false };
  }

  // Safari は continuous モードが不安定
  const supportsContinuous = !isSafari() && !isIOS();

  return { isSupported: true, supportsContinuous };
}
