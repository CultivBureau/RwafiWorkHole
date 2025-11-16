import React, { useState } from 'react';
import { AlertTriangle, X, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

const ConfirmModal = ({ title, message, onCancel, onConfirm, type = 'danger' }) => {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
      toast.success(
        isRtl ? 'تم الحذف بنجاح' : 'Deleted successfully',
        {
          icon: '🗑️',
          style: {
            background: 'var(--bg-color)',
            color: 'var(--text-color)',
            border: '1px solid var(--border-color)',
          }
        }
      );
    } catch (error) {
      toast.error(
        isRtl ? 'فشل في الحذف' : 'Failed to delete',
        {
          icon: '❌',
          style: {
            background: 'var(--bg-color)',
            color: 'var(--text-color)',
            border: '1px solid var(--border-color)',
          }
        }
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-lg bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div 
        className="w-full max-w-sm rounded-2xl shadow-2xl transform transition-all duration-300"
        style={{ backgroundColor: 'var(--bg-color)' }}
      >
        {/* Header */}
        <div className="text-center p-6">
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: '#FEF2F2' }}
          >
            <AlertTriangle size={32} className="text-red-500" />
          </div>
          
          <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-color)' }}>
            {title}
          </h2>
          
          <p className="text-sm leading-relaxed" style={{ color: 'var(--sub-text-color)' }}>
            {message}
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 p-6 pt-0">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 px-4 py-3 rounded-xl border font-medium transition-all duration-200 disabled:opacity-50"
            style={{
              backgroundColor: 'var(--bg-color)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-color)',
            }}
          >
            {isRtl ? 'إلغاء' : 'Cancel'}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className="flex-1 px-4 py-3 rounded-xl text-white font-medium transition-all duration-200 hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
            style={{
              backgroundColor: '#EF4444',
              '&:hover': { backgroundColor: '#DC2626' }
            }}
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <>
                <Trash2 size={16} />
                {isRtl ? 'حذف' : 'Delete'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;