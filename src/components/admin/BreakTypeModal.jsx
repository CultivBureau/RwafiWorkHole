import React, { useState, useEffect } from "react";
import { Coffee, X, Clock, Check, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useCreateBreakTypeMutation, useUpdateBreakTypeMutation } from "../../services/apis/BreakApi";

const BreakTypeModal = ({ show, onClose, initialData, isRtl, onSuccess }) => {
  const { t } = useTranslation();
  const [name, setName] = useState(initialData?.name || "");
  const [duration, setDuration] = useState(initialData?.duration || 15);
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
  const [errors, setErrors] = useState({});

  const [createBreakType, { isLoading: isCreating }] = useCreateBreakTypeMutation();
  const [updateBreakType, { isLoading: isUpdating }] = useUpdateBreakTypeMutation();

  useEffect(() => {
    if (show) {
      setName(initialData?.name || "");
      setDuration(initialData?.duration || 15);
      setIsActive(initialData?.isActive ?? true);
      setErrors({});
    }
  }, [show, initialData]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!name.trim()) {
      newErrors.name = isRtl ? "اسم نوع الراحة مطلوب" : "Break type name is required";
    } else if (name.trim().length < 2) {
      newErrors.name = isRtl ? "اسم نوع الراحة يجب أن يكون أكثر من حرفين" : "Break type name must be at least 2 characters";
    }
    
    if (!duration || duration < 1 || duration > 240) {
      newErrors.duration = isRtl ? "المدة يجب أن تكون بين 1 و 240 دقيقة" : "Duration must be between 1 and 240 minutes";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      if (initialData?.id) {
        await updateBreakType({ id: initialData.id, name: name.trim(), duration, isActive }).unwrap();
      } else {
        await createBreakType({ name: name.trim(), duration, isActive }).unwrap();
      }
      onSuccess && onSuccess();
      onClose();
    } catch (err) {
      setErrors({ 
        submit: isRtl ? "فشل في حفظ نوع الراحة" : "Failed to save break type" 
      });
    }
  };

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  if (!show) return null;

  const isLoading = isCreating || isUpdating;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-lg bg-opacity-40 z-50 flex items-center justify-center p-4">
      <div 
        className="w-full max-w-lg transform transition-all duration-300 scale-100"
        style={{ direction: isRtl ? "rtl" : "ltr" }}
      >
        <form
          className="bg-white rounded-2xl shadow-2xl overflow-hidden"
          onSubmit={handleSubmit}
        >
          {/* Header */}
          <div className="relative px-8 pt-8 pb-6 bg-gradient-to-br from-purple-50 to-blue-50 border-b border-gray-100">
            <button
              type="button"
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/80 transition-colors duration-200"
              disabled={isLoading}
            >
              <X size={20} className="text-gray-500" />
            </button>
            
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-2xl gradient-bg shadow-lg">
                <Coffee size={28} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {initialData?.id
                    ? isRtl ? "تعديل نوع الراحة" : "Edit Break Type"
                    : isRtl ? "إضافة نوع راحة جديد" : "Add New Break Type"}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {initialData?.id
                    ? isRtl ? "تعديل معلومات نوع الراحة" : "Modify break type information"
                    : isRtl ? "إنشاء نوع راحة جديد للموظفين" : "Create a new break type for employees"}
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-8 py-6">
            {errors.submit && (
              <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 flex items-center gap-3">
                <AlertCircle size={20} className="text-red-500 flex-shrink-0" />
                <span className="text-sm text-red-700">{errors.submit}</span>
              </div>
            )}

            <div className="space-y-6">
              {/* Name Field */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  {isRtl ? "اسم نوع الراحة" : "Break Type Name"}
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errors.name) {
                        setErrors(prev => ({ ...prev, name: "" }));
                      }
                    }}
                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none ${
                      errors.name 
                        ? "border-red-300 focus:border-red-500 bg-red-50" 
                        : "border-gray-200 focus:border-[#15919b] "
                    }`}
                    placeholder={isRtl ? "مثال: استراحة الغداء" : "e.g., Lunch Break"}
                    disabled={isLoading}
                  />
                  {!errors.name && name && (
                    <Check size={18} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500" />
                  )}
                </div>
                {errors.name && (
                  <p className="text-sm text-red-600 flex items-center gap-2">
                    <AlertCircle size={14} />
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Duration Field */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  {isRtl ? "المدة (دقيقة)" : "Duration (minutes)"}
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                    <Clock size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="number"
                    min={1}
                    max={240}
                    value={duration}
                    onChange={(e) => {
                      setDuration(Number(e.target.value));
                      if (errors.duration) {
                        setErrors(prev => ({ ...prev, duration: "" }));
                      }
                    }}
                    className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none ${
                      errors.duration 
                        ? "border-red-300 focus:border-red-500 bg-red-50" 
                        : "border-gray-200 focus:border-[#15919b] "
                    }`}
                    placeholder={isRtl ? "15" : "15"}
                    disabled={isLoading}
                  />
                </div>
                {errors.duration && (
                  <p className="text-sm text-red-600 flex items-center gap-2">
                    <AlertCircle size={14} />
                    {errors.duration}
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  {isRtl ? "المدة المسموحة: من 1 إلى 240 دقيقة" : "Allowed duration: 1 to 240 minutes"}
                </p>
              </div>

              {/* Active Status */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700">
                  {isRtl ? "حالة النشاط" : "Status"}
                </label>
                <div className="flex items-center gap-3">
                  <label className="relative flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="sr-only"
                      disabled={isLoading}
                    />
                    <div className={`w-12 h-6 rounded-full transition-all duration-200 ${
                      isActive ? 'bg-gradient-to-r from-[#15919b] to-[#09d1c7]' : 'bg-gray-300'
                    }`}>
                      <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ${
                        isActive ? 'translate-x-6' : 'translate-x-0.5'
                      } mt-0.5`}></div>
                    </div>
                    <span className={`ml-3 text-sm font-medium ${isActive ? 'text-gradient-start' : 'text-gray-500'}`}>
                      {isActive ? (isRtl ? "نشط" : "Active") : (isRtl ? "غير نشط" : "Inactive")}
                    </span>
                  </label>
                </div>
                <p className="text-xs text-gray-500">
                  {isRtl ? "تفعيل أو إلغاء تفعيل نوع الراحة للموظفين" : "Enable or disable this break type for employees"}
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 py-6 bg-gray-50 border-t border-gray-100">
            <div className="flex gap-3">
              <button
                type="button"
                className="flex-1 py-3 px-4 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold hover:bg-gray-100 hover:border-gray-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
                onClick={handleClose}
                disabled={isLoading}
              >
                {isRtl ? "إلغاء" : "Cancel"}
              </button>
              <button
                type="submit"
                className={`flex-1 py-3 px-4 rounded-xl font-semibold text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-300 ${
                  isLoading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "gradient-bg hover:shadow-lg hover:-translate-y-0.5 transform active:scale-95"
                }`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {isRtl ? "جارٍ الحفظ..." : "Saving..."}
                  </div>
                ) : (
                  <>
                    {initialData?.id
                      ? isRtl ? "تحديث نوع الراحة" : "Update Break Type"
                      : isRtl ? "إضافة نوع الراحة" : "Add Break Type"}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BreakTypeModal;