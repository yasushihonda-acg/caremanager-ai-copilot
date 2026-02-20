import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MonitoringCompareField } from '../../../components/monitoring/MonitoringCompareField';

describe('MonitoringCompareField', () => {
  describe('テキスト入力フィールド', () => {
    it('ラベルと現在値を表示する', () => {
      render(
        <MonitoringCompareField
          label="血圧"
          fieldType="text"
          currentValue="130/80"
          onChange={vi.fn()}
        />
      );
      expect(screen.getByText('血圧')).toBeInTheDocument();
      expect(screen.getByDisplayValue('130/80')).toBeInTheDocument();
    });

    it('入力変更で onChange が呼ばれる', async () => {
      const onChange = vi.fn();
      render(
        <MonitoringCompareField
          label="メモ"
          fieldType="text"
          currentValue=""
          onChange={onChange}
        />
      );
      await userEvent.type(screen.getByRole('textbox'), 'abc');
      expect(onChange).toHaveBeenCalled();
    });
  });

  describe('前回値の比較表示', () => {
    it('前回値がある場合は前回値セクションを表示する', () => {
      render(
        <MonitoringCompareField
          label="体重"
          fieldType="text"
          currentValue="55kg"
          previousValue="53kg"
          onChange={vi.fn()}
        />
      );
      expect(screen.getByText(/前回:/)).toBeInTheDocument();
      expect(screen.getByText('53kg')).toBeInTheDocument();
    });

    it('前回値がない場合は前回値セクションを表示しない', () => {
      render(
        <MonitoringCompareField
          label="体重"
          fieldType="text"
          currentValue="55kg"
          onChange={vi.fn()}
        />
      );
      expect(screen.queryByText(/前回:/)).not.toBeInTheDocument();
    });

    it('値が変わった場合は「変更あり」バッジを表示する', () => {
      render(
        <MonitoringCompareField
          label="体重"
          fieldType="text"
          currentValue="55kg"
          previousValue="53kg"
          onChange={vi.fn()}
        />
      );
      expect(screen.getByText('⚡ 変更あり')).toBeInTheDocument();
    });

    it('値が同じ場合は「変更あり」バッジを表示しない', () => {
      render(
        <MonitoringCompareField
          label="体重"
          fieldType="text"
          currentValue="55kg"
          previousValue="55kg"
          onChange={vi.fn()}
        />
      );
      expect(screen.queryByText('⚡ 変更あり')).not.toBeInTheDocument();
    });

    it('「コピー」ボタンをクリックすると前回値で onChange が呼ばれる', async () => {
      const onChange = vi.fn();
      render(
        <MonitoringCompareField
          label="体重"
          fieldType="text"
          currentValue="55kg"
          previousValue="53kg"
          onChange={onChange}
        />
      );
      await userEvent.click(screen.getByRole('button', { name: 'コピー' }));
      expect(onChange).toHaveBeenCalledWith('53kg');
    });
  });

  describe('textarea フィールド', () => {
    it('textareaとして描画され、現在値を表示する', () => {
      render(
        <MonitoringCompareField
          label="観察メモ"
          fieldType="textarea"
          currentValue="問題なし"
          onChange={vi.fn()}
        />
      );
      // textarea は label と htmlFor で関連付けられていないため role のみで検索
      const textarea = screen.getByRole('textbox');
      expect(textarea.tagName).toBe('TEXTAREA');
      expect(screen.getByDisplayValue('問題なし')).toBeInTheDocument();
    });
  });

  describe('select フィールド', () => {
    const options = [
      { value: 'good', label: '良好' },
      { value: 'poor', label: '不良' },
    ];

    it('selectオプションを表示する', () => {
      render(
        <MonitoringCompareField
          label="状態"
          fieldType="select"
          currentValue="good"
          selectOptions={options}
          onChange={vi.fn()}
        />
      );
      expect(screen.getByRole('combobox')).toBeInTheDocument();
      expect(screen.getByText('良好')).toBeInTheDocument();
      expect(screen.getByText('不良')).toBeInTheDocument();
    });

    it('前回値をラベル表示に変換して表示する', () => {
      render(
        <MonitoringCompareField
          label="状態"
          fieldType="select"
          currentValue="good"
          previousValue="poor"
          selectOptions={options}
          onChange={vi.fn()}
        />
      );
      // "不良" は option 要素と前回値テキストの両方に現れる
      const matches = screen.getAllByText('不良');
      expect(matches.length).toBeGreaterThanOrEqual(2);
      // 前回値セクション内の p 要素として存在することを確認
      const prevValueEl = matches.find(el => el.tagName === 'P');
      expect(prevValueEl).toBeTruthy();
    });
  });

  describe('showDiff=false の場合', () => {
    it('前回値セクションを非表示にする', () => {
      render(
        <MonitoringCompareField
          label="体重"
          fieldType="text"
          currentValue="55kg"
          previousValue="53kg"
          showDiff={false}
          onChange={vi.fn()}
        />
      );
      expect(screen.queryByText(/前回:/)).not.toBeInTheDocument();
      expect(screen.queryByText('⚡ 変更あり')).not.toBeInTheDocument();
    });
  });
});
