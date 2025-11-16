import React, { useState, useEffect, useCallback } from "react";
import { X, MapPin, AlertCircle, CheckCircle2, Loader2, Navigation } from "lucide-react";
import { useTranslation } from "react-i18next";
import { extractLatLngFromUrl } from "../../../utils/locationUtils";

const LocationInputModal = ({ isOpen, onClose, onConfirm, isArabic }) => {
  const { t } = useTranslation();
  const [url, setUrl] = useState("");
  const [extractedCoords, setExtractedCoords] = useState(null);
  const [error, setError] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [showManualFallback, setShowManualFallback] = useState(false); // Show manual input only as fallback

  const handleExtract = () => {
    setError("");
    setExtractedCoords(null);
    
    if (!url.trim()) {
      setError(isArabic ? "الرجاء إدخال رابط Google Maps" : "Please enter a Google Maps URL");
      return;
    }

    setIsExtracting(true);
    
    // Small delay to show loading state
    setTimeout(() => {
      const coords = extractLatLngFromUrl(url);
      
      if (coords) {
        setExtractedCoords(coords);
        setError("");
      } else {
        setError(
          isArabic
            ? "رابط غير صحيح. الرجاء التأكد من نسخ رابط Google Maps بشكل صحيح"
            : "Invalid URL. Please make sure you copied the Google Maps URL correctly"
        );
        setExtractedCoords(null);
      }
      
      setIsExtracting(false);
    }, 300);
  };

  const handleConfirm = () => {
    if (extractedCoords) {
      onConfirm(extractedCoords);
      handleClose();
    }
  };

  // Get current location using browser Geolocation API
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError(
        isArabic
          ? "المتصفح لا يدعم تحديد الموقع. يرجى استخدام الإدخال اليدوي"
          : "Browser does not support geolocation. Please use manual input"
      );
      setShowManualFallback(true);
      return;
    }

    setIsGettingLocation(true);
    setError("");
    setExtractedCoords(null);
    setShowManualFallback(false);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsGettingLocation(false);
        const { latitude, longitude, accuracy } = position.coords;
        
        setExtractedCoords({
          lat: latitude,
          lng: longitude,
          accuracy: accuracy
        });
        setError("");
        setShowManualFallback(false);
      },
      (error) => {
        setIsGettingLocation(false);
        console.error("Location error:", error);
        
        let errorMessage = isArabic
          ? "فشل في الحصول على الموقع. يرجى المحاولة مرة أخرى أو استخدام الإدخال اليدوي"
          : "Failed to get location. Please try again or use manual input";
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = isArabic
              ? "تم رفض إذن الموقع. يرجى السماح بالوصول إلى الموقع أو استخدام الإدخال اليدوي"
              : "Location permission denied. Please allow location access or use manual input";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = isArabic
              ? "الموقع غير متاح. يرجى استخدام الإدخال اليدوي"
              : "Location unavailable. Please use manual input";
            break;
          case error.TIMEOUT:
            errorMessage = isArabic
              ? "انتهت مهلة تحديد الموقع. يرجى المحاولة مرة أخرى أو استخدام الإدخال اليدوي"
              : "Location request timeout. Please try again or use manual input";
            break;
        }
        
        setError(errorMessage);
        setShowManualFallback(true); // Show manual input as fallback
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }, [isArabic]);

  // Automatically get location when modal opens
  useEffect(() => {
    if (isOpen) {
      getCurrentLocation();
    }
  }, [isOpen, getCurrentLocation]);

  const handleClose = () => {
    setUrl("");
    setExtractedCoords(null);
    setError("");
    setIsGettingLocation(false);
    setShowManualFallback(false); // Reset for next time
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop with blur */}
      <div 
        className="fixed inset-0 z-[9998] bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
        <div
          className={`pointer-events-auto bg-[var(--bg-color)] rounded-2xl border border-[var(--border-color)] shadow-2xl w-full max-w-md animate-popup-scale ${
            isArabic ? "rtl" : "ltr"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[var(--accent-color)]/10 rounded-lg">
              <MapPin className="w-5 h-5 text-[var(--accent-color)]" />
            </div>
            <h3 className="text-lg font-semibold text-[var(--text-color)]">
              {isArabic ? "إدخال الموقع" : "Enter Location"}
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-[var(--hover-color)] rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-[var(--sub-text-color)]" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Auto Location Status */}
          {isGettingLocation && (
            <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <Loader2 className="w-5 h-5 text-blue-500 animate-spin flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  {isArabic ? "جاري الحصول على موقعك تلقائياً..." : "Getting your location automatically..."}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  {isArabic ? "يرجى السماح بالوصول إلى موقعك" : "Please allow location access"}
                </p>
              </div>
            </div>
          )}

          {/* Retry button - Show when not loading and no coordinates yet */}
          {!isGettingLocation && !extractedCoords && (
            <div className="flex justify-end">
              <button
                onClick={getCurrentLocation}
                className="px-3 py-1.5 text-sm bg-[var(--container-color)] text-[var(--text-color)] border border-[var(--border-color)] rounded-lg hover:bg-[var(--hover-color)] transition-colors flex items-center gap-2"
              >
                <Navigation className="w-4 h-4" />
                {isArabic ? "إعادة المحاولة" : "Retry"}
              </button>
            </div>
          )}

          {/* Manual Input Section - Only show as fallback when auto fails */}
          {showManualFallback && (
            <>
              {/* Instructions */}
              <div className="bg-[var(--container-color)] p-4 rounded-lg border border-[var(--border-color)]">
                <p className="text-sm text-[var(--text-color)] mb-2">
                  {isArabic
                    ? "كيفية الحصول على رابط الموقع:"
                    : "How to get location URL:"}
                </p>
                <ol className={`text-xs text-[var(--sub-text-color)] space-y-1 ${isArabic ? "list-decimal list-inside" : "list-decimal list-inside"}`}>
                  <li>
                    {isArabic
                      ? "افتح تطبيق Google Maps على هاتفك"
                      : "Open Google Maps app on your phone"}
                  </li>
                  <li>
                    {isArabic
                      ? "اضغط على موقعك الحالي أو ابحث عن موقعك"
                      : "Tap on your current location or search for your location"}
                  </li>
                  <li>
                    {isArabic
                      ? "اضغط على زر المشاركة وانسخ الرابط"
                      : "Tap the share button and copy the link"}
                  </li>
                  <li>
                    {isArabic
                      ? "الصق الرابط في الحقل أدناه"
                      : "Paste the link in the field below"}
                  </li>
                </ol>
              </div>

              {/* URL Input */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-color)] mb-2">
                  {isArabic ? "رابط Google Maps" : "Google Maps URL"}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => {
                      setUrl(e.target.value);
                      setError("");
                      setExtractedCoords(null);
                    }}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleExtract();
                      }
                    }}
                    placeholder={
                      isArabic
                        ? "https://maps.google.com/?q=30.0444,31.2357"
                        : "https://maps.google.com/?q=30.0444,31.2357"
                    }
                    className="flex-1 px-4 py-2 border border-[var(--border-color)] rounded-lg bg-[var(--bg-color)] text-[var(--text-color)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent"
                  />
                  <button
                    onClick={handleExtract}
                    disabled={isExtracting || !url.trim()}
                    className="px-4 py-2 bg-[var(--accent-color)] text-white rounded-lg hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isExtracting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <MapPin className="w-4 h-4" />
                    )}
                    <span className="text-sm">
                      {isArabic ? "استخراج" : "Extract"}
                    </span>
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Extracted Coordinates */}
          {extractedCoords && (
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-700 dark:text-green-300">
                  {isArabic ? "تم الحصول على موقعك تلقائياً" : "Location obtained automatically"}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  {isArabic ? "الإحداثيات:" : "Coordinates:"} {extractedCoords.lat.toFixed(6)}, {extractedCoords.lng.toFixed(6)}
                  {extractedCoords.accuracy && (
                    <span className="ml-2">
                      ({isArabic ? "دقة:" : "Accuracy:"} {Math.round(extractedCoords.accuracy)}m)
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-[var(--border-color)]">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-[var(--text-color)] hover:bg-[var(--hover-color)] rounded-lg transition-colors"
          >
            {isArabic ? "إلغاء" : "Cancel"}
          </button>
          <button
            onClick={handleConfirm}
            disabled={!extractedCoords}
            className="px-4 py-2 bg-[var(--accent-color)] text-white rounded-lg hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isArabic ? "تأكيد" : "Confirm"}
          </button>
        </div>
      </div>
    </div>
    </>
  );
};

export default LocationInputModal;

