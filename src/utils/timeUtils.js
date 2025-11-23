/**
 * Utility functions for handling UTC and local time conversions
 * All times are stored in UTC in the backend and converted to local time for display
 */

/**
 * Get current UTC time as ISO string
 * @returns {string} ISO string of current UTC time
 */
export const getCurrentUtcTime = () => {
  return new Date().toISOString();
};

/**
 * Normalize a UTC ISO string to ensure it is treated as UTC
 * Adds 'Z' suffix if no timezone information is present
 * @param {string} utcIsoString
 * @returns {string|null}
 */
const normalizeUtcIsoString = (utcIsoString) => {
  if (typeof utcIsoString !== "string") return null;
  const trimmed = utcIsoString.trim();
  if (!trimmed) return null;

  const hasTimezone =
    trimmed.endsWith("Z") ||
    /[+-]\d{2}:?\d{2}$/.test(trimmed) ||
    trimmed.match(/[+-]\d{2}$/);

  if (hasTimezone) {
    return trimmed;
  }

  return `${trimmed}Z`;
};

/**
 * Safely parse a UTC ISO string into a Date object
 * @param {string} utcIsoString
 * @returns {Date|null}
 */
const parseUtcDate = (utcIsoString) => {
  if (!utcIsoString) return null;

  const normalized = normalizeUtcIsoString(utcIsoString);
  const date = normalized ? new Date(normalized) : new Date(utcIsoString);

  if (Number.isNaN(date.getTime())) {
    // Final fallback
    const fallbackDate = new Date(utcIsoString);
    return Number.isNaN(fallbackDate.getTime()) ? null : fallbackDate;
  }

  return date;
};

/**
 * Convert UTC ISO string to local time string for display
 * @param {string} utcIsoString - UTC time as ISO string
 * @param {string} locale - Locale string (e.g., 'en-US', 'ar-EG')
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted local time string
 */
export const utcToLocalTime = (utcIsoString, locale = 'en-US', options = {}) => {
  if (!utcIsoString) return "—";
  
  const date = parseUtcDate(utcIsoString);
  if (!date) return "—";
  
  const defaultOptions = {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    ...options
  };
  
  // Debug logging in development
  if (typeof window !== 'undefined' && import.meta.env?.DEV) {
    const normalized = normalizeUtcIsoString(utcIsoString);

  }
  
  return date.toLocaleTimeString(locale, defaultOptions);
};

/**
 * Convert UTC ISO string to local date string for display
 * @param {string} utcIsoString - UTC time as ISO string
 * @param {string} locale - Locale string (e.g., 'en-US', 'ar-EG')
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted local date string
 */
export const utcToLocalDate = (utcIsoString, locale = 'en-US', options = {}) => {
  if (!utcIsoString) return "—";
  
  const date = parseUtcDate(utcIsoString);
  if (!date) return "—";
  
  const defaultOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...options
  };
  
  return date.toLocaleDateString(locale, defaultOptions);
};

/**
 * Convert UTC ISO string to local date and time string for display
 * @param {string} utcIsoString - UTC time as ISO string
 * @param {string} locale - Locale string (e.g., 'en-US', 'ar-EG')
 * @returns {string} Formatted local date and time string
 */
export const utcToLocalDateTime = (utcIsoString, locale = 'en-US') => {
  if (!utcIsoString) return "—";
  
  const date = parseUtcDate(utcIsoString);
  if (!date) return "—";
  
  return date.toLocaleString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

/**
 * Calculate duration between two UTC ISO strings
 * @param {string} startUtcIso - Start time as UTC ISO string
 * @param {string} endUtcIso - End time as UTC ISO string (optional, defaults to now)
 * @returns {number} Duration in seconds
 */
export const calculateDurationFromUtc = (startUtcIso, endUtcIso = null) => {
  if (!startUtcIso) return 0;
  
  const start = parseUtcDate(startUtcIso);
  const end = endUtcIso ? parseUtcDate(endUtcIso) : new Date();
  
  if (!start || Number.isNaN(start.getTime())) {
    return 0;
  }

  if (!end || Number.isNaN(end.getTime())) {
    return 0;
  }
  
  return Math.max(0, Math.floor((end.getTime() - start.getTime()) / 1000));
};

/**
 * Check if a UTC date is today in local timezone
 * @param {string} utcIsoString - UTC time as ISO string
 * @returns {boolean} True if the date is today
 */
export const isUtcDateToday = (utcIsoString) => {
  if (!utcIsoString) return false;
  
  const utcDate = parseUtcDate(utcIsoString);
  if (!utcDate) return false;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const localDate = new Date(utcDate);
  localDate.setHours(0, 0, 0, 0);
  
  return localDate.getTime() === today.getTime();
};

/**
 * Get the user's device locale
 * @returns {string} Locale string (e.g., 'en-US', 'ar-EG')
 */
export const getDeviceLocale = () => {
  if (typeof window === 'undefined') return 'en-US';
  
  // Try to get locale from browser
  const browserLocale = navigator.language || navigator.userLanguage || 'en-US';
  
  // Check if Arabic is preferred
  const storedLang = localStorage.getItem('lang');
  if (storedLang === 'ar') {
    return 'ar-EG'; // Arabic (Egypt)
  }
  
  return browserLocale;
};

