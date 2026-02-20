import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ClientContextBar } from '../../../components/clients/ClientContextBar';
import type { Client } from '../../../types';

const baseClient: Client = {
  id: 'client-1',
  name: '田中 花子',
  kana: 'たなか はなこ',
  birthDate: '1940-05-15',
  gender: '女',
  careLevel: '要介護2',
  lifeHistory: {
    hobbies: ['園芸'],
    previousOccupation: '主婦',
    topicsToAvoid: [],
    importantMemories: '孫との思い出',
  },
  medicalAlerts: [],
  address: '東京都新宿区1-1-1',
  phone: '03-1234-5678',
  insurerNumber: null,
  insuredNumber: null,
  certificationDate: '2025-01-01',
  certificationExpiry: '2027-01-31',
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
  isActive: true,
};

describe('ClientContextBar', () => {
  it('利用者名を表示する', () => {
    render(<ClientContextBar client={baseClient} onBack={vi.fn()} onEdit={vi.fn()} />);
    expect(screen.getByText('田中 花子')).toBeInTheDocument();
  });

  it('介護度を表示する', () => {
    render(<ClientContextBar client={baseClient} onBack={vi.fn()} onEdit={vi.fn()} />);
    expect(screen.getByText('要介護2')).toBeInTheDocument();
  });

  it('戻るボタンをクリックすると onBack が呼ばれる', async () => {
    const onBack = vi.fn();
    render(<ClientContextBar client={baseClient} onBack={onBack} onEdit={vi.fn()} />);
    const backButton = screen.getByTitle ? screen.getByRole('button', { name: /一覧/ }) : screen.getAllByRole('button')[0];
    await userEvent.click(backButton);
    expect(onBack).toHaveBeenCalledOnce();
  });

  it('編集ボタンをクリックすると onEdit が呼ばれる', async () => {
    const onEdit = vi.fn();
    render(<ClientContextBar client={baseClient} onBack={vi.fn()} onEdit={onEdit} />);
    await userEvent.click(screen.getByTitle('利用者情報を編集'));
    expect(onEdit).toHaveBeenCalledOnce();
  });

  it('医療アラートがある場合はアラートバッジを表示する', () => {
    const clientWithAlerts: Client = {
      ...baseClient,
      medicalAlerts: ['ペースメーカー', 'ペニシリンアレルギー'],
    };
    render(<ClientContextBar client={clientWithAlerts} onBack={vi.fn()} onEdit={vi.fn()} />);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('医療アラートがない場合はアラートバッジを表示しない', () => {
    render(<ClientContextBar client={baseClient} onBack={vi.fn()} onEdit={vi.fn()} />);
    // medicalAlerts.length === 0 なのでアラートバッジなし
    // careLevel バッジ（要介護2）だけが存在する
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('認定期限が安全圏なら期限バッジを表示しない', () => {
    // certificationExpiry = '2027-01-31' は安全圏（今日2026-02-21より1年以上先）
    render(<ClientContextBar client={baseClient} onBack={vi.fn()} onEdit={vi.fn()} />);
    expect(screen.queryByText(/日後/)).not.toBeInTheDocument();
  });
});
