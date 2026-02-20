import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GoalEvaluation } from '../../../components/monitoring/GoalEvaluation';

const defaultProps = {
  goalId: 'goal-1',
  goalContent: '室内歩行が自立できる',
  status: 'not_evaluated' as const,
  observation: '',
  onStatusChange: vi.fn(),
  onObservationChange: vi.fn(),
};

describe('GoalEvaluation', () => {
  it('目標内容を表示する', () => {
    render(<GoalEvaluation {...defaultProps} />);
    expect(screen.getByText('室内歩行が自立できる')).toBeInTheDocument();
  });

  it('5つの評価ステータスボタンを表示する', () => {
    render(<GoalEvaluation {...defaultProps} />);
    expect(screen.getByRole('button', { name: '達成' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '改善傾向' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '変化なし' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '悪化傾向' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '未評価' })).toBeInTheDocument();
  });

  it('ステータスボタンをクリックすると onStatusChange が呼ばれる', async () => {
    const onStatusChange = vi.fn();
    render(<GoalEvaluation {...defaultProps} onStatusChange={onStatusChange} />);
    await userEvent.click(screen.getByRole('button', { name: '達成' }));
    expect(onStatusChange).toHaveBeenCalledWith('achieved');
  });

  it('現在のステータスに対応するボタンが選択スタイルになる', () => {
    render(<GoalEvaluation {...defaultProps} status="progressing" />);
    const button = screen.getByRole('button', { name: '改善傾向' });
    expect(button.className).toContain('ring-2');
  });

  it('観察内容テキストエリアに入力すると onObservationChange が呼ばれる', async () => {
    const onObservationChange = vi.fn();
    render(<GoalEvaluation {...defaultProps} onObservationChange={onObservationChange} />);
    const textarea = screen.getByPlaceholderText('具体的な状態や変化を記録...');
    await userEvent.type(textarea, '歩行器を使って10m歩けるようになった');
    expect(onObservationChange).toHaveBeenCalled();
  });

  it('既存の観察内容を表示する', () => {
    render(<GoalEvaluation {...defaultProps} observation="週3回リハビリ継続中" />);
    const textarea = screen.getByDisplayValue('週3回リハビリ継続中');
    expect(textarea).toBeInTheDocument();
  });
});
