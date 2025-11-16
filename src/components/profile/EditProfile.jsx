import React, { useState } from "react";
import { useMeQuery, useUpdateProfileMutation } from "../../services/apis/AuthApi";
import { Camera, X, Save, User, Phone, Upload } from "lucide-react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";

const EditProfile = ({ onClose }) => {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const { data: user } = useMeQuery();
  const [updateProfile, { isLoading }] = useUpdateProfileMutation();
  const [form, setForm] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    phone: user?.phone || "",
  });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("firstName", form.firstName);
    formData.append("lastName", form.lastName);
    formData.append("phone", form.phone);
    if (image) formData.append("profileImage", image);

    try {
      await updateProfile(formData).unwrap();
      toast.success(isRtl ? "تم تحديث الملف الشخصي بنجاح" : "Profile updated successfully");
      onClose();
    } catch (err) {
      toast.error(isRtl ? "فشل في تحديث الملف الشخصي" : "Failed to update profile");
    }
  };

  return (
    <div 
      className="w-full h-full"
      style={{ 
        backgroundColor: "var(--card-bg)",
        direction: isRtl ? 'rtl' : 'ltr'
      }}
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 sm:p-6 border-b"
        style={{ borderColor: "var(--border-color)" }}
      >
        <h2 className="text-lg sm:text-xl font-bold" style={{ color: "var(--text-color)" }}>
          {isRtl ? 'تعديل الملف الشخصي' : 'Edit Profile'}
        </h2>
        <button
          onClick={onClose}
          className="p-2 rounded-lg transition-colors hover:bg-[var(--hover-color)]"
          style={{ color: "var(--sub-text-color)" }}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
        {/* Profile Image */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <label className="relative cursor-pointer group">
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleImageChange} 
              />
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-[var(--accent-color)] flex items-center justify-center bg-[var(--bg-color)] transition-all duration-300 hover:scale-105">
                {imagePreview ? (
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="w-full h-full object-cover" 
                  />
                ) : user?.profileImage ? (
                  <img 
                    src={`${import.meta.env.VITE_API_URL}${user.profileImage}`} 
                    alt="Current Avatar" 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <div
                    className="w-full h-full rounded-full flex items-center justify-center text-2xl sm:text-3xl font-bold"
                    style={{
                      backgroundColor: "var(--accent-color)",
                      color: "white"
                    }}
                  >
                    {user?.firstName?.[0]?.toUpperCase()}{user?.lastName?.[0]?.toUpperCase()}
                  </div>
                )}
                {/* Overlay */}
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                  <Camera className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
              </div>
            </label>
          </div>
          <div className="text-center">
            <p className="text-xs sm:text-sm font-medium" style={{ color: "var(--sub-text-color)" }}>
              {isRtl ? 'انقر لتغيير صورة الملف الشخصي' : 'Click to change profile picture'}
            </p>
            {image && (
              <p className="text-xs text-green-600 mt-1">
                {isRtl ? 'تم اختيار صورة جديدة' : 'New image selected'}
              </p>
            )}
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          {/* First Name */}
          <div>
            <label 
              className="flex items-center gap-2 mb-2 text-sm font-medium" 
              style={{ color: "var(--text-color)" }}
            >
              <User className="w-4 h-4" style={{ color: "var(--accent-color)" }} />
              {isRtl ? 'الاسم الأول' : 'First Name'}
            </label>
            <input 
              name="firstName" 
              value={form.firstName} 
              onChange={handleChange}
              required
              className="w-full p-3 rounded-xl border transition-all duration-200 focus:border-[var(--accent-color)] focus:ring-2 focus:ring-[var(--accent-color)]/20 outline-none"
              style={{
                backgroundColor: "var(--bg-color)",
                borderColor: "var(--border-color)",
                color: "var(--text-color)"
              }}
              placeholder={isRtl ? 'أدخل الاسم الأول' : 'Enter first name'}
            />
          </div>

          {/* Last Name */}
          <div>
            <label 
              className="flex items-center gap-2 mb-2 text-sm font-medium" 
              style={{ color: "var(--text-color)" }}
            >
              <User className="w-4 h-4" style={{ color: "var(--accent-color)" }} />
              {isRtl ? 'الاسم الأخير' : 'Last Name'}
            </label>
            <input 
              name="lastName" 
              value={form.lastName} 
              onChange={handleChange}
              required
              className="w-full p-3 rounded-xl border transition-all duration-200 focus:border-[var(--accent-color)] focus:ring-2 focus:ring-[var(--accent-color)]/20 outline-none"
              style={{
                backgroundColor: "var(--bg-color)",
                borderColor: "var(--border-color)",
                color: "var(--text-color)"
              }}
              placeholder={isRtl ? 'أدخل الاسم الأخير' : 'Enter last name'}
            />
          </div>


        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[var(--accent-color)] to-[var(--gradient-end)] text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {isRtl ? 'جاري الحفظ...' : 'Saving...'}
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                {isRtl ? 'حفظ التغييرات' : 'Save Changes'}
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 sm:flex-initial px-6 py-3 rounded-xl border font-medium transition-all duration-200 hover:bg-[var(--hover-color)]"
            style={{
              borderColor: "var(--border-color)",
              color: "var(--text-color)",
              backgroundColor: "var(--bg-color)"
            }}
          >
            {isRtl ? 'إلغاء' : 'Cancel'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProfile;