import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { useGetAllPermissionsQuery } from '../../../services/apis/PermissionApi';
import { useCreateRoleMutation } from '../../../services/apis/RoleApi';
import { useHasPermission } from '../../../hooks/useHasPermission';

const NewRoleForm = () => {
    const { t, i18n } = useTranslation();
    const isArabic = i18n.language === "ar";
    const navigate = useNavigate();

    // Permission checks
    const canViewRolePermissions = useHasPermission('Role.ViewPermissions');
    const canViewAllPermissions = useHasPermission('Permission.View');
    const canViewPermissions = canViewRolePermissions || canViewAllPermissions;

    // Fetch permissions from API - only if user has permission to view permissions
    const { data: permissionsData, isLoading: permissionsLoading, error: permissionsError } = useGetAllPermissionsQuery(undefined, {
        skip: !canViewPermissions
    });
    const [createRole, { isLoading: isSubmitting }] = useCreateRoleMutation();

    const [formData, setFormData] = useState({
        roleName: '',
        description: '',
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

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.roleName.trim()) {
            alert(t('roles.validation.roleNameRequired') || 'Role name is required');
            return;
        }

        try {
            const result = await createRole({
                name: formData.roleName.trim(),
                permissionIds: formData.selectedPermissionIds
            }).unwrap();

            if (result) {
                navigate('/pages/admin/Roles&Permissions');
            }
        } catch (error) {
            console.error('Error creating role:', error);
            alert(error?.data?.errorMessage || t('roles.errors.createFailed') || 'Failed to create role');
        }
    };

    const handleBack = () => {
        navigate('/pages/admin/Roles&Permissions');
    };

    return (
        <div className="w-full space-y-6" dir={isArabic ? 'rtl' : 'ltr'}>
            {/* Enhanced Header section */}
            <div className="flex flex-col gap-2">
                <div className={`flex items-center gap-3 ${isArabic ? 'flex-row-reverse' : ''}`}>
                    <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center shadow-lg">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                    </div>
                    <div className="flex-1">
                        <h1 
                            className={`text-3xl font-bold gradient-text ${isArabic ? 'text-right' : 'text-left'}`}
                            dir={isArabic ? 'rtl' : 'ltr'}
                        >
                            {t('roles.addNewRole')}
                        </h1>
                        <div className={`flex items-center gap-2 text-[var(--sub-text-color)] text-sm mt-1 ${isArabic ? 'flex-row-reverse' : ''}`}>
                            <span
                                className="cursor-pointer hover:text-[var(--accent-color)] transition-colors font-medium"
                                onClick={handleBack}
                                style={{ textAlign: isArabic ? 'right' : 'left' }}
                                dir={isArabic ? 'rtl' : 'ltr'}
                            >
                                {t('roles.allRoles')}
                            </span>
                            {isArabic ? (
                                <ChevronLeft className="w-4 h-4" />
                            ) : (
                                <ChevronRight className="w-4 h-4" />
                            )}
                            <span 
                                className="text-[var(--text-color)] font-medium"
                                dir={isArabic ? 'rtl' : 'ltr'}
                            >
                                {t('roles.addNewRole')}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Enhanced Basic information card */}
                <div 
                    className="rounded-2xl p-6 border-2 transition-all"
                    style={{ 
                        background: "var(--bg-color)",
                        borderColor: "var(--border-color)",
                        boxShadow: "var(--shadow-color)"
                    }}
                >
                    <div className={`flex items-center gap-3 mb-5 ${isArabic ? 'flex-row-reverse' : ''}`}>
                        <div className="w-10 h-10 rounded-lg gradient-bg flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <h3 
                                className={`text-lg font-bold text-[var(--text-color)] ${isArabic ? 'text-right' : 'text-left'}`}
                                dir={isArabic ? 'rtl' : 'ltr'}
                            >
                                {t('roles.basicInformation')}
                            </h3>
                            <p 
                                className={`text-sm text-[var(--sub-text-color)] ${isArabic ? 'text-right' : 'text-left'}`}
                                dir={isArabic ? 'rtl' : 'ltr'}
                            >
                                {t('roles.basicInformationDesc')}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label 
                                className={`block text-sm font-semibold text-[var(--text-color)] mb-2 ${isArabic ? 'text-right' : 'text-left'}`}
                                dir={isArabic ? 'rtl' : 'ltr'}
                            >
                                {t('roles.editRole.roleName')}
                                <span className="text-red-500 ml-1">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    name="roleName"
                                    value={formData.roleName}
                                    onChange={handleInputChange}
                                    className={`form-input ${isArabic ? 'text-right' : 'text-left'}`}
                                    placeholder={t('roles.editRole.roleNamePlaceholder')}
                                    dir={isArabic ? 'rtl' : 'ltr'}
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label 
                                className={`block text-sm font-semibold text-[var(--text-color)] mb-2 ${isArabic ? 'text-right' : 'text-left'}`}
                                dir={isArabic ? 'rtl' : 'ltr'}
                            >
                                {t('roles.description')} 
                                <span className="text-[var(--sub-text-color)] text-xs font-normal ml-2">{t('roles.optional')}</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    className={`form-input ${isArabic ? 'text-right' : 'text-left'}`}
                                    placeholder={t('roles.descriptionPlaceholder')}
                                    dir={isArabic ? 'rtl' : 'ltr'}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Enhanced Permissions section */}
                <div 
                    className="rounded-2xl p-6 border-2 transition-all"
                    style={{ 
                        background: "var(--bg-color)",
                        borderColor: "var(--border-color)",
                        boxShadow: "var(--shadow-color)"
                    }}
                >
                    <div className={`flex items-center gap-3 mb-5 ${isArabic ? 'flex-row-reverse' : ''}`}>
                        <div className="w-10 h-10 rounded-lg gradient-bg flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <h2 
                                className={`text-lg font-bold text-[var(--text-color)] ${isArabic ? 'text-right' : 'text-left'}`}
                                dir={isArabic ? 'rtl' : 'ltr'}
                            >
                                {t('roles.permissions')}
                            </h2>
                            <p 
                                className={`text-sm text-[var(--sub-text-color)] ${isArabic ? 'text-right' : 'text-left'}`}
                                dir={isArabic ? 'rtl' : 'ltr'}
                            >
                                {t('roles.permissionsDescription')}
                            </p>
                        </div>
                        {canViewPermissions && !permissionsLoading && !permissionsError && (
                            <div className="px-4 py-2 rounded-lg" style={{ background: "var(--container-color)" }}>
                                <span className="text-sm font-bold gradient-text">
                                    {formData.selectedPermissionIds.length}
                                </span>
                                <span className="text-xs text-[var(--sub-text-color)] ml-1">
                                    {t('roles.selected') || 'selected'}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Show message if user doesn't have permission to view permissions */}
                    {!canViewPermissions && (
                        <div className="py-12">
                            <div className="rounded-xl p-6 border-2" style={{ 
                                background: "var(--bg-color)",
                                borderColor: "var(--border-color)"
                            }}>
                                <div className="flex flex-col items-center justify-center gap-4">
                                    <svg className="w-12 h-12 text-[var(--sub-text-color)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                    <div className="text-center">
                                        <p className="text-lg font-semibold text-[var(--text-color)] mb-2">
                                            {t('roles.noPermissionToViewPermissions') || 'No Permission to View Permissions'}
                                        </p>
                                        <p className="text-sm text-[var(--sub-text-color)]">
                                            {t('roles.noPermissionToViewPermissionsDesc') || 'You do not have permission to view permissions. You can still create a role, but you will not be able to assign permissions to it.'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {canViewPermissions && permissionsLoading && (
                        <div className="py-12">
                            <div className="flex flex-col items-center justify-center gap-4">
                                <div className="w-16 h-16 rounded-full border-4 border-t-[var(--accent-color)] border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
                                <p className="text-[var(--sub-text-color)] font-medium">
                                    {t('common.loading') || 'Loading permissions...'}
                                </p>
                            </div>
                        </div>
                    )}

                    {canViewPermissions && permissionsError && (
                        <div className="py-12">
                            <div className="rounded-xl p-6 border-2 border-red-500" style={{ background: "var(--bg-color)" }}>
                                <div className="flex items-center gap-3 justify-center">
                                    <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span className="font-semibold text-red-500">
                                        {t('roles.errors.loadPermissionsFailed') || 'Failed to load permissions'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {canViewPermissions && !permissionsLoading && !permissionsError && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                            {Object.keys(groupedPermissions).map(category => (
                                <div 
                                    key={category}
                                    className="rounded-xl p-4 border transition-all hover:shadow-md"
                                    style={{ 
                                        background: "var(--container-color)",
                                        borderColor: "var(--border-color)"
                                    }}
                                >
                                    <div className={`flex items-center justify-between gap-2 mb-3 pb-2 ${isArabic ? 'flex-row-reverse' : ''}`} style={{ borderBottom: "1px solid var(--divider-color)" }}>
                                        <div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                                            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--accent-color)20" }}>
                                                <svg className="w-4 h-4" style={{ color: "var(--accent-color)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                                                </svg>
                                            </div>
                                            <h3 
                                                className={`text-sm font-bold text-[var(--text-color)] ${isArabic ? 'text-right' : 'text-left'}`}
                                                dir={isArabic ? 'rtl' : 'ltr'}
                                            >
                                                {categoryDisplayNames[category] || category}
                                            </h3>
                                        </div>
                                        <label className={`flex items-center gap-2 cursor-pointer ${isArabic ? 'flex-row-reverse' : ''}`}>
                                            <input
                                                type="checkbox"
                                                checked={isCategoryAllSelected(category)}
                                                onChange={() => handleCategorySelectAll(category)}
                                                className="w-4 h-4 rounded border-2 border-[var(--border-color)] cursor-pointer"
                                                style={{ accentColor: 'var(--accent-color)' }}
                                            />
                                            <span className={`text-xs text-[var(--sub-text-color)] font-medium ${isArabic ? 'text-right' : 'text-left'}`} dir={isArabic ? 'rtl' : 'ltr'}>
                                                {t('roles.selectAll') || 'Select All'}
                                            </span>
                                        </label>
                                    </div>
                                    <div className="space-y-2">
                                        {groupedPermissions[category].map(permission => (
                                            <label 
                                                key={permission.id} 
                                                className={`flex items-center cursor-pointer p-2 rounded-lg hover:bg-[var(--hover-color)] transition-colors group ${isArabic ? 'flex-row-reverse' : ''}`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={formData.selectedPermissionIds.includes(permission.id)}
                                                    onChange={() => handlePermissionToggle(permission.id)}
                                                    className={`w-4 h-4 rounded border-2 border-[var(--border-color)] cursor-pointer ${isArabic ? 'mr-2' : 'mr-2'}`}
                                                    style={{ accentColor: 'var(--accent-color)' }}
                                                />
                                                <span 
                                                    className={`text-sm text-[var(--text-color)] flex-1 group-hover:text-[var(--accent-color)] transition-colors ${isArabic ? 'text-right' : 'text-left'}`}
                                                    dir={isArabic ? 'rtl' : 'ltr'}
                                                    title={permission.description}
                                                >
                                                    {permission.description}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Enhanced Form actions */}
                <div 
                    className="rounded-2xl p-6 border-2 sticky bottom-0"
                    style={{ 
                        background: "var(--bg-color)",
                        borderColor: "var(--border-color)",
                        boxShadow: "var(--shadow-color)"
                    }}
                >
                    <div className={`flex flex-col sm:flex-row justify-between items-center gap-4 ${isArabic ? 'flex-row-reverse' : ''}`}>
                        {/* Summary Info */}
                        <div className={`flex items-center gap-4 ${isArabic ? 'flex-row-reverse' : ''}`}>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                <span className="text-sm text-[var(--sub-text-color)]" dir={isArabic ? 'rtl' : 'ltr'}>
                                    <span className="font-bold text-[var(--text-color)]">{formData.selectedPermissionIds.length}</span> {t('roles.permissionsSelected')}
                                </span>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className={`flex gap-3 ${isArabic ? 'flex-row-reverse' : ''}`}>
                            <button
                                type="button"
                                onClick={handleBack}
                                className="btn-secondary flex items-center gap-2"
                                dir={isArabic ? 'rtl' : 'ltr'}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                                {t('roles.back')}
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting || (canViewPermissions && permissionsLoading)}
                                className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                dir={isArabic ? 'rtl' : 'ltr'}
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="w-5 h-5 rounded-full border-2 border-t-white border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
                                        {t('common.saving') || 'Saving...'}
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        {t('roles.add')}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default NewRoleForm;