import React, { useEffect, useRef, useState, useContext } from "react"
import { Clock, ClipboardList, Coffee, BarChart3, MapPin, Loader2, AlertCircle, CheckCircle2, Timer } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import toast from "react-hot-toast"
import { useTimer } from "../../contexts/TimerContext"
import { GlobalErrorContext } from "../../contexts/GlobalErrorContext"
import ErrorComponent from "../Error/Error"

const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Static dashboard data
const staticDashboardData = {
  dailyShift: "4h 30m",
  thisWeek: "42h 15m",
  breaksTaken: "5h 30m",
  breaksCount: 8,
  totalOvertime: "2h 45m",
  currentStatus: "Clocked In",
  activeWorkTime: "4h 30m",
  todayProgress: "4h 30m / 8h",
  efficiency: 85,
  completedShift: 56,
  remainingTime: "3h 30m",
  mostProductiveDay: { day: "Wednesday", time: "8h 30m" },
  clockInTime: new Date().toISOString()
};

// Static focus time data
const staticFocusTimeData = {
  total: "32h",
  average: "4h 34m",
  days: 7
};

const MainContent = () => {
  const { t, i18n } = useTranslation()
  const isAr = i18n.language === "ar"
  
  // Use static data instead of API calls
  const data = staticDashboardData;
  const isLoading = false;
  const error = null;
  const refetch = () => {};
  const focusTimeData = staticFocusTimeData;
  const isClockingIn = false;
  const isClockingOut = false;
  
  // Mock clock in/out handlers
  const clockIn = async () => ({ data: {} });
  const clockOut = async () => ({ data: {} });
  const navigate = useNavigate();
  const { setGlobalError } = useContext(GlobalErrorContext);

  // Enhanced timer context integration
  const { 
    timer, 
    isRunning, 
    isPaused,
    hasActiveTimer,
    displayTime,
    timer: { taskName, seconds, duration }
  } = useTimer()

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
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [offices, setOffices] = useState([])

  // احسب وقت البداية من الـ backend لو موجود
  const clockInTime = data?.clockInTime // لازم backend يرجع clockInTime بصيغة ISO

  // شغل التايمر لو المستخدم Clocked In
  useEffect(() => {
    if (stats.currentStatus === "Clocked In" && clockInTime) {
      const start = new Date(clockInTime)
      const updateTimer = () => {
        const now = new Date()
        const diff = Math.floor((now - start) / 1000)
        setActiveWorkSeconds(diff)
      }
      updateTimer()
      timerRef.current = setInterval(updateTimer, 1000)
      return () => clearInterval(timerRef.current)
    } else {
      setActiveWorkSeconds(0)
      if (timerRef.current) clearInterval(timerRef.current)
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
          resolve({ latitude, longitude, accuracy })
        },
        (error) => {
          setIsGettingLocation(false)
          toast.dismiss(loadingToast)
          let errorMessage = isAr ? 'خطأ في تحديد الموقع' : 'Location error'
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = isAr 
                ? 'تم رفض إذن الموقع. يرجى السماح بالوصول إلى الموقع' 
                : 'Location permission denied. Please allow location access'
              break
            case error.POSITION_UNAVAILABLE:
              errorMessage = isAr 
                ? 'الموقع غير متاح. تأكد من اتصال الإنترنت' 
                : 'Location unavailable. Check your internet connection'
              break
            case error.TIMEOUT:
              errorMessage = isAr 
                ? 'انتهت مهلة تحديد الموقع. يرجى المحاولة مرة أخرى' 
                : 'Location request timeout. Please try again'
              break
          }
          setGlobalError({
            title: isAr ? "خطأ في تحديد الموقع" : "Location Error",
            message: errorMessage,
            errorCode: "LOC",
            showRefresh: true,
            showHome: false,
            showBack: true,
          });
          reject(new window.Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 60000
        }
      )
    })
  }

  // Simple check if user completed attendance today
  const hasCompletedToday = data?.todayAttendance?.clockIn && data?.todayAttendance?.clockOut
  const isAlreadyClockedIn = stats.currentStatus === "Clocked In"

  // Simple handleClock function - just add confirmation for clock out
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

    try {
      console.log('Starting clock process...')
      
      // احصل على الموقع الحالي
      const location = await getCurrentLocation()
      console.log('Got location:', location)
      
      if (stats.currentStatus === "Clocked In") {
        await clockOut({ 
          latitude: location.latitude, 
          longitude: location.longitude 
        })
        
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
      } else {
        await clockIn({ 
          location: "office", 
          latitude: location.latitude, 
          longitude: location.longitude 
        })
        
        toast.success(
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            <span>{isAr ? 'تم تسجيل الحضور بنجاح' : 'Successfully clocked in'}</span>
          </div>,
          {
            duration: 3000,
            style: {
              background: '#10B981',
              color: '#fff',
            },
          }
        )
      }
      // Static data - no update needed
      refetch() // Empty function for compatibility
    } catch (e) {
      console.error('Clock process error:', e)
      
      // إذا فشل تحديد الموقع، اعرض خيارات الموقع
      setShowLocationModal(true)
    }
  }

  // دالة لتسجيل الحضور مع موقع محدد مع loading
  const handleClockWithLocation = async (locationData) => {
    const loadingToast = toast.loading(
      isAr ? 'جاري تسجيل الحضور...' : 'Recording attendance...',
      {
        style: {
          background: 'var(--card-bg)',
          color: 'var(--text-color)',
        },
      }
    )

    try {
      if (stats.currentStatus === "Clocked In") {
        await clockOut({ 
          latitude: locationData.latitude, 
          longitude: locationData.longitude 
        })
        
        toast.success(
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            <span>{isAr ? 'تم تسجيل الخروج بنجاح' : 'Successfully clocked out'}</span>
          </div>,
          {
            id: loadingToast,
            duration: 3000,
            style: {
              background: '#10B981',
              color: '#fff',
            },
          }
        )
      } else {
        await clockIn({ 
          location: "office", 
          latitude: locationData.latitude, 
          longitude: locationData.longitude 
        })
        
        toast.success(
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            <span>{isAr ? 'تم تسجيل الحضور بنجاح' : 'Successfully clocked in'}</span>
          </div>,
          {
            id: loadingToast,
            duration: 3000,
            style: {
              background: '#10B981',
              color: '#fff',
            },
          }
        )
      }
      // Static data - no update needed
      refetch() // Empty function for compatibility
      setShowLocationModal(false)
    } catch (error) {
      console.error('Clock with location error:', error)
      
      toast.error(
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <span>{isAr ? 'حدث خطأ في تسجيل الحضور' : 'Error recording attendance'}</span>
        </div>,
        {
          id: loadingToast,
          duration: 4000,
          style: {
            background: '#EF4444',
            color: '#fff',
          },
        }
      )
    }
  }

  // Fetch offices data when location modal is shown
  useEffect(() => {
    if (showLocationModal) {
      fetch(`${baseUrl}/api/attendance/offices`, { credentials: "include" })
        .then(res => res.json())
        .then(setOffices)
    }
  }, [showLocationModal])

  return (
    <div
      className="w-full h-max flex flex-col justify-center items-center"
      style={{
        backgroundColor: "var(--bg-color)",
        direction: isAr ? "rtl" : "ltr",
      }}
    >
      <div className="w-full h-max pb-5 flex flex-col gap-4 justify-center items-center">
        {/* First Row - Current Status & Active Work Time */}
        <div className="w-full h-[105px] flex gap-2 justify-center items-center">
          <div
            className="w-1/2 h-full rounded-2xl p-4 flex flex-col justify-between border"
            style={{
              backgroundColor: "var(--card-bg)",
              borderColor: "var(--border-color)",
            }}
          >
            <div className="flex items-center gap-2">
              <span className="text-[var(--sub-text-color)] text-xs">{t("mainContent.currentStatus")}</span>
              <div className={`w-2 h-2 rounded-full ${stats.currentStatus === "Clocked In" ? "bg-green-500" : "bg-red-500"}`}></div>
            </div>
            <h3 className="text-lg font-semibold" style={{ color: "var(--text-color)" }}>
              {stats.currentStatus === "Clocked In"
                ? t("clockIn")
                : t("clockOut")}
            </h3>
          </div>
          <div
            className="w-1/2 h-full rounded-2xl p-4 flex flex-col justify-between border"
            style={{
              backgroundColor: "var(--card-bg)",
              borderColor: "var(--border-color)",
            }}
          >
            <span className="text-[var(--sub-text-color)] text-xs">{t("mainContent.activeWorkTime")}</span>
            <h3 className="text-2xl font-bold" style={{ color: "var(--text-color)" }}>{activeWorkTime}</h3>
          </div>
        </div>
        {/* Second Row */}
        <div className="w-full h-[105px] flex gap-2 justify-center items-center">
          <div
            className="w-1/2 h-full rounded-2xl p-4 flex flex-col justify-between border"
            style={{
              backgroundColor: "var(--card-bg)",
              borderColor: "var(--border-color)",
            }}
          >
            <span className="text-[var(--sub-text-color)] text-xs">{t("mainContent.todaysProgress")}</span>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium" style={{ color: "var(--text-color)" }}>
                  {t("mainContent.workHours")}
                </span>
                <span className="text-xs" style={{ color: "var(--sub-text-color)" }}>{todayProgress}</span>
              </div>
              <div className="w-full bg-[var(--divider-color)] rounded-full h-1.5">
                <div className="bg-[var(--accent-color)] h-1.5 rounded-full transition-all duration-500" style={{ width: `${todayProgressPercent}%` }}></div>
              </div>
            </div>
          </div>
          <div className="w-1/2 h-full flex gap-2 justify-center items-center">
            <div
              className="w-1/2 h-full rounded-2xl p-4 flex flex-col justify-center items-center border"
              style={{
                backgroundColor: "var(--card-bg)",
                borderColor: "var(--border-color)",
              }}
            >
              <h3 className="text-2xl font-bold" style={{ color: "var(--text-color)" }}>{stats.breaksCount}</h3>
              <span className="text-[var(--sub-text-color)] text-xs">{t("mainContent.break")}</span>
            </div>
            <div
              className="w-1/2 h-full rounded-2xl p-4 flex flex-col justify-center items-center border"
              style={{
                backgroundColor: "var(--card-bg)",
                borderColor: "var(--border-color)",
              }}
            >
              <h3 className="text-2xl font-bold" style={{ color: "var(--text-color)" }}>{efficiency ? `${efficiency}%` : "0%"}</h3>
              <span className="text-[var(--sub-text-color)] text-xs">{t("mainContent.efficiency")}</span>
            </div>
          </div>
        </div>
        {/* Third Row */}
        <div className="w-full h-[105px] flex gap-2 justify-center items-center">
          <div className="w-1/2 h-full flex gap-2 justify-center items-center">
            <div
              className="w-1/2 h-full rounded-2xl p-4 flex flex-col justify-center items-center border"
              style={{
                backgroundColor: "var(--card-bg)",
                borderColor: "var(--border-color)",
              }}
            >
              <h3 className="text-2xl font-bold" style={{ color: "var(--text-color)" }}>{completedShift ? `${completedShift}%` : "0%"}</h3>
              <span className="text-[var(--sub-text-color)] text-xs text-center leading-tight">
                {t("mainContent.complete")}
              </span>
            </div>
            <div
              className="w-1/2 h-full rounded-2xl p-4 flex flex-col justify-center items-center border"
              style={{
                backgroundColor: "var(--card-bg)",
                borderColor: "var(--border-color)",
              }}
            >
              <h3 className="text-2xl font-bold" style={{ color: "var(--text-color)" }}>{remainingTime}</h3>
              <span className="text-[var(--sub-text-color)] text-xs text-center leading-tight">
                {t("mainContent.remaining")}
              </span>
            </div>
          </div>
          <div className="w-1/2 h-full flex gap-2 justify-center items-center">
            <div
              className="w-1/2 h-full rounded-2xl p-4 flex flex-col justify-center items-center border"
              style={{
                backgroundColor: "var(--card-bg)",
                borderColor: "var(--border-color)",
              }}
            >
              <span className="text-[var(--sub-text-color)] text-[10px] mb-1 text-center leading-tight">
                {stats.mostProductiveDay?.day || t("mainContent.tuesday")}
              </span>
              <h3 className="text-xl font-bold" style={{ color: "var(--text-color)" }}>{stats.mostProductiveDay?.time || "0h 0m"}</h3>
              <span className="text-[var(--sub-text-color)] text-[10px] text-center leading-tight">
                {t("mainContent.mostProductiveDay")}
              </span>
            </div>


          </div>
        </div>
        {/* Enhanced Start Your Day Button */}
        <div className="w-full h-max pb-2 pt-2 flex justify-center items-center">
          <button
            className="w-full text-white cursor-pointer font-medium py-3 px-6 rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: hasCompletedToday 
                ? 'linear-gradient(135deg, #6B7280 0%, #9CA3AF 100%)' // Gray when completed
                : `linear-gradient(135deg, var(--accent-hover) 0%, var(--accent-color) 100%)`,
              opacity: hasCompletedToday ? 0.7 : 1,
            }}
            onClick={handleClock}
            disabled={isClockingIn || isClockingOut || isGettingLocation || hasCompletedToday}
          >
            {hasCompletedToday ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (isClockingIn || isClockingOut || isGettingLocation) ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Clock className="w-5 h-5" />
            )}
            {hasCompletedToday 
              ? (isAr ? 'تم تسجيل الحضور اليوم' : 'Completed Today')
              : isGettingLocation 
              ? (isAr ? 'جاري تحديد الموقع...' : 'Getting location...')
              : (isClockingIn || isClockingOut)
              ? (isAr ? 'جاري التسجيل...' : 'Processing...')
              : stats.currentStatus === "Clocked In"
              ? "End Your Day"
              : "Start Your Day"}
          </button>
        </div>
      </div>



      {/* Enhanced Location Selection Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div 
            className="rounded-2xl p-6 max-w-md w-full shadow-2xl border animate-in slide-in-from-bottom-4 duration-300"
            style={{
              backgroundColor: "var(--card-bg)",
              borderColor: "var(--border-color)",
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold" style={{ color: "var(--text-color)" }}>
                {isAr ? 'اختر موقعك' : 'Select Your Location'}
              </h3>
            </div>
            
            <p className="text-sm mb-6" style={{ color: "var(--sub-text-color)" }}>
              {isAr ? 'فشل في تحديد الموقع تلقائياً. يرجى اختيار موقعك:' : 'Failed to get location automatically. Please select your location:'}
            </p>
            
            <div className="space-y-3">
              {offices.map((office) => (
                <button
                  key={office._id}
                  onClick={() => handleClockWithLocation({ latitude: office.latitude, longitude: office.longitude, name: office.name })}
                  className="w-full p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-md hover:scale-[1.02] group"
                  style={{ 
                    borderColor: "var(--border-color)",
                    backgroundColor: "var(--bg-color)",
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <span className="text-white text-xl">🏢</span>
                    </div>
                    <div className="text-left flex-1">
                      <div className="font-semibold text-lg" style={{ color: "var(--text-color)" }}>
                        {office.name}
                      </div>
                      <div className="text-xs" style={{ color: "var(--sub-text-color)" }}>
                        {office.latitude.toFixed(3)}°N, {office.longitude.toFixed(3)}°E
                      </div>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  </div>
                </button>
              ))}
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowLocationModal(false)}
                className="flex-1 px-4 py-3 border rounded-xl font-medium transition-all duration-200 hover:shadow-md"
                style={{ 
                  borderColor: "var(--border-color)",
                  color: "var(--text-color)",
                }}
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MainContent
