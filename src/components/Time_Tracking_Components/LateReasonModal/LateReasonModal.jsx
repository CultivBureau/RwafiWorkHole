import React, { useState } from "react";
import { X, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

const LateReasonModal = ({ isOpen, onClose, onConfirm, isArabic }) => {
  const { t } = useTranslation();
  const [reason, setReason] = useState("");

  const handleConfirm = () => {
    if (reason.trim()) {
      onConfirm(reason.trim());
      handleClose();
    }
  };

  const handleClose = () => {
    setReason("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop with blur */}
      <div 
        className="fixed inset-0 z-[9998] bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
        <div
          className={`pointer-events-auto bg-[var(--bg-color)] rounded-xl border border-[var(--border-color)] shadow-2xl w-full max-w-md animate-popup-scale ${
            isArabic ? "rtl" : "ltr"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-500/10 rounded-lg">
              <AlertCircle className="w-4 h-4 text-amber-500" />
            </div>
            <h3 className="text-base font-semibold text-[var(--text-color)]">
              {isArabic ? "تسجيل متأخر" : "Late Arrival"}
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 hover:bg-[var(--hover-color)] rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-[var(--sub-text-color)]" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          <p className="text-sm text-[var(--text-color)]">
            {isArabic
              ? "يرجى إدخال سبب التأخير:"
              : "Please enter the reason for being late:"}
          </p>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={
              isArabic
                ? "مثال: تأخرت بسبب ازدحام المرور..."
                : "Example: I was late due to traffic..."
            }
            rows={4}
            className="w-full px-3 py-2 border border-[var(--border-color)] rounded-lg bg-[var(--bg-color)] text-[var(--text-color)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent resize-none"
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-[var(--border-color)]">
          <button
            onClick={handleClose}
            className="px-3 py-1.5 text-sm text-[var(--text-color)] hover:bg-[var(--hover-color)] rounded-lg transition-colors"
          >
            {isArabic ? "إلغاء" : "Cancel"}
          </button>
          <button
            onClick={handleConfirm}
            disabled={!reason.trim()}
            className="px-3 py-1.5 text-sm bg-[var(--accent-color)] text-white rounded-lg hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isArabic ? "تأكيد" : "Confirm"}
          </button>
        </div>
      </div>
    </div>
    </>
  );
};

export default LateReasonModal;

