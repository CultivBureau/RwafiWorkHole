import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight, Eye } from "lucide-react";
import TablePopup from "./table-popup";

const TeamWalletTable = () => {
    const { t, i18n } = useTranslation();
    const isArabic = i18n.language === "ar";
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const itemsPerPage = 6;

    // Sample data matching the screenshot
    const walletData = [
        {
            id: 1,
            transactionDate: "Sep 9, 2024, 04:30pm",
            issuedBy: "Shamy wael",
            action: "Late Arrival",
            reason: "Will help the team soon",
            fullReason: "Will help the team soon. The employee was late due to traffic conditions and will make sure to leave earlier next time to avoid such delays. This is a one-time occurrence and measures have been taken to prevent future incidents.",
            amount: "EGP 1,000-",
            status: "Approved"
        },
        {
            id: 2,
            transactionDate: "Sep 9, 2024, 04:30pm",
            issuedBy: "Shamy wael",
            action: "Absence",
            reason: "Will help the team soon",
            fullReason: "Will help the team soon. Employee was absent due to personal emergency. Proper documentation has been provided and this absence has been approved by management after review.",
            amount: "EGP 1,000-",
            status: "Approved"
        },
        {
            id: 3,
            transactionDate: "Sep 9, 2024, 04:30pm",
            issuedBy: "Shamy wael",
            action: "Missed Deadline",
            reason: "Will help the team soon",
            fullReason: "Will help the team soon. The deadline was missed due to unforeseen circumstances. The employee has communicated the issues faced and is taking steps to ensure timely submissions in the future.",
            amount: "EGP 1,000-",
            status: "Approved"
        },
        {
            id: 4,
            transactionDate: "Sep 9, 2024, 04:30pm",
            issuedBy: "Shamy wael",
            action: "Late Arrival",
            reason: "Will help the team soon",
            fullReason: "Will help the team soon. The employee was late due to traffic conditions and will make sure to leave earlier next time to avoid such delays. This is a one-time occurrence and measures have been taken to prevent future incidents.",
            amount: "EGP 1,000-",
            status: "Approved"
        }
    ];

    const handleViewDetails = (record) => {
        setSelectedRecord(record);
        setIsPopupOpen(true);
    };

    const closePopup = () => {
        setIsPopupOpen(false);
        setSelectedRecord(null);
    };

    // Pagination
    const totalPages = Math.ceil(walletData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentPageData = walletData.slice(startIndex, startIndex + itemsPerPage);

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
        <>
            <div
                className="rounded-xl border shadow-sm"
                style={{
                    backgroundColor: 'var(--bg-color)',
                    borderColor: 'var(--border-color)'
                }}
                dir={isArabic ? "rtl" : "ltr"}
            >
                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead style={{ backgroundColor: 'var(--table-header-bg)' }}>
                            <tr>
                                <th className={`px-6 py-4 text-xs font-semibold uppercase tracking-wider ${isArabic ? 'text-right' : 'text-left'}`}
                                    style={{ color: 'var(--table-header-text)' }}>
                                    {t("walletTable.columns.transactionDate", "Transaction Date")}
                                </th>
                                <th className={`px-6 py-4 text-xs font-semibold uppercase tracking-wider ${isArabic ? 'text-right' : 'text-left'}`}
                                    style={{ color: 'var(--table-header-text)' }}>
                                    {t("walletTable.columns.issuedBy", "Issued by")}
                                </th>
                                <th className={`px-6 py-4 text-xs font-semibold uppercase tracking-wider ${isArabic ? 'text-right' : 'text-left'}`}
                                    style={{ color: 'var(--table-header-text)' }}>
                                    {t("walletTable.columns.action", "Action")}
                                </th>
                                <th className={`px-6 py-4 text-xs font-semibold uppercase tracking-wider ${isArabic ? 'text-right' : 'text-left'}`}
                                    style={{ color: 'var(--table-header-text)' }}>
                                    {t("walletTable.columns.reason", "Reason")}
                                </th>
                                <th className={`px-6 py-4 text-xs font-semibold uppercase tracking-wider ${isArabic ? 'text-right' : 'text-left'}`}
                                    style={{ color: 'var(--table-header-text)' }}>
                                    {t("walletTable.columns.amount", "Amount")}
                                </th>
                                <th className={`px-6 py-4 text-xs font-semibold uppercase tracking-wider ${isArabic ? 'text-right' : 'text-left'}`}
                                    style={{ color: 'var(--table-header-text)' }}>
                                    {t("walletTable.columns.status", "Status")}
                                </th>
                                <th className={`px-6 py-4 text-xs font-semibold uppercase tracking-wider ${isArabic ? 'text-right' : 'text-left'}`}
                                    style={{ color: 'var(--table-header-text)' }}>
                                    {/* Actions column - no header text */}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentPageData.map((record, index) => (
                                <tr
                                    key={record.id}
                                    className="transition-colors duration-200 cursor-pointer hover:shadow-sm"
                                    style={{
                                        borderBottom: '1px solid var(--table-border)',
                                        backgroundColor: index % 2 === 0 ? 'var(--table-row-bg)' : 'var(--table-row-alt-bg)'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = 'var(--table-header-bg)';
                                        e.currentTarget.style.transform = 'translateY(-1px)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor =
                                            index % 2 === 0 ? 'var(--table-row-bg)' : 'var(--table-row-alt-bg)';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                    }}
                                >
                                    <td className={`px-6 py-4 text-sm font-medium ${isArabic ? 'text-right' : 'text-left'}`}
                                        style={{ color: 'var(--table-text)' }}>
                                        {record.transactionDate}
                                    </td>
                                    <td className={`px-6 py-4 text-sm ${isArabic ? 'text-right' : 'text-left'}`}
                                        style={{ color: 'var(--table-text)' }}>
                                        <div className="flex items-center gap-2">
                                            <img
                                                src={`https://i.pravatar.cc/32?img=${index + 1}`}
                                                alt={record.issuedBy}
                                                className="w-8 h-8 rounded-full"
                                            />
                                            <span>{record.issuedBy}</span>
                                        </div>
                                    </td>
                                    <td className={`px-6 py-4 text-sm ${isArabic ? 'text-right' : 'text-left'}`}
                                        style={{ color: 'var(--table-text)' }}>
                                        {record.action}
                                    </td>
                                    <td className={`px-6 py-4 text-sm ${isArabic ? 'text-right' : 'text-left'}`}
                                        style={{ color: 'var(--table-text)' }}>
                                        <div className="flex items-center gap-2">
                                            <span>{record.reason}</span>
                                        </div>
                                    </td>
                                    <td className={`px-6 py-4 text-sm font-medium ${isArabic ? 'text-right' : 'text-left'}`}
                                        style={{ color: 'var(--error-color)' }}>
                                        {record.amount}
                                    </td>
                                    <td className={`px-6 py-4 ${isArabic ? 'text-right' : 'text-left'}`}>
                                        {getStatusBadge(record.status)}
                                    </td>
                                    <td className={`px-6 py-4 ${isArabic ? 'text-right' : 'text-left'}`}>
                                        <button
                                            className="p-1 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleViewDetails(record);
                                            }}
                                        >
                                            <Eye className="w-4 h-4" style={{ color: 'var(--sub-text-color)' }} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div
                    className={`px-6 py-4 border-t flex items-center justify-between ${isArabic ? 'flex-row-reverse' : ''}`}
                    style={{ borderColor: 'var(--divider-color)' }}
                >
                    <div className="text-sm font-medium" style={{ color: 'var(--sub-text-color)' }}>
                        {t("walletTable.page", "Page")} {currentPage} {t("walletTable.of", "of")} {totalPages}
                    </div>
                    <div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                        <button
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="p-2 rounded-xl border transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{
                                borderColor: 'var(--border-color)',
                                backgroundColor: 'var(--bg-color)',
                                color: 'var(--text-color)'
                            }}
                        >
                            <ChevronLeft className="w-4 h-4" style={{ color: 'var(--sub-text-color)' }} />
                        </button>
                        <button
                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                            className="p-2 rounded-xl border transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{
                                borderColor: 'var(--border-color)',
                                backgroundColor: 'var(--bg-color)',
                                color: 'var(--text-color)'
                            }}
                        >
                            <ChevronRight className="w-4 h-4" style={{ color: 'var(--sub-text-color)' }} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Popup */}
            <TablePopup
                isOpen={isPopupOpen}
                onClose={closePopup}
                record={selectedRecord}
            />
        </>
    );
};

export default TeamWalletTable;