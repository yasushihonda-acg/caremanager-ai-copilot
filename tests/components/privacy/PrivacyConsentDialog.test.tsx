import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PrivacyConsentDialog } from '../../../components/privacy/PrivacyConsentDialog';

const defaultProps = {
  onConsent: vi.fn(),
  onShowPolicy: vi.fn(),
  onLogout: vi.fn(),
  isSaving: false,
};

describe('PrivacyConsentDialog', () => {
  // ----------------------------------------------------------
  // 表示
  // ----------------------------------------------------------
  describe('表示', () => {
    it('「プライバシーポリシーへの同意」というタイトルを表示する', () => {
      render(<PrivacyConsentDialog {...defaultProps} />);
      expect(screen.getByText('プライバシーポリシーへの同意')).toBeInTheDocument();
    });

    it('「同意してサービスを利用する」ボタンを表示する', () => {
      render(<PrivacyConsentDialog {...defaultProps} />);
      expect(screen.getByRole('button', { name: /同意してサービスを利用する/ })).toBeInTheDocument();
    });

    it('「プライバシーポリシー全文を読む」ボタンを表示する', () => {
      render(<PrivacyConsentDialog {...defaultProps} />);
      expect(screen.getByRole('button', { name: /プライバシーポリシー全文を読む/ })).toBeInTheDocument();
    });

    it('ログアウトボタンを表示する', () => {
      render(<PrivacyConsentDialog {...defaultProps} />);
      expect(screen.getByRole('button', { name: /ログアウト/ })).toBeInTheDocument();
    });
  });

  // ----------------------------------------------------------
  // チェックボックス制御
  // ----------------------------------------------------------
  describe('同意ボタンの活性制御', () => {
    it('チェックボックスOFF の場合、同意ボタンは disabled', () => {
      render(<PrivacyConsentDialog {...defaultProps} />);
      expect(screen.getByRole('button', { name: /同意してサービスを利用する/ })).toBeDisabled();
    });

    it('チェックボックスをONにすると同意ボタンが活性化する', async () => {
      render(<PrivacyConsentDialog {...defaultProps} />);
      const checkbox = screen.getByRole('checkbox');
      await userEvent.click(checkbox);
      expect(screen.getByRole('button', { name: /同意してサービスを利用する/ })).not.toBeDisabled();
    });
  });

  // ----------------------------------------------------------
  // インタラクション
  // ----------------------------------------------------------
  describe('インタラクション', () => {
    it('チェックON後に同意ボタンをクリックすると onConsent が呼ばれる', async () => {
      const onConsent = vi.fn().mockResolvedValue(undefined);
      render(<PrivacyConsentDialog {...defaultProps} onConsent={onConsent} />);
      await userEvent.click(screen.getByRole('checkbox'));
      await userEvent.click(screen.getByRole('button', { name: /同意してサービスを利用する/ }));
      expect(onConsent).toHaveBeenCalledOnce();
    });

    it('「全文を読む」ボタンをクリックすると onShowPolicy が呼ばれる', async () => {
      const onShowPolicy = vi.fn();
      render(<PrivacyConsentDialog {...defaultProps} onShowPolicy={onShowPolicy} />);
      await userEvent.click(screen.getByRole('button', { name: /プライバシーポリシー全文を読む/ }));
      expect(onShowPolicy).toHaveBeenCalledOnce();
    });

    it('ログアウトボタンをクリックすると onLogout が呼ばれる', async () => {
      const onLogout = vi.fn();
      render(<PrivacyConsentDialog {...defaultProps} onLogout={onLogout} />);
      await userEvent.click(screen.getByRole('button', { name: /ログアウト/ }));
      expect(onLogout).toHaveBeenCalledOnce();
    });
  });

  // ----------------------------------------------------------
  // 保存中ローディング状態
  // ----------------------------------------------------------
  describe('isSaving', () => {
    it('isSaving=true のとき「保存中...」と表示し、ボタンが disabled になる', () => {
      render(<PrivacyConsentDialog {...defaultProps} isSaving={true} />);
      expect(screen.getByText('保存中...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /保存中/ })).toBeDisabled();
    });
  });
});
