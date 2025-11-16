import React, { useState, useEffect } from 'react';
import { useTranslation } from "react-i18next";
import { 
  MapPin, 
  Navigation, 
  CheckCircle, 
  AlertCircle, 
  Map, 
  Target,
  Crosshair,
  Save,
  X,
  RefreshCw,
  Globe,
  Building2,
  MapPinned,
  Link,
  MapIcon
} from 'lucide-react';
import { useSetOfficeLocationMutation } from '../../services/apis/AtteandanceApi';

const SetOfficeLocation = ({ onClose }) => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === "ar";
  
  const [setOfficeLocation, { isLoading, isSuccess, error }] = useSetOfficeLocationMutation();
  
  const [location, setLocation] = useState({
    latitude: '',
    longitude: '',
    address: '',
    name: '',
    radius: 100 // Default radius of 100 meters
  });
  
  const [googleMapsLink, setGoogleMapsLink] = useState('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [linkError, setLinkError] = useState('');

  // Handle Google Maps link input - Updated to handle place links
  const handleGoogleMapsLink = () => {
    if (!googleMapsLink.trim()) {
      setLinkError(isRtl ? 'يرجى إدخال رابط خرائط جوجل' : 'Please enter a Google Maps link');
      return;
    }

    try {
      let lat, lng, placeName = '';

      // Handle Google Maps place links like: https://www.google.com/maps/place/Cultiv+Bureau/@30.099326,31.3487669,18z/...
      if (googleMapsLink.includes('/place/')) {
        // Extract coordinates from @lat,lng pattern
        const coordMatch = googleMapsLink.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
        if (coordMatch) {
          lat = parseFloat(coordMatch[1]);
          lng = parseFloat(coordMatch[2]);
          
          // Extract place name from URL
          const placeMatch = googleMapsLink.match(/\/place\/([^/@]+)/);
          if (placeMatch) {
            placeName = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
          }
        }
      }
      // Handle other Google Maps URL formats
      else if (googleMapsLink.includes('maps.google') || googleMapsLink.includes('goo.gl')) {
        const url = new URL(googleMapsLink);
        
        // Format: https://maps.google.com/maps?q=lat,lng
        const queryParams = url.searchParams;
        const q = queryParams.get('q');
        
        if (q && q.includes(',')) {
          const coords = q.split(',');
          lat = parseFloat(coords[0]);
          lng = parseFloat(coords[1]);
        } else {
          // Try to extract from URL path
          const pathMatch = url.pathname.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
          if (pathMatch) {
            lat = parseFloat(pathMatch[1]);
            lng = parseFloat(pathMatch[2]);
          }
        }
      }

      if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
        setLocation(prev => ({
          ...prev,
          latitude: lat.toString(),
          longitude: lng.toString(),
          address: placeName || `Location from Google Maps (${lat.toFixed(6)}, ${lng.toFixed(6)})`,
          name: placeName || 'Office Location'
        }));
        setLinkError('');
        setGoogleMapsLink('');
      } else {
        setLinkError(isRtl ? 'رابط خرائط جوجل غير صحيح. تأكد من أن الرابط يحتوي على إحداثيات صحيحة' : 'Invalid Google Maps link. Make sure the link contains valid coordinates');
      }
    } catch (error) {
      setLinkError(isRtl ? 'رابط خرائط جوجل غير صحيح' : 'Invalid Google Maps link');
    }
  };

  // Get current location - Enhanced with better error handling
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError(isRtl ? 'المتصفح لا يدعم تحديد الموقع' : 'Browser does not support geolocation');
      return;
    }

    setIsGettingLocation(true);
    setLocationError('');

    // Clear any previous location data
    setLocation(prev => ({
      ...prev,
      latitude: '',
      longitude: '',
      address: '',
      name: ''
    }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        
        // Check if accuracy is reasonable (within 100 meters)
        if (accuracy > 100) {
          setLocationError(isRtl ? 'دقة الموقع منخفضة. يرجى المحاولة مرة أخرى' : 'Location accuracy is low. Please try again');
          setIsGettingLocation(false);
          return;
        }

        setLocation(prev => ({
          ...prev,
          latitude: latitude.toString(),
          longitude: longitude.toString(),
          address: `Current Location (${latitude.toFixed(6)}, ${longitude.toFixed(6)})`,
          name: 'Current Location'
        }));
        setIsGettingLocation(false);
      },
      (error) => {
        setIsGettingLocation(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError(isRtl ? 'تم رفض إذن الموقع. يرجى السماح بالوصول إلى الموقع' : 'Location permission denied. Please allow location access');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError(isRtl ? 'الموقع غير متاح. تأكد من اتصال الإنترنت' : 'Location unavailable. Check your internet connection');
            break;
          case error.TIMEOUT:
            setLocationError(isRtl ? 'انتهت مهلة تحديد الموقع. يرجى المحاولة مرة أخرى' : 'Location request timeout. Please try again');
            break;
          default:
            setLocationError(isRtl ? 'خطأ في تحديد الموقع' : 'Location error');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  };

  // Save office location
  const handleSave = async () => {
    if (!location.latitude || !location.longitude) {
      setLocationError(isRtl ? 'يرجى تحديد موقع المكتب' : 'Please set office location');
      return;
    }

    try {
      await setOfficeLocation({
        latitude: parseFloat(location.latitude),
        longitude: parseFloat(location.longitude),
        address: location.address,
        name: location.name || 'Office Location',
        radius: parseInt(location.radius) || 100
      }).unwrap();
      
      onClose();
    } catch (error) {
      console.error('Error setting office location:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-lg bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-xl">
              <MapPin className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {isRtl ? 'تحديد موقع المكتب' : 'Set Office Location'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {isRtl ? 'حدد موقع المكتب لتتبع الحضور' : 'Set office location for attendance tracking'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Google Maps Link Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Link className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {isRtl ? 'إضافة رابط خرائط جوجل' : 'Add Google Maps Link'}
              </h3>
            </div>
            
            <div className="space-y-3">
              <div>
                <input
                  type="url"
                  value={googleMapsLink}
                  onChange={(e) => {
                    setGoogleMapsLink(e.target.value);
                    setLinkError('');
                  }}
                  placeholder={isRtl ? 'https://www.google.com/maps/place/...' : 'https://www.google.com/maps/place/...'}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
                {linkError && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {linkError}
                  </p>
                )}
              </div>
              
              <button
                onClick={handleGoogleMapsLink}
                disabled={!googleMapsLink.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl transition-colors font-medium"
              >
                <MapIcon className="w-5 h-5" />
                {isRtl ? 'استخراج الإحداثيات من الرابط' : 'Extract Coordinates from Link'}
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">
                {isRtl ? 'أو' : 'OR'}
              </span>
            </div>
          </div>

          {/* Current Location Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Crosshair className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {isRtl ? 'استخدام موقعي الحالي' : 'Use My Current Location'}
              </h3>
            </div>
            
            <button
              onClick={getCurrentLocation}
              disabled={isGettingLocation}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl transition-colors font-medium"
            >
              {isGettingLocation ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <Navigation className="w-5 h-5" />
              )}
              {isGettingLocation 
                ? (isRtl ? 'جاري تحديد الموقع...' : 'Getting location...')
                : (isRtl ? 'تحديد موقعي الحالي' : 'Get My Current Location')
              }
            </button>
            
            {locationError && (
              <p className="text-red-500 text-sm flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {locationError}
              </p>
            )}
          </div>

          {/* Location Details */}
          {(location.latitude && location.longitude) && (
            <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {isRtl ? 'تفاصيل الموقع' : 'Location Details'}
                </h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {isRtl ? 'خط العرض' : 'Latitude'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={location.latitude}
                    onChange={(e) => setLocation(prev => ({ ...prev, latitude: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {isRtl ? 'خط الطول' : 'Longitude'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={location.longitude}
                    onChange={(e) => setLocation(prev => ({ ...prev, longitude: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {isRtl ? 'اسم الموقع' : 'Location Name'}
                </label>
                <input
                  type="text"
                  value={location.name}
                  onChange={(e) => setLocation(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={isRtl ? 'مكتب الشركة الرئيسي' : 'Main Office'}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {isRtl ? 'نطاق المسافة (متر)' : 'Distance Radius (meters)'}
                </label>
                <input
                  type="number"
                  min="10"
                  max="1000"
                  value={location.radius}
                  onChange={(e) => setLocation(prev => ({ ...prev, radius: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {isRtl ? 'المسافة المسموحة من موقع المكتب (10-1000 متر)' : 'Allowed distance from office location (10-1000 meters)'}
                </p>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <p className="text-red-700 dark:text-red-400">
                  {error?.data?.message || (isRtl ? 'حدث خطأ في حفظ الموقع' : 'Error saving location')}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            {isRtl ? 'إلغاء' : 'Cancel'}
          </button>
          <button
            onClick={handleSave}
            disabled={!location.latitude || !location.longitude || isLoading}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl transition-colors font-medium"
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isLoading 
              ? (isRtl ? 'جاري الحفظ...' : 'Saving...')
              : (isRtl ? 'حفظ الموقع' : 'Save Location')
            }
          </button>
        </div>
      </div>
    </div>
  );
};

export default SetOfficeLocation;