import React, { useState } from 'react';
import { Modal } from './Modal';
import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  requireMatchString?: string;
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDanger = false,
  requireMatchString,
  isLoading = false,
}) => {
  const [typedString, setTypedString] = useState('');

  const isMatched = !requireMatchString || typedString === requireMatchString;

  const handleConfirm = () => {
    if (isMatched && !isLoading) {
      onConfirm();
      setTypedString('');
    }
  };

  const handleClose = () => {
    setTypedString('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title} maxWidth="md">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div
            className={`p-2 rounded-full shrink-0 ${
              isDanger ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
            }`}
          >
            <AlertTriangle className="h-5 w-5" />
          </div>
          <p className="text-xs leading-relaxed text-slate-700 mt-1">{message}</p>
        </div>

        {requireMatchString && (
          <div className="space-y-1.5 pt-2 border-t border-slate-200">
            <label className="block text-xs font-medium text-slate-700">
              Type <span className="font-semibold select-all font-mono">{requireMatchString}</span> to confirm:
            </label>
            <input
              type="text"
              value={typedString}
              onChange={(e) => setTypedString(e.target.value)}
              placeholder={requireMatchString}
              className="w-full px-2.5 py-1.5 text-xs font-mono border border-slate-300 rounded bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F6CBD]"
            />
          </div>
        )}

        <div className="flex justify-end items-center gap-2 pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className="px-3 py-1.5 text-xs font-medium border border-slate-300 rounded bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!isMatched || isLoading}
            className={`px-3 py-1.5 text-xs font-medium text-white rounded transition-colors disabled:opacity-50 ${
              isDanger ? 'bg-rose-600 hover:bg-rose-700' : 'bg-[#0F6CBD] hover:bg-[#005a9e]'
            }`}
          >
            {isLoading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};
