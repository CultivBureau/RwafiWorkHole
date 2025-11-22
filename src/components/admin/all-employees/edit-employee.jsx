import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { X, User, Briefcase, FileText, Eye, EyeOff } from "lucide-react";
import { useUpdateUserMutation, useGetUserProfileByIdQuery } from "../../../services/apis/UserApi";
import { useGetAllRolesQuery } from "../../../services/apis/RoleApi";
import { useGetAllShiftsQuery } from "../../../services/apis/ShiftApi";
import { useGetTeamsByDepartmentQuery } from "../../../services/apis/TeamApi";
import { useGetAllDepartmentsQuery } from "../../../services/apis/DepartmentApi";
import { useGetAllLeaveTypesQuery } from "../../../services/apis/LeaveTypeApi";
import toast from "react-hot-toast";

export default function EditEmployeePopup({ employee, isOpen, onClose, onSave }) {
    const { t, i18n } = useTranslation();
    const isArabic = i18n.language === "ar";
    const [step, setStep] = useState(0);
    const [formData, setFormData] = useState({});
    const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();

    // Get employee ID from employee object
    const employeeId = employee?.id || employee?.userId || employee?.rawData?.id;

    // Fetch full employee profile data
    const { data: employeeProfileResponse, isLoading: isLoadingProfile } = useGetUserProfileByIdQuery(
        employeeId,
        { skip: !isOpen || !employeeId }
    );
    const employeeData = employeeProfileResponse?.value || employee;

    // Fetch dropdown data
    const { data: rolesRes } = useGetAllRolesQuery({ pageNumber: 1, pageSize: 100 });
    const roles = rolesRes?.value || rolesRes?.items || rolesRes || [];

    const { data: shiftsRes } = useGetAllShiftsQuery({ pageNumber: 1, pageSize: 100 });
    const shifts = shiftsRes?.value || shiftsRes?.items || shiftsRes || [];

    const { data: departmentsRes } = useGetAllDepartmentsQuery({ pageNumber: 1, pageSize: 100 });
    const departments = departmentsRes?.value || departmentsRes?.items || departmentsRes || [];

    const { data: leaveTypesRes } = useGetAllLeaveTypesQuery({ pageNumber: 1, pageSize: 100, status: 0 });
    const leaveTypes = leaveTypesRes?.value || leaveTypesRes?.items || leaveTypesRes || [];

    // Get teams based on selected department
    const { data: teamsRes } = useGetTeamsByDepartmentQuery(
        formData.departmentId || employeeData?.departments?.[0]?.id,
        { skip: !formData.departmentId && !employeeData?.departments?.[0]?.id }
    );
    const teams = teamsRes?.value || teamsRes?.items || teamsRes || [];

    // Initialize form data when employee data changes
    useEffect(() => {
        if (employeeData) {
            // Extract roles as array of role IDs or names
            const employeeRoles = employeeData.roles?.map(r => r.id || r.roleId || r.name || r) || [];
            
            // Extract team IDs
            const employeeTeamIds = employeeData.teams?.map(t => t.id || t.teamId) || [];
            
            // Extract shift ID (single value)
            const employeeShiftId = employeeData.shifts?.[0]?.id || employeeData.shiftId || '';
            
            // Extract department ID
            const employeeDepartmentId = employeeData.departments?.[0]?.id || employeeData.departmentId || '';

            // Extract leave balances
            const employeeLeaveBalances = employeeData.leaveBalances?.map(lb => ({
                leaveTypeId: lb.leaveTypeId || lb.leaveType?.id,
                balanceDays: lb.balanceDays || lb.balance || 0
            })) || [];

            setFormData({
                firstName: employeeData.firstName || '',
                lastName: employeeData.lastName || '',
                jobTitle: employeeData.jobTitle || '',
                password: '', // Password field (optional, only sent if provided)
                hireDate: employeeData.hireDate ? new Date(employeeData.hireDate).toISOString().split('T')[0] : '',
                employeeStatus: employeeData.employeeStatus !== undefined ? employeeData.employeeStatus : 0,
                roles: employeeRoles,
                role: employeeRoles[0] || '', // Single role for API (first selected role)
                teamIds: employeeTeamIds,
                shiftId: employeeShiftId,
                departmentId: employeeDepartmentId,
                leaveBalances: employeeLeaveBalances,
            });
        }
    }, [employeeData]);

    useEffect(() => {
        if (isOpen) {
            setStep(0);
        }
    }, [isOpen, employee]);

    if (!isOpen || !employee) return null;

    if (isLoadingProfile) {
        return (
            <div className="fixed inset-0 bg-black/20 backdrop-blur-lg flex items-center justify-center z-50 p-4">
                <div className="bg-[var(--bg-color)] rounded-xl border border-[var(--border-color)] p-8">
                    <div className="text-center">
                        <div className="w-8 h-8 border-2 border-[var(--accent-color)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-[var(--text-color)]">{t("common.loading") || "Loading..."}</p>
                    </div>
                </div>
            </div>
        );
    }

    const steps = [
        { label: t("employees.newEmployeeForm.steps.personalInfo"), icon: User },
        { label: t("employees.newEmployeeForm.steps.professionalInfo"), icon: Briefcase },
        { label: t("employees.editEmployee.leaveBalances") || "Leave Balances", icon: FileText },
        { label: t("employees.newEmployeeForm.steps.documents"), icon: FileText },
    ];

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSave = async () => {
        if (!employeeId) {
            toast.error(t("employees.editEmployee.errors.noEmployeeId") || "Employee ID not found");
            return;
        }

        // Validate required fields
        if (!formData.firstName?.trim()) {
            toast.error(t("employees.editEmployee.errors.firstNameRequired") || "First name is required");
            return;
        }
        if (!formData.lastName?.trim()) {
            toast.error(t("employees.editEmployee.errors.lastNameRequired") || "Last name is required");
            return;
        }
        if (!formData.jobTitle?.trim()) {
            toast.error(t("employees.editEmployee.errors.jobTitleRequired") || "Job title is required");
            return;
        }

        try {
            // Build update payload
            const updatePayload = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                jobTitle: formData.jobTitle,
                employeeStatus: formData.employeeStatus !== undefined ? formData.employeeStatus : 0,
            };

            // Add optional fields only if they have values
            if (formData.password && formData.password.trim()) {
                updatePayload.password = formData.password;
            }

            if (formData.hireDate) {
                const date = new Date(formData.hireDate);
                updatePayload.hireDate = date.toISOString();
            }

            // API expects 'role' as a single string (use first selected role)
            if (formData.roles && formData.roles.length > 0) {
                updatePayload.role = formData.roles[0];
            } else if (formData.role) {
                updatePayload.role = formData.role;
            }

            if (formData.teamIds && formData.teamIds.length > 0) {
                updatePayload.teamIds = formData.teamIds;
            }

            if (formData.shiftId) {
                updatePayload.shiftId = formData.shiftId;
            }

            if (formData.leaveBalances && formData.leaveBalances.length > 0) {
                updatePayload.leaveBalances = formData.leaveBalances;
            }

            toast.loading(t("employees.editEmployee.processing") || "Updating employee...");
            await updateUser({ id: employeeId, ...updatePayload }).unwrap();
            toast.dismiss();
            toast.success(t("employees.editEmployee.success") || "Employee updated successfully!");

            if (onSave) {
                onSave(updatePayload);
            }
            onClose();
        } catch (err) {
            toast.dismiss();
            const apiErrors = err?.data?.errors || err?.data?.Errors;
            const modelState = apiErrors && typeof apiErrors === 'object' ? Object.values(apiErrors).flat().join(' | ') : null;
            const message = modelState || err?.data?.errorMessage || err?.data?.message || err?.message || t("employees.editEmployee.errors.updateFailed") || "Failed to update employee";
            toast.error(message);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-lg flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div
                className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-[var(--bg-color)] rounded-xl border border-[var(--border-color)] p-8"
                dir={isArabic ? "rtl" : "ltr"}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className={`flex items-center justify-between mb-6 ${isArabic ? 'flex-row-reverse' : ''}`}>
                    <h2 className="text-xl font-semibold text-[var(--text-color)]">
                        {t("employees.editEmployee.title", "Edit Employee")}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-[var(--hover-color)] rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-[var(--sub-text-color)]" />
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="mb-8">
                    <div className="relative mb-4">
                        <div className="w-full h-1 bg-[var(--border-color)] rounded" />
                        <div
                            className={`absolute top-0 h-1 gradient-bg rounded transition-all duration-300 ${isArabic ? 'right-0' : 'left-0'}`}
                            style={{ width: `${((step + 1) / steps.length) * 100}%` }}
                        />
                    </div>

                    <div className="hidden sm:flex justify-between">
                        {steps.map((stepItem, idx) => {
                            const IconComponent = stepItem.icon;
                            const isActive = idx === step;
                            const isCompleted = idx < step;

                            return (
                                <button
                                    key={stepItem.label}
                                    onClick={() => setStep(idx)}
                                    className="flex items-center cursor-pointer"
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isArabic ? 'ml-2' : 'mr-2'} ${isActive || isCompleted
                                            ? 'gradient-bg text-white'
                                            : 'bg-[var(--container-color)] text-[var(--sub-text-color)]'
                                        }`}>
                                        <IconComponent size={16} />
                                    </div>
                                    <span className={`text-sm font-medium ${isActive || isCompleted
                                            ? 'gradient-text'
                                            : 'text-[var(--sub-text-color)]'
                                        }`}>
                                        {stepItem.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Step Content */}
                <div className="mt-8">
                    {step === 0 && <PersonalInfoEdit formData={formData} onChange={handleInputChange} />}
                    {step === 1 && (
                        <ProfessionalInfoEdit 
                            formData={formData} 
                            onChange={handleInputChange}
                            roles={roles}
                            shifts={shifts}
                            teams={teams}
                            departments={departments}
                        />
                    )}
                    {step === 2 && <LeaveBalancesEdit formData={formData} onChange={handleInputChange} leaveTypes={leaveTypes} />}
                    {step === 3 && <DocumentsEdit formData={formData} onChange={handleInputChange} />}
                </div>

                {/* Navigation */}
                <div className={`flex justify-between mt-8 ${isArabic ? 'flex-row-reverse' : ''}`}>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setStep(Math.max(0, step - 1))}
                            disabled={step === 0}
                            className="btn-secondary disabled:opacity-50"
                        >
                            {t("employees.newEmployeeForm.buttons.back")}
                        </button>
                        {step < steps.length - 1 ? (
                            <button
                                onClick={() => setStep(Math.min(3, step + 1))}
                                className="btn-primary"
                            >
                                {t("employees.newEmployeeForm.buttons.next")}
                            </button>
                        ) : (
                            <button
                                onClick={handleSave}
                                className="btn-primary flex items-center gap-2"
                                disabled={isUpdating}
                            >
                                {isUpdating ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        <span>{t("common.loading") || "Saving..."}</span>
                                    </>
                                ) : (
                                    t("employees.editEmployee.save", "Save Changes")
                                )}
                            </button>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="btn-secondary"
                    >
                        {t("employees.newEmployeeForm.buttons.cancel")}
                    </button>
                </div>
            </div>
        </div>
    );
}

// Personal Information Edit
function PersonalInfoEdit({ formData, onChange }) {
    const { t, i18n } = useTranslation();
    const isArabic = i18n.language === "ar";
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className="space-y-6">
            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-[var(--text-color)] mb-2">
                        {t("employees.newEmployeeForm.personalInfo.firstName")} <span className="text-red-500">*</span>
                    </label>
                    <input
                        className="form-input"
                        placeholder={t("employees.newEmployeeForm.personalInfo.firstName")}
                        type="text"
                        value={formData.firstName || ''}
                        onChange={(e) => onChange('firstName', e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-[var(--text-color)] mb-2">
                        {t("employees.newEmployeeForm.personalInfo.lastName")} <span className="text-red-500">*</span>
                    </label>
                    <input
                        className="form-input"
                        placeholder={t("employees.newEmployeeForm.personalInfo.lastName")}
                        type="text"
                        value={formData.lastName || ''}
                        onChange={(e) => onChange('lastName', e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-[var(--text-color)] mb-2">
                        {t("employees.newEmployeeForm.personalInfo.jobTitle") || "Job Title"} <span className="text-red-500">*</span>
                    </label>
                    <input
                        className="form-input"
                        placeholder={t("employees.newEmployeeForm.personalInfo.jobTitle") || "Job Title"}
                        type="text"
                        value={formData.jobTitle || ''}
                        onChange={(e) => onChange('jobTitle', e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-[var(--text-color)] mb-2">
                        {t("employees.editEmployee.password") || "Password"} <span className="text-[var(--sub-text-color)] text-xs">(Optional - leave blank to keep current)</span>
                    </label>
                    <div className="relative">
                        <input
                            className="form-input pr-10"
                            placeholder={t("employees.editEmployee.passwordPlaceholder") || "Enter new password (optional)"}
                            type={showPassword ? 'text' : 'password'}
                            value={formData.password || ''}
                            onChange={(e) => onChange('password', e.target.value)}
                            autoComplete="new-password"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(s => !s)}
                            className={`absolute ${isArabic ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-[var(--sub-text-color)]`}
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-[var(--text-color)] mb-2">
                        {t("employees.newEmployeeForm.personalInfo.hireDate") || "Hire Date"} <span className="text-[var(--sub-text-color)] text-xs">(Optional)</span>
                    </label>
                    <input
                        className="form-input"
                        placeholder={t("employees.newEmployeeForm.personalInfo.hireDate") || "Hire Date"}
                        type="date"
                        value={formData.hireDate || ''}
                        onChange={(e) => onChange('hireDate', e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-[var(--text-color)] mb-2">
                        {t("employees.editEmployee.employeeStatus") || "Employee Status"}
                    </label>
                    <select
                        className="form-input"
                        value={formData.employeeStatus !== undefined ? formData.employeeStatus : 0}
                        onChange={(e) => onChange('employeeStatus', parseInt(e.target.value))}
                    >
                        <option value={0}>{t("employees.editEmployee.statusActive") || "Active"}</option>
                        <option value={1}>{t("employees.editEmployee.statusInactive") || "Inactive"}</option>
                    </select>
                </div>
            </div>
        </div>
    );
}

// Professional Information Edit
function ProfessionalInfoEdit({ formData, onChange, roles, shifts, teams, departments }) {
    const { t, i18n } = useTranslation();
    const isArabic = i18n.language === "ar";

    const roleOptions = Array.isArray(roles) ? roles : [];
    const shiftOptions = Array.isArray(shifts) ? shifts : [];
    const teamOptions = Array.isArray(teams) ? teams : [];
    const deptOptions = Array.isArray(departments) ? departments : [];

    const handleRoleChange = (e) => {
        const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
        onChange('roles', selectedOptions);
        // Also update single role field (API expects single role string)
        onChange('role', selectedOptions[0] || '');
    };

    const handleTeamChange = (e) => {
        const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
        onChange('teamIds', selectedOptions);
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-[var(--text-color)] mb-2">
                        {t("employees.newEmployeeForm.professionalInfo.selectDepartment") || "Department"}
                    </label>
                    <select
                        className="form-input"
                        value={formData.departmentId || ''}
                        onChange={e => {
                            onChange('departmentId', e.target.value);
                            onChange('teamIds', []);
                        }}
                    >
                        <option value="">{t("employees.newEmployeeForm.professionalInfo.selectDepartment")}</option>
                        {deptOptions.map((d) => (
                            <option key={d.id || d.departmentId} value={d.id || d.departmentId}>
                                {d.name || d.departmentName}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-[var(--text-color)] mb-2">
                        {t("employees.newEmployeeForm.professionalInfo.selectEmployeeRole") || "Roles"}
                    </label>
                    <select
                        className="form-input"
                        multiple
                        size={4}
                        value={formData.roles || []}
                        onChange={handleRoleChange}
                    >
                        {roleOptions.map((r) => (
                            <option key={r.id || r.roleId} value={r.id || r.roleId}>
                                {r.name || r.roleName || r.code}
                            </option>
                        ))}
                    </select>
                    <p className="text-xs text-[var(--sub-text-color)] mt-1">
                        {t("employees.newEmployeeForm.professionalInfo.holdCtrl") || "Hold Ctrl/Cmd to select multiple"}
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-[var(--text-color)] mb-2">
                        {t("employees.newEmployeeForm.professionalInfo.selectShift") || "Shift"}
                    </label>
                    <select
                        className="form-input"
                        value={formData.shiftId || ''}
                        onChange={e => onChange('shiftId', e.target.value)}
                    >
                        <option value="">{t("employees.newEmployeeForm.professionalInfo.selectShift") || "Select shift"}</option>
                        {shiftOptions.map((s) => (
                            <option key={s.id || s.shiftId} value={s.id || s.shiftId}>
                                {s.name || s.shiftName}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-[var(--text-color)] mb-2">
                        {t("employees.newEmployeeForm.professionalInfo.selectTeam") || "Teams"} <span className="text-[var(--sub-text-color)] text-xs">(Optional)</span>
                    </label>
                    <select
                        className="form-input"
                        multiple
                        size={4}
                        value={formData.teamIds || []}
                        onChange={handleTeamChange}
                        disabled={!formData.departmentId}
                    >
                        {formData.departmentId ? (
                            teamOptions.map((tm) => (
                                <option key={tm.id || tm.teamId} value={tm.id || tm.teamId}>
                                    {tm.name || tm.teamName}
                                </option>
                            ))
                        ) : (
                            <option disabled>{t("employees.newEmployeeForm.professionalInfo.selectDepartment") || "Select department first"}</option>
                        )}
                    </select>
                    <p className="text-xs text-[var(--sub-text-color)] mt-1">
                        {t("employees.newEmployeeForm.professionalInfo.holdCtrl") || "Hold Ctrl/Cmd to select multiple"}
                    </p>
                </div>
            </div>
        </div>
    );
}

// Leave Balances Edit
function LeaveBalancesEdit({ formData, onChange, leaveTypes }) {
    const { t, i18n } = useTranslation();
    const isArabic = i18n.language === "ar";

    const leaveBalances = formData.leaveBalances || [];

    const handleLeaveBalanceChange = (index, field, value) => {
        const updated = [...leaveBalances];
        if (!updated[index]) {
            updated[index] = { leaveTypeId: '', balanceDays: 0 };
        }
        updated[index][field] = field === 'balanceDays' ? parseFloat(value) || 0 : value;
        onChange('leaveBalances', updated);
    };

    const addLeaveBalance = () => {
        onChange('leaveBalances', [...leaveBalances, { leaveTypeId: '', balanceDays: 0 }]);
    };

    const removeLeaveBalance = (index) => {
        const updated = leaveBalances.filter((_, i) => i !== index);
        onChange('leaveBalances', updated);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[var(--text-color)]">
                    {t("employees.editEmployee.leaveBalances") || "Leave Balances"}
                </h3>
                <button
                    type="button"
                    onClick={addLeaveBalance}
                    className="btn-primary text-sm"
                >
                    {t("employees.editEmployee.addLeaveBalance") || "+ Add Leave Balance"}
                </button>
            </div>

            {leaveBalances.length === 0 ? (
                <div className="text-center py-8 text-[var(--sub-text-color)]">
                    {t("employees.editEmployee.noLeaveBalances") || "No leave balances added. Click 'Add Leave Balance' to add one."}
                </div>
            ) : (
                <div className="space-y-4">
                    {leaveBalances.map((balance, index) => (
                        <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end p-4 border border-[var(--border-color)] rounded-lg">
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-color)] mb-2">
                                    {t("employees.editEmployee.leaveType") || "Leave Type"}
                                </label>
                                <select
                                    className="form-input"
                                    value={balance.leaveTypeId || ''}
                                    onChange={(e) => handleLeaveBalanceChange(index, 'leaveTypeId', e.target.value)}
                                >
                                    <option value="">{t("employees.editEmployee.selectLeaveType") || "Select leave type"}</option>
                                    {leaveTypes.map((lt) => (
                                        <option key={lt.id || lt.leaveTypeId} value={lt.id || lt.leaveTypeId}>
                                            {lt.name || lt.leaveTypeName}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--text-color)] mb-2">
                                    {t("employees.editEmployee.balanceDays") || "Balance Days"}
                                </label>
                                <input
                                    className="form-input"
                                    type="number"
                                    min="0"
                                    step="0.5"
                                    value={balance.balanceDays || 0}
                                    onChange={(e) => handleLeaveBalanceChange(index, 'balanceDays', e.target.value)}
                                />
                            </div>
                            <div>
                                <button
                                    type="button"
                                    onClick={() => removeLeaveBalance(index)}
                                    className="btn-secondary w-full"
                                >
                                    {t("common.remove") || "Remove"}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// Documents Edit (simplified for this example)
function DocumentsEdit({ formData, onChange }) {
    const { t } = useTranslation();

    return (
        <div className="space-y-6">
            <div className="text-center py-8">
                <FileText className="w-16 h-16 mx-auto mb-4 text-[var(--sub-text-color)]" />
                <p className="text-[var(--sub-text-color)]">
                    {t("employees.editEmployee.documentsNote", "Document management will be available in a future update")}
                </p>
            </div>
        </div>
    );
}
