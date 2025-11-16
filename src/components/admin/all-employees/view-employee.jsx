import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { X, User, Briefcase, FileText, Shield, Download } from "lucide-react";

export default function ViewEmployeePopup({ employee, isOpen, onClose }) {
    const { t, i18n } = useTranslation();
    const isArabic = i18n.language === "ar";
    const [step, setStep] = useState(0);

    // Always start from the first step when opened or when employee changes
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
                        {t("employees.viewEmployee.title", "View Employee Details")}
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
                    {step === 0 && <PersonalInfoView employee={employee} />}
                    {step === 1 && <ProfessionalInfoView employee={employee} />}
                    {step === 2 && <DocumentsView employee={employee} />}
                    {step === 3 && <AccountAccessView employee={employee} />}
                </div>

                {/* Navigation */}
                <div className={`flex justify-between mt-8 ${isArabic ? 'flex-row-reverse' : ''}`}>
                    <button
                        onClick={() => setStep(Math.max(0, step - 1))}
                        disabled={step === 0}
                        className="btn-secondary disabled:opacity-50"
                    >
                        {t("employees.newEmployeeForm.buttons.back")}
                    </button>
                    <button
                        onClick={() => setStep(Math.min(3, step + 1))}
                        disabled={step === 3}
                        className="btn-primary disabled:opacity-50"
                    >
                        {t("employees.newEmployeeForm.buttons.next")}
                    </button>
                </div>
            </div>
        </div>
    );
}

// Personal Information View
function PersonalInfoView({ employee }) {
    const { t, i18n } = useTranslation();
    const isArabic = i18n.language === "ar";

    return (
        <div className="space-y-6">
            {/* Avatar */}
            <div className={`flex ${isArabic ? 'justify-end' : 'justify-start'} mb-6`}>
                <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-[var(--border-color)]">
                    <img
                        src={employee.avatar}
                        alt={employee.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name)}&background=15919B&color=fff&size=80`;
                        }}
                    />
                </div>
            </div>

            {/* Form Fields - Read Only */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                    <label className="form-label text-[var(--sub-text-color)]">{t("employees.newEmployeeForm.personalInfo.firstName")}</label>
                    <div className="form-input-readonly ">{employee.name?.split(' ')[0] || 'N/A'}</div>
                </div>
                <div className="form-group">
                    <label className="form-label text-[var(--sub-text-color)]">{t("employees.newEmployeeForm.personalInfo.lastName")}</label>
                    <div className="form-input-readonly">{employee.name?.split(' ').slice(1).join(' ') || 'N/A'}</div>
                </div>
                <div className="form-group">
                    <label className="form-label text-[var(--sub-text-color)]">{t("employees.newEmployeeForm.personalInfo.mobileNumber")}</label>
                    <div className="form-input-readonly">{employee.mobileNumber || 'N/A'}</div>
                </div>
                <div className="form-group">
                    <label className="form-label text-[var(--sub-text-color)]">{t("employees.newEmployeeForm.personalInfo.emailAddress")}</label>
                    <div className="form-input-readonly">{employee.email || 'N/A'}</div>
                </div>
                <div className="form-group">
                    <label className="form-label text-[var(--sub-text-color)]">{t("employees.newEmployeeForm.personalInfo.dateOfBirth")}</label>
                    <div className="form-input-readonly">{employee.dateOfBirth || 'N/A'}</div>
                </div>
                <div className="form-group">
                    <label className="form-label text-[var(--sub-text-color)]">{t("employees.newEmployeeForm.personalInfo.status")}</label>
                    <div className="form-input-readonly">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${employee.status === "Active" ? 'bg-green-100 text-green-700' :
                                employee.status === "Inactive" ? 'bg-red-100 text-red-700' :
                                    'bg-yellow-100 text-yellow-700'
                            }`}>
                            {employee.status}
                        </span>
                    </div>
                </div>
                <div className="form-group">
                    <label className="form-label text-[var(--sub-text-color)]">{t("employees.newEmployeeForm.personalInfo.gender")}</label>
                    <div className="form-input-readonly">{employee.gender || 'N/A'}</div>
                </div>
                <div className="form-group">
                    <label className="form-label text-[var(--sub-text-color)]">{t("employees.newEmployeeForm.personalInfo.nationality")}</label>
                    <div className="form-input-readonly">{employee.nationality || 'N/A'}</div>
                </div>
                <div className="form-group md:col-span-2">
                    <label className="form-label text-[var(--sub-text-color)]">{t("employees.newEmployeeForm.personalInfo.address")}</label>
                    <div className="form-input-readonly">{employee.address || 'N/A'}</div>
                </div>
            </div>
        </div>
    );
}

// Professional Information View
function ProfessionalInfoView({ employee }) {
    const { t, i18n } = useTranslation();
    const isArabic = i18n.language === "ar";

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                    <label className="form-label text-[var(--sub-text-color)]">{t("employees.newEmployeeForm.professionalInfo.employeeId")}</label>
                    <div className="form-input-readonly">{employee.employeeId || 'N/A'}</div>
                </div>
                <div className="form-group">
                    <label className="form-label text-[var(--sub-text-color)]">{t("employees.newEmployeeForm.professionalInfo.userName")}</label>
                    <div className="form-input-readonly">{employee.username || 'N/A'}</div>
                </div>
                <div className="form-group">
                    <label className="form-label text-[var(--sub-text-color)]">{t("employees.newEmployeeForm.professionalInfo.selectEmployeeRole")}</label>
                    <div className="form-input-readonly">{employee.position || 'N/A'}</div>
                </div>
                <div className="form-group">
                    <label className="form-label text-[var(--sub-text-color)]">{t("employees.newEmployeeForm.personalInfo.emailAddress")}</label>
                    <div className="form-input-readonly">{employee.email || 'N/A'}</div>
                </div>
                <div className="form-group">
                    <label className="form-label text-[var(--sub-text-color)]">{t("employees.newEmployeeForm.professionalInfo.selectDepartment")}</label>
                    <div className="form-input-readonly">{employee.department || 'N/A'}</div>
                </div>
                <div className="form-group">
                    <label className="form-label text-[var(--sub-text-color)]">{t("employees.newEmployeeForm.professionalInfo.managerSupervisor")}</label>
                    <div className="form-input-readonly">{employee.manager || 'N/A'}</div>
                </div>
                <div className="form-group">
                    <label className="form-label text-[var(--sub-text-color)]">{t("employees.newEmployeeForm.professionalInfo.selectWorkingDays")}</label>
                    <div className="form-input-readonly">{employee.workingDays || 'N/A'}</div>
                </div>
                <div className="form-group">
                    <label className="form-label text-[var(--sub-text-color)]">{t("employees.newEmployeeForm.professionalInfo.selectEmploymentType")}</label>
                    <div className="form-input-readonly">{employee.employmentType || 'N/A'}</div>
                </div>
                <div className="form-group">
                    <label className="form-label text-[var(--sub-text-color)]">{t("employees.newEmployeeForm.professionalInfo.selectOfficeLocation")}</label>
                    <div className="form-input-readonly">{employee.officeLocation || 'N/A'}</div>
                </div>
                <div className="form-group">
                    <label className="form-label text-[var(--sub-text-color)]">{t("employees.newEmployeeForm.professionalInfo.selectJoiningDate")}</label>
                    <div className="form-input-readonly">{employee.joinDate || 'N/A'}</div>
                </div>
            </div>
        </div>
    );
}

// Documents View
function DocumentsView({ employee }) {
    const { t, i18n } = useTranslation();
    const isArabic = i18n.language === "ar";

    const documents = [
        { label: t("employees.newEmployeeForm.documents.uploadProofOfIdentity"), file: employee.proofOfIdentity },
        { label: t("employees.newEmployeeForm.documents.uploadEmploymentContract"), file: employee.employmentContract },
        { label: t("employees.newEmployeeForm.documents.uploadCertificatesQualifications"), file: employee.certificates },
        { label: t("employees.newEmployeeForm.documents.uploadSocialInsuranceDocs"), file: employee.socialInsurance },
    ];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {documents.map((doc, index) => (
                    <DocumentViewCard key={index} label={doc.label} file={doc.file} />
                ))}
            </div>
        </div>
    );
}

function DocumentViewCard({ label, file }) {
    const { t } = useTranslation();

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-[var(--text-color)]">{label}</label>
            <div className="border-2 border-solid rounded-xl p-6 text-center bg-[var(--container-color)] border-[var(--border-color)]">
                {file ? (
                    <div className="flex flex-col items-center">
                        <div className="w-12 h-12 mx-auto mb-3 gradient-bg rounded-full flex items-center justify-center">
                            <FileText className="text-white" size={20} />
                        </div>
                        <p className="text-sm font-medium text-[var(--text-color)] mb-2">{file.name || 'Document.pdf'}</p>
                        <button className="flex items-center gap-2 text-xs text-[var(--accent-color)] hover:underline">
                            <Download size={14} />
                            {t("employees.viewEmployee.download", "Download")}
                        </button>
                    </div>
                ) : (
                    <div>
                        <div className="w-12 h-12 mx-auto mb-3 bg-[var(--border-color)] rounded-full flex items-center justify-center">
                            <FileText className="text-[var(--sub-text-color)]" size={20} />
                        </div>
                        <p className="text-sm text-[var(--sub-text-color)]">
                            {t("employees.viewEmployee.noDocument", "No document uploaded")}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

// Account Access View
function AccountAccessView({ employee }) {
    const { t, i18n } = useTranslation();
    const isArabic = i18n.language === "ar";

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                    <label className="form-label text-[var(--sub-text-color)]">{t("employees.accountAccess.loginCredentials", "Login Credentials")}</label>
                    <div className="form-input-readonly">{employee.username || 'N/A'}</div>
                </div>
                <div className="form-group">
                    <label className="form-label text-[var(--sub-text-color)]">{t("employees.accountAccess.accessLevel", "Access Level")}</label>
                    <div className="form-input-readonly">{employee.accessLevel || 'Standard User'}</div>
                </div>
                <div className="form-group">
                    <label className="form-label text-[var(--sub-text-color)]">{t("employees.accountAccess.permissions", "Permissions")}</label>
                    <div className="form-input-readonly">{employee.permissions || 'Basic Access'}</div>
                </div>
                <div className="form-group">
                    <label className="form-label text-[var(--sub-text-color)]">{t("employees.accountAccess.lastLogin", "Last Login")}</label>
                    <div className="form-input-readonly">{employee.lastLogin || 'Never'}</div>
                </div>
            </div>
        </div>
    );
}