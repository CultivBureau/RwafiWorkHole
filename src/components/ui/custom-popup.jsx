import React from 'react';

const CustomPopup = ({ isOpen, onClose, title, message, type = 'info' }) => {
    if (!isOpen) return null;

    const getTypeStyles = () => {
        switch (type) {
            case 'error':
                return {
                    icon: '⚠️',
                    iconBg: 'bg-red-100',
                    iconColor: 'text-red-600',
                    borderColor: 'border-red-200'
                };
            case 'success':
                return {
                    icon: '✅',
                    iconBg: 'bg-green-100',
                    iconColor: 'text-green-600',
                    borderColor: 'border-green-200'
                };
            case 'warning':
                return {
                    icon: '⚠️',
                    iconBg: 'bg-yellow-100',
                    iconColor: 'text-yellow-600',
                    borderColor: 'border-yellow-200'
                };
            default:
                return {
                    icon: 'ℹ️',
                    iconBg: 'bg-blue-100',
                    iconColor: 'text-blue-600',
                    borderColor: 'border-blue-200'
                };
        }
    };

    const styles = getTypeStyles();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop with stronger blur */}
            <div
                className="absolute inset-0 bg-black/20 backdrop-blur-md"
                onClick={onClose}
            />

            {/* Popup with glass effect */}
            <div className={`relative bg-white bg-opacity-95 backdrop-blur-lg rounded-xl shadow-2xl border-2 ${styles.borderColor} max-w-md w-full mx-4 transform transition-all duration-300 scale-100`}>
                {/* Header */}
                <div className="flex items-center p-6 border-b border-gray-100 border-opacity-50">
                    <div className={`flex items-center justify-center w-12 h-12 rounded-full ${styles.iconBg} mr-4`}>
                        <span className="text-2xl">{styles.icon}</span>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold" style={{ color: 'var(--text-color)' }}>
                            {title}
                        </h3>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    <p className="text-base" style={{ color: 'var(--sub-text-color)' }}>
                        {message}
                    </p>
                </div>

                {/* Footer */}
                <div className="flex justify-end p-6 border-t border-gray-100 border-opacity-50">
                    <button
                        onClick={onClose}
                        className="gradient-bg text-white px-6 py-2 rounded-lg font-semibold hover:opacity-90 transition-opacity duration-200 shadow-lg"
                    >
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CustomPopup;