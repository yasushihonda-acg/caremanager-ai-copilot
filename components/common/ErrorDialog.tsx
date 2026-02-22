import React from 'react';
import { ConfirmDialog } from './ConfirmDialog';

interface ErrorDialogProps {
  message: string | null;
  onClose: () => void;
}

export const ErrorDialog: React.FC<ErrorDialogProps> = ({ message, onClose }) => (
  <ConfirmDialog
    isOpen={!!message}
    title="エラー"
    message={message || ''}
    showCancel={false}
    onConfirm={onClose}
    onCancel={onClose}
  />
);
