import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';

const NewFieldPopup = ({ isOpen, onClose, onSave }) => {
    const { t, i18n } = useTranslation();
    const isArabic = i18n.language === "ar";

    const [fieldData, setFieldData] = useState({
        fieldName: '',
        fieldType: '',
        assignTo: '',
        requiredField: ''
    });

    const fieldTypes = [
        t('company.customFields.fieldTypes.text'),
        t('company.customFields.fieldTypes.number'),
        t('company.customFields.fieldTypes.date'),
        t('company.customFields.fieldTypes.email'),
        t('company.customFields.fieldTypes.phone'),
        t('company.customFields.fieldTypes.dropdown'),
        t('company.customFields.fieldTypes.checkbox')
    ];
    const assignToOptions = [
        t('company.customFields.assignToOptions.employeeProfile'),
        t('company.customFields.assignToOptions.department'),
        t('company.customFields.assignToOptions.team'),
        t('company.customFields.assignToOptions.project')
    ];
    const requiredOptions = [
        t('company.customFields.requiredOptions.yes'),
        t('company.customFields.requiredOptions.no')
    ];

    const handleChange = (field, value) => {
        setFieldData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleApprove = () => {
        if (fieldData.fieldName && fieldData.fieldType && fieldData.assignTo && fieldData.requiredField) {
            onSave(fieldData);
            handleClose();
        }
    };

    const handleClose = () => {
        setFieldData({
            fieldName: '',
            fieldType: '',
            assignTo: '',
            requiredField: ''
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/20 backdrop-blur-lg z-40 transition-opacity"
                onClick={handleClose}
            />

            {/* Popup */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div
                    className="rounded-2xl shadow-2xl w-full max-w-2xl"
                    style={{
                        backgroundColor: 'var(--bg-color)',
                        border: '1px solid var(--border-color)'
                    }}
                    dir={isArabic ? 'rtl' : 'ltr'}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="p-6 border-b" style={{ borderColor: 'var(--border-color)' }}>
                        <div className={`flex items-center justify-between ${isArabic ? 'flex-row-reverse' : ''}`}>
                            <h2 className="text-lg font-semibold" style={{ color: 'var(--text-color)' }}>
                                {t('company.addNewField', 'Add New Field')}
                            </h2>
                            <button
                                onClick={handleClose}
                                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                style={{ color: 'var(--sub-text-color)' }}
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Field Name */}
                            <div>
                                <label
                                    className={`block text-sm font-medium mb-2 ${isArabic ? 'text-right' : 'text-left'}`}
                                    style={{ color: 'var(--sub-text-color)' }}
                                >
                                    {t('company.fieldName', 'Field Name')}
                                </label>
                                <input
                                    type="text"
                                    value={fieldData.fieldName}
                                    onChange={(e) => handleChange('fieldName', e.target.value)}
                                    placeholder={t('company.fieldNamePlaceholder', 'Field Name')}
                                    className="w-full px-4 py-2.5 rounded-lg border outline-none transition-all text-sm"
                                    style={{
                                        backgroundColor: 'var(--container-color)',
                                        borderColor: 'var(--border-color)',
                                        color: 'var(--text-color)'
                                    }}
                                />
                            </div>

                            {/* Field Type */}
                            <div>
                                <label
                                    className={`block text-sm font-medium mb-2 ${isArabic ? 'text-right' : 'text-left'}`}
                                    style={{ color: 'var(--sub-text-color)' }}
                                >
                                    {t('company.fieldType', 'Field Type')}
                                </label>
                                <select
                                    value={fieldData.fieldType}
                                    onChange={(e) => handleChange('fieldType', e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-lg border outline-none transition-all text-sm appearance-none cursor-pointer"
                                    style={{
                                        backgroundColor: 'var(--container-color)',
                                        borderColor: 'var(--border-color)',
                                        color: fieldData.fieldType ? 'var(--text-color)' : 'var(--sub-text-color)'
                                    }}
                                >
                                    <option value="" disabled>
                                        {t('company.fieldTypePlaceholder', 'Field Type')}
                                    </option>
                                    {fieldTypes.map((type, index) => {
                                        const originalTypes = ['Text', 'Number', 'Date', 'Email', 'Phone', 'Dropdown', 'Checkbox'];
                                        return (
                                            <option key={type} value={originalTypes[index]}>
                                                {type}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>

                            {/* Assign To */}
                            <div>
                                <label
                                    className={`block text-sm font-medium mb-2 ${isArabic ? 'text-right' : 'text-left'}`}
                                    style={{ color: 'var(--sub-text-color)' }}
                                >
                                    {t('company.assignTo', 'Assign To')}
                                </label>
                                <select
                                    value={fieldData.assignTo}
                                    onChange={(e) => handleChange('assignTo', e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-lg border outline-none transition-all text-sm appearance-none cursor-pointer"
                                    style={{
                                        backgroundColor: 'var(--container-color)',
                                        borderColor: 'var(--border-color)',
                                        color: fieldData.assignTo ? 'var(--text-color)' : 'var(--sub-text-color)'
                                    }}
                                >
                                    <option value="" disabled>
                                        {t('company.assignToPlaceholder', 'Assign To')}
                                    </option>
                                    {assignToOptions.map((option, index) => {
                                        const originalOptions = ['Employee Profile', 'Department', 'Team', 'Project'];
                                        return (
                                            <option key={option} value={originalOptions[index]}>
                                                {option}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>

                            {/* Required Field */}
                            <div>
                                <label
                                    className={`block text-sm font-medium mb-2 ${isArabic ? 'text-right' : 'text-left'}`}
                                    style={{ color: 'var(--sub-text-color)' }}
                                >
                                    {t('company.requiredField', 'Required Field')}
                                </label>
                                <select
                                    value={fieldData.requiredField}
                                    onChange={(e) => handleChange('requiredField', e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-lg border outline-none transition-all text-sm appearance-none cursor-pointer"
                                    style={{
                                        backgroundColor: 'var(--container-color)',
                                        borderColor: 'var(--border-color)',
                                        color: fieldData.requiredField ? 'var(--text-color)' : 'var(--sub-text-color)'
                                    }}
                                >
                                    <option value="" disabled>
                                        {t('company.requiredFieldPlaceholder', 'Required Field')}
                                    </option>
                                    {requiredOptions.map((option, index) => {
                                        const originalOptions = ['Yes', 'No'];
                                        return (
                                            <option key={option} value={originalOptions[index]}>
                                                {option}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t" style={{ borderColor: 'var(--border-color)' }}>
                        <div className={`flex items-center gap-3 ${isArabic ? 'flex-row-reverse' : 'justify-end'}`}>
                            <button
                                onClick={handleClose}
                                className="px-6 py-2 rounded-lg border font-medium text-sm transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                                style={{
                                    borderColor: 'var(--border-color)',
                                    color: 'var(--text-color)'
                                }}
                            >
                                {t('company.reject', 'Reject')}
                            </button>
                            <button
                                onClick={handleApprove}
                                className="px-6 py-2 rounded-lg font-medium text-sm text-white transition-all duration-200 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{
                                    backgroundColor: 'var(--accent-color)'
                                }}
                                disabled={!fieldData.fieldName || !fieldData.fieldType || !fieldData.assignTo || !fieldData.requiredField}
                            >
                                {t('company.approve', 'Approve')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default NewFieldPopup;