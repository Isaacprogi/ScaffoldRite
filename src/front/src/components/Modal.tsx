// src/components/Modal.tsx
import { X } from 'lucide-react';

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
};

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-[#1e1e1e] rounded-lg w-full max-w-md mx-4 border border-[#2d2d2d]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#2d2d2d]">
          <h2 className="text-sm font-medium text-[#e4e4e4]">{title}</h2>
          <button onClick={onClose} className="text-[#808080] hover:text-[#e4e4e4]">
            <X size={16} />
          </button>
        </div>
        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
}