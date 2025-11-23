import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { X, User, Briefcase, FileText, Eye, EyeOff, Save, ArrowRight, ArrowLeft, Calendar, Lock, Users, Clock, Building2 } from "lucide-react";
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
            // Extract roles as array of role IDs (prefer ID over name for API)
            const employeeRoles = employeeData.roles?.map(r => {
                return r.id || r.roleId || r.name || r;
            }).filter(Boolean) || [];
            
            // Extract team IDs as array
            const employeeTeamIds = employeeData.teams?.map(t => t.id || t.teamId).filter(Boolean) || [];
            
            // Extract shift ID (single value, not array)
            const employeeShiftId = employeeData.shifts?.[0]?.id || 
                                   employeeData.shiftId || 
                                   employeeData.shift?.id || 
                                   '';
            
            // Extract department ID
            const employeeDepartmentId = employeeData.departments?.[0]?.id || 
                                        employeeData.departmentId || 
                                        employeeData.department?.id || 
                                        '';

            // Extract leave balances - ensure proper structure
            const employeeLeaveBalances = employeeData.leaveBalances?.map(lb => ({
                leaveTypeId: lb.leaveTypeId || lb.leaveType?.id || lb.leaveTypeId,
                balanceDays: parseFloat(lb.balanceDays) || parseFloat(lb.balance) || 0
            })).filter(lb => lb.leaveTypeId) || [];

            setFormData({
                firstName: employeeData.firstName || '',
                lastName: employeeData.lastName || '',
                jobTitle: employeeData.jobTitle || '',
                password: '', // Password field (optional, only sent if provided)
                hireDate: employeeData.hireDate ? new Date(employeeData.hireDate).toISOString().split('T')[0] : '',
                employeeStatus: employeeData.employeeStatus !== undefined ? employeeData.employeeStatus : 0,
                roles: employeeRoles, // Keep array for backward compatibility
                role: employeeRoles[0] || employeeData.role || '', // Single role for dropdown
                teamIds: employeeTeamIds, // Keep array for backward compatibility
                teamId: employeeTeamIds[0] || '', // Single team for dropdown
                shiftId: employeeShiftId, // Single value
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
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-[var(--bg-color)] rounded-2xl border border-[var(--border-color)] p-8 shadow-2xl">
                    <div className="text-center">
                        <div className="w-12 h-12 border-4 border-[var(--accent-color)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-[var(--text-color)] font-medium">{t("common.loading") || "Loading..."}</p>
                    </div>
                </div>
            </div>
        );
    }

    const steps = [
        { label: t("employees.newEmployeeForm.steps.personalInfo") || "Personal Information", icon: User },
        { label: t("employees.newEmployeeForm.steps.professionalInfo") || "Professional Information", icon: Briefcase },
        { label: t("employees.editEmployee.leaveBalances") || "Leave Balances", icon: FileText },
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
            // Build update payload matching API structure exactly
            const updatePayload = {
                firstName: formData.firstName.trim(),
                lastName: formData.lastName.trim(),
                jobTitle: formData.jobTitle.trim(),
                employeeStatus: formData.employeeStatus !== undefined ? formData.employeeStatus : 0,
            };

            // Add optional password only if provided
            if (formData.password && formData.password.trim()) {
                updatePayload.password = formData.password.trim();
            }

            // Add hireDate if provided (convert to ISO string)
            if (formData.hireDate) {
                const date = new Date(formData.hireDate);
                if (!isNaN(date.getTime())) {
                    updatePayload.hireDate = date.toISOString();
                }
            }

            // API expects 'role' as a single string (role ID or name)
            // Prefer single role value from dropdown, fallback to first item in array
            let roleValue = null;
            if (formData.role) {
                roleValue = formData.role;
            } else if (formData.roles && Array.isArray(formData.roles) && formData.roles.length > 0) {
                roleValue = formData.roles[0];
            }
            
            if (roleValue) {
                if (typeof roleValue === 'object' && roleValue !== null) {
                    updatePayload.role = String(roleValue.id || roleValue.roleId || roleValue.name || '');
                } else {
                    updatePayload.role = String(roleValue);
                }
                
                if (!updatePayload.role || updatePayload.role.trim() === '') {
                    delete updatePayload.role;
                }
            }

            // Add teamIds as array (only if has items)
            // Support both single teamId and array teamIds
            const teamIdsToSend = formData.teamId 
                ? [formData.teamId] 
                : (formData.teamIds && Array.isArray(formData.teamIds) && formData.teamIds.length > 0 ? formData.teamIds : []);
            
            if (teamIdsToSend.length > 0) {
                updatePayload.teamIds = teamIdsToSend;
            }

            // Add shiftId as single GUID (not array)
            if (formData.shiftId && formData.shiftId.trim()) {
                updatePayload.shiftId = formData.shiftId;
            }

            // Add leaveBalances array (only if has items)
            if (formData.leaveBalances && Array.isArray(formData.leaveBalances) && formData.leaveBalances.length > 0) {
                updatePayload.leaveBalances = formData.leaveBalances
                    .filter(lb => lb.leaveTypeId && lb.leaveTypeId.trim())
                    .map(lb => ({
                        leaveTypeId: lb.leaveTypeId,
                        balanceDays: parseFloat(lb.balanceDays) || 0
                    }));
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div
                className="w-full max-w-5xl max-h-[95vh] overflow-y-auto bg-[var(--bg-color)] rounded-2xl border border-[var(--border-color)] shadow-2xl"
                dir={isArabic ? "rtl" : "ltr"}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header with gradient */}
                <div className="sticky top-0 z-10 bg-[var(--bg-color)] border-b border-[var(--border-color)] rounded-t-2xl shadow-sm">
                    <div className={`h-1 ${isArabic ? 'bg-gradient-to-l' : 'bg-gradient-to-r'} from-[#15919B] to-[#09D1C7]`} />
                    <div className={`flex items-center justify-between px-6 py-5 ${isArabic ? 'flex-row-reverse' : ''}`}>
                        <div className={`flex items-center gap-3 ${isArabic ? 'flex-row-reverse' : ''}`}>
                            <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#15919B] to-[#09D1C7] shadow-md">
                                <User className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-[var(--text-color)]">
                                    {t("employees.editEmployee.title") || "Edit Employee"}
                                </h2>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className={`p-2 hover:bg-[var(--hover-color)] rounded-lg transition-all duration-200 hover:scale-110 ${isArabic ? 'mr-auto' : 'ml-auto'}`}
                            aria-label={t("common.close") || "Close"}
                        >
                            <X className="w-5 h-5 text-[var(--sub-text-color)]" />
                        </button>
                    </div>
                </div>

                <div className="p-6">
                    {/* Progress Bar */}
                    <div className="mb-8">
                        <div className="relative mb-6">
                            <div className="w-full h-2.5 bg-[var(--container-color)] rounded-full shadow-inner" />
                            <div
                                className={`absolute top-0 h-2.5 rounded-full transition-all duration-500 shadow-md ${isArabic ? 'right-0 bg-gradient-to-l' : 'left-0 bg-gradient-to-r'} from-[#15919B] to-[#09D1C7]`}
                                style={{ width: `${((step + 1) / steps.length) * 100}%` }}
                            />
                        </div>

                        <div className={`flex justify-between items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                            {steps.map((stepItem, idx) => {
                                const IconComponent = stepItem.icon;
                                const isActive = idx === step;
                                const isCompleted = idx < step;

                                return (
                                    <button
                                        key={idx}
                                        onClick={() => setStep(idx)}
                                        className={`flex items-center gap-3 cursor-pointer transition-all group ${isArabic ? 'flex-row-reverse' : ''}`}
                                    >
                                        <div className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                                            isActive || isCompleted
                                                ? 'bg-gradient-to-br from-[#15919B] to-[#09D1C7] text-white shadow-lg scale-110 ring-4 ring-[#15919B]/20'
                                                : 'bg-[var(--container-color)] text-[var(--sub-text-color)] hover:bg-[var(--hover-color)] hover:scale-105'
                                        }`}>
                                            <IconComponent size={20} />
                                            {(isActive || isCompleted) && (
                                                <div className="absolute inset-0 rounded-full bg-white/20 animate-pulse" />
                                            )}
                                        </div>
                                        <span className={`text-sm font-semibold hidden sm:block transition-colors ${
                                            isActive || isCompleted
                                                ? 'text-[var(--accent-color)]'
                                                : 'text-[var(--sub-text-color)] group-hover:text-[var(--text-color)]'
                                        }`}>
                                            {stepItem.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Step Content */}
                    <div className="mt-8 min-h-[400px] flex items-center justify-center">
                        <div className="w-full max-w-4xl">
                            {step === 0 && <PersonalInfoEdit formData={formData} onChange={handleInputChange} isArabic={isArabic} t={t} />}
                            {step === 1 && (
                                <ProfessionalInfoEdit 
                                    formData={formData} 
                                    onChange={handleInputChange}
                                    roles={roles}
                                    shifts={shifts}
                                    teams={teams}
                                    departments={departments}
                                    isArabic={isArabic}
                                    t={t}
                                />
                            )}
                            {step === 2 && <LeaveBalancesEdit formData={formData} onChange={handleInputChange} leaveTypes={leaveTypes} isArabic={isArabic} t={t} />}
                        </div>
                    </div>

                    {/* Navigation */}
                    <div className={`flex justify-between items-center mt-8 pt-6 border-t border-[var(--border-color)] ${isArabic ? 'flex-row-reverse' : ''}`}>
                        <div className={`flex gap-3 ${isArabic ? 'flex-row-reverse' : ''}`}>
                            <button
                                onClick={() => setStep(Math.max(0, step - 1))}
                                disabled={step === 0}
                                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                                    step === 0
                                        ? 'bg-[var(--container-color)] text-[var(--sub-text-color)]'
                                        : 'bg-[var(--container-color)] text-[var(--text-color)] hover:bg-[var(--hover-color)]'
                                }`}
                            >
                                {isArabic ? <ArrowRight size={18} /> : <ArrowLeft size={18} />}
                                {t("employees.newEmployeeForm.buttons.back") || "Back"}
                            </button>
                            {step < steps.length - 1 ? (
                                <button
                                    onClick={() => setStep(Math.min(steps.length - 1, step + 1))}
                                    className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-[#15919B] to-[#09D1C7] hover:shadow-lg transition-all"
                                >
                                    {t("employees.newEmployeeForm.buttons.next") || "Next"}
                                    {isArabic ? <ArrowLeft size={18} /> : <ArrowRight size={18} />}
                                </button>
                            ) : (
                                <button
                                    onClick={handleSave}
                                    className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-[#15919B] to-[#09D1C7] hover:shadow-lg transition-all disabled:opacity-50"
                                    disabled={isUpdating}
                                >
                                    {isUpdating ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            <span>{t("common.loading") || "Saving..."}</span>
                                        </>
                                    ) : (
                                        <>
                                            <Save size={18} />
                                            <span>{t("employees.editEmployee.save") || "Save Changes"}</span>
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            className="px-6 py-3 rounded-xl font-semibold bg-[var(--container-color)] text-[var(--text-color)] hover:bg-[var(--hover-color)] transition-all"
                        >
                            {t("employees.newEmployeeForm.buttons.cancel") || "Cancel"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Personal Information Edit
function PersonalInfoEdit({ formData, onChange, isArabic, t }) {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className="space-y-6" dir={isArabic ? "rtl" : "ltr"}>
            <div className="mb-6">
                <h3 className={`text-xl font-bold text-[var(--text-color)] flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                    <User className="w-5 h-5 text-[var(--accent-color)]" />
                    {t("employees.newEmployeeForm.steps.personalInfo") || "Personal Information"}
                </h3>
                <p className={`text-sm text-[var(--sub-text-color)] mt-1 ${isArabic ? 'text-right' : 'text-left'}`}>
                    {t("employees.editEmployee.personalInfoDescription") || "Update employee's personal details"}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className={`flex items-center gap-2 text-sm font-semibold text-[var(--text-color)] mb-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                        <span className="w-1 h-4 rounded-full bg-[var(--accent-color)] shadow-sm" />
                        {t("employees.newEmployeeForm.personalInfo.firstName") || "First Name"} <span className="text-red-500 font-bold">*</span>
                    </label>
                    <input
                        className={`w-full px-4 py-3.5 rounded-xl border-2 border-[var(--border-color)] bg-[var(--bg-color)] text-[var(--text-color)] focus:border-[var(--accent-color)] focus:ring-4 focus:ring-[var(--accent-color)]/20 transition-all hover:border-[var(--accent-color)]/50 ${isArabic ? 'text-right' : 'text-left'}`}
                        placeholder={t("employees.newEmployeeForm.personalInfo.firstName") || "Enter first name"}
                        type="text"
                        value={formData.firstName || ''}
                        onChange={(e) => onChange('firstName', e.target.value)}
                        required
                        dir={isArabic ? "rtl" : "ltr"}
                    />
                </div>

                <div className="space-y-2">
                    <label className={`flex items-center gap-2 text-sm font-semibold text-[var(--text-color)] mb-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                        <span className="w-1 h-4 rounded-full bg-[var(--accent-color)] shadow-sm" />
                        {t("employees.newEmployeeForm.personalInfo.lastName") || "Last Name"} <span className="text-red-500 font-bold">*</span>
                    </label>
                    <input
                        className={`w-full px-4 py-3.5 rounded-xl border-2 border-[var(--border-color)] bg-[var(--bg-color)] text-[var(--text-color)] focus:border-[var(--accent-color)] focus:ring-4 focus:ring-[var(--accent-color)]/20 transition-all hover:border-[var(--accent-color)]/50 ${isArabic ? 'text-right' : 'text-left'}`}
                        placeholder={t("employees.newEmployeeForm.personalInfo.lastName") || "Enter last name"}
                        type="text"
                        value={formData.lastName || ''}
                        onChange={(e) => onChange('lastName', e.target.value)}
                        required
                        dir={isArabic ? "rtl" : "ltr"}
                    />
                </div>

                <div className="space-y-2">
                    <label className={`flex items-center gap-2 text-sm font-semibold text-[var(--text-color)] mb-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                        <Briefcase className="w-4 h-4 text-[var(--accent-color)]" />
                        {t("employees.newEmployeeForm.personalInfo.jobTitle") || "Job Title"} <span className="text-red-500 font-bold">*</span>
                    </label>
                    <input
                        className={`w-full px-4 py-3.5 rounded-xl border-2 border-[var(--border-color)] bg-[var(--bg-color)] text-[var(--text-color)] focus:border-[var(--accent-color)] focus:ring-4 focus:ring-[var(--accent-color)]/20 transition-all hover:border-[var(--accent-color)]/50 ${isArabic ? 'text-right' : 'text-left'}`}
                        placeholder={t("employees.newEmployeeForm.personalInfo.jobTitle") || "Enter job title"}
                        type="text"
                        value={formData.jobTitle || ''}
                        onChange={(e) => onChange('jobTitle', e.target.value)}
                        required
                        dir={isArabic ? "rtl" : "ltr"}
                    />
                </div>

                <div className="space-y-2">
                    <label className={`flex items-center gap-2 text-sm font-semibold text-[var(--text-color)] mb-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                        <Calendar className="w-4 h-4 text-[var(--accent-color)]" />
                        {t("employees.newEmployeeForm.personalInfo.hireDate") || "Hire Date"}
                    </label>
                    <input
                        className={`w-full px-4 py-3.5 rounded-xl border-2 border-[var(--border-color)] bg-[var(--bg-color)] text-[var(--text-color)] focus:border-[var(--accent-color)] focus:ring-4 focus:ring-[var(--accent-color)]/20 transition-all hover:border-[var(--accent-color)]/50 ${isArabic ? 'text-right' : 'text-left'}`}
                        type="date"
                        value={formData.hireDate || ''}
                        onChange={(e) => onChange('hireDate', e.target.value)}
                        dir={isArabic ? "rtl" : "ltr"}
                    />
                </div>

                <div className="space-y-2">
                    <label className={`flex items-center gap-2 text-sm font-semibold text-[var(--text-color)] mb-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                        <Lock className="w-4 h-4 text-[var(--accent-color)]" />
                        {t("employees.editEmployee.password") || "Password"}
                        <span className="text-xs text-[var(--sub-text-color)] font-normal">({t("common.optional") || "Optional"})</span>
                    </label>
                    <div className="relative">
                        <input
                            className={`w-full px-4 py-3.5 ${isArabic ? 'pl-12' : 'pr-12'} rounded-xl border-2 border-[var(--border-color)] bg-[var(--bg-color)] text-[var(--text-color)] focus:border-[var(--accent-color)] focus:ring-4 focus:ring-[var(--accent-color)]/20 transition-all hover:border-[var(--accent-color)]/50 ${isArabic ? 'text-right' : 'text-left'}`}
                            placeholder={t("employees.editEmployee.passwordPlaceholder") || "Enter new password (optional)"}
                            type={showPassword ? 'text' : 'password'}
                            value={formData.password || ''}
                            onChange={(e) => onChange('password', e.target.value)}
                            autoComplete="new-password"
                            dir={isArabic ? "rtl" : "ltr"}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(s => !s)}
                            className={`absolute ${isArabic ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-[var(--sub-text-color)] hover:text-[var(--accent-color)] transition-colors p-1 rounded hover:bg-[var(--hover-color)]`}
                            aria-label={showPassword ? (t("common.hidePassword") || "Hide password") : (t("common.showPassword") || "Show password")}
                        >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className={`flex items-center gap-2 text-sm font-semibold text-[var(--text-color)] mb-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                        <span className="w-1 h-4 rounded-full bg-[var(--accent-color)] shadow-sm" />
                        {t("employees.editEmployee.status") || "Status"}
                    </label>
                    <select
                        className={`w-full px-4 py-3.5 rounded-xl border-2 border-[var(--border-color)] bg-[var(--bg-color)] text-[var(--text-color)] focus:border-[var(--accent-color)] focus:ring-4 focus:ring-[var(--accent-color)]/20 transition-all hover:border-[var(--accent-color)]/50 cursor-pointer ${isArabic ? 'text-right' : 'text-left'}`}
                        value={formData.employeeStatus !== undefined ? formData.employeeStatus : 0}
                        onChange={(e) => onChange('employeeStatus', parseInt(e.target.value))}
                        dir={isArabic ? "rtl" : "ltr"}
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
function ProfessionalInfoEdit({ formData, onChange, roles, shifts, teams, departments, isArabic, t }) {
    const roleOptions = Array.isArray(roles) ? roles : [];
    const shiftOptions = Array.isArray(shifts) ? shifts : [];
    const teamOptions = Array.isArray(teams) ? teams : [];
    const deptOptions = Array.isArray(departments) ? departments : [];

    const handleRoleChange = (e) => {
        const selectedValue = e.target.value;
        onChange('role', selectedValue);
        onChange('roles', selectedValue ? [selectedValue] : []);
    };

    const handleTeamChange = (e) => {
        const selectedValue = e.target.value;
        onChange('teamId', selectedValue);
        onChange('teamIds', selectedValue ? [selectedValue] : []);
    };

    return (
        <div className="space-y-6" dir={isArabic ? "rtl" : "ltr"}>
            <div className="mb-6">
                <h3 className={`text-xl font-bold text-[var(--text-color)] flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                    <Briefcase className="w-5 h-5 text-[var(--accent-color)]" />
                    {t("employees.newEmployeeForm.steps.professionalInfo") || "Professional Information"}
                </h3>
                <p className={`text-sm text-[var(--sub-text-color)] mt-1 ${isArabic ? 'text-right' : 'text-left'}`}>
                    {t("employees.editEmployee.professionalInfoDescription") || "Update employee's professional details and assignments"}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className={`flex items-center gap-2 text-sm font-semibold text-[var(--text-color)] mb-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                        <Building2 className="w-4 h-4 text-[var(--accent-color)]" />
                        {t("employees.newEmployeeForm.professionalInfo.selectDepartment") || "Department"}
                    </label>
                    <select
                        className={`w-full px-4 py-3.5 rounded-xl border-2 border-[var(--border-color)] bg-[var(--bg-color)] text-[var(--text-color)] focus:border-[var(--accent-color)] focus:ring-4 focus:ring-[var(--accent-color)]/20 transition-all hover:border-[var(--accent-color)]/50 cursor-pointer ${isArabic ? 'text-right' : 'text-left'}`}
                        value={formData.departmentId || ''}
                        onChange={e => {
                            onChange('departmentId', e.target.value);
                            onChange('teamIds', []);
                            onChange('teamId', '');
                        }}
                        dir={isArabic ? "rtl" : "ltr"}
                    >
                        <option value="">{t("employees.newEmployeeForm.professionalInfo.selectDepartment") || "Select Department"}</option>
                        {deptOptions.map((d) => (
                            <option key={d.id || d.departmentId} value={d.id || d.departmentId}>
                                {d.name || d.departmentName}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="space-y-2">
                    <label className={`flex items-center gap-2 text-sm font-semibold text-[var(--text-color)] mb-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                        <User className="w-4 h-4 text-[var(--accent-color)]" />
                        {t("employees.newEmployeeForm.professionalInfo.selectEmployeeRole") || "Role"}
                    </label>
                    <select
                        className={`w-full px-4 py-3.5 rounded-xl border-2 border-[var(--border-color)] bg-[var(--bg-color)] text-[var(--text-color)] focus:border-[var(--accent-color)] focus:ring-4 focus:ring-[var(--accent-color)]/20 transition-all hover:border-[var(--accent-color)]/50 cursor-pointer ${isArabic ? 'text-right' : 'text-left'}`}
                        value={formData.role || formData.roles?.[0] || ''}
                        onChange={handleRoleChange}
                        dir={isArabic ? "rtl" : "ltr"}
                    >
                        <option value="">{t("employees.newEmployeeForm.professionalInfo.selectEmployeeRole") || "Select Role"}</option>
                        {roleOptions.map((r) => (
                            <option key={r.id || r.roleId} value={r.id || r.roleId}>
                                {r.name || r.roleName || r.code}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="space-y-2">
                    <label className={`flex items-center gap-2 text-sm font-semibold text-[var(--text-color)] mb-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                        <Clock className="w-4 h-4 text-[var(--accent-color)]" />
                        {t("employees.newEmployeeForm.professionalInfo.selectShift") || "Shift"}
                    </label>
                    <select
                        className={`w-full px-4 py-3.5 rounded-xl border-2 border-[var(--border-color)] bg-[var(--bg-color)] text-[var(--text-color)] focus:border-[var(--accent-color)] focus:ring-4 focus:ring-[var(--accent-color)]/20 transition-all hover:border-[var(--accent-color)]/50 cursor-pointer ${isArabic ? 'text-right' : 'text-left'}`}
                        value={formData.shiftId || ''}
                        onChange={e => onChange('shiftId', e.target.value)}
                        dir={isArabic ? "rtl" : "ltr"}
                    >
                        <option value="">{t("employees.newEmployeeForm.professionalInfo.selectShift") || "Select Shift"}</option>
                        {shiftOptions.map((s) => (
                            <option key={s.id || s.shiftId} value={s.id || s.shiftId}>
                                {s.name || s.shiftName}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="space-y-2">
                    <label className={`flex items-center gap-2 text-sm font-semibold text-[var(--text-color)] mb-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                        <Users className="w-4 h-4 text-[var(--accent-color)]" />
                        {t("employees.newEmployeeForm.professionalInfo.selectTeam") || "Team"}
                        <span className="text-xs text-[var(--sub-text-color)] font-normal">({t("common.optional") || "Optional"})</span>
                    </label>
                    <select
                        className={`w-full px-4 py-3.5 rounded-xl border-2 border-[var(--border-color)] bg-[var(--bg-color)] text-[var(--text-color)] focus:border-[var(--accent-color)] focus:ring-4 focus:ring-[var(--accent-color)]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:border-[var(--accent-color)]/50 cursor-pointer ${isArabic ? 'text-right' : 'text-left'}`}
                        value={formData.teamId || formData.teamIds?.[0] || ''}
                        onChange={handleTeamChange}
                        disabled={!formData.departmentId}
                        dir={isArabic ? "rtl" : "ltr"}
                    >
                        <option value="">{formData.departmentId ? (t("employees.newEmployeeForm.professionalInfo.selectTeam") || "Select Team") : (t("employees.newEmployeeForm.professionalInfo.selectDepartmentFirst") || "Select department first")}</option>
                        {formData.departmentId && teamOptions.map((tm) => (
                            <option key={tm.id || tm.teamId} value={tm.id || tm.teamId}>
                                {tm.name || tm.teamName}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );
}

// Leave Balances Edit
function LeaveBalancesEdit({ formData, onChange, leaveTypes, isArabic, t }) {
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
        <div className="space-y-6" dir={isArabic ? "rtl" : "ltr"}>
            <div className="mb-6 text-center">
                <h3 className={`text-xl font-bold text-[var(--text-color)] flex items-center justify-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                    <FileText className="w-5 h-5 text-[var(--accent-color)]" />
                    {t("employees.editEmployee.leaveBalances") || "Leave Balances"}
                </h3>
                <p className={`text-sm text-[var(--sub-text-color)] mt-1 ${isArabic ? 'text-right' : 'text-left'}`}>
                    {t("employees.editEmployee.leaveBalancesDescription") || "Manage employee's leave balances"}
                </p>
            </div>

            <div className="flex items-center justify-center mb-4">
                <button
                    type="button"
                    onClick={addLeaveBalance}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-white bg-gradient-to-r from-[#15919B] to-[#09D1C7] hover:shadow-lg transition-all ${isArabic ? 'flex-row-reverse' : ''}`}
                >
                    <span>+</span>
                    {t("employees.editEmployee.addLeaveBalance") || "Add Leave Balance"}
                </button>
            </div>

            {leaveBalances.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed border-[var(--border-color)] rounded-xl bg-[var(--container-color)] max-w-2xl mx-auto">
                    <div className="p-4 rounded-full bg-[var(--bg-color)] w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                        <FileText className="w-8 h-8 text-[var(--sub-text-color)]" />
                    </div>
                    <p className="text-[var(--sub-text-color)] text-sm font-medium">
                        {t("employees.editEmployee.noLeaveBalances") || "No leave balances added. Click 'Add Leave Balance' to add one."}
                    </p>
                </div>
            ) : (
                <div className="space-y-4 max-w-4xl mx-auto">
                    {leaveBalances.map((balance, index) => (
                        <div key={index} className={`grid grid-cols-1 md:grid-cols-3 gap-4 items-end p-5 border-2 border-[var(--border-color)] rounded-xl bg-[var(--container-color)] hover:border-[var(--accent-color)] hover:shadow-md transition-all ${isArabic ? 'text-right' : 'text-left'}`}>
                            <div className="space-y-2">
                                <label className={`flex items-center gap-2 text-sm font-semibold text-[var(--text-color)] mb-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                                    <span className="w-1 h-4 rounded-full bg-[var(--accent-color)] shadow-sm" />
                                    {t("employees.editEmployee.leaveType") || "Leave Type"}
                                </label>
                                <select
                                    className={`w-full px-4 py-3.5 rounded-xl border-2 border-[var(--border-color)] bg-[var(--bg-color)] text-[var(--text-color)] focus:border-[var(--accent-color)] focus:ring-4 focus:ring-[var(--accent-color)]/20 transition-all hover:border-[var(--accent-color)]/50 cursor-pointer ${isArabic ? 'text-right' : 'text-left'}`}
                                    value={balance.leaveTypeId || ''}
                                    onChange={(e) => handleLeaveBalanceChange(index, 'leaveTypeId', e.target.value)}
                                    dir={isArabic ? "rtl" : "ltr"}
                                >
                                    <option value="">{t("employees.editEmployee.selectLeaveType") || "Select leave type"}</option>
                                    {leaveTypes.map((lt) => (
                                        <option key={lt.id || lt.leaveTypeId} value={lt.id || lt.leaveTypeId}>
                                            {lt.name || lt.leaveTypeName}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className={`flex items-center gap-2 text-sm font-semibold text-[var(--text-color)] mb-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                                    <span className="w-1 h-4 rounded-full bg-[var(--accent-color)] shadow-sm" />
                                    {t("employees.editEmployee.balanceDays") || "Balance Days"}
                                </label>
                                <input
                                    className={`w-full px-4 py-3.5 rounded-xl border-2 border-[var(--border-color)] bg-[var(--bg-color)] text-[var(--text-color)] focus:border-[var(--accent-color)] focus:ring-4 focus:ring-[var(--accent-color)]/20 transition-all hover:border-[var(--accent-color)]/50 ${isArabic ? 'text-right' : 'text-left'}`}
                                    type="number"
                                    min="0"
                                    step="0.5"
                                    value={balance.balanceDays || 0}
                                    onChange={(e) => handleLeaveBalanceChange(index, 'balanceDays', e.target.value)}
                                    dir={isArabic ? "rtl" : "ltr"}
                                />
                            </div>
                            <div>
                                <button
                                    type="button"
                                    onClick={() => removeLeaveBalance(index)}
                                    className="w-full px-4 py-3.5 rounded-xl font-semibold bg-[var(--container-color)] text-[var(--text-color)] border-2 border-[var(--border-color)] hover:border-red-500 hover:text-red-500 hover:bg-red-50 transition-all"
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
