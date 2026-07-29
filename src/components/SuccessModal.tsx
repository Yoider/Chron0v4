"use client";

import React, { useEffect } from "react";

interface SuccessModalProps {
  isOpen: boolean;
  message: string;
  onClose: () => void;
}

export default function SuccessModal({ isOpen, message, onClose }: SuccessModalProps) {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#151932] border border-[#252a52] rounded-2xl p-8 flex flex-col items-center max-w-sm w-full mx-4 shadow-2xl space-y-4 animate-scaleUp relative">
        {/* Close button (x) */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#7c8ba1] hover:text-white transition-colors text-md font-bold leading-none select-none"
          title="Cerrar"
        >
          &times;
        </button>
        {/* Animated Checkmark Icon */}
        <div className="success-checkmark">
          <div className="check-icon">
            <span className="icon-line line-tip"></span>
            <span className="icon-line line-long"></span>
            <div className="icon-circle"></div>
          </div>
        </div>

        <div className="text-center space-y-1.5 pt-2">
          <h4 className="text-lg font-bold text-white tracking-wide">¡Éxito!</h4>
          <p className="text-xs text-[#7c8ba1] font-medium leading-relaxed px-4">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}
