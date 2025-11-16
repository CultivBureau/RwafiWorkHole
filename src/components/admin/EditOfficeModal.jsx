import React, { useState, useEffect } from 'react';
import { MapPin, X, Save, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

const EditOfficeModal = ({ office, onClose, onSave }) => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    latitude: '',
    longitude: '',
    radius: 100
  });
  
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (office) {
      setFormData({
        name: office.name || '',
        address: office.address || '',
        latitude: office.latitude.toString(),
        longitude: office.longitude.toString(),
        radius: office.radius || 100
      });
    }
  }, [office]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = isRtl ? 'اسم الفرع مطلوب' : 'Office name is required';
    }
    
    if (!formData.latitude || isNaN(formData.latitude)) {
      newErrors.latitude = isRtl ? 'خط العرض غير صحيح' : 'Invalid latitude';
    }
    
    if (!formData.longitude || isNaN(formData.longitude)) {
      newErrors.longitude = isRtl ? 'خط الطول غير صحيح' : 'Invalid longitude';
    }
    
    if (!formData.radius || formData.radius < 50 || formData.radius > 1000) {
      newErrors.radius = isRtl ? 'النطاق يجب أن يكون بين 50-1000 متر' : 'Radius must be between 50-1000 meters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error(isRtl ? 'يرجى تصحيح الأخطاء' : 'Please fix the errors');
      return;
    }

    setIsLoading(true);
    
    try {
      await onSave({
        name: formData.name.trim(),
        address: formData.address.trim() || undefined,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        radius: parseInt(formData.radius)
      });
      
      toast.success(
        isRtl ? 'تم تحديث الفرع بنجاح' : 'Office updated successfully',
        {
          icon: '✅',
          style: {
            background: 'var(--bg-color)',
            color: 'var(--text-color)',
            border: '1px solid var(--border-color)',
          }
        }
      );
    } catch (error) {
      toast.error(
        isRtl ? 'فشل في تحديث الفرع' : 'Failed to update office',
        {
          icon: '❌',
          style: {
            background: 'var(--bg-color)',
            color: 'var(--text-color)',
            border: '1px solid var(--border-color)',
          }
        }
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-lg bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div 
        className="w-full max-w-md rounded-2xl shadow-2xl transform transition-all duration-300"
        style={{ backgroundColor: 'var(--bg-color)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: 'var(--accent-color)' }}
            >
              <MapPin size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold" style={{ color: 'var(--text-color)' }}>
                {isRtl ? 'تعديل الفرع' : 'Edit Office'}
              </h2>
              <p className="text-sm" style={{ color: 'var(--sub-text-color)' }}>
                {isRtl ? 'تحديث بيانات الفرع' : 'Update office information'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-200"
            style={{ 
              backgroundColor: 'var(--hover-color)',
              '&:hover': { backgroundColor: 'var(--border-color)' }
            }}
          >
            <X size={18} style={{ color: 'var(--sub-text-color)' }} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Office Name */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-color)' }}>
              {isRtl ? 'اسم الفرع' : 'Office Name'} *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${errors.name ? 'border-red-500' : ''}`}
              style={{
                backgroundColor: 'var(--bg-color)',
                borderColor: errors.name ? '#EF4444' : 'var(--border-color)',
                color: 'var(--text-color)',
              }}
              placeholder={isRtl ? 'مثل: الفرع الرئيسي' : 'e.g., Main Branch'}
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                <AlertTriangle size={14} />
                {errors.name}
              </p>
            )}
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-color)' }}>
              {isRtl ? 'العنوان' : 'Address'}
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border transition-all duration-200"
              style={{
                backgroundColor: 'var(--bg-color)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-color)',
              }}
              placeholder={isRtl ? 'العنوان الكامل (اختياري)' : 'Full address (optional)'}
            />
          </div>

          {/* Coordinates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-color)' }}>
                {isRtl ? 'خط العرض' : 'Latitude'} *
              </label>
              <input
                type="number"
                step="any"
                value={formData.latitude}
                onChange={(e) => handleInputChange('latitude', e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${errors.latitude ? 'border-red-500' : ''}`}
                style={{
                  backgroundColor: 'var(--bg-color)',
                  borderColor: errors.latitude ? '#EF4444' : 'var(--border-color)',
                  color: 'var(--text-color)',
                }}
                placeholder="30.0444"
              />
              {errors.latitude && (
                <p className="text-red-500 text-xs mt-1">{errors.latitude}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-color)' }}>
                {isRtl ? 'خط الطول' : 'Longitude'} *
              </label>
              <input
                type="number"
                step="any"
                value={formData.longitude}
                onChange={(e) => handleInputChange('longitude', e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${errors.longitude ? 'border-red-500' : ''}`}
                style={{
                  backgroundColor: 'var(--bg-color)',
                  borderColor: errors.longitude ? '#EF4444' : 'var(--border-color)',
                  color: 'var(--text-color)',
                }}
                placeholder="31.2357"
              />
              {errors.longitude && (
                <p className="text-red-500 text-xs mt-1">{errors.longitude}</p>
              )}
            </div>
          </div>

          {/* Radius */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-color)' }}>
              {isRtl ? 'نطاق التغطية (متر)' : 'Coverage Radius (meters)'} *
            </label>
            <input
              type="number"
              min="50"
              max="1000"
              value={formData.radius}
              onChange={(e) => handleInputChange('radius', e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 ${errors.radius ? 'border-red-500' : ''}`}
              style={{
                backgroundColor: 'var(--bg-color)',
                borderColor: errors.radius ? '#EF4444' : 'var(--border-color)',
                color: 'var(--text-color)',
              }}
              placeholder="100"
            />
            {errors.radius && (
              <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                <AlertTriangle size={14} />
                {errors.radius}
              </p>
            )}
            <p className="text-xs mt-1" style={{ color: 'var(--sub-text-color)' }}>
              {isRtl ? 'المسافة المسموحة للحضور من هذا الموقع' : 'Allowed distance for attendance from this location'}
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl border font-medium transition-all duration-200"
              style={{
                backgroundColor: 'var(--bg-color)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-color)',
              }}
            >
              {isRtl ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-3 rounded-xl text-white font-medium transition-all duration-200 hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
              style={{
                background: 'linear-gradient(135deg, var(--accent-hover) 0%, var(--accent-color) 100%)'
              }}
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  <Save size={16} />
                  {isRtl ? 'حفظ التغييرات' : 'Save Changes'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditOfficeModal;