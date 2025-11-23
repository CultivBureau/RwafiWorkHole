import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { User, Briefcase, FileText, Camera, Upload, Eye, EyeOff } from "lucide-react";
import { jwtDecode } from "jwt-decode";
import { getUserInfo, getCompanyId } from "../../../utils/page";
import { useGetAllDepartmentsQuery } from "../../../services/apis/DepartmentApi";
import { useGetAllRolesQuery } from "../../../services/apis/RoleApi";
import { useGetAllShiftsQuery } from "../../../services/apis/ShiftApi";
import { useGetTeamsByDepartmentQuery } from "../../../services/apis/TeamApi";
import { useRegisterMutation } from "../../../services/apis/AuthApi";
import toast from "react-hot-toast";

export default function NewEmployeeForm() {
    const { t, i18n } = useTranslation();
    const isArabic = i18n.language === "ar";
    const navigate = useNavigate();
    const [step, setStep] = useState(0);

    // Initialize employee data, pre-filling companyId from token/cookie
    const [employeeData, setEmployeeData] = useState({
        userName: "",
        email: "",
        password: "",
        phoneNumber: "",
        firstName: "",
        lastName: "",
        jobTitle: "",
        hireDate: "",
        companyId: getCompanyId() || "",
        roleId: "",
        departmentId: "",
        teamIds: [], // Changed to array
        shiftIds: [], // Changed to array
    });

    const [registerUser, { isLoading: isRegistering }] = useRegisterMutation();

    const handleFieldChange = (name, value) => {
        setEmployeeData(prev => ({ ...prev, [name]: value }));
    };

    const steps = [
        { label: t("employees.newEmployeeForm.steps.personalInfo"), icon: User },
        { label: t("employees.newEmployeeForm.steps.professionalInfo"), icon: Briefcase },
        { label: t("employees.newEmployeeForm.steps.documents"), icon: FileText },
    ];

    // Data for Step 2 selects
    const { data: departmentsRes } = useGetAllDepartmentsQuery({ pageNumber: 1, pageSize: 100 });
    const departments = departmentsRes?.value || departmentsRes?.items || departmentsRes || [];

    const { data: rolesRes } = useGetAllRolesQuery({ pageNumber: 1, pageSize: 100 });
    const roles = rolesRes?.value || rolesRes?.items || rolesRes || [];

    const { data: shiftsRes } = useGetAllShiftsQuery({ pageNumber: 1, pageSize: 100 });
    const shifts = shiftsRes?.value || shiftsRes?.items || shiftsRes || [];

    const { data: teamsRes } = useGetTeamsByDepartmentQuery(employeeData.departmentId, { skip: !employeeData.departmentId });
    const teams = teamsRes?.value || teamsRes?.items || teamsRes || [];

    const handleSubmitAll = async () => {
        // Final submit: register then assign team then assign shift
        try {
            // Get companyId from token/cookie
            const companyId = getCompanyId();
            if (!companyId) {
                toast.error("Company ID not found. Please login again.");
                return;
            }

            // Validate required register fields per API contract
            const required = {
                userName: employeeData.userName,
                email: employeeData.email,
                password: employeeData.password,
                phoneNumber: employeeData.phoneNumber,
                firstName: employeeData.firstName,
                lastName: employeeData.lastName,
                jobTitle: employeeData.jobTitle,
                companyId,
                roleId: employeeData.roleId,
            };
            const missing = Object.entries(required)
                .filter(([_, v]) => !v || (typeof v === 'string' && v.trim() === ''))
                .map(([k]) => k);
            if (missing.length) {
                toast.error(t("employees.newEmployeeForm.validation.missingFields") || `Missing required fields: ${missing.join(', ')}`);
                return;
            }

            // Step 1: Register user with all required data including roleId, teamIds, and shiftIds
            const registerPayload = {
                userName: employeeData.userName.trim(),
                email: employeeData.email.trim(),
                password: employeeData.password,
                phoneNumber: employeeData.phoneNumber.trim(),
                firstName: employeeData.firstName.trim(),
                lastName: employeeData.lastName.trim(),
                jobTitle: employeeData.jobTitle.trim(),
                roleId: employeeData.roleId,
                companyId,
                // Include hireDate only if provided, format as ISO string
                ...(employeeData.hireDate && { hireDate: new Date(employeeData.hireDate).toISOString() }),
                // Include teamIds and shiftIds as arrays only if they have values
                ...(employeeData.teamIds && employeeData.teamIds.length > 0 && { teamIds: employeeData.teamIds }),
                ...(employeeData.shiftIds && employeeData.shiftIds.length > 0 && { shiftIds: employeeData.shiftIds }),
            };

            toast.loading(t("employees.newEmployeeForm.processing.register") || "Registering user...");
            const regRes = await registerUser(registerPayload).unwrap();
            toast.dismiss();
            
            // Registration now includes teamIds and shiftIds, so no separate assignment needed
            // Show success toast
            toast.success(t("employees.newEmployeeForm.success.title") || "Employee created successfully!");
            
            // Redirect to all-employees page after successful registration
            setTimeout(() => {
                navigate("/pages/admin/all-employees", { replace: true });
            }, 500);
        } catch (err) {
            toast.dismiss();
            // Handle validation errors and API errors
            const apiErrors = err?.data?.errors || err?.data?.Errors;
            const modelState = apiErrors && typeof apiErrors === 'object' ? Object.values(apiErrors).flat().join(' | ') : null;
            const message = modelState || err?.data?.errorMessage || err?.data?.message || err?.message || t("employees.newEmployeeForm.errors.createFailed") || "Failed to create employee";
            toast.error(message);
        }
    };

    return (
        <div className="w-full  mx-auto bg-[var(--bg-color)] rounded-xl border border-[var(--border-color)] p-8" dir={isArabic ? "rtl" : "ltr"}>
            {/* Progress Bar */}
            <div className="mb-8">
                {/* Progress Line */}
                <div className="relative mb-4">
                    <div className="w-full h-1 bg-[var(--border-color)] rounded" />
                    <div
                        className={`absolute top-0 h-1 gradient-bg rounded transition-all duration-300 ${isArabic ? 'right-0' : 'left-0'}`}
                        style={{ width: `${((step + 1) / steps.length) * 100}%` }}
                    />
                </div>

                {/* Step Tabs - Hidden on mobile */}
                <div className="hidden sm:flex justify-between">
                    {steps.map((stepItem, idx) => {
                        const IconComponent = stepItem.icon;
                        const isActive = idx === step;
                        const isCompleted = idx < step;

                        return (
                            <div key={stepItem.label} className="flex items-center">
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
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Step Content */}
            <div className="mt-8">
                {step === 0 && (
                    <PersonalInfoStep
                        data={employeeData}
                        onChange={handleFieldChange}
                        onNext={() => setStep(1)}
                    />
                )}
                {step === 1 && (
                    <ProfessionalInfoStep
                        data={employeeData}
                        onChange={handleFieldChange}
                        departments={departments}
                        roles={roles}
                        shifts={shifts}
                        teams={teams}
                        onNext={() => setStep(2)}
                        onBack={() => setStep(0)}
                    />
                )}
                {step === 2 && (
                    <DocumentsStep
                        onNext={handleSubmitAll}
                        onBack={() => setStep(1)}
                        loading={isRegistering}
                    />
                )}
            </div>
        </div>
    );
}

// Step 1: Personal Information
function PersonalInfoStep({ onNext, onChange, data }) {
    const { t, i18n } = useTranslation();
    const isArabic = i18n.language === "ar";
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [showPassword, setShowPassword] = useState(false);

    const getLabel = (key) => {
        const map = {
            userName: t("employees.newEmployeeForm.professionalInfo.userName") || "Username",
            email: t("employees.newEmployeeForm.personalInfo.emailAddress") || "Email",
            password: "Password",
            phoneNumber: t("employees.newEmployeeForm.personalInfo.mobileNumber") || "Mobile number",
            firstName: t("employees.newEmployeeForm.personalInfo.firstName") || "First name",
            lastName: t("employees.newEmployeeForm.personalInfo.lastName") || "Last name",
            jobTitle: "Job Title",
        };
        return map[key] || key;
    };

    // Real-time validation for a single field
    const validateField = (name, value) => {
        let error = '';
        
        switch (name) {
            case 'userName':
                if (!value?.trim()) {
                    error = `${getLabel('userName')} ${t('employees.newEmployeeForm.validation.isRequired') || 'is required'}`;
                } else if (!/^[A-Za-z]+$/.test(value)) {
                    error = t('employees.newEmployeeForm.validation.usernameLettersOnly') || 'Username must contain only letters (A-Z)';
                }
                break;
                
            case 'email':
                if (!value?.trim()) {
                    error = `${getLabel('email')} ${t('employees.newEmployeeForm.validation.isRequired') || 'is required'}`;
                } else {
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(value)) {
                        error = t('employees.newEmployeeForm.validation.invalidEmail') || 'Please enter a valid email address';
                    }
                }
                break;
                
            case 'password':
                if (!value?.trim()) {
                    error = `${getLabel('password')} ${t('employees.newEmployeeForm.validation.isRequired') || 'is required'}`;
                } else if (value.length < 8) {
                    error = t('employees.newEmployeeForm.validation.passwordMinLength') || 'Password must be at least 8 characters long';
                } else {
                    const hasUpper = /[A-Z]/.test(value);
                    const hasLower = /[a-z]/.test(value);
                    const hasSpecial = /[^A-Za-z0-9]/.test(value);
                    
                    if (!hasUpper) {
                        error = t('employees.newEmployeeForm.validation.passwordUppercase') || 'Password must contain at least one uppercase letter';
                    } else if (!hasLower) {
                        error = t('employees.newEmployeeForm.validation.passwordLowercase') || 'Password must contain at least one lowercase letter';
                    } else if (!hasSpecial) {
                        error = t('employees.newEmployeeForm.validation.passwordSpecialChar') || 'Password must contain at least one special character';
                    }
                }
                break;
                
            case 'phoneNumber':
                if (!value?.trim()) {
                    error = `${getLabel('phoneNumber')} ${t('employees.newEmployeeForm.validation.isRequired') || 'is required'}`;
                }
                break;
                
            case 'firstName':
                if (!value?.trim()) {
                    error = `${getLabel('firstName')} ${t('employees.newEmployeeForm.validation.isRequired') || 'is required'}`;
                }
                break;
                
            case 'lastName':
                if (!value?.trim()) {
                    error = `${getLabel('lastName')} ${t('employees.newEmployeeForm.validation.isRequired') || 'is required'}`;
                }
                break;
                
            case 'jobTitle':
                if (!value?.trim()) {
                    error = `${getLabel('jobTitle')} ${t('employees.newEmployeeForm.validation.isRequired') || 'is required'}`;
                }
                break;
                
            default:
                break;
        }
        
        return error;
    };

    // Validate all fields
    const validate = () => {
        const newErrors = {};
        Object.keys(data).forEach(key => {
            if (['userName', 'email', 'password', 'phoneNumber', 'firstName', 'lastName', 'jobTitle'].includes(key)) {
                const error = validateField(key, data[key]);
                if (error) newErrors[key] = error;
            }
        });
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle field change with real-time validation
    const handleFieldChange = (name, value) => {
        onChange(name, value);
        
        // Only validate if field has been touched
        if (touched[name]) {
            const error = validateField(name, value);
            setErrors(prev => ({
                ...prev,
                [name]: error
            }));
        }
    };

    // Handle field blur
    const handleBlur = (name) => {
        setTouched(prev => ({ ...prev, [name]: true }));
        const error = validateField(name, data[name]);
        setErrors(prev => ({
            ...prev,
            [name]: error
        }));
    };

    const handleNext = () => {
        // Mark all fields as touched
        const allFields = ['userName', 'email', 'password', 'phoneNumber', 'firstName', 'lastName', 'jobTitle'];
        const newTouched = {};
        allFields.forEach(field => { newTouched[field] = true; });
        setTouched(newTouched);
        
        if (validate()) {
            onNext();
        }
    };

    const errorClass = "border-red-500 focus:ring-red-500";
    const successClass = "border-green-500 focus:ring-green-500";
    const helpTextClass = `text-xs mt-1 ${isArabic ? 'text-right' : 'text-left'}`;
    const successTextClass = `${helpTextClass} text-green-600`;
    const errorTextClass = `${helpTextClass} text-red-600`;

    return (
        <div className="space-y-6">
            {/* Avatar Upload */}
            <div className={`flex ${isArabic ? 'justify-end' : 'justify-start'} mb-6`}>
                <div className="w-20 h-20 rounded-xl bg-[var(--container-color)] border-2 border-dashed border-[var(--border-color)] flex items-center justify-center cursor-pointer hover:bg-[var(--hover-color)] transition-colors">
                    <Camera className="text-[var(--sub-text-color)]" size={24} />
                </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <input
                        className={`form-input ${
                            touched.userName && errors.userName 
                                ? errorClass 
                                : touched.userName && !errors.userName && data.userName 
                                ? successClass 
                                : ''
                        }`}
                        placeholder={t("employees.newEmployeeForm.professionalInfo.userName")}
                        type="text"
                        value={data.userName}
                        onChange={e => handleFieldChange('userName', e.target.value.replace(/[^A-Za-z]/g, ''))}
                        onBlur={() => handleBlur('userName')}
                        aria-invalid={!!errors.userName}
                        autoComplete="off"
                        name="new-employee-username"
                        id="new-employee-username"
                        autoCapitalize="none"
                        autoCorrect="off"
                        spellCheck={false}
                        inputMode="text"
                    />
                    {touched.userName && errors.userName && <p className={errorTextClass}>{errors.userName}</p>}
                    {touched.userName && !errors.userName && data.userName && (
                        <p className={successTextClass}>✓ {t('employees.newEmployeeForm.validation.validUsername') || 'Valid username'}</p>
                    )}
                </div>
                <div>
                    <input
                        className={`form-input ${
                            touched.email && errors.email 
                                ? errorClass 
                                : touched.email && !errors.email && data.email 
                                ? successClass 
                                : ''
                        }`}
                        placeholder={t("employees.newEmployeeForm.personalInfo.emailAddress")}
                        type="email"
                        value={data.email}
                        onChange={e => handleFieldChange('email', e.target.value)}
                        onBlur={() => handleBlur('email')}
                        aria-invalid={!!errors.email}
                        autoComplete="email"
                        name="new-employee-email"
                        id="new-employee-email"
                        inputMode="email"
                    />
                    {touched.email && errors.email && <p className={errorTextClass}>{errors.email}</p>}
                    {touched.email && !errors.email && data.email && (
                        <p className={successTextClass}>✓ {t('employees.newEmployeeForm.validation.validEmail') || 'Valid email'}</p>
                    )}
                </div>
                <div className="relative">
                    <input
                        className={`form-input ${
                            touched.password && errors.password 
                                ? errorClass 
                                : touched.password && !errors.password && data.password 
                                ? successClass 
                                : ''
                        }`}
                        placeholder="Password"
                        type={showPassword ? 'text' : 'password'}
                        value={data.password}
                        onChange={e => handleFieldChange('password', e.target.value)}
                        onBlur={() => handleBlur('password')}
                        aria-invalid={!!errors.password}
                        autoComplete="new-password"
                        name="new-employee-password"
                        id="new-employee-password"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(s => !s)}
                        className={`absolute ${isArabic ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-[var(--sub-text-color)]`}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                    {touched.password && errors.password && <p className={errorTextClass}>{errors.password}</p>}
                    {touched.password && !errors.password && data.password && (
                        <p className={successTextClass}>✓ {t('employees.newEmployeeForm.validation.strongPassword') || 'Strong password'}</p>
                    )}
                </div>
                <div>
                    <input
                        className={`form-input ${
                            touched.phoneNumber && errors.phoneNumber 
                                ? errorClass 
                                : touched.phoneNumber && !errors.phoneNumber && data.phoneNumber 
                                ? successClass 
                                : ''
                        }`}
                        placeholder={t("employees.newEmployeeForm.personalInfo.mobileNumber")}
                        type="tel"
                        value={data.phoneNumber}
                        onChange={e => handleFieldChange('phoneNumber', e.target.value)}
                        onBlur={() => handleBlur('phoneNumber')}
                        aria-invalid={!!errors.phoneNumber}
                    />
                    {touched.phoneNumber && errors.phoneNumber && <p className={errorTextClass}>{errors.phoneNumber}</p>}
                    {touched.phoneNumber && !errors.phoneNumber && data.phoneNumber && (
                        <p className={successTextClass}>✓ {t('employees.newEmployeeForm.validation.validPhone') || 'Valid phone number'}</p>
                    )}
                </div>
                <div>
                    <input
                        className={`form-input ${
                            touched.firstName && errors.firstName 
                                ? errorClass 
                                : touched.firstName && !errors.firstName && data.firstName 
                                ? successClass 
                                : ''
                        }`}
                        placeholder={t("employees.newEmployeeForm.personalInfo.firstName")}
                        type="text"
                        value={data.firstName}
                        onChange={e => handleFieldChange('firstName', e.target.value)}
                        onBlur={() => handleBlur('firstName')}
                        aria-invalid={!!errors.firstName}
                    />
                    {touched.firstName && errors.firstName && <p className={errorTextClass}>{errors.firstName}</p>}
                    {touched.firstName && !errors.firstName && data.firstName && (
                        <p className={successTextClass}>✓ {t('employees.newEmployeeForm.validation.validFirstName') || 'Valid first name'}</p>
                    )}
                </div>
                <div>
                    <input
                        className={`form-input ${
                            touched.lastName && errors.lastName 
                                ? errorClass 
                                : touched.lastName && !errors.lastName && data.lastName 
                                ? successClass 
                                : ''
                        }`}
                        placeholder={t("employees.newEmployeeForm.personalInfo.lastName")}
                        type="text"
                        value={data.lastName}
                        onChange={e => handleFieldChange('lastName', e.target.value)}
                        onBlur={() => handleBlur('lastName')}
                        aria-invalid={!!errors.lastName}
                    />
                    {touched.lastName && errors.lastName && <p className={errorTextClass}>{errors.lastName}</p>}
                    {touched.lastName && !errors.lastName && data.lastName && (
                        <p className={successTextClass}>✓ {t('employees.newEmployeeForm.validation.validLastName') || 'Valid last name'}</p>
                    )}
                </div>
                <div className="md:col-span-2">
                    <input
                        className={`form-input ${
                            touched.jobTitle && errors.jobTitle 
                                ? errorClass 
                                : touched.jobTitle && !errors.jobTitle && data.jobTitle 
                                ? successClass 
                                : ''
                        }`}
                        placeholder="Job Title"
                        type="text"
                        value={data.jobTitle}
                        onChange={e => handleFieldChange('jobTitle', e.target.value)}
                        onBlur={() => handleBlur('jobTitle')}
                        aria-invalid={!!errors.jobTitle}
                    />
                    {touched.jobTitle && errors.jobTitle && <p className={errorTextClass}>{errors.jobTitle}</p>}
                    {touched.jobTitle && !errors.jobTitle && data.jobTitle && (
                        <p className={successTextClass}>✓ {t('employees.newEmployeeForm.validation.validJobTitle') || 'Valid job title'}</p>
                    )}
                </div>
                <div>
                    <input
                        className="form-input"
                        placeholder={t("employees.newEmployeeForm.personalInfo.hireDate") || "Hire Date (Optional)"}
                        type="date"
                        value={data.hireDate || ""}
                        onChange={e => handleFieldChange('hireDate', e.target.value)}
                        aria-label="Hire Date"
                    />
                </div>
                {/* companyId is derived from token and saved in state; not shown as input */}
            </div>

            {/* Action Buttons */}
            <div className={`flex ${isArabic ? 'justify-start' : 'justify-end'} gap-3 pt-6`}>
                <button type="button" className="btn-secondary">{t("employees.newEmployeeForm.buttons.cancel")}</button>
                <button type="button" className="btn-primary" onClick={handleNext}>{t("employees.newEmployeeForm.buttons.next")}</button>
            </div>
        </div>
    );
}

// Step 2: Professional Information
function ProfessionalInfoStep({ onNext, onBack, onChange, data, departments, roles, shifts, teams }) {
    const { t, i18n } = useTranslation();
    const isArabic = i18n.language === "ar";
    const [error, setError] = useState("");

    const deptOptions = Array.isArray(departments) ? departments : [];
    const roleOptions = Array.isArray(roles) ? roles : [];
    const shiftOptions = Array.isArray(shifts) ? shifts : [];
    const teamOptions = Array.isArray(teams) ? teams : [];

    const handleNext = () => {
        // Validate required fields for step 2
        if (!data.roleId) {
            setError(t("employees.newEmployeeForm.validation.roleRequired") || "Role is required");
            return;
        }
        
        setError("");
        onNext();
    };

    return (
        <div className="space-y-6">
            {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                    {error}
                </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                    <label className="form-label">
                        {t("employees.newEmployeeForm.professionalInfo.selectDepartment") || "Department"} <span className="text-red-500">*</span>
                    </label>
                    <select
                        className="form-input"
                        value={data.departmentId}
                        onChange={e => {
                            onChange('departmentId', e.target.value);
                            onChange('teamIds', []); // Reset teams when department changes
                            setError("");
                        }}
                    >
                        <option value="">{t("employees.newEmployeeForm.professionalInfo.selectDepartment")}</option>
                        {deptOptions.map((d) => (
                            <option key={d.id || d.departmentId} value={d.id || d.departmentId}>{d.name || d.departmentName}</option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label className="form-label">
                        {t("employees.newEmployeeForm.professionalInfo.selectEmployeeRole") || "Role"} <span className="text-red-500">*</span>
                    </label>
                    <select
                        className={`form-input ${!data.roleId && error ? 'border-red-500' : ''}`}
                        value={data.roleId}
                        onChange={e => {
                            onChange('roleId', e.target.value);
                            setError("");
                        }}
                    >
                        <option value="">{t("employees.newEmployeeForm.professionalInfo.selectEmployeeRole")}</option>
                        {roleOptions.map((r) => (
                            <option key={r.id || r.roleId} value={r.id || r.roleId}>
                                {r.name || r.roleName || r.code}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="form-group md:col-span-2">
                    <label className="form-label">
                        {t("employees.newEmployeeForm.professionalInfo.selectShifts") || "Select Shifts"} <span className="text-gray-400 text-sm">(Optional, hold Ctrl/Cmd to select multiple)</span>
                    </label>
                    <select
                        className="form-input"
                        multiple
                        size={4}
                        value={data.shiftIds || []}
                        onChange={e => {
                            const selectedValues = Array.from(e.target.selectedOptions, option => option.value);
                            onChange('shiftIds', selectedValues);
                            setError("");
                        }}
                    >
                        {shiftOptions.map((s) => (
                            <option key={s.id || s.shiftId} value={s.id || s.shiftId}>{s.name || s.shiftName}</option>
                        ))}
                    </select>
                    {data.shiftIds && data.shiftIds.length > 0 && (
                        <p className="text-sm text-gray-500 mt-1">
                            {data.shiftIds.length} shift(s) selected
                        </p>
                    )}
                </div>

                <div className="form-group md:col-span-2">
                    <label className="form-label">
                        {t("employees.newEmployeeForm.professionalInfo.selectTeams") || "Select Teams"} <span className="text-gray-400 text-sm">(Optional, hold Ctrl/Cmd to select multiple)</span>
                    </label>
                    <select
                        className="form-input"
                        multiple
                        size={4}
                        value={data.teamIds || []}
                        onChange={e => {
                            const selectedValues = Array.from(e.target.selectedOptions, option => option.value);
                            onChange('teamIds', selectedValues);
                            setError("");
                        }}
                        disabled={!data.departmentId}
                    >
                        {data.departmentId ? (
                            teamOptions.map((tm) => (
                                <option key={tm.id || tm.teamId} value={tm.id || tm.teamId}>{tm.name || tm.teamName}</option>
                            ))
                        ) : (
                            <option disabled>{t("employees.newEmployeeForm.professionalInfo.selectDepartment") || "Select department first"}</option>
                        )}
                    </select>
                    {data.teamIds && data.teamIds.length > 0 && (
                        <p className="text-sm text-gray-500 mt-1">
                            {data.teamIds.length} team(s) selected
                        </p>
                    )}
                </div>
            </div>

            {/* Action Buttons */}
            <div className={`flex ${isArabic ? 'justify-start' : 'justify-end'} gap-3 pt-6`}>
                <button type="button" className="btn-secondary" onClick={onBack}>{t("employees.newEmployeeForm.buttons.back")}</button>
                <button type="button" className="btn-primary" onClick={handleNext}>{t("employees.newEmployeeForm.buttons.next")}</button>
            </div>
        </div>
    );
}

// Step 3: Documents
function DocumentsStep({ onNext, onBack, loading }) {
    const { t, i18n } = useTranslation();
    const isArabic = i18n.language === "ar";

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FileUpload label={t("employees.newEmployeeForm.documents.uploadProofOfIdentity")} />
                <FileUpload label={t("employees.newEmployeeForm.documents.uploadEmploymentContract")} />
                <FileUpload label={t("employees.newEmployeeForm.documents.uploadCertificatesQualifications")} optional />
                <FileUpload label={t("employees.newEmployeeForm.documents.uploadSocialInsuranceDocs")} />
            </div>

            {/* Action Buttons */}
            <div className={`flex ${isArabic ? 'justify-start' : 'justify-end'} gap-3 pt-6`}>
                <button type="button" className="btn-secondary" onClick={onBack} disabled={loading}>
                    {t("employees.newEmployeeForm.buttons.back")}
                </button>
                <button 
                    type="button" 
                    className="btn-primary flex items-center gap-2" 
                    onClick={onNext}
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>{t("employees.newEmployeeForm.buttons.submitting") || t("common.loading") || "Processing..."}</span>
                        </>
                    ) : (
                        t("employees.newEmployeeForm.buttons.submit") || t("common.submit") || "Submit"
                    )}
                </button>
            </div>
        </div>
    );
}

function FileUpload({ label, optional }) {
    const { t, i18n } = useTranslation();
    const isArabic = i18n.language === "ar";
    const [uploadedFile, setUploadedFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleFileUpload = (files) => {
        const file = files[0];
        if (file) {
            // Validate file type
            const allowedTypes = ['image/jpeg', 'image/jpg', 'application/pdf'];
            if (!allowedTypes.includes(file.type)) {
                alert(t("employees.newEmployeeForm.documents.invalidFileType"));
                return;
            }

            // Validate file size (e.g., max 5MB)
            const maxSize = 5 * 1024 * 1024; // 5MB
            if (file.size > maxSize) {
                alert(t("employees.newEmployeeForm.documents.fileSizeLimit"));
                return;
            }

            setUploadedFile(file);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files);
        handleFileUpload(files);
    };

    const handleFileInputChange = (e) => {
        const files = Array.from(e.target.files);
        handleFileUpload(files);
    };

    const removeFile = () => {
        setUploadedFile(null);
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-[var(--text-color)]">
                {label} {optional && <span className="text-[var(--sub-text-color)]">{t("employees.newEmployeeForm.documents.optional")}</span>}
            </label>

            <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${isDragging
                    ? 'border-[var(--accent-color)] bg-[var(--hover-color)]'
                    : 'border-[var(--border-color)] bg-[var(--container-color)] hover:bg-[var(--hover-color)]'
                    }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById(`file-input-${label.replace(/\s+/g, '-').toLowerCase()}`).click()}
            >
                <input
                    id={`file-input-${label.replace(/\s+/g, '-').toLowerCase()}`}
                    type="file"
                    accept=".jpeg,.jpg,.pdf"
                    onChange={handleFileInputChange}
                    className="hidden"
                />

                {uploadedFile ? (
                    <div className="flex flex-col items-center">
                        <div className="w-12 h-12 mx-auto mb-3 gradient-bg rounded-full flex items-center justify-center">
                            <FileText className="text-white" size={20} />
                        </div>
                        <p className="text-sm font-medium text-[var(--text-color)] mb-1">
                            {uploadedFile.name}
                        </p>
                        <p className="text-xs text-[var(--sub-text-color)] mb-2">
                            {formatFileSize(uploadedFile.size)}
                        </p>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                removeFile();
                            }}
                            className="text-xs text-[var(--error-color)] hover:underline"
                        >
                            {t("employees.newEmployeeForm.documents.removeFile")}
                        </button>
                    </div>
                ) : (
                    <div>
                        <div className="w-12 h-12 mx-auto mb-3 gradient-bg rounded-full flex items-center justify-center">
                            <Upload className="text-white" size={20} />
                        </div>
                        <p className="text-sm text-[var(--sub-text-color)] mb-1">
                            {t("employees.newEmployeeForm.documents.dragDrop")} <span className="text-[var(--accent-color)] font-medium">{t("employees.newEmployeeForm.documents.chooseFile")}</span> {t("employees.newEmployeeForm.documents.toUpload")}
                        </p>
                        <p className="text-xs text-[var(--sub-text-color)]">
                            {t("employees.newEmployeeForm.documents.supportedFormats")}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

