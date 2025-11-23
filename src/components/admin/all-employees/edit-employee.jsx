import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { X, User, FileText, Save, ArrowRight, ArrowLeft, Calendar, Briefcase } from "lucide-react";
import { useUpdateUserMutation, useGetUserProfileByIdQuery } from "../../../services/apis/UserApi";
import { useGetAllLeaveTypesQuery } from "../../../services/apis/LeaveTypeApi";
import { 
    useGetUserLeaveBalancesQuery, 
    useCreateLeaveBalanceMutation, 
    useUpdateLeaveBalanceMutation 
} from "../../../services/apis/LeaveBalanceApi";
import toast from "react-hot-toast";

export default function EditEmployeePopup({ employee, isOpen, onClose, onSave }) {
    const { t, i18n } = useTranslation();
    const isArabic = i18n.language === "ar";
    const [step, setStep] = useState(0);
    const [formData, setFormData] = useState({});
    const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
    const [createLeaveBalance, { isLoading: isCreatingLeaveBalance }] = useCreateLeaveBalanceMutation();
    const [updateLeaveBalance, { isLoading: isUpdatingLeaveBalance }] = useUpdateLeaveBalanceMutation();
    
    const isSavingLeaveBalances = isCreatingLeaveBalance || isUpdatingLeaveBalance;

    // Get employee ID from employee object
    const employeeId = employee?.id || employee?.userId || employee?.rawData?.id;

    // Fetch full employee profile data
    const { data: employeeProfileResponse, isLoading: isLoadingProfile } = useGetUserProfileByIdQuery(
        employeeId,
        { skip: !isOpen || !employeeId }
    );
    const employeeData = employeeProfileResponse?.value || employee;

    // Fetch dropdown data
    const { data: leaveTypesRes } = useGetAllLeaveTypesQuery({ pageNumber: 1, pageSize: 100, status: 0 });
    const leaveTypes = leaveTypesRes?.value || leaveTypesRes?.items || leaveTypesRes || [];

    // Fetch current leave balances for conflict checking (used in handleSaveLeaveBalances)
    const { data: currentLeaveBalancesResponse, refetch: refetchLeaveBalances } = useGetUserLeaveBalancesQuery(
        employeeId,
        { skip: !isOpen || !employeeId }
    );
    const currentLeaveBalances = currentLeaveBalancesResponse?.value || [];

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

            setFormData({
                firstName: employeeData.firstName || '',
                lastName: employeeData.lastName || '',
                jobTitle: employeeData.jobTitle || '',
                hireDate: employeeData.hireDate ? new Date(employeeData.hireDate).toISOString().split('T')[0] : '',
                employeeStatus: employeeData.employeeStatus !== undefined ? employeeData.employeeStatus : 0,
                roles: employeeRoles, // Keep array for backward compatibility
                role: employeeRoles[0] || employeeData.role || '', // Single role for dropdown
                teamIds: employeeTeamIds, // Keep array for backward compatibility
                teamId: employeeTeamIds[0] || '', // Single team for dropdown
                shiftId: employeeShiftId, // Single value
                departmentId: employeeDepartmentId,
                leaveBalances: [], // Will be populated from API when step 1 is accessed
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
        { label: t("employees.editEmployee.leaveBalances") || "Leave Balances", icon: FileText },
    ];

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Handle saving personal info (step 0) using PUT /api/v1/User/Update/{id}
    const handleSavePersonalInfo = async () => {
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

            // Add hireDate if provided (convert to ISO string)
            if (formData.hireDate) {
                const date = new Date(formData.hireDate);
                if (!isNaN(date.getTime())) {
                    updatePayload.hireDate = date.toISOString();
                }
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

    // Handle saving leave balances (create new or update existing)
    const handleSaveLeaveBalances = async (fetchedLeaveBalances = []) => {
        if (!employeeId || !formData.leaveBalances || !Array.isArray(formData.leaveBalances)) {
            return;
        }

        const errors = [];
        const validBalances = formData.leaveBalances.filter(lb => lb.leaveTypeId && lb.leaveTypeId.trim());
        const updatedBalances = [...formData.leaveBalances]; // Create a mutable copy to track IDs

        for (const balance of validBalances) {
            try {
                const balanceDays = parseFloat(balance.balanceDays) || 0;
                
                // Check if balance has an ID (either id or leaveBalanceId from API)
                const balanceId = balance.leaveBalanceId || balance.id;
                
                if (balanceId) {
                    // Update existing leave balance using PUT /api/v1/LeaveBalance/Update/{id}
                    // The id should be the leaveBalanceId from the API response
                    // Calculate adjustmentAmount: new balance - old balance
                    const oldBalance = parseFloat(balance.originalBalanceDays) || 0;
                    const adjustmentAmount = balanceDays - oldBalance;
                    
                    if (Math.abs(adjustmentAmount) > 0.01) { // Only update if there's a meaningful change
                        await updateLeaveBalance({
                            id: balanceId, // Use leaveBalanceId (or id) for the update
                            adjustmentAmount: adjustmentAmount
                        }).unwrap();
                        
                        // Update the originalBalanceDays to the new value after successful update
                        const balanceIndex = updatedBalances.findIndex(lb => 
                            (lb.leaveBalanceId || lb.id) === balanceId
                        );
                        if (balanceIndex !== -1) {
                            updatedBalances[balanceIndex].originalBalanceDays = balanceDays;
                        }
                    }
                } else {
                    // Check if a leave balance already exists for this leaveTypeId in the fetched balances
                    // API returns leaveBalanceId, so we need to check for that
                    const existingBalance = fetchedLeaveBalances.find(lb => 
                        (lb.leaveTypeId || lb.leaveType?.id) === balance.leaveTypeId
                    );
                    
                    if (existingBalance) {
                        // Leave balance already exists - use PUT instead of CREATE
                        // API returns leaveBalanceId (not id), so extract it correctly
                        const existingId = existingBalance.leaveBalanceId || existingBalance.id;
                        const existingBalanceDays = parseFloat(existingBalance.balanceDays) || 0;
                        const adjustmentAmount = balanceDays - existingBalanceDays;
                        
                        if (Math.abs(adjustmentAmount) > 0.01) { // Only update if there's a meaningful change
                            await updateLeaveBalance({
                                id: existingId, // Use leaveBalanceId from API response
                                adjustmentAmount: adjustmentAmount
                            }).unwrap();
                            
                            // Update the balance in updatedBalances with the ID so it's tracked properly
                            const balanceIndex = updatedBalances.findIndex(lb => 
                                !lb.id && !lb.leaveBalanceId && lb.leaveTypeId === balance.leaveTypeId
                            );
                            if (balanceIndex !== -1) {
                                updatedBalances[balanceIndex].id = existingId;
                                updatedBalances[balanceIndex].leaveBalanceId = existingId; // Also store as leaveBalanceId
                                updatedBalances[balanceIndex].originalBalanceDays = balanceDays;
                            }
                        }
                    } else {
                        // Truly a new leave balance - use POST /api/v1/LeaveBalance/Create
                        if (balance.leaveTypeId && balanceDays > 0) {
                            const createResult = await createLeaveBalance({
                                userId: employeeId,
                                leaveTypeId: balance.leaveTypeId,
                                balanceDays: balanceDays
                            }).unwrap();
                            
                            // Extract ID from response: { value: { id: "uuid" } }
                            // Note: The create response returns id, but we should also store it as leaveBalanceId for consistency
                            const newId = createResult?.value?.id || createResult?.id || null;
                            
                            if (newId) {
                                // Find the balance in updatedBalances and update it with the new ID
                                const balanceIndex = updatedBalances.findIndex(lb => 
                                    !lb.id && !lb.leaveBalanceId && 
                                    lb.leaveTypeId === balance.leaveTypeId &&
                                    Math.abs(parseFloat(lb.balanceDays) - balanceDays) < 0.01
                                );
                                
                                if (balanceIndex !== -1) {
                                    updatedBalances[balanceIndex].id = newId;
                                    updatedBalances[balanceIndex].leaveBalanceId = newId; // Also store as leaveBalanceId
                                    updatedBalances[balanceIndex].originalBalanceDays = balanceDays;
                                }
                            }
                        }
                    }
                }
            } catch (err) {
                const errorMsg = err?.data?.errorMessage || err?.data?.message || err?.message || "Failed to save leave balance";
                const leaveTypeName = balance.leaveTypeName || leaveTypes.find(lt => (lt.id || lt.leaveTypeId) === balance.leaveTypeId)?.name || balance.leaveTypeId;
                errors.push(`${leaveTypeName}: ${errorMsg}`);
            }
        }
        
        // Update formData with the new IDs if any were created or existing ones were assigned
        const hasNewIds = updatedBalances.some((lb, idx) => {
            const oldBalance = formData.leaveBalances[idx];
            const oldId = oldBalance?.leaveBalanceId || oldBalance?.id;
            const newId = lb.leaveBalanceId || lb.id;
            return (oldBalance && !oldId && newId) || (oldBalance && oldId && oldBalance.originalBalanceDays !== lb.originalBalanceDays);
        });
        
        if (hasNewIds) {
            onChange('leaveBalances', updatedBalances);
        }

        if (errors.length > 0) {
            toast.error(errors.join(' | '));
            throw new Error(errors.join(' | '));
        }
    };

    // Handle saving leave balances (step 1)
    const handleSaveLeaveBalancesStep = async () => {
        if (!employeeId) {
            toast.error(t("employees.editEmployee.errors.noEmployeeId") || "Employee ID not found");
            return;
        }

        try {
            // Refetch current leave balances to get the latest data before saving
            const refetchResult = await refetchLeaveBalances();
            const fetchedLeaveBalances = refetchResult?.data?.value || currentLeaveBalances || [];

            toast.loading(t("employees.editEmployee.processing") || "Saving leave balances...");
            await handleSaveLeaveBalances(fetchedLeaveBalances);
            toast.dismiss();
            toast.success(t("employees.editEmployee.success") || "Leave balances saved successfully!");
            
            if (onSave) {
                onSave({ leaveBalances: formData.leaveBalances });
            }
            onClose();
        } catch (err) {
            toast.dismiss();
            const apiErrors = err?.data?.errors || err?.data?.Errors;
            const modelState = apiErrors && typeof apiErrors === 'object' ? Object.values(apiErrors).flat().join(' | ') : null;
            const message = modelState || err?.data?.errorMessage || err?.data?.message || err?.message || t("employees.editEmployee.errors.updateFailed") || "Failed to save leave balances";
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
                                <LeaveBalancesEdit 
                                    formData={formData} 
                                    onChange={handleInputChange} 
                                    leaveTypes={leaveTypes}
                                    employeeId={employeeId}
                                    isArabic={isArabic} 
                                    t={t} 
                                />
                            )}
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
                            {step === 0 ? (
                                <>
                                    {/* Save button for step 0 */}
                                    <button
                                        onClick={handleSavePersonalInfo}
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
                                                <span>{t("employees.editEmployee.save") || "Save"}</span>
                                            </>
                                        )}
                                    </button>
                                    {/* Next button for step 0 */}
                                    <button
                                        onClick={() => setStep(Math.min(steps.length - 1, step + 1))}
                                        className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-[#15919B] to-[#09D1C7] hover:shadow-lg transition-all"
                                    >
                                        {t("employees.newEmployeeForm.buttons.next") || "Next"}
                                        {isArabic ? <ArrowLeft size={18} /> : <ArrowRight size={18} />}
                                    </button>
                                </>
                            ) : step < steps.length - 1 ? (
                                <button
                                    onClick={() => setStep(Math.min(steps.length - 1, step + 1))}
                                    className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-[#15919B] to-[#09D1C7] hover:shadow-lg transition-all"
                                >
                                    {t("employees.newEmployeeForm.buttons.next") || "Next"}
                                    {isArabic ? <ArrowLeft size={18} /> : <ArrowRight size={18} />}
                                </button>
                            ) : (
                                <button
                                    onClick={handleSaveLeaveBalancesStep}
                                    className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-[#15919B] to-[#09D1C7] hover:shadow-lg transition-all disabled:opacity-50"
                                    disabled={isSavingLeaveBalances}
                                >
                                    {isSavingLeaveBalances ? (
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

// Leave Balances Edit
function LeaveBalancesEdit({ formData, onChange, leaveTypes, employeeId, isArabic, t }) {
    // Fetch user's leave balances
    const { data: leaveBalancesResponse, isLoading: isLoadingBalances, refetch: refetchBalances } = useGetUserLeaveBalancesQuery(
        employeeId,
        { skip: !employeeId }
    );
    
    const fetchedLeaveBalances = leaveBalancesResponse?.value || [];
    const leaveBalances = formData.leaveBalances || [];

    // Initialize leave balances from API when they're fetched
    useEffect(() => {
        if (fetchedLeaveBalances.length > 0) {
            // Only update if we haven't loaded balances yet or if the fetched data changed
            // API returns leaveBalanceId (not id), so we need to extract it correctly
            const mappedBalances = fetchedLeaveBalances.map(lb => ({
                id: lb.leaveBalanceId || lb.id || null, // API returns leaveBalanceId, store as id for consistency
                leaveBalanceId: lb.leaveBalanceId || lb.id || null, // Also store as leaveBalanceId for reference
                leaveTypeId: lb.leaveTypeId || '',
                leaveTypeName: lb.leaveTypeName || '',
                balanceDays: parseFloat(lb.balanceDays) || 0,
                originalBalanceDays: parseFloat(lb.balanceDays) || 0, // Store original for adjustment calculation
            }));
            
            // Only update if formData doesn't have balances yet or if IDs don't match
            const currentIds = leaveBalances.map(lb => lb.id || lb.leaveBalanceId).filter(Boolean).sort().join(',');
            const fetchedIds = mappedBalances.map(lb => lb.id || lb.leaveBalanceId).filter(Boolean).sort().join(',');
            
            if (leaveBalances.length === 0 || currentIds !== fetchedIds) {
                onChange('leaveBalances', mappedBalances);
            }
        } else if (fetchedLeaveBalances.length === 0 && leaveBalances.length === 0 && !isLoadingBalances) {
            // No leave balances exist yet - user can add new ones
            // Only set empty array if we're done loading
            onChange('leaveBalances', []);
        }
    }, [fetchedLeaveBalances, isLoadingBalances]);

    const handleLeaveBalanceChange = (index, field, value) => {
        const updated = [...leaveBalances];
        if (!updated[index]) {
            updated[index] = { leaveTypeId: '', balanceDays: 0, originalBalanceDays: 0 };
        }
        
        if (field === 'leaveTypeId') {
            updated[index].leaveTypeId = value;
            // Find leave type name from leaveTypes array
            const leaveType = leaveTypes.find(lt => (lt.id || lt.leaveTypeId) === value);
            if (leaveType) {
                updated[index].leaveTypeName = leaveType.name || leaveType.leaveTypeName || '';
            }
            // If this is a new leave balance (no ID), reset originalBalanceDays
            if (!updated[index].id) {
                updated[index].originalBalanceDays = 0;
            }
        } else if (field === 'balanceDays') {
            const newBalance = parseFloat(value) || 0;
            updated[index].balanceDays = newBalance;
            // Preserve original balance if it exists and hasn't been set yet
            const balanceId = updated[index].leaveBalanceId || updated[index].id;
            if (balanceId && !updated[index].originalBalanceDays && updated[index].originalBalanceDays !== 0) {
                // Find the original balance from fetched data
                // API returns leaveBalanceId, so check for that
                const fetchedBalance = fetchedLeaveBalances.find(lb => 
                    (lb.leaveBalanceId || lb.id) === balanceId
                );
                if (fetchedBalance) {
                    updated[index].originalBalanceDays = parseFloat(fetchedBalance.balanceDays) || 0;
                }
            }
        } else {
            updated[index][field] = value;
        }
        
        onChange('leaveBalances', updated);
    };

    const addLeaveBalance = () => {
        onChange('leaveBalances', [...leaveBalances, { leaveTypeId: '', balanceDays: 0, originalBalanceDays: 0 }]);
    };

    const removeLeaveBalance = (index) => {
        const updated = leaveBalances.filter((_, i) => i !== index);
        onChange('leaveBalances', updated);
    };

    if (isLoadingBalances) {
        return (
            <div className="flex items-center justify-center py-16">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-[var(--accent-color)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-[var(--sub-text-color)] font-medium">{t("common.loading") || "Loading leave balances..."}</p>
                </div>
            </div>
        );
    }

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
