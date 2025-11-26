"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { ChevronLeft, ChevronRight, Edit, Trash2, UserPlus, RotateCcw, Shield } from "lucide-react"
import EditRole from "./edit_role"
import ViewPermissionsModal from "./view_permissions_modal"
import { useTranslation } from "react-i18next"
import { useGetAllRolesQuery, useDeleteRoleMutation, useRestoreRoleMutation } from "../../../services/apis/RoleApi"
import toast from "react-hot-toast"
import { useHasPermission } from "../../../hooks/useHasPermission"

const RolesTable = ({ onRoleSelect, searchValue = "", statusFilter = "0" }) => {
    const { t, i18n } = useTranslation();
    const isArabic = i18n.language === "ar";
    // Permission checks
    const canUpdateRole = useHasPermission('Role.Update');
    const canDeleteRole = useHasPermission('Role.Delete');
    const canRestoreRole = useHasPermission('Role.Restore');
    const canViewPermissions = useHasPermission('Role.ViewPermissions');

    // Fetch roles from API
    const queryArgs = useMemo(() => ({
        pageNumber: 1,
        pageSize: 100,
        status: Number(statusFilter ?? 0),
    }), [statusFilter]);

    const { data: rolesResponse, isLoading, error, refetch } = useGetAllRolesQuery(queryArgs);
    const [deleteRole, { isLoading: isDeleting }] = useDeleteRoleMutation();
    const [restoreRole, { isLoading: isRestoring }] = useRestoreRoleMutation();
    const isProcessingAction = isDeleting || isRestoring;

    const defaultRoleFilter = t('roles.filters.roleType');

    const [roleType] = useState(defaultRoleFilter)
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [selectedRole, setSelectedRole] = useState(null)
    const [selectedRoleId, setSelectedRoleId] = useState(null)
    const [pendingAction, setPendingAction] = useState(null) // { type: 'delete' | 'restore', role }
    const [permissionsModal, setPermissionsModal] = useState({ isOpen: false, roleId: null, roleName: null })
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage, setItemsPerPage] = useState(7)

    const tableContainerRef = useRef(null)

    // Transform API data to table format
    const rolesData = useMemo(() => {
        if (!rolesResponse?.value) return [];
        
        return rolesResponse.value.map(role => ({
            id: role.id,
            role: role.name,
            name: role.name, // Keep original name for filtering
            users: role.usersCount || 0, // Use usersCount from API
            status: role.status ? "Active" : "Inactive", // Convert boolean to string
            permissions: role.permissions || [],
            companyId: role.companyId
        }));
    }, [rolesResponse]);

    // Calculate items per page based on table height
    useEffect(() => {
        const calculateItemsPerPage = () => {
            if (tableContainerRef.current) {
                const containerHeight = tableContainerRef.current.clientHeight;
                const headerHeight = 48; // Approximate header height (py-3 = 12px top + 12px bottom + text)
                const rowHeight = 68; // Approximate row height (py-4 = 16px top + 16px bottom + content)

                const availableHeight = containerHeight - headerHeight;
                const calculatedRows = Math.floor(availableHeight / rowHeight);

                // Ensure at least 1 row and maximum reasonable amount
                const rows = Math.max(1, Math.min(calculatedRows, 20));
                setItemsPerPage(rows);
            }
        };

        // Calculate on mount
        calculateItemsPerPage();

        // Recalculate on window resize
        window.addEventListener('resize', calculateItemsPerPage);

        // Cleanup
        return () => window.removeEventListener('resize', calculateItemsPerPage);
    }, [isEditOpen]); // Recalculate when edit panel opens/closes

    // Filter the data based on selected filters and search
    const filteredData = useMemo(() => {
        if (!rolesData.length) return [];
        
        return rolesData.filter(role => {
            // Search filter - case-insensitive search on role name
            const searchMatches = !searchValue || 
                role.name?.toLowerCase().includes(searchValue.toLowerCase()) ||
                role.role?.toLowerCase().includes(searchValue.toLowerCase());

            // Role filter - check if roleType is the default filter text or matches the role name
            const defaultRoleFilter = t('roles.filters.roleType');
            const roleMatches = roleType === defaultRoleFilter || role.name === roleType || role.role === roleType;

            // Status filter
            const statusMatches =
                statusFilter === "2" ||
                (statusFilter === "0" && role.status === "Active") ||
                (statusFilter === "1" && role.status === "Inactive");

            return searchMatches && roleMatches && statusMatches;
        });
    }, [rolesData, roleType, statusFilter, searchValue, t]);

    // Calculate pagination info
    const totalItems = filteredData.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentPageData = filteredData.slice(startIndex, endIndex);

    // Reset to first page when filters or search change
    useEffect(() => {
        setCurrentPage(1);
    }, [roleType, statusFilter, searchValue]);

    const handleEditRole = (role) => {
        setSelectedRole(role);
        setIsEditOpen(true);
        onRoleSelect?.(role.id);
    };

    const handleViewPermissions = (role) => {
        setPermissionsModal({
            isOpen: true,
            roleId: role.id,
            roleName: role.role || role.name
        });
    };

    const handleSaveRole = async () => {
        // Refetch roles after update
        await refetch();
        setIsEditOpen(false);
    };

    const openActionModal = (type, role) => {
        setPendingAction({ type, role });
    };

    const confirmAction = async () => {
        if (!pendingAction?.role) return;

        const { type, role } = pendingAction;
        const isRestore = type === "restore";

        try {
            if (isRestore) {
                await restoreRole(role.id).unwrap();
                toast.success(t('roles.roleRestored') || 'Role restored successfully');
            } else {
                await deleteRole(role.id).unwrap();
                toast.success(t('roles.roleDeleted') || 'Role deleted successfully');
            }
            refetch();
        } catch (error) {
            toast.error(
                error?.data?.errorMessage ||
                (isRestore
                    ? t('roles.errors.restoreFailed') || 'Failed to restore role'
                    : t('roles.errors.deleteFailed') || 'Failed to delete role')
            );
        } finally {
            setPendingAction(null);
        }
    };

    const handlePreviousPage = () => {
        setCurrentPage(prev => Math.max(prev - 1, 1));
    };

    const handleNextPage = () => {
        setCurrentPage(prev => Math.min(prev + 1, totalPages));
    };

    const getStatusBadge = (status) => {
        const baseClasses = "px-3 py-1 rounded-full text-xs font-medium inline-block border"
        const statusLower = String(status || '').toLowerCase().trim()
        
        if (statusLower === 'active' || status === true || status === 1) {
            return <span className={`${baseClasses} bg-[var(--approved-leave-box-bg)] text-[var(--success-color)] border-[var(--success-color)]`}>{t('roles.filters.active')}</span>
        }
        if (statusLower === 'inactive' || status === false || status === 0) {
            return <span className={`${baseClasses} bg-[var(--rejected-leave-box-bg)] text-[var(--error-color)] border-[var(--error-color)]`}>{t('roles.filters.inactive')}</span>
        }
        
        // Fallback: try to translate if it's a known status, otherwise show raw value
        return <span className={`${baseClasses} bg-[var(--container-color)] text-[var(--sub-text-color)] border-[var(--border-color)]`}>{t(`roles.filters.${statusLower}`, status)}</span>
    }

    // Create empty rows to maintain consistent table height
    const emptyRowsNeeded = itemsPerPage - currentPageData.length;
    const emptyRows = Array(emptyRowsNeeded).fill(null);

    // Render the table row with cells for both RTL and LTR
    const renderTableRows = () => {
        return currentPageData.map((role) => (
            <tr 
                key={role.id} 
                className={`border-b border-[var(--border-color)] last:border-b-0 hover:bg-[var(--hover-color)] cursor-pointer transition-colors ${selectedRoleId === role.id ? 'bg-[var(--accent-color)]/20' : ''}`}
                onClick={() => {
                    setSelectedRoleId(role.id);
                    onRoleSelect?.(role.id);
                }}
            >
                <td className={`py-4 px-6 ${isArabic ? 'text-right' : 'text-left'}`}>
                    <span className="font-medium text-[var(--text-color)] text-sm">{role.role}</span>
                </td>
                <td className={`py-4 px-6 text-[var(--text-color)] text-sm font-medium ${isArabic ? 'text-right' : 'text-left'}`}>{role.users}</td>
                <td className={`py-4 px-6 ${isArabic ? 'text-right' : 'text-left'}`}>{getStatusBadge(role.status)}</td>
                {/* Actions cell - Only show if user has any action permissions */}
                {(canUpdateRole || canDeleteRole || canRestoreRole || canViewPermissions) && (
                    <td className="py-4 px-6" onClick={(e) => e.stopPropagation()}>
                        <div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                            {canViewPermissions && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleViewPermissions(role);
                                    }}
                                    className="p-2 text-[var(--accent-color)] hover:bg-[var(--hover-color)] rounded-lg transition-colors cursor-pointer"
                                    aria-label={t('roles.viewPermissions') || 'View Permissions'}
                                    title={t('roles.viewPermissions') || 'View Permissions'}
                                >
                                    <Shield className="w-4 h-4" />
                                </button>
                            )}
                            {canUpdateRole && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditRole(role);
                                    }}
                                    className="p-2 text-[var(--accent-color)] hover:bg-[var(--hover-color)] rounded-lg transition-colors cursor-pointer"
                                    aria-label={t('employees.actions.edit')}
                                    title={t('employees.actions.edit')}
                                >
                                    <Edit className="w-4 h-4" />
                                </button>
                            )}
                            {role.status === "Active" && canDeleteRole && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        openActionModal("delete", role);
                                    }}
                                    className="p-2 text-[var(--error-color)] hover:bg-[var(--hover-color)] rounded-lg transition-colors cursor-pointer"
                                    aria-label={t('employees.actions.delete')}
                                    title={t('employees.actions.delete')}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                            {role.status === "Inactive" && canRestoreRole && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        openActionModal("restore", role);
                                    }}
                                    className="p-2 text-[var(--accent-color)] hover:bg-[var(--hover-color)] rounded-lg transition-colors cursor-pointer"
                                    aria-label={t('roles.actions.restore') || 'Restore'}
                                    title={t('roles.actions.restore') || 'Restore'}
                                >
                                    <RotateCcw className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </td>
                )}
            </tr>
        ));
    };

    // Show loading state
    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-8" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
                <span className="text-[var(--sub-text-color)]">{t('common.loading')}</span>
            </div>
        );
    }

    // Show error state
    if (error) {
        return (
            <div className="flex items-center justify-center py-8" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
                <span className="text-red-500">{t('roles.errors.loadRolesFailed') || t('roles.errors.loadPermissionsFailed') || 'Failed to load roles'}</span>
            </div>
        );
    }

    return (
        <div className="flex flex-col" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
        
            {/* Main content area with table and edit panel - 80vh height */}
            <div className={`flex gap-4 ${isArabic ? 'flex-row-reverse' : ''}`} style={{ height: '80vh' }}>
                {/* Table Section */}
                <div className={`${isEditOpen ? 'w-[75%]' : 'w-full'} transition-all duration-300 h-full flex flex-col overflow-hidden`}>
                    <div className="h-full border border-[var(--border-color)] rounded-lg flex flex-col">
                        <div ref={tableContainerRef} className="flex-1 overflow-auto">
                            <table className="min-w-[800px] w-full">
                                <thead className="bg-[var(--bg-table-header)] sticky top-0 z-10">
                                    <tr>
                                        <th className={`py-3 px-4 text-sm font-medium text-[var(--text-color)] ${isArabic ? 'text-right' : 'text-left'}`}>
                                            {t('roles.table.role')}
                                        </th>
                                        <th className={`py-3 px-4 text-sm font-medium text-[var(--text-color)] ${isArabic ? 'text-right' : 'text-left'}`}>
                                            {t('roles.table.users')}
                                        </th>
                                        <th className={`py-3 px-4 text-sm font-medium text-[var(--text-color)] ${isArabic ? 'text-right' : 'text-left'}`}>
                                            {t('roles.table.status')}
                                        </th>
                                        {/* Actions column - Only show if user has any action permissions */}
                {(canUpdateRole || canDeleteRole || canRestoreRole || canViewPermissions) && (
                                            <th className={`py-3 px-4 text-sm font-medium text-[var(--text-color)] ${isArabic ? 'text-right' : 'text-left'}`}>
                                                {t('roles.table.actions')}
                                            </th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentPageData.length === 0 ? (
                                        <tr>
                                            <td colSpan={(canUpdateRole || canDeleteRole || canViewPermissions) ? 4 : 3} className="py-8 text-center">
                                                <span className="text-[var(--sub-text-color)] text-sm" dir={isArabic ? 'rtl' : 'ltr'}>
                                                    {t('roles.table.noRoles') || 'No roles found'}
                                                </span>
                                            </td>
                                        </tr>
                                    ) : (
                                        <>
                                            {renderTableRows()}
                                            {/* Empty rows */}
                                            {emptyRows.map((_, index) => (
                                                <tr key={`empty-${index}`} className="border-b border-[var(--border-color)] last:border-b-0">
                                                    <td colSpan={(canUpdateRole || canDeleteRole || canViewPermissions) ? 4 : 3} className="h-[68px]"></td>
                                                </tr>
                                            ))}
                                        </>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div
                            className={`px-3 md:px-6 py-3 border-t flex items-center justify-between ${isArabic ? 'flex-row-reverse' : ''}`}
                            style={{ borderColor: 'var(--border-color)' }}
                        >
                            <div className="text-xs md:text-sm font-medium" style={{ color: 'var(--sub-text-color)' }}>
                                {totalPages > 0 ? (
                                    <>
                                        <span className="hidden md:inline">
                                            {t("employees.pagination.page", "Page")} {currentPage} {t("employees.pagination.of", "of")} {totalPages}
                                            {" "}
                                            ({totalItems} {t("employees.pagination.total", "total entries")})
                                        </span>
                                        <span className="md:hidden">
                                            {currentPage}/{totalPages} ({totalItems})
                                        </span>
                                    </>
                                ) : (
                                    <span>{t('roles.table.noRoles') || 'No roles found'}</span>
                                )}
                            </div>
                            <div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                            <button
                                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                    disabled={currentPage === 1}
                                    className="p-1.5 md:p-2 rounded-xl border transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                                    style={{
                                        borderColor: 'var(--border-color)',
                                        backgroundColor: 'var(--bg-color)',
                                        color: 'var(--text-color)'
                                    }}
                                >
                                    <ChevronLeft className="w-3 h-3 md:w-4 md:h-4" />
                                </button>
                                <button
                                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-1.5 md:p-2 rounded-xl border transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                                    style={{
                                        borderColor: 'var(--border-color)',
                                        backgroundColor: 'var(--bg-color)',
                                        color: 'var(--text-color)'
                                    }}
                                >
                                    <ChevronRight className="w-3 h-3 md:w-4 md:h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Edit Role Section - Matches table height exactly */}
                {isEditOpen && (
                    <div className="w-[25%] transition-all duration-300 h-full overflow-hidden">
                        <EditRole
                            isOpen={isEditOpen}
                            onClose={() => setIsEditOpen(false)}
                            roleData={selectedRole}
                            onSave={handleSaveRole}
                        />
                    </div>
                    )}
            </div>

            {/* Delete / Restore Confirmation Modal */}
            {pendingAction && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-[var(--bg-color)] rounded-lg border border-[var(--border-color)] p-6 max-w-md w-full" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
                        <h3 className={`text-lg font-semibold text-[var(--text-color)] mb-4 ${isArabic ? 'text-right' : 'text-left'}`}>
                            {pendingAction.type === "restore"
                                ? t('roles.confirmRestore') || 'Restore Role'
                                : t('roles.confirmDelete')}
                        </h3>
                        <p className={`text-[var(--sub-text-color)] mb-6 ${isArabic ? 'text-right' : 'text-left'}`}>
                            {pendingAction.type === "restore"
                                ? (t('roles.restoreMessage') || 'Are you sure you want to restore this role?')
                                : (t('roles.confirmDeleteMessage') || 'Are you sure you want to delete this role?')}
                            {` "${pendingAction.role?.role || pendingAction.role?.name}"`}
                        </p>
                        <div className={`flex gap-3 ${isArabic ? 'flex-row-reverse' : ''}`}>
                            <button
                                onClick={() => setPendingAction(null)}
                                disabled={isProcessingAction}
                                className="flex-1 px-4 py-2 border border-[var(--border-color)] text-[var(--text-color)] rounded-lg font-medium hover:bg-[var(--hover-color)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {t('roles.cancel')}
                            </button>
                            <button
                                onClick={confirmAction}
                                disabled={isProcessingAction}
                                className="flex-1 px-4 py-2 rounded-lg font-medium text-white transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{
                                    background: pendingAction.type === "restore"
                                        ? "linear-gradient(135deg, #15919B 0%, #09D1C7 100%)"
                                        : "var(--error-color)"
                                }}
                            >
                                {isProcessingAction
                                    ? (t('common.loading') || 'Processing...')
                                    : pendingAction.type === "restore"
                                        ? (t('roles.actions.restore') || 'Restore')
                                        : (t('roles.delete') || 'Delete')}
                            </button>
                        </div>
                    </div>
                    </div>
                )}

            {/* View Permissions Modal */}
            <ViewPermissionsModal
                isOpen={permissionsModal.isOpen}
                onClose={() => setPermissionsModal({ isOpen: false, roleId: null, roleName: null })}
                roleId={permissionsModal.roleId}
                roleName={permissionsModal.roleName}
            />
        </div>
    );
};

export default RolesTable;
