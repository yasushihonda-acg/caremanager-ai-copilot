// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOnboarding } from '../../hooks/useOnboarding';

const STORAGE_KEY = 'caremanager_onboarding_completed';

describe('useOnboarding', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('初期状態', () => {
    it('localStorageにキーがない場合、showTourはtrueになる', () => {
      const { result } = renderHook(() => useOnboarding());
      expect(result.current.showTour).toBe(true);
    });

    it('localStorageに完了フラグがある場合、showTourはfalseになる', () => {
      localStorage.setItem(STORAGE_KEY, 'true');
      const { result } = renderHook(() => useOnboarding());
      expect(result.current.showTour).toBe(false);
    });
  });

  describe('completeTour', () => {
    it('localStorageにフラグを保存しshowTourをfalseにする', () => {
      const { result } = renderHook(() => useOnboarding());
      expect(result.current.showTour).toBe(true);

      act(() => {
        result.current.completeTour();
      });

      expect(result.current.showTour).toBe(false);
      expect(localStorage.getItem(STORAGE_KEY)).toBe('true');
    });
  });

  describe('reopenTour', () => {
    it('completeTour後にreopenTourを呼ぶとshowTourがtrueに戻る', () => {
      const { result } = renderHook(() => useOnboarding());

      act(() => {
        result.current.completeTour();
      });
      expect(result.current.showTour).toBe(false);

      act(() => {
        result.current.reopenTour();
      });
      expect(result.current.showTour).toBe(true);
    });

    it('reopenTourはlocalStorageのフラグを変更しない（次回ログイン時は自動表示されない）', () => {
      localStorage.setItem(STORAGE_KEY, 'true');
      const { result } = renderHook(() => useOnboarding());

      act(() => {
        result.current.reopenTour();
      });

      expect(result.current.showTour).toBe(true);
      expect(localStorage.getItem(STORAGE_KEY)).toBe('true');
    });
  });
});
