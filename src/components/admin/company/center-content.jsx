import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Building2, Calendar, Plus, Eye, Edit2, MoreVertical, X, Check } from 'lucide-react';
import NewFieldPopup from './new-field';

const CenterContent = () => {
    const { t, i18n } = useTranslation();
    const isArabic = i18n.language === "ar";
    const navigate = useNavigate();

    const [companyInfo, setCompanyInfo] = useState({
        name: 'Work Hole',
        status: 'Active',
        startPlanDate: 'Jan 2024',
        endPlanDate: 'Dec 2024'
    });

    const [isEditing, setIsEditing] = useState(false);
    const [editedCompanyInfo, setEditedCompanyInfo] = useState(companyInfo);
    const [isNewFieldPopupOpen, setIsNewFieldPopupOpen] = useState(false);

    // Mock data for custom fields
    const [customFields, setCustomFields] = useState([
        {
            id: 1,
            title: 'Passport Number',
            assignedTo: 'Employee Profile',
            type: 'Text',
            required: true
        },
        {
            id: 2,
            title: 'Passport Number',
            assignedTo: 'Employee Profile',
            type: 'Text',
            required: true
        },
        {
            id: 3,
            title: 'Passport Number',
            assignedTo: 'Employee Profile',
            type: 'Text',
            required: true
        },
        {
            id: 4,
            title: 'National ID',
            assignedTo: 'Employee Profile',
            type: 'Text',
            required: true
        }
    ]);

    // Mock data for departments
    const departments = [
        {
            id: 1,
            name: 'Department Development',
            members: 45,
            teams: 5,
            presentToday: 18,
            avatars: ['/assets/navbar/Avatar.png', '/assets/navbar/Avatar.png', '/assets/navbar/Avatar.png']
        },
        {
            id: 2,
            name: 'Department Development',
            members: 45,
            teams: 5,
            presentToday: 18,
            avatars: ['/assets/navbar/Avatar.png', '/assets/navbar/Avatar.png', '/assets/navbar/Avatar.png']
        },
        {
            id: 3,
            name: 'Department Development',
            members: 45,
            teams: 5,
            presentToday: 18,
            avatars: ['/assets/navbar/Avatar.png', '/assets/navbar/Avatar.png', '/assets/navbar/Avatar.png']
        },
        {
            id: 4,
            name: 'Marketing Department',
            members: 32,
            teams: 4,
            presentToday: 15,
            avatars: ['/assets/navbar/Avatar.png', '/assets/navbar/Avatar.png', '/assets/navbar/Avatar.png']
        }
    ];

    const statusOptions = [t("company.active"), t("company.inactive"), t("company.suspended", "Suspended")];

    const handleEdit = () => {
        setIsEditing(true);
        setEditedCompanyInfo(companyInfo);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setEditedCompanyInfo(companyInfo);
    };

    const handleSave = () => {
        setCompanyInfo(editedCompanyInfo);
        setIsEditing(false);
        console.log('Saving company info:', editedCompanyInfo);
    };

    const handleChange = (field, value) => {
        setEditedCompanyInfo(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSaveNewField = (fieldData) => {
        const newField = {
            id: customFields.length + 1,
            title: fieldData.fieldName,
            assignedTo: fieldData.assignTo,
            type: fieldData.fieldType,
            required: fieldData.requiredField === 'Yes'
        };
        setCustomFields([...customFields, newField]);
    };

    // Navigation handlers
    const handleAddDepartment = () => {
        navigate('/pages/admin/new-department');
    };

    const handleAddUser = () => {
        navigate('/pages/admin/new-employee');
    };

    const handleViewLog = () => {
        navigate('/pages/admin/attendance');
    };

    // Calculate height for exactly 3 rows
    const headerHeight = 45;
    const cardHeight = 85;
    const gapBetweenCards = 10;
    const containerPadding = 32;
    const sideColumnHeight = headerHeight + (cardHeight * 3) + (gapBetweenCards * 2) + containerPadding;

    return (
        <div className="w-full mb-2 items-center justify-center" dir={isArabic ? 'rtl' : 'ltr'}>
            {/* 10 Column Grid Layout: 4 + 3 + 3 */}
            <div className="grid grid-cols-1 lg:grid-cols-10 gap-3">
                {/* First Section - 4 Columns */}
                <div className="lg:col-span-4 flex flex-col gap-3">
                    {/* Three Buttons Row */}
                    <div className="grid grid-cols-1 p-2 rounded-xl sm:grid-cols-3 gap-2 flex-shrink-0" style={{ background: 'var(--bg-all)' }}>
                        {/* Add Department Button */}
                        <button
                            onClick={handleAddDepartment}
                            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border transition-all duration-200 hover:shadow-md"
                            style={{
                                backgroundColor: 'var(--bg-color)',
                                borderColor: 'var(--border-color)',
                                color: 'var(--accent-color)'
                            }}
                        >
                            <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--accent-color)' }}>
                                <Plus className="w-3 h-3 text-white" />
                            </div>
                            <span className="font-medium text-xs">{t('company.addDepartment', 'Add Department')}</span>
                        </button>

                        {/* Add User Button */}
                        <button
                            onClick={handleAddUser}
                            className="flex items-center justify-center gap-1 px-3 py-2 rounded-xl border transition-all duration-200 hover:shadow-md"
                            style={{
                                backgroundColor: 'var(--bg-color)',
                                borderColor: 'var(--border-color)',
                                color: 'var(--accent-color)'
                            }}
                        >
                            <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--accent-color)' }}>
                                <Plus className="w-3 h-3 text-white" />
                            </div>
                            <span className="font-medium text-xs">{t('company.addUser', 'Add User')}</span>
                        </button>

                        {/* View Log Button */}
                        <button
                            onClick={handleViewLog}
                            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border transition-all duration-200 hover:shadow-md"
                            style={{
                                backgroundColor: 'var(--bg-color)',
                                borderColor: 'var(--border-color)',
                                color: 'var(--accent-color)'
                            }}
                        >
                            <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--accent-color)' }}>
                                <Eye className="w-3 h-3 text-white" />
                            </div>
                            <span className="font-medium text-xs">{t('company.viewLog', 'View Log')}</span>
                        </button>
                    </div>

                    {/* Company Info Card - Increased padding */}
                    <div
                        className="rounded-xl h-full border p-6"
                        style={{
                            backgroundColor: 'var(--bg-all)',
                            borderColor: 'var(--border-color)',
                            boxShadow: 'var(--shadow-color)'
                        }}
                    >
                        {/* Header */}
                        <div className={`flex items-center justify-between mb-4 ${isArabic ? 'flex-row-reverse' : ''}`}>
                            <h3 className={`text-sm font-semibold ${isArabic ? 'text-right' : 'text-left'}`} style={{ color: 'var(--sub-text-color)' }}>
                                {t('company.companyInfo', 'Company Info')}
                            </h3>
                            {!isEditing ? (
                                <button
                                    onClick={handleEdit}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-200 hover:opacity-90"
                                    style={{
                                        backgroundColor: 'var(--accent-color)',
                                        color: 'white'
                                    }}
                                >
                                    <Edit2 className="w-3 h-3" />
                                    <span className="text-xs font-medium">{t('company.editCompany', 'Edit Company')}</span>
                                </button>
                            ) : (
                                <div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                                    <button
                                        onClick={handleCancel}
                                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg border transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                                        style={{
                                            borderColor: 'var(--border-color)',
                                            color: 'var(--text-color)'
                                        }}
                                    >
                                        <X className="w-3 h-3" />
                                        <span className="text-xs font-medium">{t('company.cancel', 'Cancel')}</span>
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all duration-200 hover:opacity-90"
                                        style={{
                                            backgroundColor: 'var(--accent-color)',
                                            color: 'white'
                                        }}
                                    >
                                        <Check className="w-3 h-3" />
                                        <span className="text-xs font-medium">{t('company.save', 'Save')}</span>
                                    </button>
                                </div>
                            )}
                        </div>
                        <hr className="border-t py-1 border-gray-300" />

                        {/* Company Info Content */}
                        <div className="space-y-2">
                            {/* Company Name */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={`block text-[10px] font-medium mb-2 ${isArabic ? 'text-right' : 'text-left'}`} style={{ color: 'var(--sub-text-color)' }}>
                                        {t('company.companyName', 'Company Name')}
                                    </label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={editedCompanyInfo.name}
                                            onChange={(e) => handleChange('name', e.target.value)}
                                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border outline-none transition-all text-xs font-medium"
                                            style={{
                                                backgroundColor: 'var(--container-color)',
                                                borderColor: 'var(--accent-color)',
                                                color: 'var(--text-color)'
                                            }}
                                        />
                                    ) : (
                                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border" style={{ borderColor: 'var(--border-color)' }}>
                                            <Building2 className="w-4 h-4" style={{ color: 'var(--accent-color)' }} />
                                            <span className="text-xs font-medium" style={{ color: 'var(--text-color)' }}>
                                                {companyInfo.name}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Status */}
                                <div>
                                    <label className={`block text-[10px] font-medium mb-2 ${isArabic ? 'text-right' : 'text-left'}`} style={{ color: 'var(--sub-text-color)' }}>
                                        {t('company.status', 'Status')}
                                    </label>
                                    {isEditing ? (
                                        <select
                                            value={editedCompanyInfo.status}
                                            onChange={(e) => handleChange('status', e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg border outline-none transition-all text-xs font-medium appearance-none cursor-pointer"
                                            style={{
                                                backgroundColor: 'var(--container-color)',
                                                borderColor: 'var(--accent-color)',
                                                color: 'var(--text-color)'
                                            }}
                                        >
                                            {statusOptions.map((status) => (
                                                <option key={status} value={status === t("company.active") ? "Active" : status === t("company.inactive") ? "Inactive" : "Suspended"}>
                                                    {status}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border" style={{ borderColor: 'var(--border-color)' }}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${companyInfo.status === 'Active' ? 'bg-green-500' : companyInfo.status === 'Inactive' ? 'bg-gray-500' : 'bg-red-500'}`}></div>
                                            <span className="text-xs font-medium" style={{ color: 'var(--text-color)' }}>
                                                {companyInfo.status}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Date Range */}
                            <div className="grid grid-cols-2 gap-4">
                                {/* Start Plan Date */}
                                <div>
                                    <label className={`block text-[10px] font-medium mb-2 ${isArabic ? 'text-right' : 'text-left'}`} style={{ color: 'var(--sub-text-color)' }}>
                                        {t('company.startPlanDate', 'Start Plan Date')}
                                    </label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={editedCompanyInfo.startPlanDate}
                                            onChange={(e) => handleChange('startPlanDate', e.target.value)}
                                            placeholder="MMM YYYY"
                                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border outline-none transition-all text-xs font-medium"
                                            style={{
                                                backgroundColor: 'var(--container-color)',
                                                borderColor: 'var(--accent-color)',
                                                color: 'var(--text-color)'
                                            }}
                                        />
                                    ) : (
                                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border" style={{ borderColor: 'var(--border-color)' }}>
                                            <Calendar className="w-4 h-4" style={{ color: 'var(--accent-color)' }} />
                                            <span className="text-xs font-medium" style={{ color: 'var(--text-color)' }}>
                                                {companyInfo.startPlanDate}
                                            </span>
                                            <Calendar className="w-3 h-3 ml-auto" style={{ color: 'var(--sub-text-color)' }} />
                                        </div>
                                    )}
                                </div>

                                {/* End Plan Date */}
                                <div>
                                    <label className={`block text-[10px] font-medium mb-2 ${isArabic ? 'text-right' : 'text-left'}`} style={{ color: 'var(--sub-text-color)' }}>
                                        {t('company.endPlanDate', 'End Plan Date')}
                                    </label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={editedCompanyInfo.endPlanDate}
                                            onChange={(e) => handleChange('endPlanDate', e.target.value)}
                                            placeholder="MMM YYYY"
                                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border outline-none transition-all text-xs font-medium"
                                            style={{
                                                backgroundColor: 'var(--container-color)',
                                                borderColor: 'var(--accent-color)',
                                                color: 'var(--text-color)'
                                            }}
                                        />
                                    ) : (
                                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border" style={{ borderColor: 'var(--border-color)' }}>
                                            <Calendar className="w-4 h-4" style={{ color: 'var(--accent-color)' }} />
                                            <span className="text-xs font-medium" style={{ color: 'var(--text-color)' }}>
                                                {companyInfo.endPlanDate}
                                            </span>
                                            <Calendar className="w-3 h-3 ml-auto" style={{ color: 'var(--sub-text-color)' }} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Second Section - Custom Fields - 3 Columns */}
                <div className="lg:col-span-3">
                    <div
                        className="rounded-xl border p-4 flex flex-col"
                        style={{
                            backgroundColor: 'var(--bg-color)',
                            borderColor: 'var(--border-color)',
                            boxShadow: 'var(--shadow-color)',
                            height: `${sideColumnHeight}px`
                        }}
                    >
                        {/* Header */}
                        <div className={`flex items-center justify-between mb-2.5 flex-shrink-0 ${isArabic ? 'flex-row-reverse' : ''}`}>
                            <h3 className={`text-sm font-semibold ${isArabic ? 'text-right' : 'text-left'}`} style={{ color: 'var(--text-color)' }}>
                                {t('company.customFields.title', 'Custom Fields')}
                            </h3>
                            <button
                                onClick={() => setIsNewFieldPopupOpen(true)}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg"
                                style={{
                                    backgroundColor: 'var(--accent-color)',
                                    color: 'white'
                                }}
                            >
                                <Plus className="w-3 h-3" />
                                <span className="text-[10px] font-medium">{t('company.addField', 'Add Field')}</span>
                            </button>
                        </div>

                        {/* Custom Fields List - Exactly 3 rows visible, then scroll */}
                        <div className="overflow-y-auto flex-1" style={{ minHeight: 0 }}>
                            <div className="space-y-2.5">
                                {customFields.map((field) => (
                                    <div
                                        key={field.id}
                                        className="p-2.5 rounded-lg border"
                                        style={{
                                            backgroundColor: 'var(--bg-all)',
                                            borderColor: 'var(--border-color)',
                                            minHeight: `${cardHeight}px`
                                        }}
                                    >
                                        <div className={`flex items-start justify-between mb-1.5 ${isArabic ? 'flex-row-reverse' : ''}`}>
                                            <h4 className="text-xs font-semibold" style={{ color: 'var(--text-color)' }}>
                                                {field.title}
                                            </h4>
                                            <button className="gradient-text ">
                                                <span className="text-[10px] font-medium">{t('company.edit', 'Edit')}</span>
                                            </button>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[10px]" style={{ color: 'var(--sub-text-color)' }}>
                                                <span className="font-medium">{t('company.assignTo', 'Assigned To')}:</span> {field.assignedTo}
                                            </p>
                                            <p className="text-[10px]" style={{ color: 'var(--sub-text-color)' }}>
                                                <span className="font-medium">{t('company.type', 'Type')}:</span> {field.type} | <span className="font-medium">{t('company.required', 'Required')}:</span> {field.required ? t('company.customFields.requiredOptions.yes', 'Yes') : t('company.customFields.requiredOptions.no', 'No')}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Third Section - Departments Overview - 3 Columns */}
                <div className="lg:col-span-3">
                    <div
                        className="rounded-xl border p-4 flex flex-col"
                        style={{
                            backgroundColor: 'var(--bg-color)',
                            borderColor: 'var(--border-color)',
                            boxShadow: 'var(--shadow-color)',
                            height: `${sideColumnHeight}px`
                        }}
                    >
                        {/* Header */}
                        <div className={`flex items-center justify-between mb-2.5 flex-shrink-0 ${isArabic ? 'flex-row-reverse' : ''}`}>
                            <h3 className={`text-sm font-semibold ${isArabic ? 'text-right' : 'text-left'}`} style={{ color: 'var(--text-color)' }}>
                                {t('company.departmentsOverview', 'Departments Overview')}
                            </h3>
                            <button className="p-1">
                                <MoreVertical className="w-4 h-4" style={{ color: 'var(--sub-text-color)' }} />
                            </button>
                        </div>

                        {/* Departments List - Exactly 3 rows visible, then scroll */}
                        <div className="overflow-y-auto flex-1" style={{ minHeight: 0 }}>
                            <div className="space-y-2.5">
                                {departments.map((dept) => (
                                    <div
                                        key={dept.id}
                                        className="p-2.5 rounded-lg border"
                                        style={{
                                            backgroundColor: 'var(--bg-all)',
                                            borderColor: 'var(--border-color)',
                                            minHeight: `${cardHeight}px`
                                        }}
                                    >
                                        <div className={`flex items-start justify-between mb-1.5 ${isArabic ? 'flex-row-reverse' : ''}`}>
                                            <h4 className="text-xs font-semibold" style={{ color: 'var(--text-color)' }}>
                                                {dept.name}
                                            </h4>
                                            <button className="gradient-text ">
                                                <span className="text-[10px] font-medium">{t('company.viewAll', 'View All')}</span>
                                            </button>
                                        </div>

                                        <div className="space-y-1 mb-1.5">
                                            <p className="text-[10px]" style={{ color: 'var(--sub-text-color)' }}>
                                                <span className="font-medium">{dept.members}</span> {t('company.departments.members', 'Members')}
                                            </p>
                                            <div className={`flex items-center gap-1.5 ${isArabic ? 'flex-row-reverse' : ''}`}>
                                                <span className="text-[10px] font-medium" style={{ color: 'var(--sub-text-color)' }}>
                                                    {t('company.departments.teams', 'Teams')}: {dept.teams}
                                                </span>
                                                <span className="mx-1" style={{ color: 'var(--sub-text-color)' }}>|</span>
                                                <span className="text-[10px] font-medium" style={{ color: 'var(--sub-text-color)' }}>
                                                    {t('company.departments.presentToday', 'Present Today')}: {dept.presentToday}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Avatars */}
                                        <div className={`flex items-center ${isArabic ? 'flex-row-reverse' : ''}`}>
                                            {dept.avatars.map((avatar, idx) => (
                                                <img
                                                    key={idx}
                                                    src={avatar}
                                                    alt={`Member ${idx + 1}`}
                                                    className={`w-6 h-6 rounded-full border-2 border-white object-cover ${idx > 0 ? (isArabic ? 'mr-[-6px]' : 'ml-[-6px]') : ''}`}
                                                />
                                            ))}
                                            {dept.members > 3 && (
                                                <div
                                                    className={`w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-medium ${isArabic ? 'mr-[-6px]' : 'ml-[-6px]'}`}
                                                    style={{
                                                        backgroundColor: 'var(--accent-color)',
                                                        color: 'white'
                                                    }}
                                                >
                                                    +{dept.members - 3}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* New Field Popup */}
            <NewFieldPopup
                isOpen={isNewFieldPopupOpen}
                onClose={() => setIsNewFieldPopupOpen(false)}
                onSave={handleSaveNewField}
            />
        </div>
    );
};

export default CenterContent;