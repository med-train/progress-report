
import React from 'react';
import { MailIcon, WhatsAppIcon, XCircleIcon } from './icons';

interface SendModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmSend: (type: 'email' | 'whatsapp') => void;
  candidateCount: number;
  isSending: boolean;
}

const SendModal: React.FC<SendModalProps> = ({ isOpen, onClose, onConfirmSend, candidateCount, isSending }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60" aria-modal="true" role="dialog">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md m-4">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-bold text-gray-800">Send Notifications</h2>
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600" disabled={isSending}>
              <XCircleIcon className="w-8 h-8"/>
            </button>
          </div>
          <p className="text-gray-600 mb-6">
            You have selected <span className="font-bold text-blue-600">{candidateCount}</span> candidate(s).
            How would you like to notify them?
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => onConfirmSend('email')}
              disabled={isSending}
              className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              <MailIcon className="w-6 h-6" />
              <span>{isSending ? 'Sending...' : 'Send via Email'}</span>
            </button>
            <button
              onClick={() => onConfirmSend('whatsapp')}
              disabled={isSending}
              className="w-full flex items-center justify-center gap-3 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 disabled:bg-green-400 disabled:cursor-not-allowed"
            >
              <WhatsAppIcon className="w-6 h-6" />
              <span>{isSending ? 'Sending...' : 'Send via WhatsApp'}</span>
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            Note: For WhatsApp, only candidates with a valid phone number will receive a message.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SendModal;
