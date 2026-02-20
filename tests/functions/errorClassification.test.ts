/**
 * Vertex AI エラー分類ロジック仕様テスト
 *
 * functions/src/vertexAi.ts の classifyVertexError と同等のロジックをテスト。
 * このテストは BE の仕様を文書化し、エラー分類の変更に気付けるようにする。
 *
 * テスト対象ルール（testing.md §5）:
 * - transient（429, 503, timeout） → 'unavailable'（リトライ可能）
 * - permanent（400, 404, その他） → 'internal'（終端エラー）
 */

import { describe, it, expect } from 'vitest';

// =============================================================
// BEのclassifyVertexError と同等のロジック
// ソース: functions/src/vertexAi.ts
// =============================================================
type HttpsErrorCode = 'unavailable' | 'internal' | 'resource-exhausted';

function classifyVertexError(error: unknown): { code: HttpsErrorCode; message: string } {
  const status = (error as { status?: number })?.status;
  const code = (error as { code?: string })?.code;
  const msg = error instanceof Error ? error.message : 'Unknown error';

  const isTransient =
    status === 429 ||
    status === 503 ||
    code === 'ETIMEDOUT' ||
    code === 'ECONNRESET' ||
    code === 'RESOURCE_EXHAUSTED' ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('503') ||
    msg.includes('429');

  if (isTransient) {
    return {
      code: 'unavailable',
      message: '一時的に利用できません。しばらくしてから再試行してください。',
    };
  }

  return { code: 'internal', message: msg };
}

// =============================================================
// テスト
// =============================================================

describe('Vertex AI エラー分類（classifyVertexError）', () => {
  describe('transientエラー → "unavailable"', () => {
    it('HTTP 429（Rate Limit Exceeded）はtransient', () => {
      const result = classifyVertexError({ status: 429 });
      expect(result.code).toBe('unavailable');
    });

    it('HTTP 503（Service Unavailable）はtransient', () => {
      const result = classifyVertexError({ status: 503 });
      expect(result.code).toBe('unavailable');
    });

    it('ETIMEDOUT コードはtransient', () => {
      const result = classifyVertexError({ code: 'ETIMEDOUT' });
      expect(result.code).toBe('unavailable');
    });

    it('ECONNRESET コードはtransient', () => {
      const result = classifyVertexError({ code: 'ECONNRESET' });
      expect(result.code).toBe('unavailable');
    });

    it('RESOURCE_EXHAUSTED コードはtransient', () => {
      const result = classifyVertexError({ code: 'RESOURCE_EXHAUSTED' });
      expect(result.code).toBe('unavailable');
    });

    it('メッセージにRESOURCE_EXHAUSTEDを含むErrorはtransient', () => {
      const result = classifyVertexError(new Error('RESOURCE_EXHAUSTED: quota exceeded'));
      expect(result.code).toBe('unavailable');
    });

    it('メッセージに"503"を含むErrorはtransient', () => {
      const result = classifyVertexError(new Error('Service returned 503'));
      expect(result.code).toBe('unavailable');
    });

    it('メッセージに"429"を含むErrorはtransient', () => {
      const result = classifyVertexError(new Error('Rate limit 429 exceeded'));
      expect(result.code).toBe('unavailable');
    });

    it('transientエラーは日本語の再試行メッセージを返す', () => {
      const result = classifyVertexError({ status: 429 });
      expect(result.message).toContain('一時的に利用できません');
      expect(result.message).toContain('再試行');
    });
  });

  describe('permanentエラー → "internal"', () => {
    it('HTTP 400（Bad Request）はpermanent', () => {
      const result = classifyVertexError({ status: 400 });
      expect(result.code).toBe('internal');
    });

    it('HTTP 404（Not Found）はpermanent', () => {
      const result = classifyVertexError({ status: 404 });
      expect(result.code).toBe('internal');
    });

    it('HTTP 422（Unprocessable Entity）はpermanent', () => {
      const result = classifyVertexError({ status: 422 });
      expect(result.code).toBe('internal');
    });

    it('未知のエラーオブジェクトはpermanent', () => {
      const result = classifyVertexError(new Error('JSON parse failed'));
      expect(result.code).toBe('internal');
    });

    it('nullはpermanentで"Unknown error"メッセージ', () => {
      const result = classifyVertexError(null);
      expect(result.code).toBe('internal');
      expect(result.message).toBe('Unknown error');
    });

    it('undefinedはpermanentで"Unknown error"メッセージ', () => {
      const result = classifyVertexError(undefined);
      expect(result.code).toBe('internal');
      expect(result.message).toBe('Unknown error');
    });

    it('permanentエラーはError.messageをそのまま返す', () => {
      const result = classifyVertexError(new Error('Invalid JSON response from model'));
      expect(result.code).toBe('internal');
      expect(result.message).toBe('Invalid JSON response from model');
    });
  });

  describe('エラーコードの境界値', () => {
    it('status=500はpermanent（503のみtransient）', () => {
      const result = classifyVertexError({ status: 500 });
      expect(result.code).toBe('internal');
    });

    it('status=428はpermanent（429のみtransient）', () => {
      const result = classifyVertexError({ status: 428 });
      expect(result.code).toBe('internal');
    });

    it('status=0はpermanent', () => {
      const result = classifyVertexError({ status: 0 });
      expect(result.code).toBe('internal');
    });
  });
});
