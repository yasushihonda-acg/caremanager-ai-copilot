// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// =============================================================
// モック定義
// =============================================================
const CURRENT_VERSION = '1.0';
const DEMO_UID = 'demo-user-uid';

const mocks = vi.hoisted(() => ({
  getPrivacyConsent: vi.fn(),
  savePrivacyConsent: vi.fn(),
}));

vi.mock('../../services/firebase', () => ({
  getPrivacyConsent: mocks.getPrivacyConsent,
  savePrivacyConsent: mocks.savePrivacyConsent,
  DEMO_USER_UID: 'demo-user-uid',
}));

vi.mock('../../components/privacy/privacyContent', () => ({
  PRIVACY_POLICY_VERSION: '1.0',
}));

import { usePrivacyConsent } from '../../hooks/usePrivacyConsent';

describe('usePrivacyConsent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ----------------------------------------------------------
  // 初期状態
  // ----------------------------------------------------------
  describe('初期状態', () => {
    it('userId が null のとき consentStatus は loading のまま', () => {
      const { result } = renderHook(() => usePrivacyConsent(null));
      expect(result.current.consentStatus).toBe('loading');
    });

    it('デモユーザーUID の場合 Firestore を呼ばず即座に consented になる', async () => {
      const { result } = renderHook(() => usePrivacyConsent(DEMO_UID));
      await waitFor(() => {
        expect(result.current.consentStatus).toBe('consented');
      });
      expect(mocks.getPrivacyConsent).not.toHaveBeenCalled();
    });
  });

  // ----------------------------------------------------------
  // 同意状態チェック
  // ----------------------------------------------------------
  describe('Firestore 同意チェック', () => {
    it('同意記録なし（null）→ required', async () => {
      mocks.getPrivacyConsent.mockResolvedValue(null);
      const { result } = renderHook(() => usePrivacyConsent('user-1'));
      await waitFor(() => {
        expect(result.current.consentStatus).toBe('required');
      });
      expect(mocks.getPrivacyConsent).toHaveBeenCalledWith('user-1');
    });

    it('古いバージョンで同意済み → required（再同意要求）', async () => {
      mocks.getPrivacyConsent.mockResolvedValue({
        privacyConsentVersion: '0.9',
        privacyConsentAt: { toDate: () => new Date() },
      });
      const { result } = renderHook(() => usePrivacyConsent('user-1'));
      await waitFor(() => {
        expect(result.current.consentStatus).toBe('required');
      });
    });

    it('現在のバージョンで同意済み → consented', async () => {
      mocks.getPrivacyConsent.mockResolvedValue({
        privacyConsentVersion: CURRENT_VERSION,
        privacyConsentAt: { toDate: () => new Date() },
      });
      const { result } = renderHook(() => usePrivacyConsent('user-1'));
      await waitFor(() => {
        expect(result.current.consentStatus).toBe('consented');
      });
    });

    it('Firestore エラー時 → required（安全側に倒す）', async () => {
      mocks.getPrivacyConsent.mockRejectedValue(new Error('network error'));
      const { result } = renderHook(() => usePrivacyConsent('user-1'));
      await waitFor(() => {
        expect(result.current.consentStatus).toBe('required');
      });
    });
  });

  // ----------------------------------------------------------
  // saveConsent
  // ----------------------------------------------------------
  describe('saveConsent', () => {
    it('savePrivacyConsent を現在のバージョンで呼び、consented に遷移する', async () => {
      mocks.getPrivacyConsent.mockResolvedValue(null);
      mocks.savePrivacyConsent.mockResolvedValue(undefined);

      const { result } = renderHook(() => usePrivacyConsent('user-1'));
      await waitFor(() => expect(result.current.consentStatus).toBe('required'));

      await act(async () => {
        await result.current.saveConsent();
      });

      expect(mocks.savePrivacyConsent).toHaveBeenCalledWith('user-1', CURRENT_VERSION);
      expect(result.current.consentStatus).toBe('consented');
    });

    it('userId が null のとき savePrivacyConsent を呼ばない', async () => {
      const { result } = renderHook(() => usePrivacyConsent(null));

      await act(async () => {
        await result.current.saveConsent();
      });

      expect(mocks.savePrivacyConsent).not.toHaveBeenCalled();
    });

    it('保存中は isSaving が true になる', async () => {
      mocks.getPrivacyConsent.mockResolvedValue(null);
      let resolveSave!: () => void;
      mocks.savePrivacyConsent.mockImplementation(
        () => new Promise<void>((resolve) => { resolveSave = resolve; }),
      );

      const { result } = renderHook(() => usePrivacyConsent('user-1'));
      await waitFor(() => expect(result.current.consentStatus).toBe('required'));

      act(() => {
        result.current.saveConsent();
      });

      await waitFor(() => expect(result.current.isSaving).toBe(true));

      act(() => resolveSave());

      await waitFor(() => expect(result.current.isSaving).toBe(false));
    });
  });
});
