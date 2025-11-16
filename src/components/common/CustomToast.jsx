import React, { useEffect } from 'react';
import { X, Rocket } from 'lucide-react';

const CustomToast = ({ message, isVisible, onClose, isArabic = false }) => {
    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(() => {
                onClose();
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [isVisible, onClose]);

    if (!isVisible) return null;

    return (
        <div
            className={`fixed bottom-4 z-[9999] ${isArabic
                ? 'left-4 animate-toast-slide-in-rtl'
                : 'right-4 animate-toast-slide-in'
                }`}
        >
            <div
                className="flex items-center gap-3 px-5 py-4 rounded-xl shadow-xl border backdrop-blur-sm min-w-[280px]"
                style={{
                    background: 'var(--bg-color)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-color)',
                    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
                    direction: isArabic ? 'rtl' : 'ltr',
                }}
            >
                <div className="flex-shrink-0">
                    <Rocket className="w-6 h-6 text-blue-500" />
                </div>
                <div className="flex-1">
                    <span className="font-semibold text-lg">{message}</span>
                </div>
                <button
                    onClick={onClose}
                    className="flex-shrink-0 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                    style={{
                        color: 'var(--sub-text-color)',
                    }}
                >
                    <X className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

export default CustomToast;