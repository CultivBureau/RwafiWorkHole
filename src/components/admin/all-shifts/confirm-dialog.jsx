import React from 'react';
import { useTranslation } from 'react-i18next';
import { X, AlertTriangle } from 'lucide-react';

const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, confirmText, cancelText, type = 'danger' }) => {
    const { t, i18n } = useTranslation();
    const isArabic = i18n.language === "ar";

    if (!isOpen) return null;

    const handleConfirm = () => {
        onConfirm();
        onClose();
    };

    const handleCancel = () => {
        onClose();
    };

    const getColors = () => {
        switch (type) {
            case 'brand':
                return {
                    iconColor: 'var(--accent-color)',
                    iconBgSoft: 'linear-gradient(135deg, rgba(21,145,155,0.15), rgba(9,209,199,0.12))',
                    buttonBg: 'linear-gradient(135deg, #15919B, #09D1C7)',
                    buttonText: '#ffffff',
                    buttonShadow: '0 10px 25px rgba(21,145,155,0.35)',
                    buttonBorder: 'transparent'
                };
            case 'warning':
                return {
                    iconColor: 'var(--warning-color)',
                    iconBgSoft: 'color-mix(in srgb, var(--warning-color) 18%, transparent)',
                    buttonBg: 'var(--warning-color)',
                    buttonText: '#ffffff'
                };
            case 'danger':
                return {
                    iconColor: 'var(--error-color)',
                    iconBgSoft: 'color-mix(in srgb, var(--error-color) 18%, transparent)',
                    buttonBg: 'var(--error-color)',
                    buttonText: '#ffffff'
                };
            default:
                return {
                    iconColor: 'var(--info-color)',
                    iconBgSoft: 'color-mix(in srgb, var(--info-color) 18%, transparent)',
                    buttonBg: 'var(--info-color)',
                    buttonText: '#ffffff'
                };
        }
    };

    const colors = getColors();

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity"
                onClick={handleCancel}
            />

            {/* Dialog */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div
                    className="rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                    style={{
                        backgroundColor: 'var(--bg-color)',
                        border: '1px solid var(--border-color)'
                    }}
                    dir={isArabic ? 'rtl' : 'ltr'}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="p-6 border-b" style={{ borderColor: 'var(--border-color)' }}>
                        <div className={`flex items-center gap-3 ${isArabic ? 'flex-row-reverse' : ''}`}>
                            <div
                                className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-inner"
                                style={{ background: colors.iconBgSoft || 'var(--hover-color)' }}
                            >
                                <AlertTriangle
                                    className="w-6 h-6"
                                    style={{ color: colors.iconColor }}
                                />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold" style={{ color: 'var(--text-color)' }}>
                                    {title || t('confirm.title', 'Confirm Action')}
                                </h3>
                            </div>
                            <button
                                onClick={handleCancel}
                                className="p-1 rounded-lg hover:bg-[var(--hover-color)] transition-colors"
                                style={{ color: 'var(--sub-text-color)' }}
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        <p className={`text-sm ${isArabic ? 'text-right' : 'text-left'}`} style={{ color: 'var(--text-color)' }}>
                            {message || t('confirm.message', 'Are you sure you want to proceed?')}
                        </p>
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t flex gap-3" style={{ borderColor: 'var(--border-color)' }}>
                        <button
                            onClick={handleCancel}
                            className="flex-1 px-4 py-2.5 rounded-lg border font-medium text-sm transition-all duration-200 hover:bg-[var(--hover-color)]"
                            style={{
                                borderColor: 'var(--border-color)',
                                color: 'var(--text-color)'
                            }}
                        >
                            {cancelText || t('confirm.cancel', 'Cancel')}
                        </button>
                        <button
                            onClick={handleConfirm}
                            className="flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 hover:opacity-90 border"
                            style={{
                                background: colors.buttonBg,
                                color: colors.buttonText || '#ffffff',
                                borderColor: colors.buttonBorder || colors.buttonBg,
                                boxShadow: colors.buttonShadow || 'none'
                            }}
                        >
                            {confirmText || t('confirm.confirm', 'Confirm')}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ConfirmDialog;

