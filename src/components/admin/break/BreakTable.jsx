"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { Edit, Trash2, Plus } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useGetAllBreaksQuery, useDeleteBreakMutation } from "../../../services/apis/BreakApi"
import BreakForm from "./BreakForm"
import toast from "react-hot-toast"
import { useHasPermission } from "../../../hooks/useHasPermission"

const BreakTable = () => {
    const { t, i18n } = useTranslation();
    const isArabic = i18n.language === "ar";

    // Fetch breaks from API
    const [statusFilter, setStatusFilter] = useState("0"); // 0: Active, 1: Inactive, 2: All
    const statusOptions = useMemo(() => ([
        { value: "0", label: t('breaks.status.active') || 'Active' },
        { value: "1", label: t('breaks.status.inactive') || 'Inactive' },
        { value: "2", label: t('breaks.filters.allStatus') || 'All Status' },
    ]), [t]);

    const { data: breaksResponse, isLoading, error, refetch } = useGetAllBreaksQuery({
        pageNumber: 1,
        pageSize: 100,
        status: Number(statusFilter ?? "0"),
    });
    const [deleteBreak] = useDeleteBreakMutation();
    
    // Permission checks
    const canCreate = useHasPermission('Break.Create');
    const canUpdate = useHasPermission('Break.Update');
    const canDelete = useHasPermission('Break.Delete');
    const canRestore = useHasPermission('Break.Restore');

    const [searchTerm, setSearchTerm] = useState("")
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [selectedBreak, setSelectedBreak] = useState(null)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [breakToDelete, setBreakToDelete] = useState(null)
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(10)

    const tableContainerRef = useRef(null)

    // Transform API data
    const breaksData = useMemo(() => {
        if (!breaksResponse?.value) return [];
        
        return breaksResponse.value.map(breakItem => ({
            id: breakItem.id,
            name: breakItem.name,
            duration: breakItem.duration || 0,
            status: breakItem.status ? "Active" : "Inactive",
            companyId: breakItem.companyId
        }));
    }, [breaksResponse]);

    // Calculate items per page based on table height
    useEffect(() => {
        const calculateItemsPerPage = () => {
            if (tableContainerRef.current) {
                const containerHeight = tableContainerRef.current.clientHeight;
                const headerHeight = 48;
                const rowHeight = 68;

                const availableHeight = containerHeight - headerHeight;
                const calculatedRows = Math.floor(availableHeight / rowHeight);

                const rows = Math.max(1, Math.min(calculatedRows, 20));
                setItemsPerPage(rows);
            }
        };

        calculateItemsPerPage();
        window.addEventListener('resize', calculateItemsPerPage);
        return () => window.removeEventListener('resize', calculateItemsPerPage);
    }, [isFormOpen]);

    // Filter the data
    const filteredData = useMemo(() => {
        if (!breaksData.length) return [];
        
        return breaksData.filter(breakItem => {
            const matchesSearch = breakItem.name.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesStatus =
                statusFilter === "2" ||
                (statusFilter === "0" && breakItem.status === "Active") ||
                (statusFilter === "1" && breakItem.status === "Inactive");

            return matchesSearch && matchesStatus;
        });
    }, [breaksData, searchTerm, statusFilter]);

    // Pagination
    const totalItems = filteredData.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentPageData = filteredData.slice(startIndex, endIndex);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter]);

    const handleEdit = (breakItem) => {
        setSelectedBreak(breakItem);
        setIsFormOpen(true);
    };

    const handleDelete = (breakItem) => {
        setBreakToDelete(breakItem);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!breakToDelete) return;

        try {
            await deleteBreak(breakToDelete.id).unwrap();
            toast.success(t('breaks.deleteSuccess') || 'Break deleted successfully');
            setIsDeleteModalOpen(false);
            setBreakToDelete(null);
            refetch();
        } catch (error) {
            toast.error(error?.data?.errorMessage || t('breaks.deleteFailed') || 'Failed to delete break');
        }
    };

    const handleAddNew = () => {
        setSelectedBreak(null);
        setIsFormOpen(true);
    };

    const handleFormClose = () => {
        setIsFormOpen(false);
        setSelectedBreak(null);
        refetch();
    };

    const getStatusBadge = (status) => {
        const baseClasses = "px-3 py-1 rounded-full text-xs font-medium inline-block border"
        switch (status) {
            case "Active":
                return <span className={`${baseClasses} bg-[var(--approved-leave-box-bg)] text-[var(--success-color)] border-[var(--success-color)]`}>{t('breaks.status.active')}</span>
            case "Inactive":
                return <span className={`${baseClasses} bg-[var(--rejected-leave-box-bg)] text-[var(--error-color)] border-[var(--error-color)]`}>{t('breaks.status.inactive')}</span>
            default:
                return <span className={`${baseClasses} bg-[var(--container-color)] text-[var(--sub-text-color)] border-[var(--border-color)]`}>{status}</span>
        }
    }

    const formatDuration = (minutes) => {
        if (minutes < 60) {
            return `${minutes} ${t('breaks.minutes') || 'min'}`;
        }
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (mins === 0) {
            return `${hours} ${t('breaks.hours') || 'hr'}`;
        }
        return `${hours} ${t('breaks.hours') || 'hr'} ${mins} ${t('breaks.minutes') || 'min'}`;
    };

    const emptyRowsNeeded = itemsPerPage - currentPageData.length;
    const emptyRows = Array(emptyRowsNeeded).fill(null);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-8" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
                <span className="text-[var(--sub-text-color)]">{t('common.loading')}</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center py-8" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
                <span className="text-red-500">{t('breaks.errors.loadFailed') || 'Failed to load breaks'}</span>
            </div>
        );
    }

    return (
        <div className="flex flex-col" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
            {/* Header and Filters */}
            <div className="mb-4 flex-shrink-0">
                <div className="flex bg-[var(--bg-color)] p-4 rounded-3xl border border-[var(--border-color)] flex-wrap items-center gap-4 justify-between">
                    <div className="flex flex-wrap items-center gap-4 flex-1">
                        {/* Search */}
                        <div className="flex-1 min-w-[200px]">
                            <input
                                type="text"
                                placeholder={t('breaks.searchPlaceholder') || 'Search breaks...'}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full h-8 px-3 border border-[var(--border-color)] rounded-md text-sm bg-[var(--bg-color)] text-[var(--text-color)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-color)]"
                                dir={isArabic ? 'rtl' : 'ltr'}
                            />
                        </div>

                        {/* Status Filter */}
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-medium text-[var(--sub-text-color)] whitespace-nowrap">
                                {t('breaks.status.label') || 'Status'}
                            </span>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="h-8 px-3 border border-[var(--border-color)] rounded-md text-[10px] bg-[var(--bg-color)] text-[var(--text-color)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-color)] cursor-pointer"
                                dir={isArabic ? 'rtl' : 'ltr'}
                            >
                                {statusOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Add New Button */}
                        {canCreate && (
                            <button
                                onClick={handleAddNew}
                                className={`flex items-center gap-2 h-8 px-3 bg-[var(--accent-color)] text-white rounded-md text-[12px] font-medium hover:opacity-90 transition-opacity ${isArabic ? 'flex-row-reverse' : ''}`}
                            >
                                <Plus className="w-4 h-4" />
                                <span>{t('breaks.addNew') || 'Add New'}</span>
                            </button>
                        )}
                    </div>

                    {/* Pagination Info */}
                    <div className={`flex items-center gap-3 ${isArabic ? 'flex-row-reverse' : ''}`}>
                        <span className="text-[10px] text-[var(--sub-text-color)]">
                            {t('leaves.table.page')} {currentPage} {t('leaves.table.of')} {totalPages} ({totalItems} {t('leaves.table.entries')})
                        </span>
                        <div className={`flex items-center gap-1 ${isArabic ? 'flex-row-reverse' : ''}`}>
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="h-8 w-8 border border-[var(--border-color)] rounded-md bg-[var(--bg-color)] hover:bg-[var(--hover-color)] flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <svg className="h-4 w-4 text-[var(--sub-text-color)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isArabic ? "M15 19l-7-7 7-7" : "M15 19l-7-7 7-7"} />
                                </svg>
                            </button>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages || totalPages === 0}
                                className="h-8 w-8 border border-[var(--border-color)] rounded-md bg-[var(--bg-color)] hover:bg-[var(--hover-color)] flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <svg className="h-4 w-4 text-[var(--sub-text-color)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isArabic ? "M9 5l7 7-7 7" : "M9 5l7 7-7 7"} />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto border border-[var(--border-color)] rounded-lg" ref={tableContainerRef}>
                <table className="min-w-[600px] w-full">
                    <thead className="bg-[var(--bg-table-header)] sticky top-0 z-10">
                        <tr>
                            <th className={`py-3 px-4 text-sm font-medium text-[var(--text-color)] ${isArabic ? 'text-right' : 'text-left'}`}>
                                {t('breaks.table.name') || 'Name'}
                            </th>
                            <th className={`py-3 px-4 text-sm font-medium text-[var(--text-color)] ${isArabic ? 'text-right' : 'text-left'}`}>
                                {t('breaks.table.duration') || 'Duration'}
                            </th>
                            <th className={`py-3 px-4 text-sm font-medium text-[var(--text-color)] ${isArabic ? 'text-right' : 'text-left'}`}>
                                {t('breaks.table.status') || 'Status'}
                            </th>
                            <th className={`py-3 px-4 text-sm font-medium text-[var(--text-color)] ${isArabic ? 'text-right' : 'text-left'}`}>
                                {t('breaks.table.actions') || 'Actions'}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentPageData.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="py-8 text-center">
                                    <span className="text-[var(--sub-text-color)] text-sm" dir={isArabic ? 'rtl' : 'ltr'}>
                                        {t('breaks.table.noBreaks') || 'No breaks found'}
                                    </span>
                                </td>
                            </tr>
                        ) : (
                            <>
                                {currentPageData.map((breakItem) => (
                                    <tr key={breakItem.id} className="border-b border-[var(--border-color)] last:border-b-0 hover:bg-[var(--hover-color)]">
                                        <td className={`py-4 px-6 ${isArabic ? 'text-right' : 'text-left'}`}>
                                            <span className="font-medium text-[var(--text-color)] text-sm">{breakItem.name}</span>
                                        </td>
                                        <td className={`py-4 px-6 text-[var(--text-color)] text-sm ${isArabic ? 'text-right' : 'text-left'}`}>
                                            {formatDuration(breakItem.duration)}
                                        </td>
                                        <td className={`py-4 px-6 ${isArabic ? 'text-right' : 'text-left'}`}>
                                            {getStatusBadge(breakItem.status)}
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                                                {canUpdate && (
                                                    <button
                                                        onClick={() => handleEdit(breakItem)}
                                                        className="p-2 text-[var(--accent-color)] hover:bg-[var(--hover-color)] rounded-lg transition-colors"
                                                        aria-label={t('breaks.actions.edit') || 'Edit'}
                                                        title={t('breaks.actions.edit') || 'Edit'}
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {canDelete && (
                                                    <button
                                                        onClick={() => handleDelete(breakItem)}
                                                        className="p-2 text-[var(--error-color)] hover:bg-[var(--hover-color)] rounded-lg transition-colors"
                                                        aria-label={t('breaks.actions.delete') || 'Delete'}
                                                        title={t('breaks.actions.delete') || 'Delete'}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {emptyRows.map((_, index) => (
                                    <tr key={`empty-${index}`} className="border-b border-[var(--border-color)] last:border-b-0">
                                        <td colSpan={4} className="h-[68px]"></td>
                                    </tr>
                                ))}
                            </>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Form Modal */}
            {isFormOpen && (
                <BreakForm
                    isOpen={isFormOpen}
                    onClose={handleFormClose}
                    breakData={selectedBreak}
                />
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-[var(--bg-color)] rounded-lg border border-[var(--border-color)] p-6 max-w-md w-full" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
                        <h3 className="text-lg font-semibold text-[var(--text-color)] mb-4">
                            {t('breaks.confirmDelete') || 'Confirm Delete'}
                        </h3>
                        <p className="text-[var(--sub-text-color)] mb-6">
                            {t('breaks.deleteMessage') || 'Are you sure you want to delete this break?'} "{breakToDelete?.name}"
                        </p>
                        <div className={`flex gap-3 ${isArabic ? 'flex-row-reverse' : ''}`}>
                            <button
                                onClick={() => {
                                    setIsDeleteModalOpen(false);
                                    setBreakToDelete(null);
                                }}
                                className="flex-1 px-4 py-2 border border-[var(--border-color)] text-[var(--text-color)] rounded-lg font-medium hover:bg-[var(--hover-color)] transition-colors"
                            >
                                {t('breaks.cancel') || 'Cancel'}
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="flex-1 px-4 py-2 bg-[var(--error-color)] text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
                            >
                                {t('breaks.delete') || 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BreakTable;

