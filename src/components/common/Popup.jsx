import React from 'react';
import { X } from 'lucide-react';

const Popup = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed  inset-0 z-[9999] flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/20 backdrop-blur-lg"
                onClick={onClose}
            />

            {/* Popup Content */}
            <div
                className="relative h-min bg-[var(--bg-all)] rounded-xl shadow-2xl border border-[var(--border-color)] p-6 m-4 animate-popup-scale"
                style={{ maxWidth: "500px", width: "100%" }}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <h2
                        className="text-lg font-semibold gradient-text"
                        style={{ color: "var(--text-color)" }}
                    >
                        {title}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-[var(--hover-color)] transition-colors"
                    >
                        <X className="w-5 h-5" style={{ color: "var(--sub-text-color)" }} />
                    </button>
                </div>

                {/* Content */}
                <div className="max-h-[70vh] mx-2 rounded-xl overflow-auto">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Popup;