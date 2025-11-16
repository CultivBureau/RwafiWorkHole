import React, { useState, useEffect, useMemo } from 'react';
import { X, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useGetRolePermissionsQuery, useUpdateRoleMutation } from '../../../services/apis/RoleApi';
import { useGetAllPermissionsQuery } from '../../../services/apis/PermissionApi';
import { useHasPermission } from '../../../hooks/useHasPermission';

const EditRole = ({ isOpen, onClose, roleData, onSave }) => {
    const { t, i18n } = useTranslation();
    const isArabic = i18n.language === "ar";
    
    // Permission checks
    const canUpdateRole = useHasPermission('Role.Update');
    const canViewRolePermissions = useHasPermission('Role.ViewPermissions');
    const canViewAllPermissions = useHasPermission('Permission.View');
    const canViewPermissions = canViewRolePermissions || canViewAllPermissions;

    // Fetch all permissions to map codes to IDs - only if user has permission to view permissions
    const { data: permissionsData } = useGetAllPermissionsQuery(undefined, {
        skip: !canViewPermissions
    });
    // Fetch role permissions - only if user has permission to view permissions
    const { data: rolePermissionsData } = useGetRolePermissionsQuery(roleData?.id || null, { 
        skip: !roleData?.id || !isOpen || !canViewPermissions
    });
    const [updateRole, { isLoading: isUpdating }] = useUpdateRoleMutation();

    // Create a map of permission codes to IDs
    const permissionCodeToIdMap = useMemo(() => {
        if (!permissionsData?.value) return {};
        const map = {};
        permissionsData.value.forEach(perm => {
            map[perm.code] = perm.id;
        });
        return map;
    }, [permissionsData]);

    const [formData, setFormData] = useState({
        roleName: '',
        selectedPermissionIds: [] // Array of permission IDs
    });

    // Group permissions by category (prefix before dot)
    const groupedPermissions = useMemo(() => {
        if (!permissionsData?.value) return {};

        const grouped = {};
        permissionsData.value.forEach(permission => {
            const category = permission.code.split('.')[0]; // e.g., "User" from "User.Create"
            if (!grouped[category]) {
                grouped[category] = [];
            }
            grouped[category].push(permission);
        });

        // Sort permissions within each category by code
        Object.keys(grouped).forEach(category => {
            grouped[category].sort((a, b) => a.code.localeCompare(b.code));
        });

        return grouped;
    }, [permissionsData]);

    // Category display names mapping
    const categoryDisplayNames = {
        'User': t('roles.editRole.categories.employeeManagement'),
        'Break': t('roles.editRole.categories.breakManagement'),
        'BreakLog': t('roles.editRole.categories.breakLogs'),
        'ClockinLog': t('roles.editRole.categories.timeAndAttendance'),
        'Company': t('roles.editRole.categories.company'),
        'Department': t('roles.editRole.categories.department'),
        'LeaveBalance': t('roles.editRole.categories.leaveBalance'),
        'LeaveRequest': t('roles.editRole.categories.leaveManagement'),
        'LeaveType': t('roles.editRole.categories.leaveType'),
        'Role': t('roles.editRole.categories.roles'),
        'Team': t('roles.editRole.categories.team'),
        'Permission': t('roles.editRole.categories.permission'),
    };

    useEffect(() => {
        if (roleData) {
            setFormData({
                roleName: roleData.role || roleData.name || '',
                selectedPermissionIds: []
            });

            // If we have role permissions from API, map them to IDs
            if (rolePermissionsData?.value && permissionCodeToIdMap) {
                const permissionIds = rolePermissionsData.value.map(perm => perm.permissionId).filter(id => id);
                setFormData(prev => ({
                    ...prev,
                    selectedPermissionIds: permissionIds
                }));
            } else if (roleData.permissions && permissionCodeToIdMap) {
                // Map permission codes to IDs
                const permissionIds = roleData.permissions
                    .map(code => permissionCodeToIdMap[code])
                    .filter(id => id !== undefined);
                setFormData(prev => ({
                    ...prev,
                    selectedPermissionIds: permissionIds
                }));
            }
        }
    }, [roleData, rolePermissionsData, permissionCodeToIdMap]);

    const handlePermissionToggle = (permissionId) => {
        setFormData(prev => {
            const isSelected = prev.selectedPermissionIds.includes(permissionId);
            return {
                ...prev,
                selectedPermissionIds: isSelected
                    ? prev.selectedPermissionIds.filter(id => id !== permissionId)
                    : [...prev.selectedPermissionIds, permissionId]
            };
        });
    };

    const handleCategorySelectAll = (category) => {
        const categoryPermissions = groupedPermissions[category] || [];
        const categoryPermissionIds = categoryPermissions.map(p => p.id);
        const allSelected = categoryPermissionIds.every(id => formData.selectedPermissionIds.includes(id));

        setFormData(prev => {
            if (allSelected) {
                // Deselect all permissions in this category
                return {
                    ...prev,
                    selectedPermissionIds: prev.selectedPermissionIds.filter(id => !categoryPermissionIds.includes(id))
                };
            } else {
                // Select all permissions in this category
                const newIds = [...prev.selectedPermissionIds];
                categoryPermissionIds.forEach(id => {
                    if (!newIds.includes(id)) {
                        newIds.push(id);
                    }
                });
                return {
                    ...prev,
                    selectedPermissionIds: newIds
                };
            }
        });
    };

    const isCategoryAllSelected = (category) => {
        const categoryPermissions = groupedPermissions[category] || [];
        if (categoryPermissions.length === 0) return false;
        const categoryPermissionIds = categoryPermissions.map(p => p.id);
        return categoryPermissionIds.every(id => formData.selectedPermissionIds.includes(id));
    };

    const handleSave = async () => {
        if (!roleData?.id) return;

        if (!formData.roleName.trim()) {
            alert(t('roles.validation.roleNameRequired') || 'Role name is required');
            return;
        }

        try {
            await updateRole({
                id: roleData.id,
                name: formData.roleName.trim(),
                permissionIds: formData.selectedPermissionIds
            }).unwrap();

            if (onSave) {
                onSave(formData);
            }
            onClose();
        } catch (error) {
            console.error('Error updating role:', error);
            alert(error?.data?.errorMessage || t('roles.errors.updateFailed') || t('roles.errors.createFailed') || 'Failed to update role');
        }
    };

    const handleCancel = () => {
        onClose();
    };

    if (!isOpen) return null;

    const isMobileOrTablet = typeof window !== 'undefined' && window.innerWidth <= 1100;

    // Show loading state if permissions are not loaded yet
    if (!permissionsData?.value) {
        return (
            <div className="bg-[var(--bg-color)] rounded-lg border border-[var(--border-color)] h-full min-h-0 flex items-center justify-center"
                style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
                <span className="text-[var(--sub-text-color)]">{t('common.loading')}</span>
            </div>
        );
    }

    // Mobile/Tablet Modal Layout
    if (isMobileOrTablet) {
        return (
            <>
                {/* Backdrop */}
                <div
                    className="fixed inset-0 bg-black/20 bg-opacity-50 z-40"
                    onClick={onClose}
                />

                {/* Modal */}
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="bg-[var(--bg-color)] rounded-lg border border-[var(--border-color)] w-full max-w-md max-h-[90vh] flex flex-col"
                        style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
                        {/* Header */}
                        <div className={`flex items-center justify-between p-4 border-b border-[var(--border-color)] ${isArabic ? 'flex-row-reverse' : ''}`}>
                            <h2 className={`text-lg font-semibold text-[var(--text-color)] ${isArabic ? 'text-right' : 'text-left'}`} dir={isArabic ? 'rtl' : 'ltr'}>
                                {t('roles.editRoleTitle')}
                            </h2>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-[var(--hover-color)] rounded-lg transition-colors"
                                aria-label={t('roles.cancel')}
                            >
                                <X className="w-5 h-5 text-[var(--sub-text-color)]" />
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {/* Role Name */}
                            <div>
                                <label 
                                    className={`block text-sm font-medium text-[var(--text-color)] mb-2 ${isArabic ? 'text-right' : 'text-left'}`}
                                    dir={isArabic ? 'rtl' : 'ltr'}
                                >
                                    {t('roles.editRole.roleName')}
                                </label>
                                <input
                                    type="text"
                                    value={formData.roleName}
                                    onChange={(e) => setFormData(prev => ({ ...prev, roleName: e.target.value }))}
                                    disabled={!canUpdateRole}
                                    className={`w-full px-3 py-2 border border-[var(--border-color)] rounded-lg bg-[var(--input-bg)] text-[var(--text-color)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] focus:border-[var(--accent-color)] ${
                                        !canUpdateRole ? 'opacity-60 cursor-not-allowed' : ''
                                    }`}
                                    placeholder={t('roles.editRole.roleNamePlaceholder')}
                                    dir={isArabic ? 'rtl' : 'ltr'}
                                />
                            </div>

                            {/* Permission Sections - Only show if user has permission to view permissions */}
                            {!canViewPermissions ? (
                                <div className="text-center py-8">
                                    <p className="text-[var(--sub-text-color)] text-sm">
                                        {t('roles.noPermissionToViewPermissions') || 'You do not have permission to view permissions'}
                                    </p>
                                </div>
                            ) : (
                                Object.keys(groupedPermissions).map(category => (
                                <div key={category} className="space-y-3">
                                    <div>
                                        <div className={`flex items-center justify-between pb-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                                            <h3 
                                                className={`text-sm font-semibold text-[var(--text-color)] ${isArabic ? 'text-right' : 'text-left'}`}
                                                dir={isArabic ? 'rtl' : 'ltr'}
                                            >
                                                {categoryDisplayNames[category] || category}
                                            </h3>
                                            {canUpdateRole && (
                                                <label className={`flex items-center gap-2 cursor-pointer ${isArabic ? 'flex-row-reverse' : ''}`}>
                                                    <input
                                                        type="checkbox"
                                                        checked={isCategoryAllSelected(category)}
                                                        onChange={() => handleCategorySelectAll(category)}
                                                        className="w-4 h-4 rounded border-2 border-[var(--border-color)] text-[var(--accent-color)] focus:ring-[var(--accent-color)] focus:ring-2 checked:bg-[var(--accent-color)] checked:border-[var(--accent-color)]"
                                                        style={{
                                                            accentColor: 'var(--accent-color)'
                                                        }}
                                                    />
                                                    <span className={`text-xs text-[var(--sub-text-color)] font-medium ${isArabic ? 'text-right' : 'text-left'}`} dir={isArabic ? 'rtl' : 'ltr'}>
                                                        {t('roles.selectAll') || 'Select All'}
                                                    </span>
                                                </label>
                                            )}
                                        </div>
                                        <div className="w-full h-px bg-[var(--border-color)]"></div>
                                    </div>
                                    <div className="space-y-2">
                                        {groupedPermissions[category].map(permission => (
                                            <label 
                                                key={permission.id} 
                                                className={`flex items-center gap-3 cursor-pointer ${isArabic ? 'flex-row-reverse justify-end' : ''}`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={formData.selectedPermissionIds.includes(permission.id)}
                                                    onChange={() => handlePermissionToggle(permission.id)}
                                                    disabled={!canUpdateRole}
                                                    className={`w-4 h-4 rounded border-2 border-[var(--border-color)] text-[var(--accent-color)] focus:ring-[var(--accent-color)] focus:ring-2 checked:bg-[var(--accent-color)] checked:border-[var(--accent-color)] ${
                                                        !canUpdateRole ? 'opacity-60 cursor-not-allowed' : ''
                                                    }`}
                                                    style={{
                                                        accentColor: 'var(--accent-color)'
                                                    }}
                                                />
                                                <span 
                                                    className={`text-sm text-[var(--text-color)] ${isArabic ? 'text-right' : 'text-left'}`}
                                                    dir={isArabic ? 'rtl' : 'ltr'}
                                                    title={permission.description}
                                                >
                                                    {permission.description}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                ))
                            )}
                        </div>

                        {/* Fixed Footer with Buttons - Only show Save if user has update permission */}
                        <div className="border-t border-[var(--border-color)] p-4 bg-[var(--bg-color)]">
                            <div className={`flex gap-3 ${isArabic ? 'flex-row-reverse' : ''}`}>
                                <button
                                    onClick={handleCancel}
                                    className="flex-1 px-4 py-3 border border-[var(--border-color)] text-[var(--text-color)] rounded-lg font-medium hover:bg-[var(--hover-color)] transition-colors"
                                >
                                    {t('roles.cancel')}
                                </button>
                                {canUpdateRole && (
                                    <button
                                        onClick={handleSave}
                                        disabled={isUpdating}
                                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[var(--accent-color)] text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed ${isArabic ? 'flex-row-reverse' : ''}`}
                                    >
                                        <Check className="w-4 h-4" />
                                        {isUpdating ? (t('common.saving') || 'Saving...') : t('roles.save')}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    // Desktop Inline Layout
    return (
        <div className="bg-[var(--bg-color)] rounded-lg border border-[var(--border-color)] h-full min-h-0 flex flex-col"
            style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
            {/* Header */}
            <div className={`flex items-center justify-between p-4 border-b border-[var(--border-color)] flex-shrink-0 ${isArabic ? 'flex-row-reverse' : ''}`}>
                <h2 className={`text-lg font-semibold text-[var(--text-color)] ${isArabic ? 'text-right' : 'text-left'}`} dir={isArabic ? 'rtl' : 'ltr'}>
                    {t('roles.editRoleTitle')}
                </h2>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-[var(--hover-color)] rounded-lg transition-colors"
                    aria-label={t('roles.cancel')}
                >
                    <X className="w-5 h-5 text-[var(--sub-text-color)]" />
                </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
                {/* Role Name */}
                <div>
                    <label 
                        className={`block text-sm font-medium text-[var(--text-color)] mb-2 ${isArabic ? 'text-right' : 'text-left'}`}
                        dir={isArabic ? 'rtl' : 'ltr'}
                    >
                        {t('roles.editRole.roleName')}
                    </label>
                    <input
                        type="text"
                        value={formData.roleName}
                        onChange={(e) => setFormData(prev => ({ ...prev, roleName: e.target.value }))}
                        disabled={!canUpdateRole}
                        className={`w-full px-3 py-2 border border-[var(--border-color)] rounded-lg bg-[var(--input-bg)] text-[var(--text-color)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] focus:border-[var(--accent-color)] ${
                            !canUpdateRole ? 'opacity-60 cursor-not-allowed' : ''
                        }`}
                        placeholder={t('roles.editRole.roleNamePlaceholder')}
                        dir={isArabic ? 'rtl' : 'ltr'}
                    />
                </div>

                {/* Permission Sections - Only show if user has permission to view permissions */}
                {!canViewPermissions ? (
                    <div className="text-center py-8">
                        <p className="text-[var(--sub-text-color)] text-sm">
                            {t('roles.noPermissionToViewPermissions') || 'You do not have permission to view permissions'}
                        </p>
                    </div>
                ) : (
                    Object.keys(groupedPermissions).map(category => (
                    <div key={category} className="space-y-3">
                        <div>
                            <div className={`flex items-center justify-between pb-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                                <h3 
                                    className={`text-sm font-semibold text-[var(--text-color)] ${isArabic ? 'text-right' : 'text-left'}`}
                                    dir={isArabic ? 'rtl' : 'ltr'}
                                >
                                    {categoryDisplayNames[category] || category}
                                </h3>
                                {canUpdateRole && (
                                    <label className={`flex items-center gap-2 cursor-pointer ${isArabic ? 'flex-row-reverse' : ''}`}>
                                        <input
                                            type="checkbox"
                                            checked={isCategoryAllSelected(category)}
                                            onChange={() => handleCategorySelectAll(category)}
                                            className="w-4 h-4 rounded border-2 border-[var(--border-color)] text-[var(--accent-color)] focus:ring-[var(--accent-color)] focus:ring-2 checked:bg-[var(--accent-color)] checked:border-[var(--accent-color)]"
                                            style={{
                                                accentColor: 'var(--accent-color)'
                                            }}
                                        />
                                        <span className={`text-xs text-[var(--sub-text-color)] font-medium ${isArabic ? 'text-right' : 'text-left'}`} dir={isArabic ? 'rtl' : 'ltr'}>
                                            {t('roles.selectAll') || 'Select All'}
                                        </span>
                                    </label>
                                )}
                            </div>
                            <div className="w-full h-px bg-[var(--border-color)]"></div>
                        </div>
                        <div className="space-y-2">
                            {groupedPermissions[category].map(permission => (
                                <label 
                                    key={permission.id} 
                                    className={`flex items-center gap-3 cursor-pointer ${isArabic ? 'flex-row-reverse justify-end' : ''}`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={formData.selectedPermissionIds.includes(permission.id)}
                                        onChange={() => handlePermissionToggle(permission.id)}
                                        disabled={!canUpdateRole}
                                        className={`w-4 h-4 rounded border-2 border-[var(--border-color)] text-[var(--accent-color)] focus:ring-[var(--accent-color)] focus:ring-2 checked:bg-[var(--accent-color)] checked:border-[var(--accent-color)] ${
                                            !canUpdateRole ? 'opacity-60 cursor-not-allowed' : ''
                                        }`}
                                        style={{
                                            accentColor: 'var(--accent-color)'
                                        }}
                                    />
                                    <span 
                                        className={`text-sm text-[var(--text-color)] ${isArabic ? 'text-right' : 'text-left'}`}
                                        dir={isArabic ? 'rtl' : 'ltr'}
                                        title={permission.description}
                                    >
                                        {permission.description}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>
                    ))
                )}
            </div>

            {/* Fixed Footer with Buttons - Only show Save if user has update permission */}
            <div className="border-t border-[var(--border-color)] p-4 bg-[var(--bg-color)] flex-shrink-0">
                <div className={`flex gap-3 ${isArabic ? 'flex-row-reverse' : ''}`}>
                    <button
                        onClick={handleCancel}
                        className="flex-1 px-4 py-3 border border-[var(--border-color)] text-[var(--text-color)] rounded-lg font-medium hover:bg-[var(--hover-color)] transition-colors"
                    >
                        {t('roles.cancel')}
                    </button>
                    {canUpdateRole && (
                        <button
                            onClick={handleSave}
                            disabled={isUpdating}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[var(--accent-color)] text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed ${isArabic ? 'flex-row-reverse' : ''}`}
                        >
                            <Check className="w-4 h-4" />
                            {isUpdating ? (t('common.saving') || 'Saving...') : t('roles.save')}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EditRole;