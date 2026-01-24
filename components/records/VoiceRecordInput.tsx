import React, { useState, useRef, useCallback } from 'react';

interface VoiceRecordInputProps {
  onTranscript: (text: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * 音声入力コンポーネント
 * Web Speech API を使用してリアルタイム音声認識を行う
 */
export const VoiceRecordInput: React.FC<VoiceRecordInputProps> = ({
  onTranscript,
  placeholder = '音声入力するにはマイクボタンをクリック',
  disabled = false,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const startRecording = useCallback(() => {
    // Web Speech API のサポートチェック
    const SpeechRecognition =
      window.SpeechRecognition || (window as unknown as { webkitSpeechRecognition: typeof window.SpeechRecognition }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError('このブラウザは音声認識に対応していません');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'ja-JP';
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsRecording(true);
        setError(null);
      };

      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            interimTranscript += result[0].transcript;
          }
        }

        if (finalTranscript) {
          setTranscript((prev) => prev + finalTranscript);
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setError('マイクへのアクセスが許可されていません');
        } else {
          setError(`音声認識エラー: ${event.error}`);
        }
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setError('音声認識の開始に失敗しました');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsRecording(false);
  }, []);

  const handleToggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleApply = () => {
    if (transcript.trim()) {
      onTranscript(transcript.trim());
      setTranscript('');
    }
  };

  const handleClear = () => {
    setTranscript('');
  };

  return (
    <div className="space-y-2">
      {/* 音声認識結果表示 */}
      <div className="relative">
        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full px-3 py-2 pr-12 border border-gray-300 rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          rows={3}
        />
        {/* マイクボタン */}
        <button
          type="button"
          onClick={handleToggleRecording}
          disabled={disabled}
          className={`absolute right-2 top-2 p-2 rounded-full transition-colors ${
            isRecording
              ? 'bg-red-500 text-white animate-pulse'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          title={isRecording ? '録音停止' : '音声入力開始'}
        >
          <svg
            className="w-5 h-5"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1 1.93c-3.94-.49-7-3.85-7-7.93h2c0 3.31 2.69 6 6 6s6-2.69 6-6h2c0 4.08-3.06 7.44-7 7.93V19h4v2H8v-2h4v-3.07z" />
          </svg>
        </button>
      </div>

      {/* エラー表示 */}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {/* 録音中インジケータ */}
      {isRecording && (
        <div className="flex items-center gap-2 text-sm text-red-600">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          録音中...
        </div>
      )}

      {/* アクションボタン */}
      {transcript && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleApply}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            入力を確定
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="px-3 py-1 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            クリア
          </button>
        </div>
      )}
    </div>
  );
};

export default VoiceRecordInput;
