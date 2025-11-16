import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { X, User, Briefcase, FileText, Shield, Camera, Upload, Check } from "lucide-react";

export default function EditEmployeePopup({ employee, isOpen, onClose, onSave }) {
    const { t, i18n } = useTranslation();
    const isArabic = i18n.language === "ar";
    const [step, setStep] = useState(0);
    const [formData, setFormData] = useState({});

    // Initialize form data when employee changes
    useEffect(() => {
        if (employee) {
            setFormData({
                firstName: employee.name?.split(' ')[0] || '',
                lastName: employee.name?.split(' ').slice(1).join(' ') || '',
                mobileNumber: employee.mobileNumber || '',
                email: employee.email || '',
                dateOfBirth: employee.dateOfBirth || '',
                status: employee.status || '',
                gender: employee.gender || '',
                nationality: employee.nationality || '',
                address: employee.address || '',
                employeeId: employee.employeeId || '',
                username: employee.username || '',
                position: employee.position || '',
                department: employee.department || '',
                manager: employee.manager || '',
                workingDays: employee.workingDays || '',
                employmentType: employee.employmentType || '',
                officeLocation: employee.officeLocation || '',
                joinDate: employee.joinDate || '',
                avatar: employee.avatar || '',
            });
        }
    }, [employee]);

    useEffect(() => {
        if (isOpen) {
            setStep(0);
        }
    }, [isOpen, employee]);

    if (!isOpen || !employee) return null;

    const steps = [
        { label: t("employees.newEmployeeForm.steps.personalInfo"), icon: User },
        { label: t("employees.newEmployeeForm.steps.professionalInfo"), icon: Briefcase },
        { label: t("employees.newEmployeeForm.steps.documents"), icon: FileText },
        { label: t("employees.newEmployeeForm.steps.accountAccess"), icon: Shield },
    ];

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSave = () => {
        const updatedEmployee = {
            ...employee,
            ...formData,
            name: `${formData.firstName} ${formData.lastName}`.trim()
        };
        onSave(updatedEmployee);
        onClose();
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
                    {step === 1 && <ProfessionalInfoEdit formData={formData} onChange={handleInputChange} />}
                    {step === 2 && <DocumentsEdit formData={formData} onChange={handleInputChange} />}
                    {step === 3 && <AccountAccessEdit formData={formData} onChange={handleInputChange} />}
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
                        {step < 3 ? (
                            <button
                                onClick={() => setStep(Math.min(3, step + 1))}
                                className="btn-primary"
                            >
                                {t("employees.newEmployeeForm.buttons.next")}
                            </button>
                        ) : (
                            <button
                                onClick={handleSave}
                                className="btn-primary"
                            >
                                {t("employees.editEmployee.save", "Save Changes")}
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

    return (
        <div className="space-y-6">
            {/* Avatar Upload */}
            <div className={`flex ${isArabic ? 'justify-end' : 'justify-start'} mb-6`}>
                <div className="relative">
                    {formData.avatar ? (
                        <img
                            src={formData.avatar}
                            alt="Employee Avatar"
                            className="w-20 h-20 rounded-xl object-cover border-2 border-[var(--border-color)]"
                        />
                    ) : (
                        <div className="w-20 h-20 rounded-xl bg-[var(--container-color)] border-2 border-dashed border-[var(--border-color)] flex items-center justify-center cursor-pointer hover:bg-[var(--hover-color)] transition-colors">
                            <Camera className="text-[var(--sub-text-color)]" size={24} />
                        </div>
                    )}
                    <button className="absolute -bottom-2 -right-2 w-8 h-8 gradient-bg rounded-full flex items-center justify-center text-white shadow-lg">
                        <Camera size={16} />
                    </button>
                </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                    className="form-input"
                    placeholder={t("employees.newEmployeeForm.personalInfo.firstName")}
                    type="text"
                    value={formData.firstName || ''}
                    onChange={(e) => onChange('firstName', e.target.value)}
                />
                <input
                    className="form-input"
                    placeholder={t("employees.newEmployeeForm.personalInfo.lastName")}
                    type="text"
                    value={formData.lastName || ''}
                    onChange={(e) => onChange('lastName', e.target.value)}
                />
                <input
                    className="form-input"
                    placeholder={t("employees.newEmployeeForm.personalInfo.mobileNumber")}
                    type="tel"
                    value={formData.mobileNumber || ''}
                    onChange={(e) => onChange('mobileNumber', e.target.value)}
                />
                <input
                    className="form-input"
                    placeholder={t("employees.newEmployeeForm.personalInfo.emailAddress")}
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => onChange('email', e.target.value)}
                />
                <input
                    className="form-input"
                    placeholder={t("employees.newEmployeeForm.personalInfo.dateOfBirth")}
                    type="date"
                    value={formData.dateOfBirth || ''}
                    onChange={(e) => onChange('dateOfBirth', e.target.value)}
                />
                <select
                    className="form-input"
                    value={formData.status || ''}
                    onChange={(e) => onChange('status', e.target.value)}
                >
                    <option value="">{t("employees.newEmployeeForm.personalInfo.status")}</option>
                    <option value="Active">{t("employees.newEmployeeForm.personalInfo.active")}</option>
                    <option value="Inactive">{t("employees.newEmployeeForm.personalInfo.inactive")}</option>
                </select>
                <select
                    className="form-input"
                    value={formData.gender || ''}
                    onChange={(e) => onChange('gender', e.target.value)}
                >
                    <option value="">{t("employees.newEmployeeForm.personalInfo.gender")}</option>
                    <option value="male">{t("employees.newEmployeeForm.personalInfo.male")}</option>
                    <option value="female">{t("employees.newEmployeeForm.personalInfo.female")}</option>
                    <option value="other">{t("employees.newEmployeeForm.personalInfo.other")}</option>
                </select>
                <select
                    className="form-input"
                    value={formData.nationality || ''}
                    onChange={(e) => onChange('nationality', e.target.value)}
                >
                    <option value="">{t("employees.newEmployeeForm.personalInfo.nationality")}</option>
                    <option value="us">{t("employees.newEmployeeForm.personalInfo.unitedStates")}</option>
                    <option value="uk">{t("employees.newEmployeeForm.personalInfo.unitedKingdom")}</option>
                    <option value="ca">{t("employees.newEmployeeForm.personalInfo.canada")}</option>
                </select>
                <input
                    className="form-input md:col-span-2"
                    placeholder={t("employees.newEmployeeForm.personalInfo.address")}
                    type="text"
                    value={formData.address || ''}
                    onChange={(e) => onChange('address', e.target.value)}
                />
            </div>
        </div>
    );
}

// Professional Information Edit
function ProfessionalInfoEdit({ formData, onChange }) {
    const { t, i18n } = useTranslation();
    const isArabic = i18n.language === "ar";

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex gap-2">
                    <input
                        className="form-input flex-1"
                        placeholder={t("employees.newEmployeeForm.professionalInfo.employeeId")}
                        type="text"
                        value={formData.employeeId || ''}
                        onChange={(e) => onChange('employeeId', e.target.value)}
                    />
                    <button type="button" className="btn-primary px-4 whitespace-nowrap">
                        {t("employees.newEmployeeForm.professionalInfo.generate")}
                    </button>
                </div>
                <input
                    className="form-input"
                    placeholder={t("employees.newEmployeeForm.professionalInfo.userName")}
                    type="text"
                    value={formData.username || ''}
                    onChange={(e) => onChange('username', e.target.value)}
                />
                <select
                    className="form-input"
                    value={formData.position || ''}
                    onChange={(e) => onChange('position', e.target.value)}
                >
                    <option value="">{t("employees.newEmployeeForm.professionalInfo.selectEmployeeRole")}</option>
                    <option value="manager">{t("employees.newEmployeeForm.professionalInfo.manager")}</option>
                    <option value="developer">{t("employees.newEmployeeForm.professionalInfo.developer")}</option>
                    <option value="designer">{t("employees.newEmployeeForm.professionalInfo.designer")}</option>
                </select>
                <input
                    className="form-input"
                    placeholder={t("employees.newEmployeeForm.personalInfo.emailAddress")}
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => onChange('email', e.target.value)}
                />
                <select
                    className="form-input"
                    value={formData.department || ''}
                    onChange={(e) => onChange('department', e.target.value)}
                >
                    <option value="">{t("employees.newEmployeeForm.professionalInfo.selectDepartment")}</option>
                    <option value="hr">{t("employees.newEmployeeForm.professionalInfo.humanResources")}</option>
                    <option value="it">{t("employees.newEmployeeForm.professionalInfo.it")}</option>
                    <option value="finance">{t("employees.newEmployeeForm.professionalInfo.finance")}</option>
                </select>
                <input
                    className="form-input"
                    placeholder={t("employees.newEmployeeForm.professionalInfo.managerSupervisor")}
                    type="text"
                    value={formData.manager || ''}
                    onChange={(e) => onChange('manager', e.target.value)}
                />
                <select
                    className="form-input"
                    value={formData.workingDays || ''}
                    onChange={(e) => onChange('workingDays', e.target.value)}
                >
                    <option value="">{t("employees.newEmployeeForm.professionalInfo.selectWorkingDays")}</option>
                    <option value="5">{t("employees.newEmployeeForm.professionalInfo.fiveDays")}</option>
                    <option value="6">{t("employees.newEmployeeForm.professionalInfo.sixDays")}</option>
                </select>
                <select
                    className="form-input"
                    value={formData.employmentType || ''}
                    onChange={(e) => onChange('employmentType', e.target.value)}
                >
                    <option value="">{t("employees.newEmployeeForm.professionalInfo.selectEmploymentType")}</option>
                    <option value="full-time">{t("employees.newEmployeeForm.professionalInfo.fullTime")}</option>
                    <option value="part-time">{t("employees.newEmployeeForm.professionalInfo.partTime")}</option>
                    <option value="contract">{t("employees.newEmployeeForm.professionalInfo.contract")}</option>
                </select>
                <select
                    className="form-input"
                    value={formData.officeLocation || ''}
                    onChange={(e) => onChange('officeLocation', e.target.value)}
                >
                    <option value="">{t("employees.newEmployeeForm.professionalInfo.selectOfficeLocation")}</option>
                    <option value="main">{t("employees.newEmployeeForm.professionalInfo.mainOffice")}</option>
                    <option value="branch">{t("employees.newEmployeeForm.professionalInfo.branchOffice")}</option>
                </select>
                <input
                    className="form-input"
                    placeholder={t("employees.newEmployeeForm.professionalInfo.selectJoiningDate")}
                    type="date"
                    value={formData.joinDate || ''}
                    onChange={(e) => onChange('joinDate', e.target.value)}
                />
            </div>
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

// Account Access Edit (simplified for this example)
function AccountAccessEdit({ formData, onChange }) {
    const { t } = useTranslation();

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                    className="form-input"
                    placeholder={t("employees.accountAccess.loginCredentials", "Username")}
                    type="text"
                    value={formData.username || ''}
                    onChange={(e) => onChange('username', e.target.value)}
                />
                <select
                    className="form-input"
                    value={formData.accessLevel || ''}
                    onChange={(e) => onChange('accessLevel', e.target.value)}
                >
                    <option value="">{t("employees.accountAccess.accessLevel", "Access Level")}</option>
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="user">Standard User</option>
                </select>
            </div>
        </div>
    );
}