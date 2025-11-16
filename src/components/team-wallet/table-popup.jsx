import React from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";

const TablePopup = ({ isOpen, onClose, record }) => {
    const { t, i18n } = useTranslation();
    const isArabic = i18n.language === "ar";

    if (!isOpen || !record) return null;

    const getStatusBadge = (status) => {
        const statusConfig = {
            approved: { bg: "bg-green-100", text: "text-green-700", label: t("walletTable.status.approved", "Approved") },
            pending: { bg: "bg-yellow-100", text: "text-yellow-700", label: t("walletTable.status.pending", "Pending") },
            rejected: { bg: "bg-red-100", text: "text-red-700", label: t("walletTable.status.rejected", "Rejected") }
        };

        const config = statusConfig[status?.toLowerCase()] || statusConfig.approved;

        return (
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
                {config.label}
            </span>
        );
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                style={{
                    backgroundColor: 'var(--bg-color)',
                    borderColor: 'var(--border-color)'
                }}
                dir={isArabic ? "rtl" : "ltr"}
            >
                {/* Header */}
                <div
                    className="flex items-center justify-between p-6 border-b"
                    style={{ borderColor: 'var(--divider-color)' }}
                >
                    <h2
                        className="text-xl font-semibold"
                        style={{ color: 'var(--text-color)' }}
                    >
                        {t("walletPopup.title", "Transaction Details")}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                    >
                        <X className="w-5 h-5" style={{ color: 'var(--sub-text-color)' }} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {/* Grid Layout for most fields */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Transaction Date */}
                        <div
                            className="p-4 rounded-lg border"
                            style={{
                                backgroundColor: 'var(--table-header-bg)',
                                borderColor: 'var(--border-color)'
                            }}
                        >
                            <label
                                className="text-sm font-medium block mb-2"
                                style={{ color: 'var(--sub-text-color)' }}
                            >
                                {t("walletTable.columns.transactionDate", "Transaction Date")}
                            </label>
                            <p
                                className="text-base font-medium"
                                style={{ color: 'var(--text-color)' }}
                            >
                                {record.transactionDate}
                            </p>
                        </div>

                        {/* Issued By */}
                        <div
                            className="p-4 rounded-lg border"
                            style={{
                                backgroundColor: 'var(--table-header-bg)',
                                borderColor: 'var(--border-color)'
                            }}
                        >
                            <label
                                className="text-sm font-medium block mb-2"
                                style={{ color: 'var(--sub-text-color)' }}
                            >
                                {t("walletTable.columns.issuedBy", "Issued by")}
                            </label>
                            <div className="flex items-center gap-3">
                                <img
                                    src={`https://i.pravatar.cc/32?img=${record.id}`}
                                    alt={record.issuedBy}
                                    className="w-8 h-8 rounded-full"
                                />
                                <span
                                    className="font-medium"
                                    style={{ color: 'var(--text-color)' }}
                                >
                                    {record.issuedBy}
                                </span>
                            </div>
                        </div>

                        {/* Action */}
                        <div
                            className="p-4 rounded-lg border"
                            style={{
                                backgroundColor: 'var(--table-header-bg)',
                                borderColor: 'var(--border-color)'
                            }}
                        >
                            <label
                                className="text-sm font-medium block mb-2"
                                style={{ color: 'var(--sub-text-color)' }}
                            >
                                {t("walletTable.columns.action", "Action")}
                            </label>
                            <p
                                className="text-base font-medium"
                                style={{ color: 'var(--text-color)' }}
                            >
                                {record.action}
                            </p>
                        </div>

                        {/* Amount */}
                        <div
                            className="p-4 rounded-lg border"
                            style={{
                                backgroundColor: 'var(--table-header-bg)',
                                borderColor: 'var(--border-color)'
                            }}
                        >
                            <label
                                className="text-sm font-medium block mb-2"
                                style={{ color: 'var(--sub-text-color)' }}
                            >
                                {t("walletTable.columns.amount", "Amount")}
                            </label>
                            <p
                                className="text-lg font-bold"
                                style={{ color: 'var(--error-color)' }}
                            >
                                {record.amount}
                            </p>
                        </div>

                        {/* Status */}
                        <div
                            className="p-4 rounded-lg border col-span-2"
                            style={{
                                backgroundColor: 'var(--table-header-bg)',
                                borderColor: 'var(--border-color)'
                            }}
                        >
                            <label
                                className="text-sm font-medium block mb-2"
                                style={{ color: 'var(--sub-text-color)' }}
                            >
                                {t("walletTable.columns.status", "Status")}
                            </label>
                            <div>
                                {getStatusBadge(record.status)}
                            </div>
                        </div>
                    </div>

                    {/* Full Reason - Full Width */}
                    <div
                        className="p-4 rounded-lg border"
                        style={{
                            backgroundColor: 'var(--table-header-bg)',
                            borderColor: 'var(--border-color)'
                        }}
                    >
                        <label
                            className="text-sm font-medium block mb-2"
                            style={{ color: 'var(--sub-text-color)' }}
                        >
                            {t("walletTable.columns.reason", "Reason")}
                        </label>
                        <p
                            className="text-sm leading-relaxed"
                            style={{ color: 'var(--text-color)' }}
                        >
                            {record.fullReason || record.reason}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TablePopup;