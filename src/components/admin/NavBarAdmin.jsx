import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  Globe,
  Clock,
  Calendar,
  ChevronDown,
  User,
  LogOut,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
const AvatarIcon = "/assets/navbar/Avatar.png";
import { getAuthToken, getUserInfo, logout } from "../../utils/page";
import { useLang } from "../../contexts/LangContext";
import { useMeQuery } from "../../services/apis/AuthApi";
import {
  useClockInMutation,
  useClockOutMutation,
  useGetUserClockinLogsQuery,
} from "../../services/apis/ClockinLogApi";
import { useHasPermission } from "../../hooks/useHasPermission";

import LocationInputModal from "../Time_Tracking_Components/LocationInputModal/LocationInputModal";
import LateReasonModal from "../Time_Tracking_Components/LateReasonModal/LateReasonModal";
import toast from "react-hot-toast";
import { isUtcDateToday } from "../../utils/timeUtils";

const NavBar = ({ onMobileSidebarToggle, isMobileSidebarOpen }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { lang, setLang, isRtl } = useLang();

  // Check if user is authenticated before making API calls
  const isAuthenticated = !!getAuthToken();

  // Permission checks - user must be able to both clock in and clock out
  const canClockIn = useHasPermission("ClockinLog.Clockin");
  const canClockOut = useHasPermission("ClockinLog.Clockout");
  const canUseClockFeature = canClockIn && canClockOut;
  
  // Get user info from cookies as fallback (available immediately after login)
  const userInfoFromCookie = getUserInfo();
  
  // Fetch user data from /me endpoint
  const { data: meResponse, isLoading: userLoading, error: userError } = useMeQuery(undefined, {
    skip: !isAuthenticated, // Skip API call if not authenticated
  });

  // Extract user data from API response (value wrapper)
  const userData = meResponse?.value || null;
  
  // Extract role name - handle both object format {id, name} and string format
  const firstRole = userData?.roles?.[0];
  const roleName = firstRole 
    ? (typeof firstRole === 'string' ? firstRole : firstRole?.name || '')
    : null;
  
  // Use API data if available, otherwise fallback to cookie data, then loading/guest state
  const user = userData ? {
    id: userData.id,
    firstName: userData.firstName || "",
    lastName: userData.lastName || "",
    userName: userData.userName || "",
    email: userData.email || "",
    jobTitle: userData.jobTitle || "",
    role: roleName || userData.jobTitle || "Employee", // Use first role name or jobTitle
    roles: userData.roles || [],
    profileImage: null, // API response doesn't include profileImage
  } : (userInfoFromCookie ? {
    // Use cookie data as fallback (available immediately after login)
    id: userInfoFromCookie.sub || null,
    firstName: userInfoFromCookie.firstName || "",
    lastName: userInfoFromCookie.lastName || "",
    userName: userInfoFromCookie.unique_name || "",
    email: "",
    jobTitle: userInfoFromCookie.jobTitle || "",
    role: userInfoFromCookie.role || userInfoFromCookie.jobTitle || "Employee",
    roles: [],
    profileImage: null,
  } : (isAuthenticated ? {
    firstName: "Loading...",
    lastName: "",
    role: "",
    profileImage: null
  } : {
    firstName: "Guest",
    lastName: "",
    role: "",
    profileImage: null
  }));

  // Logout function - uses utility function that clears all data and reloads

  // Real API mutations
  const [clockInMutation, { isLoading: isClockingIn }] = useClockInMutation();
  const [clockOutMutation, { isLoading: isClockingOut }] = useClockOutMutation();

  // Use userId from API data or fallback to cookie data
  const userId = userData?.id || userInfoFromCookie?.sub || null;
  const isArabic = lang === "ar";

  const {
    data: userLogsData,
    isLoading: logsLoading,
    isFetching: logsFetching,
    refetch: refetchLogs,
  } = useGetUserClockinLogsQuery(
    { userId, pageNumber: 1, pageSize: 50 },
    { skip: !isAuthenticated || !userId }
  );

  const [langOpen, setLangOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [profileOpen, setProfileOpen] = useState(false); // desktop only
  const [mobileProfileOpen, setMobileProfileOpen] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showLateReasonModal, setShowLateReasonModal] = useState(false);
  const [pendingLocation, setPendingLocation] = useState(null);

  const langRef = useRef(null);
  const profileRef = useRef(null); // desktop only
  const mobileProfileRef = useRef(null);

  const attendanceLogs = useMemo(() => {
    if (!userLogsData) return [];
    const raw =
      userLogsData?.value ||
      userLogsData?.data ||
      userLogsData?.items ||
      userLogsData?.results ||
      userLogsData ||
      [];
    return Array.isArray(raw) ? raw : [];
  }, [userLogsData]);

  const todayLogs = useMemo(
    () =>
      attendanceLogs.filter((log) =>
        isUtcDateToday(log?.clockinTime || log?.clockoutTime)
      ),
    [attendanceLogs]
  );

  const sortedTodayLogs = useMemo(() => {
    return [...todayLogs].sort((a, b) => {
      const getSortValue = (entry) =>
        new Date(entry?.clockinTime || entry?.clockoutTime || 0).getTime();
      return getSortValue(b) - getSortValue(a);
    });
  }, [todayLogs]);

  const activeClockIn = useMemo(
    () => sortedTodayLogs.find((log) => log?.clockinTime && !log?.clockoutTime) || null,
    [sortedTodayLogs]
  );

  const hasCompletedToday = useMemo(
    () =>
      sortedTodayLogs.some(
        (log) => log?.clockinTime && log?.clockoutTime && isUtcDateToday(log.clockinTime)
      ),
    [sortedTodayLogs]
  );

  const currentStatus = activeClockIn ? "Clocked In" : "Clocked Out";

  const refetchDashboard = useCallback(async () => {
    try {
      await refetchLogs();
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn("Failed to refetch attendance logs:", error);
      }
    }
  }, [refetchLogs]);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (langRef.current && !langRef.current.contains(e.target))
        setLangOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target))
        setProfileOpen(false);
      if (mobileProfileRef.current && !mobileProfileRef.current.contains(e.target)) {
        setMobileProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const popSideLang = isRtl ? "left-0" : "right-0";

  // Change language and save to localStorage
  const handleLangChange = (lng) => {
    setLang(lng);
    setLangOpen(false);
  };

  // زرار تسجيل الخروج
  const handleLogout = () => {
    logout(); // This will clear all data and reload page
  };

  // Handle clock in/out with location from Google Maps URL
  const handleClockInOut = async () => {
    // If already completed attendance today, show toast and return
    if (hasCompletedToday) {
      toast(
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-500" />
          <span>{isArabic ? 'لقد سجلت الحضور والانصراف لهذا اليوم بالفعل' : 'You already clocked in today'}</span>
        </div>,
        {
          duration: 3000,
          style: {
            background: '#F0FDF4',
            border: '1px solid #10B981',
            color: '#065F46',
          },
        }
      );
      return;
    }

    // Add confirmation only for clock out
    if (currentStatus === "Clocked In") {
      const confirmClockOut = await new Promise((resolve) => {
        toast((t) => (
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            <div>
              <div className="font-medium text-gray-900">
                {isArabic ? 'هل أنت متأكد من تسجيل الخروج؟' : 'Are you sure you want to clock out?'}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  resolve(true);
                }}
                className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
              >
                {isArabic ? 'نعم' : 'Yes'}
              </button>
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  resolve(false);
                }}
                className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
              >
                {isArabic ? 'لا' : 'No'}
              </button>
            </div>
          </div>
        ), {
          duration: 8000,
          style: {
            background: '#FEF3C7',
            border: '1px solid #F59E0B',
            borderRadius: '12px',
          },
        });
      });

      if (!confirmClockOut) return;
    }

    // Show location input modal
    setShowLocationModal(true);
  };

  // Handle location confirmation from modal
  const handleLocationConfirm = (coords) => {
    setPendingLocation(coords);
    setShowLocationModal(false);
    
    if (currentStatus === "Clocked In") {
      handleClockOutWithLocation(coords);
    } else {
      handleClockInWithLocation(coords, "");
    }
  };

  // Handle clock in with location
  const handleClockInWithLocation = async (coords, reason, isRetry = false) => {
    const loadingToast = !isRetry ? toast.loading(
      isArabic ? 'جاري تسجيل الحضور...' : 'Recording attendance...',
      {
        style: {
          background: 'var(--card-bg)',
          color: 'var(--text-color)',
        },
      }
    ) : null;

    try {
      const result = await clockInMutation({
        latitude: coords.lat,
        longitude: coords.lng,
        reason: reason || ""
      }).unwrap();

      if (loadingToast) toast.dismiss(loadingToast);

      const isLate = result?.value?.isLate || false;

      if (isLate && !reason) {
        setPendingLocation(coords);
        setShowLateReasonModal(true);
        return;
      }

      toast.success(
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5" />
          <span>
            {isLate 
              ? (isArabic ? 'تم تسجيل الحضور المتأخر بنجاح' : 'Successfully clocked in (late)')
              : (isArabic ? 'تم تسجيل الحضور بنجاح' : 'Successfully clocked in')
            }
          </span>
        </div>,
        {
          duration: 3000,
          style: {
            background: '#10B981',
            color: '#fff',
          },
        }
      );

      refetchDashboard();
      setPendingLocation(null);
    } catch (error) {
      console.error('Clock in error:', error);
      console.error('Error details:', {
        status: error?.status,
        statusCode: error?.statusCode,
        data: error?.data,
        errors: error?.data?.errors,
        validationErrors: error?.data?.errors ? Object.entries(error.data.errors).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`).join('; ') : null,
        originalStatus: error?.originalStatus,
        message: error?.message,
        coords: { lat: coords.lat, lng: coords.lng },
        fullError: JSON.stringify(error, null, 2)
      });
      if (loadingToast) toast.dismiss(loadingToast);
      
      // Check if this is a late clock-in error (400 with specific error message)
      const errorMessage = error?.data?.errorMessage || error?.data?.message || error?.data?.error || error?.data?.title || error?.message;
      const isLateError = error?.status === 400 && (
        errorMessage?.toLowerCase().includes('late') || 
        errorMessage?.toLowerCase().includes('reason') ||
        error?.data?.errorMessage?.toLowerCase().includes('late')
      );
      
      // If it's a late error and no reason was provided, show the late reason modal
      if (isLateError && !reason) {
        setPendingLocation(coords);
        setShowLateReasonModal(true);
        return;
      }
      
      // Get error message from API response
      let displayErrorMessage = errorMessage;
      
      // If there are validation errors, format them nicely
      if (error?.data?.errors && typeof error.data.errors === 'object') {
        const validationErrors = Object.entries(error.data.errors)
          .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
          .join('; ');
        if (validationErrors) {
          displayErrorMessage = validationErrors;
        }
      }
      
      if (!displayErrorMessage) {
        displayErrorMessage = isArabic ? 'حدث خطأ في تسجيل الحضور' : 'Error recording attendance';
      }
      
      toast.error(
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <span>{displayErrorMessage}</span>
        </div>,
        {
          duration: 4000,
          style: {
            background: '#EF4444',
            color: '#fff',
          },
        }
      );
    }
  };

  // Handle late reason confirmation
  const handleLateReasonConfirm = async (reason) => {
    setShowLateReasonModal(false);
    if (pendingLocation) {
      await handleClockInWithLocation(pendingLocation, reason, true);
    }
  };

  // Handle clock out with location
  const handleClockOutWithLocation = async (coords) => {
    const isAr = lang === "ar";
    const loadingToast = toast.loading(
      isAr ? 'جاري تسجيل الخروج...' : 'Recording clock out...',
      {
        style: {
          background: 'var(--card-bg)',
          color: 'var(--text-color)',
        },
      }
    );

    try {
      await clockOutMutation({
        latitude: coords.lat,
        longitude: coords.lng
      }).unwrap();

      toast.dismiss(loadingToast);
      toast.success(
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5" />
          <span>{isAr ? 'تم تسجيل الخروج بنجاح' : 'Successfully clocked out'}</span>
        </div>,
        {
          duration: 3000,
          style: {
            background: '#10B981',
            color: '#fff',
          },
        }
      );

      refetchDashboard();
      setPendingLocation(null);
    } catch (error) {
      console.error('Clock out error:', error);
      console.error('Clock out error details:', {
        status: error?.status,
        statusCode: error?.statusCode,
        data: error?.data,
        originalStatus: error?.originalStatus,
        message: error?.message,
        coords: { lat: coords.lat, lng: coords.lng },
        fullError: JSON.stringify(error, null, 2)
      });
      toast.dismiss(loadingToast);
      
      // Get error message from API response - try multiple possible locations
      const errorMessage = 
        error?.data?.message || 
        error?.data?.error || 
        error?.data?.title ||
        error?.data?.errors?.join?.(' ') ||
        error?.message || 
        (isAr ? 'حدث خطأ في تسجيل الخروج' : 'Error recording clock out');
      
      toast.error(
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <span>{errorMessage}</span>
        </div>,
        {
          duration: 4000,
          style: {
            background: '#EF4444',
            color: '#fff',
          },
        }
      );
    }
  };

  // Format time and date based on language and locale
  const formatDateTime = () => {
    const now = currentTime;

    if (lang === "ar") {
      // Arabic format
      const day = now.getDate();
      const month = t(`navbar.months.${now.getMonth()}`);
      const year = now.getFullYear();
      const hours = now.getHours();
      const minutes = now.getMinutes();

      // Convert to Arabic numerals
      const arabicNumerals = (num) => {
        const arabicNumbers = [
          "٠",
          "١",
          "٢",
          "٣",
          "٤",
          "٥",
          "٦",
          "٧",
          "٨",
          "٩",
        ];
        return num
          .toString()
          .split("")
          .map((digit) => arabicNumbers[digit])
          .join("");
      };

      const formattedTime = `${arabicNumerals(
        hours % 12 || 12
      )}:${arabicNumerals(minutes.toString().padStart(2, "0"))} ${hours >= 12 ? "م" : "ص"
        }`;
      const formattedDate = `${arabicNumerals(day)} ${month} ${arabicNumerals(
        year
      )}`;

      return { time: formattedTime, date: formattedDate };
    } else {
      // English format
      const day = now.getDate();
      const month = t(`navbar.months.${now.getMonth()}`);
      const year = now.getFullYear();
      const hours = now.getHours();
      const minutes = now.getMinutes();

      const formattedTime = `${hours % 12 || 12}:${minutes
        .toString()
        .padStart(2, "0")} ${hours >= 12 ? "PM" : "AM"}`;
      const formattedDate = `${month} ${day
        .toString()
        .padStart(2, "0")}, ${year}`;

      return { time: formattedTime, date: formattedDate };
    }
  };

  const { time, date } = formatDateTime();

  // Dynamic greeting based on time
  const getGreeting = () => {
    const hour = currentTime.getHours();

    if (lang === "ar") {
      if (hour < 12) return "صباح الخير";
      else if (hour < 18) return "مساء الخير";
      else return "مساء الخير";
    } else {
      if (hour < 12) return "Good Morning";
      else if (hour < 18) return "Good Afternoon";
      else return "Good Evening";
    }
  };

  return (
    <nav
      className="w-full h-12 sm:h-14 md:h-16 flex items-center justify-between px-2 sm:px-4 lg:px-6 border-b border-gray-200/50 relative z-40"
      style={{
        background: "var(--bg-color)",
        borderColor: "var(--border-color)",
      }}
    >
      {/* Mobile Layout - First name, language, clock button, date, time, profile */}
      <div className="lg:hidden flex items-center justify-between w-full gap-2">
        {/* Left Section - First Name Only */}
        <div className="flex items-center flex-shrink-0">
          <h1 className="text-sm sm:text-base font-bold tracking-tight truncate">
            <span
              className="font-semibold"
              style={{ color: "var(--text-color)" }}
            >
              {userLoading ? "..." : user?.firstName}
            </span>
          </h1>
        </div>

        {/* Center Section - Clock Button */}
        {canUseClockFeature && (
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Clock In/Out Button */}
            <button
              onClick={handleClockInOut}
              disabled={isClockingIn || isClockingOut || hasCompletedToday || logsLoading || logsFetching}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-200 border text-xs font-semibold min-w-[80px] justify-center"
              style={{
                borderColor: hasCompletedToday
                  ? "#9CA3AF"
                  : currentStatus === "Clocked In"
                    ? "#EF4444"
                    : "var(--accent-color)",
                backgroundColor: hasCompletedToday
                  ? "#F3F4F6"
                  : currentStatus === "Clocked In"
                    ? "#FEF2F2"
                    : "var(--accent-color)",
                color: hasCompletedToday
                  ? "#9CA3AF"
                  : currentStatus === "Clocked In"
                    ? "#EF4444"
                    : "#fff",
                cursor: hasCompletedToday ? "not-allowed" : "pointer",
              }}
            >
              {(isClockingIn || isClockingOut || logsLoading || logsFetching) ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Clock className="w-4 h-4" />
              )}
              <span className="text-xs">
                {hasCompletedToday
                  ? (lang === "ar" ? "مكتمل" : "Done")
                  : currentStatus === "Clocked In"
                    ? (lang === "ar" ? "خروج" : "Out")
                    : (lang === "ar" ? "دخول" : "In")}
              </span>
            </button>
          </div>
        )}

        {/* Right Section - Profile Only */}
        <div className="flex items-center flex-shrink-0">
          {/* Profile Icon + Dropdown */}
          <div className="relative" ref={mobileProfileRef}>
            <button
              onClick={() => setMobileProfileOpen((v) => !v)}
              className="w-10 h-10 rounded-full overflow-hidden ring-2 transition-all duration-200 cursor-pointer hover:ring-4"
              style={{ borderColor: "var(--border-color)" }}
            >
              <img
                src={
                  user?.profileImage
                    ? `${import.meta.env.VITE_API_URL}${user.profileImage}`
                    : AvatarIcon
                }
                alt="Avatar"
                className="w-full h-full rounded-full object-cover shadow-md"
                style={{
                  border: "3px solid var(--bg-color)",
                }}
              />
            </button>

            {/* Mobile Profile Dropdown */}
            {mobileProfileOpen && (
              <div
                className="fixed left-1/2 top-16 z-[9999] w-56 rounded-2xl shadow-2xl border overflow-hidden"
                style={{
                  backgroundColor: "var(--bg-color)",
                  borderColor: "var(--border-color)",
                  minWidth: 220,
                  transform: "translateX(-20%)",
                }}
              >
                {/* Header Section */}
                <div
                  className="px-4 py-3 border-b"
                  style={{
                    backgroundColor: "var(--hover-color)",
                    borderColor: "var(--border-color)",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src={
                          user?.profileImage
                            ? `${import.meta.env.VITE_API_URL}${user.profileImage}`
                            : AvatarIcon
                        }
                        alt="Avatar"
                        className="w-10 h-10 rounded-full object-cover shadow-md"
                        style={{
                          border: "3px solid var(--bg-color)",
                        }}
                      />
                      <div
                        className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2"
                        style={{
                          backgroundColor: "var(--success-color)",
                          borderColor: "var(--bg-color)",
                        }}
                      ></div>
                    </div>
                    <div className="flex-1">
                      <h3
                        className="font-bold text-sm leading-tight"
                        style={{ color: "var(--text-color)" }}
                      >
                        {userLoading ? "..." : user?.firstName + " " + user?.lastName}
                      </h3>
                      <p
                        className="text-xs"
                        style={{ color: "var(--sub-text-color)" }}
                      >
                        {userLoading ? "..." : user?.role}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="py-1">
                  <button
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all duration-200 group"
                    style={{
                      color: "var(--text-color)",
                      backgroundColor: "transparent",
                    }}
                    onClick={() => {
                      setMobileProfileOpen(false);
                      navigate("/pages/User/profile");
                    }}
                  >
                    <User
                      className="w-5 h-5"
                      style={{ color: "var(--accent-color)" }}
                    />
                    <span className="font-semibold text-sm">
                      {t("navbar.profile")}
                    </span>
                  </button>

                  <div
                    className="mx-4 my-1 border-t"
                    style={{ borderColor: "var(--border-color)" }}
                  ></div>

                  <button
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all duration-200 group"
                    style={{
                      backgroundColor: "transparent",
                      color: "var(--error-color)",
                    }}
                    onClick={async () => {
                      setMobileProfileOpen(false);
                      await handleLogout();
                    }}
                  >
                    <LogOut
                      className="w-5 h-5"
                      style={{ color: "var(--error-color)" }}
                    />
                    <span
                      className="font-semibold text-sm"
                      style={{ color: "var(--error-color)" }}
                    >
                      {t("navbar.logout")}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Layout - Keep exactly as original */}
      <div className="hidden lg:flex items-center justify-between w-full">
        {/* Desktop Greeting */}
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight">
              <span className="gradient-text">{getGreeting()}</span>
              <span
                className="font-semibold pl-1 sm:pl-2"
                style={{ color: "var(--text-color)" }}
              >
                {/* ديناميكي من الـ API */}
                {userLoading ? "..." : user?.firstName}
              </span>
            </h1>
          </div>
          <div className="flex items-center gap-3 sm:gap-5">
            {/* Online Status */}
            <div
              className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border shadow-sm"
              style={{
                backgroundColor: "var(--hover-color)",
                borderColor: "var(--border-color)",
              }}
            >
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span
                className="text-xs font-semibold"
                style={{ color: "var(--accent-color)" }}
              >
                {t("navbar.online")}
              </span>
            </div>
            {/* Language Selector */}
            <div ref={langRef} className="relative">
              <button
                onClick={() => setLangOpen((v) => !v)}
                className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl sm:rounded-2xl transition-all duration-200 border"
                style={{
                  borderColor: "var(--border-color)",
                  backgroundColor: "var(--bg-color)",
                  color: "var(--text-color)",
                }}
              >
                <span className="text-xs font-semibold">
                  {lang === "ar" ? t("navbar.arabic") : t("navbar.english")}
                </span>
                <Globe
                  className="w-3 h-3 sm:w-4 sm:h-4"
                  style={{ color: "var(--sub-text-color)" }}
                />
                <ChevronDown
                  className={`w-2.5 h-2.5 sm:w-3 sm:h-3 transition-transform duration-200 ${langOpen ? "rotate-180" : ""
                    }`}
                  style={{ color: "var(--sub-text-color)" }}
                />
              </button>
              {langOpen && (
                <div
                  className={`absolute top-full mt-2 ${popSideLang} w-32 sm:w-36 border shadow-xl rounded-xl sm:rounded-2xl overflow-hidden z-50`}
                  style={{
                    backgroundColor: "var(--bg-color)",
                    borderColor: "var(--border-color)",
                  }}
                >
                  <button
                    onClick={() => handleLangChange("en")}
                    className="w-full text-left px-3 sm:px-4 py-2 sm:py-2.5 text-xs transition-colors"
                    style={{
                      color: "var(--text-color)",
                      backgroundColor:
                        lang === "en" ? "var(--hover-color)" : "transparent",
                      fontWeight: lang === "en" ? "bold" : "medium",
                    }}
                  >
                    {t("navbar.english")}
                  </button>
                  <button
                    onClick={() => handleLangChange("ar")}
                    className="w-full text-left px-3 sm:px-4 py-2 sm:py-2.5 text-xs transition-colors"
                    style={{
                      color: "var(--text-color)",
                      backgroundColor:
                        lang === "ar" ? "var(--hover-color)" : "transparent",
                      fontWeight: lang === "ar" ? "bold" : "medium",
                    }}
                  >
                    {t("navbar.arabic")}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Desktop Right Section */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Clock In/Out Button */}
          {canUseClockFeature && (
            <button
              onClick={handleClockInOut}
              disabled={isClockingIn || isClockingOut || hasCompletedToday || logsLoading || logsFetching}
              className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl transition-all duration-200 border font-semibold text-sm"
              style={{
                borderColor: hasCompletedToday
                  ? "#9CA3AF"
                  : currentStatus === "Clocked In"
                    ? "#EF4444"
                    : "var(--accent-color)",
                backgroundColor: hasCompletedToday
                  ? "#F3F4F6"
                  : currentStatus === "Clocked In"
                    ? "#FEF2F2"
                    : "var(--accent-color)",
                color: hasCompletedToday
                  ? "#9CA3AF"
                  : currentStatus === "Clocked In"
                    ? "#EF4444"
                    : "#fff",
                cursor: hasCompletedToday ? "not-allowed" : "pointer",
              }}
            >
              {(isClockingIn || isClockingOut || logsLoading || logsFetching) ? (
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
              ) : (
                <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
              <span>
                {hasCompletedToday
                  ? (lang === "ar" ? "مكتمل اليوم" : "Completed Today")
                  : currentStatus === "Clocked In"
                    ? (lang === "ar" ? "تسجيل خروج" : "Clock Out")
                    : (lang === "ar" ? "تسجيل دخول" : "Clock In")}
              </span>
            </button>
          )}

          {/* Date and Time - Dynamic - Compact */}
          <div
            className="flex flex-col items-center gap-1"
            style={{
              direction: lang === "ar" ? "rtl" : "ltr",
            }}
          >
            {/* Time */}
            <div className="flex items-center gap-1.5 w-full">
              <Clock
                className="w-3.5 h-3.5"
                style={{ color: "var(--sub-text-color)" }}
              />
              <span
                className="text-sm font-bold"
                style={{ color: "var(--text-color)" }}
              >
                {time}
              </span>
            </div>

            {/* Date */}
            <div className="flex items-center gap-1.5">
              <Calendar
                className="w-3.5 h-3.5"
                style={{ color: "var(--sub-text-color)" }}
              />
              <span
                className="text-xs font-medium"
                style={{ color: "var(--sub-text-color)" }}
              >
                {date}
              </span>
            </div>
          </div>

          {/* Profile Section */}
          <div className="relative" ref={profileRef}>
            <div
              className="flex items-center gap-2 sm:gap-3 rounded-xl sm:rounded-2xl border px-3 sm:px-4 py-1.5 sm:py-2 transition-all duration-200 cursor-pointer group"
              style={{
                borderColor: "var(--border-color)",
                backgroundColor: "var(--bg-color)",
              }}
              onClick={() => setProfileOpen((v) => !v)}
              tabIndex={0}
            >
              <div
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden ring-2 transition-all duration-200 cursor-pointer hover:ring-4"
                style={{ borderColor: "var(--border-color)" }}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate("/pages/User/profile");
                }}
              >
                <img
                  src={
                    user?.profileImage
                      ? `${import.meta.env.VITE_API_URL}${user.profileImage}`
                      : AvatarIcon
                  }
                  alt="Avatar"
                  className="w-full h-full rounded-full object-cover shadow-md"
                  style={{
                    border: "2px solid var(--bg-color)",
                  }}
                />
              </div>
              <div className="flex flex-col items-start">
                <h3
                  className="text-xs sm:text-sm font-bold transition-colors duration-200 truncate max-w-24 sm:max-w-32"
                  style={{ color: "var(--text-color)" }}
                >
                  {userLoading ? "..." : user?.firstName + " " + user?.lastName}
                </h3>
                <p
                  className="text-xs font-medium truncate max-w-24 sm:max-w-32"
                  style={{ color: "var(--sub-text-color)" }}
                >
                  {userLoading ? "..." : user?.role}
                </p>
              </div>
              <ChevronDown
                className={`w-3 h-3 sm:w-3.5 sm:h-3.5 transition-transform duration-200 group-hover:rotate-180 ${profileOpen ? "rotate-180" : ""
                  }`}
                style={{ color: "var(--sub-text-color)" }}
              />
            </div>
            {profileOpen && (
              <div
                className={`absolute ${isRtl ? "left-0" : "right-0"
                  } mt-2 w-52 sm:w-56 rounded-xl sm:rounded-2xl shadow-2xl border z-50 overflow-hidden`}
                style={{
                  backgroundColor: "var(--bg-color)",
                  borderColor: "var(--border-color)",
                  minWidth: 200,
                  animation: "fadeInScale 0.2s ease-out",
                }}
              >
                {/* Header Section */}
                <div
                  className="px-3 sm:px-4 py-2 sm:py-3 border-b"
                  style={{
                    backgroundColor: "var(--hover-color)",
                    borderColor: "var(--border-color)",
                  }}
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="relative">
                      <img
                        src={
                          user?.profileImage
                            ? `${import.meta.env.VITE_API_URL}${user.profileImage}`
                            : AvatarIcon
                        }
                        alt="Avatar"
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover shadow-md"
                        style={{
                          border: "2px sm:border-3 solid var(--bg-color)",
                        }}
                      />
                      <div
                        className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded-full border-2"
                        style={{
                          backgroundColor: "var(--success-color)",
                          borderColor: "var(--bg-color)",
                        }}
                      ></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3
                        className="font-bold text-xs sm:text-sm leading-tight truncate"
                        style={{ color: "var(--text-color)" }}
                      >
                        {userLoading ? "..." : user?.firstName + " " + user?.lastName}
                      </h3>
                      <p
                        className="text-xs truncate"
                        style={{ color: "var(--sub-text-color)" }}
                      >
                        {userLoading ? "..." : user?.role}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="py-1">
                  <button
                    className="w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 text-left transition-all duration-200 group"
                    style={{
                      color: "var(--text-color)",
                      backgroundColor: "transparent",
                    }}
                    onMouseEnter={(e) =>
                      (e.target.style.backgroundColor = "var(--hover-color)")
                    }
                    onMouseLeave={(e) =>
                      (e.target.style.backgroundColor = "transparent")
                    }
                    onClick={() => {
                      setProfileOpen(false);
                      navigate("/pages/User/profile");
                    }}
                  >
                    <User
                      className="w-4 h-4 sm:w-5 sm:h-5"
                      style={{ color: "var(--accent-color)" }}
                    />
                    <span className="font-semibold text-xs sm:text-sm">
                      {t("navbar.profile")}
                    </span>
                  </button>

                  <div
                    className="mx-3 sm:mx-4 my-1 border-t"
                    style={{ borderColor: "var(--border-color)" }}
                  ></div>

                  <button
                    className="w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 text-left transition-all duration-200 group"
                    style={{
                      backgroundColor: "transparent",
                    }}
                    onMouseEnter={(e) =>
                      (e.target.style.backgroundColor = "var(--hover-color)")
                    }
                    onMouseLeave={(e) =>
                      (e.target.style.backgroundColor = "transparent")
                    }
                    onClick={handleLogout}
                  >
                    <LogOut
                      className="w-4 h-4 sm:w-5 sm:h-5"
                      style={{ color: "var(--error-color)" }}
                    />
                    <span
                      className="font-semibold text-xs sm:text-sm"
                      style={{ color: "var(--error-color)" }}
                    >
                      {t("navbar.logout")}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Location Input Modal */}
      <LocationInputModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onConfirm={handleLocationConfirm}
        isArabic={lang === "ar"}
      />

      {/* Late Reason Modal */}
      <LateReasonModal
        isOpen={showLateReasonModal}
        onClose={() => {
          setShowLateReasonModal(false);
          setPendingLocation(null);
        }}
        onConfirm={handleLateReasonConfirm}
        isArabic={lang === "ar"}
      />
    </nav>
  );
};

export default NavBar;