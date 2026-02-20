import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CarePlanStatusBar } from '../../../components/careplan/CarePlanStatusBar';

describe('CarePlanStatusBar', () => {
  it('現在のステータスを強調表示する', () => {
    render(<CarePlanStatusBar status="review" onAdvance={vi.fn()} />);
    // 現在ステータス「確認中」は● マーカーで表示される
    const steps = screen.getAllByText('確認中');
    expect(steps.length).toBeGreaterThan(0);
  });

  it('全4ステップのラベルを表示する', () => {
    render(<CarePlanStatusBar status="draft" onAdvance={vi.fn()} />);
    expect(screen.getByText('下書き')).toBeInTheDocument();
    expect(screen.getByText('確認中')).toBeInTheDocument();
    expect(screen.getByText('同意済')).toBeInTheDocument();
    expect(screen.getByText('運用中')).toBeInTheDocument();
  });

  it('次のステータスに進めるボタンが表示される（draft → review）', () => {
    render(<CarePlanStatusBar status="draft" onAdvance={vi.fn()} />);
    expect(screen.getByRole('button', { name: /確認中.*に進める/ })).toBeInTheDocument();
  });

  it('ボタンクリックで onAdvance が呼ばれる', async () => {
    const onAdvance = vi.fn();
    render(<CarePlanStatusBar status="draft" onAdvance={onAdvance} />);
    await userEvent.click(screen.getByRole('button', { name: /確認中.*に進める/ }));
    expect(onAdvance).toHaveBeenCalledWith('review');
  });

  it('active（最終）ステータスでは進めるボタンを表示しない', () => {
    render(<CarePlanStatusBar status="active" onAdvance={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /に進める/ })).not.toBeInTheDocument();
  });

  it('過去ステップには ✓ マークを表示する', () => {
    render(<CarePlanStatusBar status="consented" onAdvance={vi.fn()} />);
    // draft・review は過去ステップ
    const checkMarks = screen.getAllByText('✓');
    expect(checkMarks).toHaveLength(2);
  });
});
