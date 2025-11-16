import React, { useEffect, useRef, useState, useContext, useMemo } from "react"
import { Clock, ClipboardList, Coffee, BarChart3, MapPin, Loader2, AlertCircle, CheckCircle2, Timer } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import toast from "react-hot-toast"
import { useTimer } from "../../../contexts/TimerContext"
import ErrorComponent from "../../Error/Error";
import { GlobalErrorContext } from "../../../contexts/GlobalErrorContext"
import { useClockInMutation, useClockOutMutation, useGetUserClockinLogsQuery } from "../../../services/apis/ClockinLogApi"
import { getAuthToken } from "../../../utils/page"
import LocationInputModal from "../LocationInputModal/LocationInputModal"
import LateReasonModal from "../LateReasonModal/LateReasonModal"
import { isUtcDateToday, calculateDurationFromUtc } from "../../../utils/timeUtils"

// Helper function to get user ID from token
const deriveUserId = () => {
  try {
    const token = getAuthToken()
    if (!token) return null
    const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}")
    if (userInfo?.userId) return userInfo.userId
    const parts = token.split(".")
    if (parts.length !== 3) return null
    const payload = JSON.parse(atob(parts[1]))
    if (payload?.sub) return payload.sub
    if (payload?.userId) return payload.userId
    return null
  } catch {
    return null
  }
}

// Helper function to calculate duration in seconds from clock-in/out times
// API returns UTC times, so we calculate duration correctly
const calculateDuration = (clockinTime, clockoutTime) => {
  return calculateDurationFromUtc(clockinTime, clockoutTime)
}

// Helper function to format seconds to "xh ym"
const formatTimeFromSeconds = (seconds) => {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return `${h}h ${m}m`
}

// Helper function to get start of week (Monday)
const getWeekStart = (date = new Date()) => {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
  return new Date(d.setDate(diff))
}

const MainContent = () => {
  const { t, i18n } = useTranslation()
  const isAr = i18n.language === "ar"
  
  // Get user ID and fetch clock-in logs (fetch more for accurate calculations)
  const userId = useMemo(() => deriveUserId(), [])
  const { data: clockinLogsData, isLoading: isLoadingLogs, refetch: refetchLogs } = useGetUserClockinLogsQuery(
    { userId, pageNumber: 1, pageSize: 50 }, // Fetch more logs for weekly calculations
    { skip: !userId }
  )
  
  // Real API mutations
  const [clockInMutation, { isLoading: isClockingIn }] = useClockInMutation();
  const [clockOutMutation, { isLoading: isClockingOut }] = useClockOutMutation();
  const navigate = useNavigate();
  const { setGlobalError } = useContext(GlobalErrorContext);
  const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
  
  // Enhanced timer context integration
  const {
    timer,
    isRunning,
    isPaused,
    hasActiveTimer,
    displayTime,
    timer: { taskName, seconds, duration }
  } = useTimer()

  // Find the most recent active clock-in (has clockinTime but no clockoutTime)
  const activeClockIn = useMemo(() => {
    if (!clockinLogsData) return null
    
    let items = []
    if (Array.isArray(clockinLogsData)) {
      items = clockinLogsData
    } else if (clockinLogsData?.value && Array.isArray(clockinLogsData.value)) {
      items = clockinLogsData.value
    } else if (clockinLogsData?.data && Array.isArray(clockinLogsData.data)) {
      items = clockinLogsData.data
    } else if (clockinLogsData?.items && Array.isArray(clockinLogsData.items)) {
      items = clockinLogsData.items
    } else if (clockinLogsData?.results && Array.isArray(clockinLogsData.results)) {
      items = clockinLogsData.results
    }
    
    // Find today's active clock-in (has clockinTime but no clockoutTime)
    // API returns UTC time, check if it's today in local timezone
    return items.find(log => {
      if (!log?.clockinTime) return false
      // Check if clock-in date is today (in local timezone) and has no clock-out
      return isUtcDateToday(log.clockinTime) && !log?.clockoutTime
    }) || null
  }, [clockinLogsData])

  // Check if user has completed attendance today (has both clock-in and clock-out for today)
  const hasCompletedToday = useMemo(() => {
    if (!clockinLogsData) return false
    
    let items = []
    if (Array.isArray(clockinLogsData)) {
      items = clockinLogsData
    } else if (clockinLogsData?.value && Array.isArray(clockinLogsData.value)) {
      items = clockinLogsData.value
    } else if (clockinLogsData?.data && Array.isArray(clockinLogsData.data)) {
      items = clockinLogsData.data
    } else if (clockinLogsData?.items && Array.isArray(clockinLogsData.items)) {
      items = clockinLogsData.items
    } else if (clockinLogsData?.results && Array.isArray(clockinLogsData.results)) {
      items = clockinLogsData.results
    }
    
    // Check if there's a log entry for today with both clock-in and clock-out
    return items.some(log => {
      if (!log?.clockinTime || !log?.clockoutTime) return false
      // Check if clock-in date is today (in local timezone) and has clock-out
      return isUtcDateToday(log.clockinTime) && !!log.clockoutTime
    })
  }, [clockinLogsData])

  // Determine current status and clock-in time
  const currentStatus = activeClockIn ? "Clocked In" : "Clocked Out"
  const clockInTime = activeClockIn?.clockinTime || null

  // Calculate metrics from clock-in logs
  const calculatedMetrics = useMemo(() => {
    if (!clockinLogsData) {
      return {
        dailyShift: "0h 0m",
        thisWeek: "0h 0m",
        breaksTaken: "0h 0m",
        breaksCount: 0,
        totalOvertime: "0h 0m",
        mostProductiveDay: { day: "-", time: "0h 0m" },
      }
    }

    let items = []
    if (Array.isArray(clockinLogsData)) {
      items = clockinLogsData
    } else if (clockinLogsData?.value && Array.isArray(clockinLogsData.value)) {
      items = clockinLogsData.value
    } else if (clockinLogsData?.data && Array.isArray(clockinLogsData.data)) {
      items = clockinLogsData.data
    } else if (clockinLogsData?.items && Array.isArray(clockinLogsData.items)) {
      items = clockinLogsData.items
    } else if (clockinLogsData?.results && Array.isArray(clockinLogsData.results)) {
      items = clockinLogsData.results
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const weekStart = getWeekStart(today)
    weekStart.setHours(0, 0, 0, 0)

    // Calculate today's hours
    // API returns UTC time, filter by today in local timezone
    const todayLogs = items.filter(log => {
      if (!log?.clockinTime) return false
      return isUtcDateToday(log.clockinTime)
    })
    const todaySeconds = todayLogs.reduce((sum, log) => {
      return sum + calculateDuration(log.clockinTime, log.clockoutTime)
    }, 0)
    const dailyShift = formatTimeFromSeconds(todaySeconds)

    // Calculate this week's hours
    // API returns UTC time, convert to local time for comparison
    const weekLogs = items.filter(log => {
      if (!log?.clockinTime) return false
      const logDate = new Date(log.clockinTime) // Convert UTC to local
      logDate.setHours(0, 0, 0, 0)
      return logDate >= weekStart
    })
    const weekSeconds = weekLogs.reduce((sum, log) => {
      return sum + calculateDuration(log.clockinTime, log.clockoutTime)
    }, 0)
    const thisWeek = formatTimeFromSeconds(weekSeconds)

    // Calculate overtime (hours over 8 per day)
    // API returns UTC time, convert to local time for date grouping
    const dailyHours = new Map()
    items.forEach(log => {
      if (!log?.clockinTime) return
      const logDate = new Date(log.clockinTime) // Convert UTC to local
      logDate.setHours(0, 0, 0, 0)
      const dateKey = logDate.toISOString().split('T')[0]
      const duration = calculateDuration(log.clockinTime, log.clockoutTime)
      const hours = duration / 3600
      dailyHours.set(dateKey, (dailyHours.get(dateKey) || 0) + hours)
    })
    let totalOvertimeSeconds = 0
    dailyHours.forEach((hours, date) => {
      if (hours > 8) {
        totalOvertimeSeconds += (hours - 8) * 3600
      }
    })
    const totalOvertime = formatTimeFromSeconds(totalOvertimeSeconds)

    // Find most productive day this week
    // API returns UTC time, convert to local time for date grouping
    const weekDailyHours = new Map()
    weekLogs.forEach(log => {
      if (!log?.clockinTime) return
      const logDate = new Date(log.clockinTime) // Convert UTC to local
      logDate.setHours(0, 0, 0, 0)
      const dateKey = logDate.toISOString().split('T')[0]
      const duration = calculateDuration(log.clockinTime, log.clockoutTime)
      const hours = duration / 3600
      weekDailyHours.set(dateKey, (weekDailyHours.get(dateKey) || 0) + hours)
    })
    let maxHours = 0
    let maxDay = "-"
    weekDailyHours.forEach((hours, date) => {
      if (hours > maxHours) {
        maxHours = hours
        const dayDate = new Date(date)
        const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
        maxDay = dayNames[dayDate.getDay()]
      }
    })
    const mostProductiveDay = {
      day: maxDay,
      time: formatTimeFromSeconds(maxHours * 3600)
    }

    return {
      dailyShift,
      thisWeek,
      breaksTaken: "0h 0m", // No BreakLog API available
      breaksCount: 0, // No BreakLog API available
      totalOvertime,
      mostProductiveDay,
    }
  }, [clockinLogsData])

  // Dashboard data calculated from real clock-in logs
  const data = {
    dailyShift: calculatedMetrics.dailyShift,
    thisWeek: calculatedMetrics.thisWeek,
    breaksTaken: calculatedMetrics.breaksTaken,
    breaksCount: calculatedMetrics.breaksCount,
    totalOvertime: calculatedMetrics.totalOvertime,
    currentStatus: currentStatus,
    activeWorkTime: "0h 0m", // Will be calculated dynamically below
    todayProgress: "0h 0m / 8h", // Will be calculated dynamically below
    efficiency: 0, // Will be calculated dynamically below
    completedShift: 0, // Will be calculated dynamically below
    remainingTime: "0h 0m", // Will be calculated dynamically below
    mostProductiveDay: calculatedMetrics.mostProductiveDay,
    clockInTime: clockInTime
  }
  
  // Focus time data - calculate from timer context or set to 0
  const focusTimeData = useMemo(() => {
    // Timer logs are stored in localStorage via TimerContext
    // For now, return 0 since there's no API for timer logs
    return {
      total: "0h",
      average: "0h 0m",
      days: 0
    }
  }, [])

  // fallback لو البيانات مش موجودة
  const stats = data || {
    dailyShift: "0h 0m",
    thisWeek: "0h 0m",
    breaksTaken: "0h 0m",
    breaksCount: 0,
    totalOvertime: "0h 0m",
    currentStatus: "Clocked Out",
    activeWorkTime: "0h 0m",
    todayProgress: "0h 0m / 8h",
    efficiency: 0,
    completedShift: 0,
    remainingTime: "0h 0m",
    mostProductiveDay: { day: "-", time: "0h 0m" },
  }
  const [activeWorkSeconds, setActiveWorkSeconds] = useState(0)
  const timerRef = useRef(null)
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [showLateReasonModal, setShowLateReasonModal] = useState(false)
  const [pendingLocation, setPendingLocation] = useState(null)

  useEffect(() => {
    if (stats.currentStatus === "Clocked In" && clockInTime) {
      // Parse clockInTime as UTC (API returns UTC)
      // Ensure the string is treated as UTC by adding 'Z' if it's not present
      let utcString = clockInTime;
      if (typeof utcString === 'string' && !utcString.endsWith('Z') && !utcString.includes('+') && !utcString.includes('-', 10)) {
        utcString = utcString + 'Z';
      }
      
      // Parse as UTC - JavaScript Date will correctly handle the conversion
      const start = new Date(utcString);
      
      // Debug logging in development
      if (import.meta.env.DEV) {
        console.log('Timer initialization:', {
          clockInTime,
          utcString,
          startUTC: start.toISOString(),
          startLocal: start.toLocaleString(),
          now: new Date().toLocaleString(),
          diffSeconds: Math.floor((new Date().getTime() - start.getTime()) / 1000),
        });
      }
      
      const updateTimer = () => {
        const now = new Date();
        // Calculate difference in milliseconds, then convert to seconds
        // Both dates are in the same timezone (milliseconds since epoch), so this is correct
        const diff = Math.floor((now.getTime() - start.getTime()) / 1000);
        setActiveWorkSeconds(Math.max(0, diff)); // Ensure non-negative
      };
      updateTimer();
      timerRef.current = setInterval(updateTimer, 1000);
      return () => clearInterval(timerRef.current);
    } else {
      setActiveWorkSeconds(0);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [stats.currentStatus, clockInTime])

  // دالة لتحويل الثواني إلى "xh ym"
  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    return `${h}h ${m}m`
  }

  // استخدم الوقت الفعلي لو المستخدم Clocked In
  const activeWorkTime = stats.currentStatus === "Clocked In"
    ? formatTime(activeWorkSeconds)
    : stats.activeWorkTime

  const todayProgress = stats.currentStatus === "Clocked In"
    ? `${formatTime(activeWorkSeconds)} / 8h`
    : stats.todayProgress

  // احسب النسبة المئوية للتقدم
  const todayProgressPercent = (() => {
    const [worked, total] = todayProgress?.split("/") || ["0h 0m", "8h"]
    const workedMinutes = parseInt(worked) * 60 + parseInt(worked.split(" ")[1]?.replace("m", "") || "0")
    const totalMinutes = parseInt(total) * 60 + parseInt(total.split(" ")[1]?.replace("m", "") || "0")
    return totalMinutes ? Math.min(100, Math.round((workedMinutes / totalMinutes) * 100)) : 0
  })()

  // احسب Efficiency و Complete و Remaining بشكل حي لو المستخدم Clocked In
  const shiftMinutes = 8 * 60 // لو الشيفت 8 ساعات
  const workedMinutes = stats.currentStatus === "Clocked In"
    ? Math.floor(activeWorkSeconds / 60)
    : (() => {
      const [worked] = stats.todayProgress?.split("/") || ["0h 0m"]
      return parseInt(worked) * 60 + parseInt(worked.split(" ")[1]?.replace("m", "") || "0")
    })()

  const efficiency = stats.currentStatus === "Clocked In"
    ? Math.min(100, Math.round((workedMinutes / shiftMinutes) * 100))
    : stats.efficiency

  const completedShift = stats.currentStatus === "Clocked In"
    ? Math.min(100, Math.round((workedMinutes / shiftMinutes) * 100))
    : stats.completedShift

  const remainingMinutes = stats.currentStatus === "Clocked In"
    ? Math.max(0, shiftMinutes - workedMinutes)
    : (() => {
      const [_, total] = stats.todayProgress?.split("/") || ["0h 0m", "8h"]
      const totalMinutes = parseInt(total) * 60 + parseInt(total.split(" ")[1]?.replace("m", "") || "0")
      return Math.max(0, totalMinutes - workedMinutes)
    })()

  const remainingTime = stats.currentStatus === "Clocked In"
    ? formatTime(remainingMinutes * 60)
    : stats.remainingTime

  // دالة للحصول على الموقع الحالي مع UI محسن
  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new window.Error(isAr ? 'المتصفح لا يدعم تحديد الموقع' : 'Browser does not support geolocation'))
        return
      }

      setIsGettingLocation(true)

      // Show loading toast
      const loadingToast = toast.loading(
        isAr ? 'جاري تحديد موقعك...' : 'Getting your location...',
        {
          icon: '📍',
          style: {
            background: 'var(--card-bg)',
            color: 'var(--text-color)',
            border: '1px solid var(--border-color)',
          },
        }
      )

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setIsGettingLocation(false)
          toast.dismiss(loadingToast)

          const { latitude, longitude, accuracy } = position.coords

          console.log('Location success:', { latitude, longitude, accuracy })

          // Success toast with location info
          toast.success(
            isAr ? `تم تحديد الموقع بدقة ${Math.round(accuracy)}م` : `Location found with ${Math.round(accuracy)}m accuracy`,
            {
              icon: '🎯',
              duration: 2000,
              style: {
                background: '#10B981',
                color: '#fff',
              },
            }
          )

          resolve({
            latitude,
            longitude,
            accuracy
          })
        },
        (error) => {
          setIsGettingLocation(false)
          toast.dismiss(loadingToast)

          console.error('Location error details:', {
            code: error.code,
            message: error.message,
          })

          let errorMessage = isAr ? 'خطأ في تحديد الموقع' : 'Location error'
          let errorIcon = '❌'

          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = isAr
                ? 'تم رفض إذن الموقع. يرجى السماح بالوصول إلى الموقع'
                : 'Location permission denied. Please allow location access'
              errorIcon = '🚫'
              break
            case error.POSITION_UNAVAILABLE:
              errorMessage = isAr
                ? 'الموقع غير متاح. تأكد من اتصال الإنترنت'
                : 'Location unavailable. Check your internet connection'
              errorIcon = '📡'
              break
            case error.TIMEOUT:
              errorMessage = isAr
                ? 'انتهت مهلة تحديد الموقع. يرجى المحاولة مرة أخرى'
                : 'Location request timeout. Please try again'
              errorIcon = '⏰'
              break
          }

          reject(new window.Error(errorMessage)); // <-- use JS Error, not React Error
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 60000
        }
      )
    })
  }

  const isAlreadyClockedIn = stats.currentStatus === "Clocked In"

  // Handle clock in/out with location from Google Maps URL
  const handleClock = async () => {
    // If already completed attendance today, show toast and return
    if (hasCompletedToday) {
      toast(
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-500" />
          <span>{isAr ? 'لقد سجلت الحضور والانصراف لهذا اليوم بالفعل' : 'You already clocked in today'}</span>
        </div>,
        {
          duration: 3000,
          style: {
            background: '#F0FDF4',
            border: '1px solid #10B981',
            color: '#065F46',
          },
        }
      )
      return
    }

    // Add confirmation only for clock out
    if (stats.currentStatus === "Clocked In") {
      const confirmClockOut = await new Promise((resolve) => {
        toast((t) => (
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            <div>
              <div className="font-medium text-gray-900">
                {isAr ? 'هل أنت متأكد من تسجيل الخروج؟' : 'Are you sure you want to clock out?'}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  toast.dismiss(t.id)
                  resolve(true)
                }}
                className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
              >
                {isAr ? 'نعم' : 'Yes'}
              </button>
              <button
                onClick={() => {
                  toast.dismiss(t.id)
                  resolve(false)
                }}
                className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
              >
                {isAr ? 'لا' : 'No'}
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
        })
      })

      if (!confirmClockOut) return
    }

    // Show location input modal
    setShowLocationModal(true)
  }

  // Handle location confirmation from modal
  const handleLocationConfirm = (coords) => {
    setPendingLocation(coords)
    setShowLocationModal(false)
    
    // If clocking in, we'll check if late after API call
    // If clocking out, proceed directly
    if (stats.currentStatus === "Clocked In") {
      handleClockOutWithLocation(coords)
    } else {
      // For clock in, we need to check if late first
      handleClockInWithLocation(coords, "")
    }
  }

  // Handle clock in with location
  const handleClockInWithLocation = async (coords, reason, isRetry = false) => {
    // Only show loading toast if not a retry (retry already has pending state)
    const loadingToast = !isRetry ? toast.loading(
      isAr ? 'جاري تسجيل الحضور...' : 'Recording attendance...',
      {
        style: {
          background: 'var(--card-bg)',
          color: 'var(--text-color)',
        },
      }
    ) : null

    try {
      const result = await clockInMutation({
        latitude: coords.lat,
        longitude: coords.lng,
        reason: reason || ""
      }).unwrap()

      if (loadingToast) toast.dismiss(loadingToast)

      // Log the result to debug
      if (import.meta.env.DEV) {
        console.log('Clock in result:', result)
      }

      // Check if late from API response - handle different response structures
      // Only treat as late if explicitly true (strict check to avoid false positives)
      const isLate = result?.value?.isLate === true || result?.isLate === true || result?.data?.isLate === true

      // If late and no reason provided yet, show reason modal
      // Only show modal if user is actually late (isLate === true)
      if (isLate === true && !reason) {
        setPendingLocation(coords)
        setShowLateReasonModal(true)
        return
      }

      // Success - either on time or late with reason
      // Small delay to ensure refetch completes before showing success
      setTimeout(() => {
        toast.success(
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            <span>
              {isLate 
                ? (isAr ? 'تم تسجيل الحضور المتأخر بنجاح' : 'Successfully clocked in (late)')
                : (isAr ? 'تم تسجيل الحضور بنجاح' : 'Successfully clocked in')
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
        )
      }, 100)

      // Refetch clock-in logs to update timer (with error handling)
      if (userId) {
        try {
          await refetchLogs()
        } catch (refetchError) {
          // Log but don't show error to user - clock-in was successful
          if (import.meta.env.DEV) {
            console.warn('Failed to refetch logs after clock-in:', refetchError)
          }
        }
      }
      setPendingLocation(null)
    } catch (error) {
      console.error('Clock in error:', error)
      console.error('Clock in error details:', {
        status: error?.status,
        data: error?.data,
        errors: error?.data?.errors,
        validationErrors: error?.data?.errors ? Object.entries(error.data.errors).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`).join('; ') : null,
        coords: { lat: coords.lat, lng: coords.lng },
      })
      if (loadingToast) toast.dismiss(loadingToast)
      
      // Check if this is a late clock-in error (400 with specific error message)
      const errorMessage = error?.data?.errorMessage || error?.data?.message || error?.data?.error || error?.data?.title || error?.message
      const errorMessageLower = errorMessage?.toLowerCase() || ''
      
      // Only show late reason modal if error explicitly indicates late arrival
      // Check for specific late-related keywords, but be more strict
      const isLateError = error?.status === 400 && (
        errorMessageLower.includes('late arrival') ||
        errorMessageLower.includes('arrived late') ||
        errorMessageLower.includes('clock in late') ||
        errorMessageLower.includes('late clock') ||
        (errorMessageLower.includes('late') && errorMessageLower.includes('reason'))
      )
      
      // If it's a late error and no reason was provided, show the late reason modal
      // Only show if user is actually late (strict check)
      if (isLateError === true && !reason) {
        setPendingLocation(coords)
        setShowLateReasonModal(true)
        return
      }
      
      // Get error message from API response
      let displayErrorMessage = errorMessage
      
      // If there are validation errors, format them nicely
      if (error?.data?.errors && typeof error.data.errors === 'object') {
        const validationErrors = Object.entries(error.data.errors)
          .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
          .join('; ')
        if (validationErrors) {
          displayErrorMessage = validationErrors
        }
      }
      
      if (!displayErrorMessage) {
        displayErrorMessage = isAr ? 'حدث خطأ في تسجيل الحضور' : 'Error recording attendance'
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
      )
    }
  }

  // Handle late reason confirmation
  const handleLateReasonConfirm = async (reason) => {
    setShowLateReasonModal(false)
    if (pendingLocation) {
      // Retry clock-in with reason
      await handleClockInWithLocation(pendingLocation, reason, true)
    }
  }

  // Handle clock out with location
  const handleClockOutWithLocation = async (coords) => {
    const loadingToast = toast.loading(
      isAr ? 'جاري تسجيل الخروج...' : 'Recording clock out...',
      {
        style: {
          background: 'var(--card-bg)',
          color: 'var(--text-color)',
        },
      }
    )

    try {
      await clockOutMutation({
        latitude: coords.lat,
        longitude: coords.lng
      }).unwrap()

      toast.dismiss(loadingToast)
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
      )

      // Refetch clock-in logs to update timer (with error handling)
      if (userId) {
        try {
          await refetchLogs()
        } catch (refetchError) {
          // Log but don't show error to user - clock-out was successful
          if (import.meta.env.DEV) {
            console.warn('Failed to refetch logs after clock-out:', refetchError)
          }
        }
      }
      setPendingLocation(null)
    } catch (error) {
      console.error('Clock out error:', error)
      toast.dismiss(loadingToast)
      toast.error(
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <span>{isAr ? 'حدث خطأ في تسجيل الخروج' : 'Error recording clock out'}</span>
        </div>,
        {
          duration: 4000,
          style: {
            background: '#EF4444',
            color: '#fff',
          },
        }
      )
    }
  }

  // Legacy function for backward compatibility (if still used elsewhere)
  const handleClockWithLocation = async (locationData) => {
    if (stats.currentStatus === "Clocked In") {
      await handleClockOutWithLocation({ lat: locationData.latitude, lng: locationData.longitude })
    } else {
      await handleClockInWithLocation({ lat: locationData.latitude, lng: locationData.longitude }, "")
    }
  }

  // Remove old office fetching - now using Google Maps URL input

  const [showError, setShowError] = useState(false)
  const [errorDetails, setErrorDetails] = useState({})

  return (
    <>
      {/* Location Input Modal */}
      <LocationInputModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onConfirm={handleLocationConfirm}
        isArabic={isAr}
      />

      {/* Late Reason Modal */}
      <LateReasonModal
        isOpen={showLateReasonModal}
        onClose={() => {
          setShowLateReasonModal(false)
          setPendingLocation(null)
        }}
        onConfirm={handleLateReasonConfirm}
        isArabic={isAr}
      />

      {showError ? (
        <ErrorComponent
          {...errorDetails}
          onRefresh={() => {
            setShowError(false)
            window.location.reload()
          }}
          onGoBack={() => setShowError(false)}
        />
      ) : (
        <div
          className="w-full h-max flex flex-col justify-center items-center px-2 sm:px-4"
          style={{
            backgroundColor: "var(--bg-color)",
            direction: isAr ? "rtl" : "ltr",
          }}
        >
          <div className="w-full max-w-4xl h-max pb-5 flex flex-col gap-2 sm:gap-4 justify-center items-center">
            {/* First Row - Current Status & Active Work Time */}
            <div className="w-full h-[80px] sm:h-[105px] flex gap-1 sm:gap-2 justify-center items-center">
              <div
                className="w-1/2 h-full rounded-xl sm:rounded-2xl p-2 sm:p-4 flex flex-col justify-between border"
                style={{
                  backgroundColor: "var(--card-bg)",
                  borderColor: "var(--border-color)",
                }}
              >
                <div className="flex items-center gap-1 sm:gap-2">
                  <span className="text-[var(--sub-text-color)] text-[10px] sm:text-xs">{t("mainContent.currentStatus")}</span>
                  <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${stats.currentStatus === "Clocked In" ? "bg-green-500" : "bg-red-500"}`}></div>
                </div>
                <h3 className="text-sm sm:text-lg font-semibold" style={{ color: "var(--text-color)" }}>
                  {stats.currentStatus === "Clocked In"
                    ? t("clockIn")
                    : t("clockOut")}
                </h3>
              </div>
              <div
                className="w-1/2 h-full rounded-xl sm:rounded-2xl p-2 sm:p-4 flex flex-col justify-between border"
                style={{
                  backgroundColor: "var(--card-bg)",
                  borderColor: "var(--border-color)",
                }}
              >
                <span className="text-[var(--sub-text-color)] text-[10px] sm:text-xs">{t("mainContent.activeWorkTime")}</span>
                <h3 className="text-lg sm:text-2xl font-bold" style={{ color: "var(--text-color)" }}>{activeWorkTime}</h3>
              </div>
            </div>

            {/* Second Row */}
            <div className="w-full h-[80px] sm:h-[105px] flex gap-1 sm:gap-2 justify-center items-center">
              <div
                className="w-1/2 h-full rounded-xl sm:rounded-2xl p-2 sm:p-4 flex flex-col justify-between border"
                style={{
                  backgroundColor: "var(--card-bg)",
                  borderColor: "var(--border-color)",
                }}
              >
                <span className="text-[var(--sub-text-color)] text-[10px] sm:text-xs">{t("mainContent.todaysProgress")}</span>
                <div className="flex flex-col gap-1 sm:gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] sm:text-xs font-medium" style={{ color: "var(--text-color)" }}>
                      {t("mainContent.workHours")}
                    </span>
                    <span className="text-[10px] sm:text-xs" style={{ color: "var(--sub-text-color)" }}>{todayProgress}</span>
                  </div>
                  <div className="w-full bg-[var(--divider-color)] rounded-full h-1 sm:h-1.5">
                    <div className="bg-[var(--accent-color)] h-1 sm:h-1.5 rounded-full transition-all duration-500" style={{ width: `${todayProgressPercent}%` }}></div>
                  </div>
                </div>
              </div>
              <div className="w-1/2 h-full flex gap-1 sm:gap-2 justify-center items-center">
                <div
                  className="w-1/2 h-full rounded-xl sm:rounded-2xl p-2 sm:p-4 flex flex-col justify-center items-center border"
                  style={{
                    backgroundColor: "var(--card-bg)",
                    borderColor: "var(--border-color)",
                  }}
                >
                  <h3 className="text-lg sm:text-2xl font-bold" style={{ color: "var(--text-color)" }}>{stats.breaksCount}</h3>
                  <span className="text-[var(--sub-text-color)] text-[10px] sm:text-xs">{t("mainContent.break")}</span>
                </div>
                <div
                  className="w-1/2 h-full rounded-xl sm:rounded-2xl p-2 sm:p-4 flex flex-col justify-center items-center border"
                  style={{
                    backgroundColor: "var(--card-bg)",
                    borderColor: "var(--border-color)",
                  }}
                >
                  <h3 className="text-lg sm:text-2xl font-bold" style={{ color: "var(--text-color)" }}>{efficiency ? `${efficiency}%` : "0%"}</h3>
                  <span className="text-[var(--sub-text-color)] text-[10px] sm:text-xs">{t("mainContent.efficiency")}</span>
                </div>
              </div>
            </div>

            {/* Third Row */}
            <div className="w-full h-[80px] sm:h-[105px] flex gap-1 sm:gap-2 justify-center items-center">
              <div className="w-1/2 h-full flex gap-1 sm:gap-2 justify-center items-center">
                <div
                  className="w-1/2 h-full rounded-xl sm:rounded-2xl p-2 sm:p-4 flex flex-col justify-center items-center border"
                  style={{
                    backgroundColor: "var(--card-bg)",
                    borderColor: "var(--border-color)",
                  }}
                >
                  <h3 className="text-lg sm:text-2xl font-bold" style={{ color: "var(--text-color)" }}>{completedShift ? `${completedShift}%` : "0%"}</h3>
                  <span className="text-[var(--sub-text-color)] text-[8px] sm:text-xs text-center leading-tight">
                    {t("mainContent.complete")}
                  </span>
                </div>
                <div
                  className="w-1/2 h-full rounded-xl sm:rounded-2xl p-2 sm:p-4 flex flex-col justify-center items-center border"
                  style={{
                    backgroundColor: "var(--card-bg)",
                    borderColor: "var(--border-color)",
                  }}
                >
                  <h3 className="text-lg sm:text-2xl font-bold" style={{ color: "var(--text-color)" }}>{remainingTime}</h3>
                  <span className="text-[var(--sub-text-color)] text-[8px] sm:text-xs text-center leading-tight">
                    {t("mainContent.remaining")}
                  </span>
                </div>
              </div>
              <div className="w-1/2 h-full flex gap-1 sm:gap-2 justify-center items-center">
                <div
                  className="w-1/2 h-full rounded-xl sm:rounded-2xl p-2 sm:p-4 flex flex-col justify-center items-center border"
                  style={{
                    backgroundColor: "var(--card-bg)",
                    borderColor: "var(--border-color)",
                  }}
                >
                  <span className="text-[var(--sub-text-color)] text-[8px] sm:text-[10px] mb-1 text-center leading-tight">
                    {stats.mostProductiveDay?.day || t("mainContent.tuesday")}
                  </span>
                  <h3 className="text-sm sm:text-xl font-bold" style={{ color: "var(--text-color)" }}>{stats.mostProductiveDay?.time || "0h 0m"}</h3>
                  <span className="text-[var(--sub-text-color)] text-[8px] sm:text-[10px] text-center leading-tight">
                    {t("mainContent.mostProductiveDay")}
                  </span>
                </div>
                {/* Enhanced Focus Time Card with Timer Context */}
                <div
                  className={`w-1/2 h-full rounded-xl sm:rounded-2xl p-2 sm:p-4 flex flex-col justify-center items-center border transition-all duration-300 ${hasActiveTimer ? 'border-[#09D1C7] shadow-lg' : ''
                    }`}
                  style={{
                    backgroundColor: hasActiveTimer ? "var(--card-bg)" : "var(--card-bg)",
                    borderColor: hasActiveTimer ? "#09D1C7" : "var(--border-color)",
                  }}
                >
                  <div className="flex items-center gap-1 mb-1">
                    <Timer className={`w-2 h-2 sm:w-3 sm:h-3 ${hasActiveTimer ? 'text-[#09D1C7]' : 'text-[var(--sub-text-color)]'}`} />
                    <span className="text-[var(--sub-text-color)] text-[8px] sm:text-[10px] text-center leading-tight">
                      {hasActiveTimer ? t("mainContent.activeFocus") : t("mainContent.thisWeek")}
                    </span>
                  </div>
                  <h3 className={`text-sm sm:text-xl font-bold ${hasActiveTimer ? 'text-[#09D1C7]' : ''}`} style={{ color: hasActiveTimer ? "#09D1C7" : "var(--text-color)" }}>
                    {hasActiveTimer ? displayTime : (focusTimeData?.formattedTime || "0h 0m")}
                  </h3>

                  {/* Active timer status indicator */}
                  {hasActiveTimer && (
                    <div className="flex items-center gap-1 mt-1">
                      <div className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></div>
                      <span className="text-[6px] sm:text-[8px] text-[var(--sub-text-color)]">
                        {isRunning ? t("mainContent.running") : t("mainContent.paused")}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Enhanced Start Your Day Button */}
            <div className="w-full h-max pb-2 pt-2 flex justify-center items-center relative">
              {/* Tooltip - يظهر بس لو المستخدم مش عامل clock in */}
              {!hasCompletedToday && stats.currentStatus === "ClockedOut" && (
                <div
                  className="absolute -top-8 sm:-top-12 right-2 sm:right-4 bg-gradient-to-r bg-[var(--accent-color)] text-white text-[10px] sm:text-xs px-2 sm:px-3 py-1 sm:py-2 rounded-lg shadow-lg animate-bounce z-10"
                  style={{
                    animation: 'bounce 2s infinite',
                  }}
                >
                  <div className="relative">
                    {isAr ? 'اضغط هنا لبدء يومك!' : 'Click here to start your day!'}
                    {/* السهم الصغير */}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 sm:border-l-4 sm:border-r-4 sm:border-t-4 border-l-transparent border-r-transparent border-t-blue-500"></div>
                  </div>
                </div>
              )}

              <button
                className={`w-full text-white font-medium py-2 sm:py-3 px-4 sm:px-6 rounded-xl sm:rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 text-sm sm:text-base ${
                  hasCompletedToday 
                    ? 'cursor-not-allowed opacity-70' 
                    : 'cursor-pointer hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]'
                }`}
                style={{
                  background: hasCompletedToday
                    ? 'linear-gradient(135deg, #6B7280 0%, #9CA3AF 100%)'
                    : `linear-gradient(135deg, var(--accent-hover) 0%, var(--accent-color) 100%)`,
                }}
                onClick={handleClock}
                disabled={isClockingIn || isClockingOut || hasCompletedToday}
              >
                {hasCompletedToday ? (
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (isClockingIn || isClockingOut) ? (
                  <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                ) : (
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
                {hasCompletedToday
                  ? (isAr ? 'تم إكمال اليوم' : 'Completed Day')
                  : (isClockingIn || isClockingOut)
                    ? (isAr ? 'جاري التسجيل...' : 'Processing...')
                    : stats.currentStatus === "Clocked In"
                      ? (isAr ? 'إنهاء اليوم' : 'End Your Day')
                      : (isAr ? 'بدء اليوم' : 'Start Your Day')}
              </button>
            </div>
          </div>

          {/* Bottom Cards */}
          <div className="w-full max-w-4xl h-max flex flex-col sm:flex-row gap-2 sm:gap-5 justify-center items-center px-2 sm:px-0">
            <div
              className="w-full sm:w-1/2 h-full rounded-xl sm:rounded-[17px] p-3 sm:p-4 shadow-lg flex flex-col items-center gap-2 sm:gap-3 border"
              style={{
                backgroundColor: "var(--bg-color)",
                borderColor: "var(--border-color)",
              }}
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-teal-100 flex items-center justify-center">
                <ClipboardList className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--accent-color)]" />
              </div>
              <div className="text-center">
                <h3 className="text-base sm:text-lg font-semibold mb-1" style={{ color: "var(--text-color)" }}>
                  {t("mainContent.attendanceLogs")}
                </h3>
                <p className="text-[var(--sub-text-color)] text-[10px] sm:text-xs mb-2">
                  {t("mainContent.attendanceLogsDesc")}
                </p>
              </div>
              <button
                className="w-full text-white text-[10px] sm:text-xs font-medium py-2 px-3 rounded-xl transition-colors flex items-center justify-center gap-1"
                style={{
                  background: `linear-gradient(135deg, var(--accent-hover) 0%, var(--accent-color) 100%)`,
                }}
                onClick={() => navigate("/pages/User/attendance-logs")}
              >
                <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4" />
                {t("mainContent.viewAttendanceLogs")}
              </button>
            </div>
            <div
              className="w-full sm:w-1/2 h-full rounded-xl sm:rounded-[17px] shadow-lg p-3 sm:p-4 flex flex-col items-center gap-2 sm:gap-3 border"
              style={{
                backgroundColor: "var(--bg-color)",
                borderColor: "var(--border-color)",
              }}
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-teal-100 flex items-center justify-center">
                <Coffee className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--accent-color)]" />
              </div>
              <div className="text-center">
                <h3 className="text-base sm:text-lg font-semibold mb-1" style={{ color: "var(--text-color)" }}>
                  {t("mainContent.breakTracking")}
                </h3>
                <p className="text-[var(--sub-text-color)] text-[10px] sm:text-xs mb-2">
                  {t("mainContent.breakTrackingDesc")}
                </p>
              </div>
              <button
                className="w-full text-white text-[10px] sm:text-xs font-medium py-2 px-3 rounded-xl transition-colors flex items-center justify-center gap-1"
                style={{
                  background: `linear-gradient(135deg, var(--accent-hover) 0%, var(--accent-color) 100%)`,
                }}
                onClick={() => navigate("/pages/User/break-tracking")}
              >
                <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4" />
                {t("mainContent.viewBreakLogs")}
              </button>
            </div>
          </div>

        </div>
      )}
    </>
  )
}

export default MainContent
