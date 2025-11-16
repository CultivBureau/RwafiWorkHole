import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCreateBreakMutation, useUpdateBreakMutation } from '../../../services/apis/BreakApi';
import { getCompanyId } from '../../../utils/page';
import toast from 'react-hot-toast';

const BreakForm = ({ isOpen, onClose, breakData }) => {
    const { t, i18n } = useTranslation();
    const isArabic = i18n.language === "ar";
    const isEditMode = !!breakData;

    const [createBreak, { isLoading: isCreating }] = useCreateBreakMutation();
    const [updateBreak, { isLoading: isUpdating }] = useUpdateBreakMutation();

    const [formData, setFormData] = useState({
        name: '',
        duration: 0,
        companyId: ''
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        const companyId = getCompanyId();
        if (isEditMode && breakData) {
            setFormData({
                name: breakData.name || '',
                duration: breakData.duration || 0,
                companyId: breakData.companyId || companyId || ''
            });
        } else {
            setFormData({
                name: '',
                duration: 0,
                companyId: companyId || ''
            });
        }
        setErrors({});
    }, [breakData, isEditMode]);

    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.name.trim()) {
            newErrors.name = t('breaks.validation.nameRequired') || 'Break name is required';
        }

        if (formData.duration <= 0) {
            newErrors.duration = t('breaks.validation.durationRequired') || 'Duration must be greater than 0';
        }

        if (!formData.companyId) {
            newErrors.companyId = t('breaks.validation.companyIdRequired') || 'Company ID is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            if (isEditMode) {
                await updateBreak({
                    id: breakData.id,
                    ...formData
                }).unwrap();
                toast.success(t('breaks.updateSuccess') || 'Break updated successfully');
            } else {
                await createBreak(formData).unwrap();
                toast.success(t('breaks.createSuccess') || 'Break created successfully');
            }
            onClose();
        } catch (error) {
            toast.error(error?.data?.errorMessage || t('breaks.errors.saveFailed') || 'Failed to save break');
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'duration' ? parseInt(value) || 0 : value
        }));
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    if (!isOpen) return null;

    const isSubmitting = isCreating || isUpdating;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-[var(--bg-color)] rounded-lg border border-[var(--border-color)] w-full max-w-md max-h-[90vh] flex flex-col"
                style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
                {/* Header */}
                <div className={`flex items-center justify-between p-4 border-b border-[var(--border-color)] ${isArabic ? 'flex-row-reverse' : ''}`}>
                    <h2 className={`text-lg font-semibold text-[var(--text-color)] ${isArabic ? 'text-right' : 'text-left'}`} dir={isArabic ? 'rtl' : 'ltr'}>
                        {isEditMode ? (t('breaks.editTitle') || 'Edit Break') : (t('breaks.createTitle') || 'Create Break')}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-[var(--hover-color)] rounded-lg transition-colors"
                        aria-label={t('breaks.cancel') || 'Close'}
                    >
                        <X className="w-5 h-5 text-[var(--sub-text-color)]" />
                    </button>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Name Field */}
                    <div>
                        <label 
                            className={`block text-sm font-medium text-[var(--text-color)] mb-2 ${isArabic ? 'text-right' : 'text-left'}`}
                            dir={isArabic ? 'rtl' : 'ltr'}
                        >
                            {t('breaks.form.name') || 'Break Name'}
                            <span className="text-red-500 ml-1">*</span>
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 border rounded-lg bg-[var(--input-bg)] text-[var(--text-color)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] focus:border-[var(--accent-color)] ${errors.name ? 'border-red-500' : 'border-[var(--border-color)]'}`}
                            placeholder={t('breaks.form.namePlaceholder') || 'Enter break name'}
                            dir={isArabic ? 'rtl' : 'ltr'}
                        />
                        {errors.name && (
                            <p className={`text-red-500 text-xs mt-1 ${isArabic ? 'text-right' : 'text-left'}`} dir={isArabic ? 'rtl' : 'ltr'}>
                                {errors.name}
                            </p>
                        )}
                    </div>

                    {/* Duration Field */}
                    <div>
                        <label 
                            className={`block text-sm font-medium text-[var(--text-color)] mb-2 ${isArabic ? 'text-right' : 'text-left'}`}
                            dir={isArabic ? 'rtl' : 'ltr'}
                        >
                            {t('breaks.form.duration') || 'Duration (minutes)'}
                            <span className="text-red-500 ml-1">*</span>
                        </label>
                        <input
                            type="number"
                            name="duration"
                            value={formData.duration}
                            onChange={handleChange}
                            min="1"
                            className={`w-full px-3 py-2 border rounded-lg bg-[var(--input-bg)] text-[var(--text-color)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] focus:border-[var(--accent-color)] ${errors.duration ? 'border-red-500' : 'border-[var(--border-color)]'}`}
                            placeholder={t('breaks.form.durationPlaceholder') || 'Enter duration in minutes'}
                            dir={isArabic ? 'rtl' : 'ltr'}
                        />
                        {errors.duration && (
                            <p className={`text-red-500 text-xs mt-1 ${isArabic ? 'text-right' : 'text-left'}`} dir={isArabic ? 'rtl' : 'ltr'}>
                                {errors.duration}
                            </p>
                        )}
                    </div>
                </form>

                {/* Footer */}
                <div className="border-t border-[var(--border-color)] p-4 bg-[var(--bg-color)]">
                    <div className={`flex gap-3 ${isArabic ? 'flex-row-reverse' : ''}`}>
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 border border-[var(--border-color)] text-[var(--text-color)] rounded-lg font-medium hover:bg-[var(--hover-color)] transition-colors"
                        >
                            {t('breaks.cancel') || 'Cancel'}
                        </button>
                        <button
                            type="submit"
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[var(--accent-color)] text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed ${isArabic ? 'flex-row-reverse' : ''}`}
                        >
                            <Check className="w-4 h-4" />
                            {isSubmitting ? (t('common.saving') || 'Saving...') : (isEditMode ? (t('breaks.save') || 'Save') : (t('breaks.create') || 'Create'))}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BreakForm;

