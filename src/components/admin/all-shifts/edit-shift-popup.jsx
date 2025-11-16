import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Eye, Edit } from 'lucide-react';
import { useUpdateShiftMutation, useGetShiftByIdQuery } from '../../../services/apis/ShiftApi';
import { getCompanyId } from '../../../utils/page';
import toast from 'react-hot-toast';
import { dayNamesToEnumValues, enumValuesToDayNames } from '../../../utils/workDayUtils';

const EditShiftPopup = ({ isOpen, onClose, shiftId, mode = 'edit', onSave }) => {
    const { t, i18n } = useTranslation();
    const isArabic = i18n.language === "ar";
    const [updateShift, { isLoading: isUpdating }] = useUpdateShiftMutation();
    const isViewMode = mode === 'view';

    // Fetch shift data if shiftId is provided
    const { data: shiftData, isLoading: isLoadingShift } = useGetShiftByIdQuery(shiftId, {
        skip: !shiftId || !isOpen
    });

    const shift = shiftData?.value || shiftData;

    // Days of week matching backend WorkDay enum (Saturday=1, Sunday=2, Monday=3, Tuesday=4, Wednesday=5, Thursday=6, Friday=7)
    const daysOfWeek = [
        { value: 'saturday', label: t('shifts.days.saturday', 'Saturday'), enumValue: 1 },
        { value: 'sunday', label: t('shifts.days.sunday', 'Sunday'), enumValue: 2 },
        { value: 'monday', label: t('shifts.days.monday', 'Monday'), enumValue: 3 },
        { value: 'tuesday', label: t('shifts.days.tuesday', 'Tuesday'), enumValue: 4 },
        { value: 'wednesday', label: t('shifts.days.wednesday', 'Wednesday'), enumValue: 5 },
        { value: 'thursday', label: t('shifts.days.thursday', 'Thursday'), enumValue: 6 },
        { value: 'friday', label: t('shifts.days.friday', 'Friday'), enumValue: 7 },
    ];

    const [formData, setFormData] = useState({
        name: '',
        hasLocation: false,
        latitude: '',
        longitude: '',
        radius: '',
        gracePeriodMinutes: '',
        hasOvertime: false,
        maxOvertime: '',
        startTime: '',
        endTime: '',
        workDays: [],
    });


    // Pre-populate form when shift data is loaded
    useEffect(() => {
        if (shift && isOpen) {
            // Convert workDays from enum values to day names
            // workDays should be an array of enum values (1-7) matching WorkDay enum
            // Saturday=1, Sunday=2, Monday=3, Tuesday=4, Wednesday=5, Thursday=6, Friday=7
            const workDaysNames = enumValuesToDayNames(shift.workDays);
            
            // Convert time from HH:MM:SS to HH:MM for input
            const formatTimeFromHHMMSS = (time) => {
                if (!time) return '';
                // If time is in HH:MM:SS format, remove seconds
                if (time.length === 8) return time.substring(0, 5);
                return time;
            };

            // Convert maxOvertimeMinutes from minutes to hours
            const maxOvertimeHours = shift.maxOvertimeMinutes ? (shift.maxOvertimeMinutes / 60).toFixed(2) : '';

            setFormData({
                name: shift.name || '',
                hasLocation: shift.isLocation === true || shift.isLocation === 1,
                latitude: shift.latitude?.toString() || (shift.latitude === 0 ? '0' : ''),
                longitude: shift.longitude?.toString() || (shift.longitude === 0 ? '0' : ''),
                radius: shift.radiusMeters?.toString() || (shift.radiusMeters === 0 ? '0' : ''),
                gracePeriodMinutes: shift.gracePeriodMinutes?.toString() || (shift.gracePeriodMinutes === 0 ? '0' : ''),
                hasOvertime: shift.overtimeAllowed === true || shift.overtimeAllowed === 1,
                maxOvertime: maxOvertimeHours,
                startTime: formatTimeFromHHMMSS(shift.startTime),
                endTime: formatTimeFromHHMMSS(shift.endTime),
                workDays: workDaysNames,
            });
        } else if (!shift && isOpen) {
            // Reset form when modal opens without shift data
            setFormData({
                name: '',
                hasLocation: false,
                latitude: '',
                longitude: '',
                radius: '',
                gracePeriodMinutes: '',
                hasOvertime: false,
                maxOvertime: '',
                startTime: '',
                endTime: '',
                workDays: [],
            });
        }
    }, [shift, isOpen]);

    const handleChange = (field, value) => {
        if (isViewMode) return; // Don't allow changes in view mode
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleToggleChange = (field) => {
        if (isViewMode) return; // Don't allow changes in view mode
        setFormData(prev => ({
            ...prev,
            [field]: !prev[field],
            // Reset dependent fields when toggling off
            ...(field === 'hasLocation' && prev.hasLocation ? {
                latitude: '',
                longitude: '',
                radius: ''
            } : {}),
            ...(field === 'hasOvertime' && prev.hasOvertime ? {
                maxOvertime: ''
            } : {})
        }));
    };

    const handleDayToggle = (dayValue) => {
        if (isViewMode) return; // Don't allow changes in view mode
        setFormData(prev => ({
            ...prev,
            workDays: prev.workDays.includes(dayValue)
                ? prev.workDays.filter(d => d !== dayValue)
                : [...prev.workDays, dayValue]
        }));
    };

    const handleSubmit = async () => {
        if (isViewMode) return;

        // Validate required fields
        if (!formData.name.trim()) {
            toast.error(t('shifts.validation.nameRequired', 'Shift name is required'));
            return;
        }

        if (formData.hasLocation) {
            if (!formData.latitude || !formData.longitude || !formData.radius) {
                toast.error(t('shifts.validation.locationFieldsRequired', 'Latitude, Longitude, and Radius are required when location is enabled'));
                return;
            }
        }

        if (formData.workDays.length === 0) {
            toast.error(t('shifts.validation.workDaysRequired', 'At least one work day must be selected'));
            return;
        }

        if (!formData.startTime || !formData.endTime) {
            toast.error(t('shifts.validation.timeRequired', 'Start time and end time are required'));
            return;
        }

        // Convert workDays from day names to an array of enum values
        // API expects an array like [1, 2, 3] matching WorkDay enum (Saturday=1, Sunday=2, Monday=3, etc.)
        const workDaysArray = dayNamesToEnumValues(formData.workDays);

        // Format startTime and endTime to HH:MM:SS (add :00 seconds if not present)
        const formatTimeToHHMMSS = (time) => {
            if (!time) return '';
            // If time is already in HH:MM:SS format, return as is
            if (time.length === 8) return time;
            // If time is in HH:MM format, add :00
            if (time.length === 5) return `${time}:00`;
            return time;
        };

        const startTimeFormatted = formatTimeToHHMMSS(formData.startTime);
        const endTimeFormatted = formatTimeToHHMMSS(formData.endTime);

        // Convert maxOvertime from hours to minutes
        const maxOvertimeMinutes = formData.hasOvertime && formData.maxOvertime 
            ? Math.round(parseFloat(formData.maxOvertime) * 60) 
            : 0;

        // Get companyId
        const companyId = getCompanyId();
        if (!companyId) {
            toast.error(t('shifts.validation.companyIdRequired', 'Company ID is required'));
            return;
        }

        // Prepare API payload - send all fields to ensure complete update
        const payload = {
            name: formData.name.trim(),
            latitude: formData.hasLocation && formData.latitude ? parseFloat(formData.latitude) : 0,
            longitude: formData.hasLocation && formData.longitude ? parseFloat(formData.longitude) : 0,
            radiusMeters: formData.hasLocation && formData.radius ? parseFloat(formData.radius) : 0,
            gracePeriodMinutes: formData.gracePeriodMinutes ? parseInt(formData.gracePeriodMinutes) : 0,
            maxOvertimeMinutes: maxOvertimeMinutes,
            startTime: startTimeFormatted,
            endTime: endTimeFormatted,
            workDays: workDaysArray,
            isLocation: formData.hasLocation,
            isFaceRecognition: false,
            isDevice: false,
            overtimeAllowed: formData.hasOvertime,
            companyId: companyId,
        };

        try {
            await updateShift({ id: shiftId, ...payload }).unwrap();
            toast.success(t('shifts.form.updateSuccess', 'Shift updated successfully!'));
            handleClose();
            if (onSave) onSave();
        } catch (error) {
            const errorMessage = error?.data?.errorMessage || error?.data?.message || error?.message || t('shifts.form.updateError', 'Failed to update shift');
            toast.error(errorMessage);
        }
    };

    const handleClose = () => {
        setFormData({
            name: '',
            hasLocation: false,
            latitude: '',
            longitude: '',
            radius: '',
            gracePeriodMinutes: '',
            hasOvertime: false,
            maxOvertime: '',
            startTime: '',
            endTime: '',
            workDays: [],
        });
        onClose();
    };

    if (!isOpen) return null;

    const isLoading = isLoadingShift;

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
                    className="rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
                    style={{
                        backgroundColor: 'var(--bg-color)',
                        border: '1px solid var(--border-color)'
                    }}
                    dir={isArabic ? 'rtl' : 'ltr'}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="p-6 border-b sticky top-0 bg-[var(--bg-color)] z-10" style={{ borderColor: 'var(--border-color)' }}>
                        <div className={`flex items-center justify-between ${isArabic ? 'flex-row-reverse' : ''}`}>
                            <div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                                {isViewMode ? (
                                    <Eye className="w-5 h-5" style={{ color: 'var(--text-color)' }} />
                                ) : (
                                    <Edit className="w-5 h-5" style={{ color: 'var(--text-color)' }} />
                                )}
                                <h2 className="text-xl font-semibold" style={{ color: 'var(--text-color)' }}>
                                    {isViewMode 
                                        ? t('shifts.viewShift.title', 'View Shift Details')
                                        : t('shifts.editShift.title', 'Edit Shift')
                                    }
                                </h2>
                            </div>
                            <button
                                onClick={handleClose}
                                className="p-1 rounded-lg hover:bg-[var(--hover-color)] transition-colors"
                                style={{ color: 'var(--sub-text-color)' }}
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    {isLoading ? (
                        <div className="p-12 text-center">
                            <div className="text-[var(--sub-text-color)]">{t('shifts.loading', 'Loading...')}</div>
                        </div>
                    ) : (
                        <div className="p-6 space-y-6">
                            {/* Shift Name */}
                            <div>
                                <label
                                    className={`block text-sm font-medium mb-2 ${isArabic ? 'text-right' : 'text-left'}`}
                                    style={{ color: 'var(--sub-text-color)' }}
                                >
                                    {t('shifts.form.name', 'Shift Name')} <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => handleChange('name', e.target.value)}
                                    disabled={isViewMode}
                                    placeholder={t('shifts.form.namePlaceholder', 'Enter shift name')}
                                    className="w-full px-4 py-2.5 rounded-lg border outline-none transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    style={{
                                        backgroundColor: isViewMode ? 'var(--container-color)' : 'var(--container-color)',
                                        borderColor: 'var(--border-color)',
                                        color: 'var(--text-color)'
                                    }}
                                />
                            </div>

                            {/* Grace Period Minutes */}
                            <div>
                                <label
                                    className={`block text-sm font-medium mb-2 ${isArabic ? 'text-right' : 'text-left'}`}
                                    style={{ color: 'var(--sub-text-color)' }}
                                >
                                    {t('shifts.form.gracePeriodMinutes', 'Grace Period (minutes)')}
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={formData.gracePeriodMinutes}
                                    onChange={(e) => handleChange('gracePeriodMinutes', e.target.value)}
                                    disabled={isViewMode}
                                    placeholder={t('shifts.form.gracePeriodMinutesPlaceholder', 'Enter grace period in minutes')}
                                    className="w-full px-4 py-2.5 rounded-lg border outline-none transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    style={{
                                        backgroundColor: 'var(--container-color)',
                                        borderColor: 'var(--border-color)',
                                        color: 'var(--text-color)'
                                    }}
                                />
                            </div>

                            {/* Location Toggle */}
                            <div className="flex items-center justify-between p-4 rounded-lg border" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--container-color)' }}>
                                <label className="text-sm font-medium" style={{ color: 'var(--text-color)' }}>
                                    {t('shifts.form.hasLocation', 'Require Location')}
                                </label>
                                {isViewMode ? (
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                        formData.hasLocation ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                    }`}>
                                        {formData.hasLocation ? t('shifts.form.yes', 'Yes') : t('shifts.form.no', 'No')}
                                    </span>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => handleToggleChange('hasLocation')}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                            formData.hasLocation ? 'bg-[var(--accent-color)]' : 'bg-gray-300'
                                        }`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                                formData.hasLocation ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                        />
                                    </button>
                                )}
                            </div>

                            {/* Location Fields (shown when hasLocation is true) */}
                            {formData.hasLocation && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-lg border" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--container-color)' }}>
                                    <div>
                                        <label
                                            className={`block text-sm font-medium mb-2 ${isArabic ? 'text-right' : 'text-left'}`}
                                            style={{ color: 'var(--sub-text-color)' }}
                                        >
                                            {t('shifts.form.latitude', 'Latitude')} <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            step="any"
                                            value={formData.latitude}
                                            onChange={(e) => handleChange('latitude', e.target.value)}
                                            disabled={isViewMode}
                                            placeholder={t('shifts.form.latitudePlaceholder', 'Enter latitude')}
                                            className="w-full px-4 py-2.5 rounded-lg border outline-none transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                            style={{
                                                backgroundColor: 'var(--bg-color)',
                                                borderColor: 'var(--border-color)',
                                                color: 'var(--text-color)'
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <label
                                            className={`block text-sm font-medium mb-2 ${isArabic ? 'text-right' : 'text-left'}`}
                                            style={{ color: 'var(--sub-text-color)' }}
                                        >
                                            {t('shifts.form.longitude', 'Longitude')} <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            step="any"
                                            value={formData.longitude}
                                            onChange={(e) => handleChange('longitude', e.target.value)}
                                            disabled={isViewMode}
                                            placeholder={t('shifts.form.longitudePlaceholder', 'Enter longitude')}
                                            className="w-full px-4 py-2.5 rounded-lg border outline-none transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                            style={{
                                                backgroundColor: 'var(--bg-color)',
                                                borderColor: 'var(--border-color)',
                                                color: 'var(--text-color)'
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <label
                                            className={`block text-sm font-medium mb-2 ${isArabic ? 'text-right' : 'text-left'}`}
                                            style={{ color: 'var(--sub-text-color)' }}
                                        >
                                            {t('shifts.form.radius', 'Radius (meters)')} <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.radius}
                                            onChange={(e) => handleChange('radius', e.target.value)}
                                            disabled={isViewMode}
                                            placeholder={t('shifts.form.radiusPlaceholder', 'Enter radius')}
                                            className="w-full px-4 py-2.5 rounded-lg border outline-none transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                            style={{
                                                backgroundColor: 'var(--bg-color)',
                                                borderColor: 'var(--border-color)',
                                                color: 'var(--text-color)'
                                            }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Overtime Toggle */}
                            <div className="flex items-center justify-between p-4 rounded-lg border" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--container-color)' }}>
                                <label className="text-sm font-medium" style={{ color: 'var(--text-color)' }}>
                                    {t('shifts.form.hasOvertime', 'Enable Overtime')}
                                </label>
                                {isViewMode ? (
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                        formData.hasOvertime ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                    }`}>
                                        {formData.hasOvertime ? t('shifts.form.yes', 'Yes') : t('shifts.form.no', 'No')}
                                    </span>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => handleToggleChange('hasOvertime')}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                            formData.hasOvertime ? 'bg-[var(--accent-color)]' : 'bg-gray-300'
                                        }`}
                                    >
                                        <span
                                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                                formData.hasOvertime ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                        />
                                    </button>
                                )}
                            </div>

                            {/* Start Time and End Time - Always Required */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label
                                        className={`block text-sm font-medium mb-2 ${isArabic ? 'text-right' : 'text-left'}`}
                                        style={{ color: 'var(--sub-text-color)' }}
                                    >
                                        {t('shifts.form.startTime', 'Start Time')} <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="time"
                                        value={formData.startTime}
                                        onChange={(e) => handleChange('startTime', e.target.value)}
                                        disabled={isViewMode}
                                        className="w-full px-4 py-2.5 rounded-lg border outline-none transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                        style={{
                                            backgroundColor: 'var(--container-color)',
                                            borderColor: 'var(--border-color)',
                                            color: 'var(--text-color)'
                                        }}
                                    />
                                </div>
                                <div>
                                    <label
                                        className={`block text-sm font-medium mb-2 ${isArabic ? 'text-right' : 'text-left'}`}
                                        style={{ color: 'var(--sub-text-color)' }}
                                    >
                                        {t('shifts.form.endTime', 'End Time')} <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="time"
                                        value={formData.endTime}
                                        onChange={(e) => handleChange('endTime', e.target.value)}
                                        disabled={isViewMode}
                                        className="w-full px-4 py-2.5 rounded-lg border outline-none transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                        style={{
                                            backgroundColor: 'var(--container-color)',
                                            borderColor: 'var(--border-color)',
                                            color: 'var(--text-color)'
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Overtime Fields (shown when hasOvertime is true) */}
                            {formData.hasOvertime && (
                                <div className="p-4 rounded-lg border" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--container-color)' }}>
                                    <div>
                                        <label
                                            className={`block text-sm font-medium mb-2 ${isArabic ? 'text-right' : 'text-left'}`}
                                            style={{ color: 'var(--sub-text-color)' }}
                                        >
                                            {t('shifts.form.maxOvertime', 'Max Overtime (hours)')} <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            step="0.5"
                                            value={formData.maxOvertime}
                                            onChange={(e) => handleChange('maxOvertime', e.target.value)}
                                            disabled={isViewMode}
                                            placeholder={t('shifts.form.maxOvertimePlaceholder', 'Enter max overtime hours')}
                                            className="w-full px-4 py-2.5 rounded-lg border outline-none transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                            style={{
                                                backgroundColor: 'var(--bg-color)',
                                                borderColor: 'var(--border-color)',
                                                color: 'var(--text-color)'
                                            }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Work Days */}
                            <div>
                                <label
                                    className={`block text-sm font-medium mb-3 ${isArabic ? 'text-right' : 'text-left'}`}
                                    style={{ color: 'var(--sub-text-color)' }}
                                >
                                    {t('shifts.form.workDays', 'Work Days')} <span className="text-red-500">*</span>
                                </label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {daysOfWeek.map((day) => (
                                        <button
                                            key={day.value}
                                            type="button"
                                            onClick={() => handleDayToggle(day.value)}
                                            disabled={isViewMode}
                                            className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                                                formData.workDays.includes(day.value)
                                                    ? 'bg-[var(--accent-color)] text-white border-[var(--accent-color)]'
                                                    : 'bg-[var(--container-color)] border-[var(--border-color)] text-[var(--text-color)] hover:bg-[var(--hover-color)]'
                                            }`}
                                        >
                                            {day.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Footer */}
                    {!isLoading && (
                        <div className="p-6 border-t sticky bottom-0 bg-[var(--bg-color)] z-10" style={{ borderColor: 'var(--border-color)' }}>
                            <div className={`flex items-center gap-3 ${isArabic ? 'flex-row-reverse' : 'justify-end'}`}>
                                <button
                                    onClick={handleClose}
                                    className="px-6 py-2 rounded-lg border font-medium text-sm transition-all duration-200 hover:bg-[var(--hover-color)]"
                                    style={{
                                        borderColor: 'var(--border-color)',
                                        color: 'var(--text-color)'
                                    }}
                                >
                                    {isViewMode ? t('shifts.form.close', 'Close') : t('shifts.form.cancel', 'Cancel')}
                                </button>
                                {!isViewMode && (
                                    <button
                                        onClick={handleSubmit}
                                        disabled={isUpdating}
                                        className="px-6 py-2 rounded-lg font-medium text-sm text-white transition-all duration-200 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                                        style={{
                                            backgroundColor: 'var(--accent-color)'
                                        }}
                                    >
                                        {isUpdating ? t('shifts.form.updating', 'Updating...') : t('shifts.form.update', 'Update Shift')}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default EditShiftPopup;

