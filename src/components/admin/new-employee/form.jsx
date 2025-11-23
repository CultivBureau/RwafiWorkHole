import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { User, Briefcase, Eye, ChevronDown, X, Plus, Check, Search, EyeOff, Camera } from "lucide-react";
import { getCompanyId } from "../../../utils/page";
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
        teamIds: [],
        shiftIds: [],
    });

    const [registerUser, { isLoading: isRegistering }] = useRegisterMutation();

    const handleFieldChange = (name, value) => {
        setEmployeeData(prev => ({ ...prev, [name]: value }));
    };

    const steps = [
        { label: t("employees.newEmployeeForm.steps.personalInfo"), icon: User },
        { label: t("employees.newEmployeeForm.steps.professionalInfo"), icon: Briefcase },
        { label: "Review & Submit", icon: Eye },
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
        try {
            const companyId = getCompanyId();
            if (!companyId) {
                toast.error("Company ID not found. Please login again.");
                return;
            }

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
                ...(employeeData.hireDate && { hireDate: new Date(employeeData.hireDate).toISOString() }),
                ...(employeeData.teamIds && employeeData.teamIds.length > 0 && { teamIds: employeeData.teamIds }),
                ...(employeeData.shiftIds && employeeData.shiftIds.length > 0 && { shiftIds: employeeData.shiftIds }),
            };

            toast.loading(t("employees.newEmployeeForm.processing.register") || "Registering user...");
            await registerUser(registerPayload).unwrap();
            toast.dismiss();
            
            toast.success(t("employees.newEmployeeForm.success.title") || "Employee created successfully!");
            
            setTimeout(() => {
                navigate("/pages/admin/all-employees", { replace: true });
            }, 500);
        } catch (err) {
            toast.dismiss();
            const apiErrors = err?.data?.errors || err?.data?.Errors;
            const modelState = apiErrors && typeof apiErrors === 'object' ? Object.values(apiErrors).flat().join(' | ') : null;
            const message = modelState || err?.data?.errorMessage || err?.data?.message || err?.message || t("employees.newEmployeeForm.errors.createFailed") || "Failed to create employee";
            toast.error(message);
        }
    };

    return (
        <div className="w-full mx-auto bg-[var(--bg-color)] rounded-xl border border-[var(--border-color)]" dir={isArabic ? "rtl" : "ltr"}>
            {/* Header */}
            <div className="p-6 border-b border-[var(--border-color)]">
                <h1
                    className={`text-2xl font-bold text-[var(--text-color)] mb-2 ${isArabic ? 'text-right' : 'text-left'}`}
                >
                    {t("employees.newEmployeeForm.title") || "Create New Employee"}
                </h1>
            </div>

            <div className="p-8">
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

                    {/* Step Tabs */}
                    <div className="flex justify-between">
                        {steps.map((stepItem, idx) => {
                            const IconComponent = stepItem.icon;
                            const isActive = idx === step;
                            const isCompleted = idx < step;

                            return (
                                <div
                                    key={stepItem.label}
                                    className="flex items-center"
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isArabic ? 'ml-2' : 'mr-2'} ${isActive || isCompleted ? 'gradient-bg text-white' :
                                        'bg-[var(--container-color)] text-[var(--sub-text-color)]'
                                        }`}>
                                        <IconComponent size={16} />
                                    </div>
                                    <span className={`text-sm font-medium hidden sm:block ${isActive || isCompleted
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
                        <ReviewStep
                            employeeData={employeeData}
                            departments={departments}
                            roles={roles}
                            shifts={shifts}
                            teams={teams}
                            onNext={handleSubmitAll}
                            onBack={() => setStep(1)}
                            loading={isRegistering}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

// Step 1: Personal Information
function PersonalInfoStep({ onNext, onChange, data }) {
    const { t, i18n } = useTranslation();
    const isArabic = i18n.language === "ar";
    const navigate = useNavigate();
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

    // Check form validity without setting state (for use during render)
    const checkFormValid = useMemo(() => {
        const requiredFields = ['userName', 'email', 'password', 'phoneNumber', 'firstName', 'lastName', 'jobTitle'];
        return requiredFields.every(field => {
            const value = data[field];
            if (!value || (typeof value === 'string' && !value.trim())) {
                return false;
            }
            // Additional validation for specific fields
            if (field === 'email') {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                return emailRegex.test(value);
            }
            if (field === 'password') {
                return value.length >= 8 && /[A-Z]/.test(value) && /[a-z]/.test(value) && /[^A-Za-z0-9]/.test(value);
            }
            if (field === 'userName') {
                return /^[A-Za-z]+$/.test(value);
            }
            return true;
        });
    }, [data.userName, data.email, data.password, data.phoneNumber, data.firstName, data.lastName, data.jobTitle]);

    const handleFieldChange = (name, value) => {
        onChange(name, value);
        
        if (touched[name]) {
            const error = validateField(name, value);
            setErrors(prev => ({
                ...prev,
                [name]: error
            }));
        }
    };

    const handleBlur = (name) => {
        setTouched(prev => ({ ...prev, [name]: true }));
        const error = validateField(name, data[name]);
        setErrors(prev => ({
            ...prev,
            [name]: error
        }));
    };

    const handleNext = () => {
        const allFields = ['userName', 'email', 'password', 'phoneNumber', 'firstName', 'lastName', 'jobTitle'];
        const newTouched = {};
        allFields.forEach(field => { newTouched[field] = true; });
        setTouched(newTouched);
        
        if (validate()) {
            onNext();
        }
    };

    const isFormValid = checkFormValid;

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
                        className={`form-input ${errors.userName ? 'border-red-500 focus:ring-red-500' : ''}`}
                        placeholder={t("employees.newEmployeeForm.professionalInfo.userName")}
                        type="text"
                        value={data.userName}
                        onChange={e => handleFieldChange('userName', e.target.value.replace(/[^A-Za-z]/g, ''))}
                        onBlur={() => handleBlur('userName')}
                    />
                    {errors.userName && (
                        <p className="mt-1 text-sm text-red-500" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
                            {errors.userName}
                        </p>
                    )}
                </div>
                <div>
                    <input
                        className={`form-input ${errors.email ? 'border-red-500 focus:ring-red-500' : ''}`}
                        placeholder={t("employees.newEmployeeForm.personalInfo.emailAddress")}
                        type="email"
                        value={data.email}
                        onChange={e => handleFieldChange('email', e.target.value)}
                        onBlur={() => handleBlur('email')}
                    />
                    {errors.email && (
                        <p className="mt-1 text-sm text-red-500" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
                            {errors.email}
                        </p>
                    )}
                </div>
                <div className="relative">
                    <input
                        className={`form-input ${errors.password ? 'border-red-500 focus:ring-red-500' : ''}`}
                        placeholder="Password"
                        type={showPassword ? 'text' : 'password'}
                        value={data.password}
                        onChange={e => handleFieldChange('password', e.target.value)}
                        onBlur={() => handleBlur('password')}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(s => !s)}
                        className={`absolute ${isArabic ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-[var(--sub-text-color)]`}
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                    {errors.password && (
                        <p className="mt-1 text-sm text-red-500" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
                            {errors.password}
                        </p>
                    )}
                </div>
                <div>
                    <input
                        className={`form-input ${errors.phoneNumber ? 'border-red-500 focus:ring-red-500' : ''}`}
                        placeholder={t("employees.newEmployeeForm.personalInfo.mobileNumber")}
                        type="tel"
                        value={data.phoneNumber}
                        onChange={e => handleFieldChange('phoneNumber', e.target.value)}
                        onBlur={() => handleBlur('phoneNumber')}
                    />
                    {errors.phoneNumber && (
                        <p className="mt-1 text-sm text-red-500" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
                            {errors.phoneNumber}
                        </p>
                    )}
                </div>
                <div>
                    <input
                        className={`form-input ${errors.firstName ? 'border-red-500 focus:ring-red-500' : ''}`}
                        placeholder={t("employees.newEmployeeForm.personalInfo.firstName")}
                        type="text"
                        value={data.firstName}
                        onChange={e => handleFieldChange('firstName', e.target.value)}
                        onBlur={() => handleBlur('firstName')}
                    />
                    {errors.firstName && (
                        <p className="mt-1 text-sm text-red-500" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
                            {errors.firstName}
                        </p>
                    )}
                </div>
                <div>
                    <input
                        className={`form-input ${errors.lastName ? 'border-red-500 focus:ring-red-500' : ''}`}
                        placeholder={t("employees.newEmployeeForm.personalInfo.lastName")}
                        type="text"
                        value={data.lastName}
                        onChange={e => handleFieldChange('lastName', e.target.value)}
                        onBlur={() => handleBlur('lastName')}
                    />
                    {errors.lastName && (
                        <p className="mt-1 text-sm text-red-500" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
                            {errors.lastName}
                        </p>
                    )}
                </div>
                <div className="md:col-span-2">
                    <input
                        className={`form-input ${errors.jobTitle ? 'border-red-500 focus:ring-red-500' : ''}`}
                        placeholder="Job Title"
                        type="text"
                        value={data.jobTitle}
                        onChange={e => handleFieldChange('jobTitle', e.target.value)}
                        onBlur={() => handleBlur('jobTitle')}
                    />
                    {errors.jobTitle && (
                        <p className="mt-1 text-sm text-red-500" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
                            {errors.jobTitle}
                        </p>
                    )}
                </div>
                <div>
                    <input
                        className="form-input"
                        placeholder={t("employees.newEmployeeForm.personalInfo.hireDate") || "Hire Date (Optional)"}
                        type="date"
                        value={data.hireDate || ""}
                        onChange={e => onChange('hireDate', e.target.value)}
                    />
                </div>
            </div>

            {/* Action Buttons */}
            <div className={`flex ${isArabic ? 'justify-start' : 'justify-end'} gap-3 pt-6`}>
                <button type="button" className="btn-secondary" onClick={() => navigate('/pages/admin/all-employees')}>
                    {t("employees.newEmployeeForm.buttons.cancel") || "Cancel"}
                </button>
                <button 
                    type="button" 
                    className="btn-primary" 
                    onClick={handleNext}
                    disabled={!isFormValid}
                    style={{
                        opacity: !isFormValid ? 0.6 : 1,
                        cursor: !isFormValid ? 'not-allowed' : 'pointer'
                    }}
                >
                    {t("employees.newEmployeeForm.buttons.next") || "Next"}
                </button>
            </div>
        </div>
    );
}

// Step 2: Professional Information
function ProfessionalInfoStep({ onNext, onBack, onChange, data, departments, roles, shifts, teams }) {
    const { t, i18n } = useTranslation();
    const isArabic = i18n.language === "ar";
    const [error, setError] = useState("");
    
    // Dropdown states
    const [isDeptOpen, setIsDeptOpen] = useState(false);
    const [isRoleOpen, setIsRoleOpen] = useState(false);
    const [isShiftOpen, setIsShiftOpen] = useState(false);
    const [isTeamOpen, setIsTeamOpen] = useState(false);
    
    // Search terms
    const [deptSearch, setDeptSearch] = useState("");
    const [roleSearch, setRoleSearch] = useState("");
    const [shiftSearch, setShiftSearch] = useState("");
    const [teamSearch, setTeamSearch] = useState("");

    const deptOptions = Array.isArray(departments) ? departments : [];
    const roleOptions = Array.isArray(roles) ? roles : [];
    const shiftOptions = Array.isArray(shifts) ? shifts : [];
    const teamOptions = Array.isArray(teams) ? teams : [];

    // Filtered options
    const filteredDepts = useMemo(() => {
        if (!deptSearch.trim()) return deptOptions;
        const search = deptSearch.toLowerCase();
        return deptOptions.filter(d => 
            (d.name || d.departmentName || '').toLowerCase().includes(search)
        );
    }, [deptOptions, deptSearch]);

    const filteredRoles = useMemo(() => {
        if (!roleSearch.trim()) return roleOptions;
        const search = roleSearch.toLowerCase();
        return roleOptions.filter(r => 
            (r.name || r.roleName || r.code || '').toLowerCase().includes(search)
        );
    }, [roleOptions, roleSearch]);

    const filteredShifts = useMemo(() => {
        if (!shiftSearch.trim()) return shiftOptions;
        const search = shiftSearch.toLowerCase();
        return shiftOptions.filter(s => 
            (s.name || s.shiftName || '').toLowerCase().includes(search)
        );
    }, [shiftOptions, shiftSearch]);

    const filteredTeams = useMemo(() => {
        if (!teamSearch.trim()) return teamOptions;
        const search = teamSearch.toLowerCase();
        return teamOptions.filter(t => 
            (t.name || t.teamName || '').toLowerCase().includes(search)
        );
    }, [teamOptions, teamSearch]);

    const selectedDept = deptOptions.find(d => (d.id || d.departmentId) === data.departmentId);
    const selectedRole = roleOptions.find(r => (r.id || r.roleId) === data.roleId);
    const selectedShifts = shiftOptions.filter(s => (data.shiftIds || []).includes(s.id || s.shiftId));
    const selectedTeams = teamOptions.filter(t => (data.teamIds || []).includes(t.id || t.teamId));

    const toggleShift = (shiftId) => {
        const currentIds = data.shiftIds || [];
        if (currentIds.includes(shiftId)) {
            onChange('shiftIds', currentIds.filter(id => id !== shiftId));
        } else {
            onChange('shiftIds', [...currentIds, shiftId]);
        }
    };

    const toggleTeam = (teamId) => {
        const currentIds = data.teamIds || [];
        if (currentIds.includes(teamId)) {
            onChange('teamIds', currentIds.filter(id => id !== teamId));
        } else {
            onChange('teamIds', [...currentIds, teamId]);
        }
    };

    const handleNext = () => {
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
                {/* Department Dropdown */}
                <div className="relative">
                    <label className="block text-sm font-medium text-[var(--text-color)] mb-2">
                        {t("employees.newEmployeeForm.professionalInfo.selectDepartment") || "Department"} <span className="text-red-500">*</span>
                    </label>
                    <div className="form-input cursor-pointer flex items-center justify-between" onClick={() => setIsDeptOpen(!isDeptOpen)}>
                        <span className="text-[var(--sub-text-color)]">
                            {selectedDept ? (selectedDept.name || selectedDept.departmentName) : t("employees.newEmployeeForm.professionalInfo.selectDepartment")}
                        </span>
                        <ChevronDown className={`text-[var(--sub-text-color)] transition-transform ${isDeptOpen ? 'rotate-180' : ''}`} size={16} />
                    </div>
                    {isDeptOpen && (
                        <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-[var(--bg-color)] border border-[var(--border-color)] rounded-lg shadow-lg max-h-60 overflow-hidden flex flex-col">
                            <div className="p-2 border-b border-[var(--border-color)] sticky top-0 bg-[var(--bg-color)]">
                                <div className="relative">
                                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--sub-text-color)]" />
                                    <input
                                        type="text"
                                        value={deptSearch}
                                        onChange={(e) => setDeptSearch(e.target.value)}
                                        placeholder="Search departments..."
                                        className="w-full pl-8 pr-3 py-2 text-sm border border-[var(--border-color)] rounded-lg bg-[var(--input-bg)] text-[var(--text-color)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]"
                                        onClick={(e) => e.stopPropagation()}
                                        dir={isArabic ? 'rtl' : 'ltr'}
                                    />
                                </div>
                            </div>
                            <div className="overflow-y-auto max-h-[240px]">
                                {filteredDepts.map((d) => (
                                    <div 
                                        key={d.id || d.departmentId} 
                                        className="p-3 hover:bg-[var(--hover-color)] cursor-pointer"
                                        onClick={() => {
                                            onChange('departmentId', d.id || d.departmentId);
                                            onChange('teamIds', []);
                                            setIsDeptOpen(false);
                                            setDeptSearch("");
                                        }}
                                    >
                                        <div className="text-sm text-[var(--text-color)]">{d.name || d.departmentName}</div>
                                    </div>
                                ))}
                                {filteredDepts.length === 0 && (
                                    <div className="p-3 text-[var(--sub-text-color)]">No departments found</div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Role Dropdown */}
                <div className="relative">
                    <label className="block text-sm font-medium text-[var(--text-color)] mb-2">
                        {t("employees.newEmployeeForm.professionalInfo.selectEmployeeRole") || "Role"} <span className="text-red-500">*</span>
                    </label>
                    <div className={`form-input cursor-pointer flex items-center justify-between ${!data.roleId && error ? 'border-red-500' : ''}`} onClick={() => setIsRoleOpen(!isRoleOpen)}>
                        <span className="text-[var(--sub-text-color)]">
                            {selectedRole ? (selectedRole.name || selectedRole.roleName || selectedRole.code) : t("employees.newEmployeeForm.professionalInfo.selectEmployeeRole")}
                        </span>
                        <ChevronDown className={`text-[var(--sub-text-color)] transition-transform ${isRoleOpen ? 'rotate-180' : ''}`} size={16} />
                    </div>
                    {isRoleOpen && (
                        <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-[var(--bg-color)] border border-[var(--border-color)] rounded-lg shadow-lg max-h-60 overflow-hidden flex flex-col">
                            <div className="p-2 border-b border-[var(--border-color)] sticky top-0 bg-[var(--bg-color)]">
                                <div className="relative">
                                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--sub-text-color)]" />
                                    <input
                                        type="text"
                                        value={roleSearch}
                                        onChange={(e) => setRoleSearch(e.target.value)}
                                        placeholder="Search roles..."
                                        className="w-full pl-8 pr-3 py-2 text-sm border border-[var(--border-color)] rounded-lg bg-[var(--input-bg)] text-[var(--text-color)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]"
                                        onClick={(e) => e.stopPropagation()}
                                        dir={isArabic ? 'rtl' : 'ltr'}
                                    />
                                </div>
                            </div>
                            <div className="overflow-y-auto max-h-[240px]">
                                {filteredRoles.map((r) => (
                                    <div 
                                        key={r.id || r.roleId} 
                                        className="p-3 hover:bg-[var(--hover-color)] cursor-pointer"
                                        onClick={() => {
                                            onChange('roleId', r.id || r.roleId);
                                            setIsRoleOpen(false);
                                            setRoleSearch("");
                                            setError("");
                                        }}
                                    >
                                        <div className="text-sm text-[var(--text-color)]">{r.name || r.roleName || r.code}</div>
                                    </div>
                                ))}
                                {filteredRoles.length === 0 && (
                                    <div className="p-3 text-[var(--sub-text-color)]">No roles found</div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Shifts Multi-Select */}
                <div className="md:col-span-2 relative">
                    <label className="block text-sm font-medium text-[var(--text-color)] mb-2">
                        Select shift <span className="text-[var(--sub-text-color)] text-xs">(Optional)</span>
                    </label>
                    <div className="form-input cursor-pointer flex items-center justify-between" onClick={() => setIsShiftOpen(!isShiftOpen)}>
                        <span className="text-[var(--sub-text-color)]">
                            {selectedShifts.length > 0 
                                ? `${selectedShifts.length} shift(s) selected` 
                                : "Select shifts (optional)"}
                        </span>
                        <ChevronDown className={`text-[var(--sub-text-color)] transition-transform ${isShiftOpen ? 'rotate-180' : ''}`} size={16} />
                    </div>
                    {isShiftOpen && (
                        <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-[var(--bg-color)] border border-[var(--border-color)] rounded-lg shadow-lg max-h-60 overflow-hidden flex flex-col">
                            <div className="p-2 border-b border-[var(--border-color)] sticky top-0 bg-[var(--bg-color)]">
                                <div className="relative">
                                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--sub-text-color)]" />
                                    <input
                                        type="text"
                                        value={shiftSearch}
                                        onChange={(e) => setShiftSearch(e.target.value)}
                                        placeholder="Search shifts..."
                                        className="w-full pl-8 pr-3 py-2 text-sm border border-[var(--border-color)] rounded-lg bg-[var(--input-bg)] text-[var(--text-color)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]"
                                        onClick={(e) => e.stopPropagation()}
                                        dir={isArabic ? 'rtl' : 'ltr'}
                                    />
                                </div>
                            </div>
                            <div className="overflow-y-auto max-h-[240px]">
                                {filteredShifts.map((s) => {
                                    const shiftId = s.id || s.shiftId;
                                    const isSelected = (data.shiftIds || []).includes(shiftId);
                                    return (
                                        <div 
                                            key={shiftId} 
                                            className={`p-3 cursor-pointer flex items-center justify-between ${isSelected ? 'bg-[var(--accent-color)] bg-opacity-10' : 'hover:bg-[var(--hover-color)]'}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleShift(shiftId);
                                            }}
                                        >
                                            <div className="text-sm text-[var(--text-color)]">{s.name || s.shiftName}</div>
                                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                                isSelected 
                                                    ? 'border-[var(--accent-color)] bg-[var(--accent-color)]' 
                                                    : 'border-[var(--border-color)]'
                                            }`}>
                                                {isSelected && <Check className="text-white" size={12} />}
                                            </div>
                                        </div>
                                    );
                                })}
                                {filteredShifts.length === 0 && (
                                    <div className="p-3 text-[var(--sub-text-color)]">No shifts found</div>
                                )}
                            </div>
                        </div>
                    )}
                    {selectedShifts.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                            {selectedShifts.map((s) => (
                                <div key={s.id || s.shiftId} className="flex items-center gap-1 px-2 py-1 bg-[var(--container-color)] rounded-lg text-xs border border-[var(--border-color)]">
                                    <span className="text-[var(--text-color)]">{s.name || s.shiftName}</span>
                                    <X 
                                        size={12} 
                                        className="text-[var(--sub-text-color)] cursor-pointer hover:text-red-500" 
                                        onClick={() => toggleShift(s.id || s.shiftId)}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Teams Multi-Select */}
                <div className="md:col-span-2 relative">
                    <label className="block text-sm font-medium text-[var(--text-color)] mb-2">
                        Select Team <span className="text-[var(--sub-text-color)] text-xs">(Optional)</span>
                    </label>
                    <div 
                        className={`form-input cursor-pointer flex items-center justify-between ${!data.departmentId ? 'opacity-50 cursor-not-allowed' : ''}`} 
                        onClick={() => data.departmentId && setIsTeamOpen(!isTeamOpen)}
                    >
                        <span className="text-[var(--sub-text-color)]">
                            {!data.departmentId 
                                ? "Select department first"
                                : selectedTeams.length > 0 
                                    ? `${selectedTeams.length} team(s) selected` 
                                    : "Select teams (optional)"}
                        </span>
                        <ChevronDown className={`text-[var(--sub-text-color)] transition-transform ${isTeamOpen ? 'rotate-180' : ''}`} size={16} />
                    </div>
                    {isTeamOpen && data.departmentId && (
                        <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-[var(--bg-color)] border border-[var(--border-color)] rounded-lg shadow-lg max-h-60 overflow-hidden flex flex-col">
                            <div className="p-2 border-b border-[var(--border-color)] sticky top-0 bg-[var(--bg-color)]">
                                <div className="relative">
                                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--sub-text-color)]" />
                                    <input
                                        type="text"
                                        value={teamSearch}
                                        onChange={(e) => setTeamSearch(e.target.value)}
                                        placeholder="Search teams..."
                                        className="w-full pl-8 pr-3 py-2 text-sm border border-[var(--border-color)] rounded-lg bg-[var(--input-bg)] text-[var(--text-color)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]"
                                        onClick={(e) => e.stopPropagation()}
                                        dir={isArabic ? 'rtl' : 'ltr'}
                                    />
                                </div>
                            </div>
                            <div className="overflow-y-auto max-h-[240px]">
                                {filteredTeams.map((t) => {
                                    const teamId = t.id || t.teamId;
                                    const isSelected = (data.teamIds || []).includes(teamId);
                                    return (
                                        <div 
                                            key={teamId} 
                                            className={`p-3 cursor-pointer flex items-center justify-between ${isSelected ? 'bg-[var(--accent-color)] bg-opacity-10' : 'hover:bg-[var(--hover-color)]'}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleTeam(teamId);
                                            }}
                                        >
                                            <div className="text-sm text-[var(--text-color)]">{t.name || t.teamName}</div>
                                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                                isSelected 
                                                    ? 'border-[var(--accent-color)] bg-[var(--accent-color)]' 
                                                    : 'border-[var(--border-color)]'
                                            }`}>
                                                {isSelected && <Check className="text-white" size={12} />}
                                            </div>
                                        </div>
                                    );
                                })}
                                {filteredTeams.length === 0 && (
                                    <div className="p-3 text-[var(--sub-text-color)]">No teams found</div>
                                )}
                            </div>
                        </div>
                    )}
                    {selectedTeams.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                            {selectedTeams.map((t) => (
                                <div key={t.id || t.teamId} className="flex items-center gap-1 px-2 py-1 bg-[var(--container-color)] rounded-lg text-xs border border-[var(--border-color)]">
                                    <span className="text-[var(--text-color)]">{t.name || t.teamName}</span>
                                    <X 
                                        size={12} 
                                        className="text-[var(--sub-text-color)] cursor-pointer hover:text-red-500" 
                                        onClick={() => toggleTeam(t.id || t.teamId)}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Action Buttons */}
            <div className={`flex ${isArabic ? 'justify-start' : 'justify-end'} gap-3 pt-6`}>
                <button type="button" className="btn-secondary" onClick={onBack}>
                    {t("employees.newEmployeeForm.buttons.back") || "Back"}
                </button>
                <button type="button" className="btn-primary" onClick={handleNext}>
                    {t("employees.newEmployeeForm.buttons.next") || "Next"}
                </button>
            </div>
        </div>
    );
}

// Step 3: Review & Submit
function ReviewStep({ onNext, onBack, employeeData, departments, roles, shifts, teams, loading }) {
    const { t, i18n } = useTranslation();
    const isArabic = i18n.language === "ar";

    const selectedDept = departments.find(d => (d.id || d.departmentId) === employeeData.departmentId);
    const selectedRole = roles.find(r => (r.id || r.roleId) === employeeData.roleId);
    const selectedShifts = shifts.filter(s => (employeeData.shiftIds || []).includes(s.id || s.shiftId));
    const selectedTeams = teams.filter(t => (employeeData.teamIds || []).includes(t.id || t.teamId));

    return (
        <div className="space-y-8">
            <h2 className="text-xl font-bold text-[var(--text-color)]">
                {t("employees.newEmployeeForm.review.title") || "Review Employee Details"}
            </h2>

            {/* Personal Information */}
            <div className="p-6 bg-[var(--container-color)] rounded-lg border border-[var(--border-color)]">
                <h3 className="text-lg font-semibold text-[var(--text-color)] mb-4">
                    {t("employees.newEmployeeForm.steps.personalInfo")}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <span className="text-[var(--sub-text-color)] text-sm">Username:</span>
                        <div className="text-[var(--text-color)] font-medium">{employeeData.userName}</div>
                    </div>
                    <div>
                        <span className="text-[var(--sub-text-color)] text-sm">Email:</span>
                        <div className="text-[var(--text-color)] font-medium">{employeeData.email}</div>
                    </div>
                    <div>
                        <span className="text-[var(--sub-text-color)] text-sm">First Name:</span>
                        <div className="text-[var(--text-color)] font-medium">{employeeData.firstName}</div>
                    </div>
                    <div>
                        <span className="text-[var(--sub-text-color)] text-sm">Last Name:</span>
                        <div className="text-[var(--text-color)] font-medium">{employeeData.lastName}</div>
                    </div>
                    <div>
                        <span className="text-[var(--sub-text-color)] text-sm">Phone Number:</span>
                        <div className="text-[var(--text-color)] font-medium">{employeeData.phoneNumber}</div>
                    </div>
                    <div>
                        <span className="text-[var(--sub-text-color)] text-sm">Job Title:</span>
                        <div className="text-[var(--text-color)] font-medium">{employeeData.jobTitle}</div>
                    </div>
                    {employeeData.hireDate && (
                        <div>
                            <span className="text-[var(--sub-text-color)] text-sm">Hire Date:</span>
                            <div className="text-[var(--text-color)] font-medium">{new Date(employeeData.hireDate).toLocaleDateString()}</div>
                        </div>
                    )}
                </div>
            </div>

            {/* Professional Information */}
            <div className="p-6 bg-[var(--container-color)] rounded-lg border border-[var(--border-color)]">
                <h3 className="text-lg font-semibold text-[var(--text-color)] mb-4">
                    {t("employees.newEmployeeForm.steps.professionalInfo")}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedDept && (
                        <div>
                            <span className="text-[var(--sub-text-color)] text-sm">Department:</span>
                            <div className="text-[var(--text-color)] font-medium">{selectedDept.name || selectedDept.departmentName}</div>
                        </div>
                    )}
                    {selectedRole && (
                        <div>
                            <span className="text-[var(--sub-text-color)] text-sm">Role:</span>
                            <div className="text-[var(--text-color)] font-medium">{selectedRole.name || selectedRole.roleName || selectedRole.code}</div>
                        </div>
                    )}
                    {selectedShifts.length > 0 && (
                        <div className="md:col-span-2">
                            <span className="text-[var(--sub-text-color)] text-sm">Shifts:</span>
                            <div className="flex flex-wrap gap-2 mt-1">
                                {selectedShifts.map((s) => (
                                    <span key={s.id || s.shiftId} className="px-2 py-1 bg-[var(--bg-color)] rounded text-sm text-[var(--text-color)] border border-[var(--border-color)]">
                                        {s.name || s.shiftName}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                    {selectedTeams.length > 0 && (
                        <div className="md:col-span-2">
                            <span className="text-[var(--sub-text-color)] text-sm">Teams:</span>
                            <div className="flex flex-wrap gap-2 mt-1">
                                {selectedTeams.map((t) => (
                                    <span key={t.id || t.teamId} className="px-2 py-1 bg-[var(--bg-color)] rounded text-sm text-[var(--text-color)] border border-[var(--border-color)]">
                                        {t.name || t.teamName}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Action Buttons */}
            <div className={`flex ${isArabic ? 'justify-start' : 'justify-end'} gap-3 pt-6`}>
                <button type="button" className="btn-secondary" onClick={onBack} disabled={loading}>
                    {t("employees.newEmployeeForm.buttons.back") || "Back"}
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
                        t("employees.newEmployeeForm.buttons.submit") || t("common.submit") || "Create Employee"
                    )}
                </button>
            </div>
        </div>
    );
}

