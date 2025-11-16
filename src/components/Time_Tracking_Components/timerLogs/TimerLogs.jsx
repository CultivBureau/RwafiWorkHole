import { useState, useEffect, useMemo } from "react"
import { Eye } from "lucide-react"
import { useTranslation } from "react-i18next"

const TIMER_LOGS_KEY = "workhole_timer_logs"

// Get timer logs from localStorage
const getTimerLogsFromStorage = () => {
  try {
    const stored = localStorage.getItem(TIMER_LOGS_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch {
    // Ignore parse errors
  }
  return []
}

export function TimeFocusLogs({ refreshTrigger }) {
  const { t, i18n } = useTranslation()
  const isAr = i18n.language === "ar"
  
  // Get timer logs from localStorage (TimerContext stores them there)
  const logs = useMemo(() => {
    return getTimerLogsFromStorage()
  }, [refreshTrigger])
  
  const isLoading = false
  const refetch = () => {
    // Timer logs are stored in localStorage, so refetch just triggers a re-render
    // The refreshTrigger prop will cause useMemo to recalculate
  }
  
  const [showModal, setShowModal] = useState(false)
  const [lastRefreshTrigger, setLastRefreshTrigger] = useState(refreshTrigger)

  // Only refetch when refreshTrigger actually changes
  useEffect(() => {
    if (refreshTrigger !== lastRefreshTrigger) {
      setLastRefreshTrigger(refreshTrigger)
      refetch()
    }
  }, [refreshTrigger, lastRefreshTrigger, refetch])

  // Only refetch when modal opens, not on every state change
  useEffect(() => {
    if (showModal) {
      refetch()
    }
  }, [showModal, refetch])

  const localizeMin = (duration) => (isAr ? duration.replace("min", "دقيقة") : duration)

  // Format duration from seconds/minutes
  const formatDuration = (timer) => {
    if (timer.actualDurationSeconds)
      return `${String(Math.floor(timer.actualDurationSeconds / 60)).padStart(2, "0")}:${String(
        timer.actualDurationSeconds % 60
      ).padStart(2, "0")} min`
    if (timer.actualDuration) return `${String(timer.actualDuration).padStart(2, "0")}:00 min`
    return `${String(timer.duration).padStart(2, "0")}:00 min`
  }

  // Format time
  const formatTime = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString(isAr ? "ar-EG" : "en-US", { hour: "2-digit", minute: "2-digit" })
  }

  // Theme reactivity for tag colors
  const getTagColors = () => {
    const theme = document.documentElement.getAttribute("data-theme") || "light"
    const isDark = theme === "dark"
    return {
      tagBg: isDark ? "#232b32" : "#F5F5F5",
      tagText: isDark ? "#E6F4F4" : "var(--text-color)",
    }
  }

  const [tagColors, setTagColors] = useState(getTagColors())

  useEffect(() => {
    const updateColors = () => setTagColors(getTagColors())
    const observer = new MutationObserver(updateColors)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] })
    observer.observe(document.body, { attributes: true, attributeFilter: ['data-theme', 'class'] })
    updateColors()
    return () => observer.disconnect()
  }, [])

  // Sort logs by startTime (newest first) and take first 4
  const sortedLogs = [...logs].sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
  const newestLogs = sortedLogs.slice(0, 4)

  return (
    <div
      className="bg-[var(--bg-color)] rounded-xl sm:rounded-2xl p-2 sm:p-4 shadow-sm border border-[var(--border-color)] h-full lg:min-h-[200px]  xl:min-h-[300px]"
      style={{ direction: isAr ? "rtl" : "ltr" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2 sm:mb-4">
        <h1 className="text-lg sm:text-xl font-normal" style={{ color: "var(--text-color)" }}>
          {t("timerLogs.title")}
        </h1>
        <button
          className="flex items-center gap-1 text-[var(--accent-color)] border border-[var(--border-color)] bg-[var(--bg-color)] px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl font-medium text-[10px] sm:text-xs transition-colors hover:bg-[var(--hover-color)]"
          onClick={() => setShowModal(true)}
        >
          <Eye className="w-3 h-3 sm:w-4 sm:h-4" style={{ color: "var(--sub-text-color)" }} />
          <span className="hidden xs:inline">{t("timerLogs.viewLogs")}</span>
          <span className="xs:hidden">{isAr ? "عرض" : "View"}</span>
        </button>
      </div>

      {/* Column Headers */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-2 sm:mb-3 pb-1 sm:pb-2 border-b border-[var(--divider-color)]">
        <div className="text-[var(--sub-text-color)] text-[10px] sm:text-xs font-medium">{t("timerLogs.time")}</div>
        <div className="text-[var(--sub-text-color)] text-[10px] sm:text-xs font-medium">{t("timerLogs.duration")}</div>
        <div className="text-[var(--sub-text-color)] text-[10px] sm:text-xs font-medium">{t("timerLogs.tag")}</div>
      </div>

      {/* Log Entries - Show newest 4 */}
      <div className="space-y-2 sm:space-y-3">
        {(isLoading ? [] : newestLogs).map((log, idx) => (
          <div
            key={log.id}
            className={`grid grid-cols-3 gap-2 sm:gap-3 items-center py-1 sm:py-2 ${idx !== newestLogs.length - 1 ? "border-b border-[var(--divider-color)]" : ""
              }`}
          >
            <div className="text-[var(--sub-text-color)] text-[10px] sm:text-xs">{formatTime(log.startTime)}</div>
            <div className="text-[var(--text-color)] text-[10px] sm:text-xs font-medium">
              {localizeMin(formatDuration(log))}
            </div>
            <div className="flex items-center gap-1">
              <span
                className="px-1.5 sm:px-2 py-0.5 rounded-md sm:rounded-lg text-[8px] sm:text-[10px] truncate max-w-full"
                style={{ background: tagColors.tagBg, color: tagColors.tagText }}
                title={log.tag}
              >
                {log.tag}
              </span>
            </div>
          </div>
        ))}
        
        {/* Show message if no logs */}
        {!isLoading && newestLogs.length === 0 && (
          <div className="text-center py-4 sm:py-8">
            <p className="text-[var(--sub-text-color)] text-xs sm:text-sm">
              {isAr ? "لا توجد سجلات مؤقت متاحة" : "No timer logs available"}
            </p>
          </div>
        )}
      </div>

      {/* Full Screen Modal - Show all logs */}
      {showModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-lg bg-opacity-40 z-50 flex items-center justify-center p-2 sm:p-4">
          <div 
            className="rounded-xl sm:rounded-2xl shadow-2xl p-3 sm:p-6 w-full max-w-xs sm:max-w-4xl h-[85vh] sm:max-h-[90vh] flex flex-col"
            style={{ 
              backgroundColor: "var(--card-bg)",
              borderColor: "var(--border-color)",
              border: "1px solid var(--border-color)"
            }}
          >
            {/* Fixed Header */}
            <div className="flex justify-between items-center mb-3 sm:mb-6 flex-shrink-0">
              <h2 className="text-lg sm:text-2xl font-bold" style={{ color: "var(--text-color)" }}>
                {t("timerLogs.title")}
              </h2>
              <button
                className="text-gray-500 hover:text-gray-700 font-bold text-lg sm:text-xl transition-colors p-1"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>
            
            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-hidden">
              {/* Mobile View - Stack Layout */}
              <div className="block sm:hidden h-full">
                <div className="h-full overflow-y-auto space-y-2 pr-1" style={{ 
                  WebkitOverflowScrolling: 'touch',
                  scrollBehavior: 'smooth'
                }}>
                  {(isLoading ? [] : sortedLogs).map((log, idx) => (
                    <div
                      key={log._id}
                      className="bg-[var(--hover-color)] rounded-lg p-3 space-y-2"
                    >
                      <div className="flex justify-between items-start">
                        <div className="text-[var(--text-color)] text-sm font-medium">
                          {formatTime(log.startTime)}
                        </div>
                        <span
                          className={`px-2 py-1 rounded-full text-[10px] font-semibold ${
                            log.status === "completed"
                              ? "bg-green-100 text-green-700"
                              : log.status === "cancelled"
                                ? "bg-red-100 text-red-700"
                                : log.status === "paused"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : log.status === "running"
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {log.status === "completed"
                            ? t("timerLogs.completed") || "Completed"
                            : log.status === "cancelled"
                              ? t("timerLogs.cancelled") || "Cancelled"
                              : log.status === "paused"
                                ? t("timerLogs.paused") || "Paused"
                                : log.status === "running"
                                  ? t("timerLogs.running") || "Running"
                                  : log.status}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="text-[var(--sub-text-color)] text-xs">
                          {localizeMin(formatDuration(log))}
                        </div>
                        <span
                          className="px-2 py-1 rounded-md text-[10px]"
                          style={{ background: tagColors.tagBg, color: tagColors.tagText }}
                        >
                          {log.tag}
                        </span>
                      </div>
                    </div>
                  ))}
                  
                  {/* Show message if no logs */}
                  {!isLoading && sortedLogs.length === 0 && (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[var(--divider-color)] flex items-center justify-center">
                        <Eye className="w-6 h-6 text-[var(--sub-text-color)]" />
                      </div>
                      <p className="text-[var(--sub-text-color)] text-sm font-medium">
                        {isAr ? "لا توجد سجلات مؤقت متاحة" : "No timer logs available"}
                      </p>
                      <p className="text-[var(--sub-text-color)] text-xs mt-2">
                        {isAr ? "ابدأ مؤقتك الأول لرؤية السجلات هنا" : "Start your first timer to see logs here"}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Desktop View - Table Layout */}
              <div className="hidden sm:block h-full">
                <div className="h-full overflow-y-auto" style={{ 
                  WebkitOverflowScrolling: 'touch',
                  scrollBehavior: 'smooth'
                }}>
                  {/* Column Headers */}
                  <div className="grid grid-cols-4 gap-4 mb-4 pb-3 border-b border-[var(--divider-color)] sticky top-0 bg-[var(--card-bg)] z-10">
                    <div className="text-[var(--sub-text-color)] text-sm font-semibold">{t("timerLogs.time")}</div>
                    <div className="text-[var(--sub-text-color)] text-sm font-semibold">{t("timerLogs.duration")}</div>
                    <div className="text-[var(--sub-text-color)] text-sm font-semibold">{t("timerLogs.tag")}</div>
                    <div className="text-[var(--sub-text-color)] text-sm font-semibold">{t("timerLogs.status") || "Status"}</div>
                  </div>
                  
                  {/* All Log Entries - Sorted by newest first */}
                  <div className="space-y-3 pb-4">
                    {(isLoading ? [] : sortedLogs).map((log, idx) => (
                      <div
                        key={log._id}
                        className={`grid grid-cols-4 gap-4 items-center py-3 px-2 rounded-lg hover:bg-[var(--hover-color)] transition-colors ${
                          idx !== sortedLogs.length - 1 ? "border-b border-[var(--divider-color)]" : ""
                        }`}
                      >
                        <div className="text-[var(--sub-text-color)] text-sm">{formatTime(log.startTime)}</div>
                        <div className="text-[var(--text-color)] text-sm font-medium">
                          {localizeMin(formatDuration(log))}
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className="px-3 py-1 rounded-lg text-xs font-medium"
                            style={{ background: tagColors.tagBg, color: tagColors.tagText }}
                          >
                            {log.tag}
                          </span>
                        </div>
                        <div className="text-xs font-semibold">
                          <span
                            className={`px-2 py-1 rounded-full ${
                              log.status === "completed"
                                ? "bg-green-100 text-green-700"
                                : log.status === "cancelled"
                                  ? "bg-red-100 text-red-700"
                                  : log.status === "paused"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : log.status === "running"
                                      ? "bg-blue-100 text-blue-700"
                                      : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {log.status === "completed"
                              ? t("timerLogs.completed") || "Completed"
                              : log.status === "cancelled"
                                ? t("timerLogs.cancelled") || "Cancelled"
                                : log.status === "paused"
                                  ? t("timerLogs.paused") || "Paused"
                                  : log.status === "running"
                                    ? t("timerLogs.running") || "Running"
                                    : log.status}
                          </span>
                        </div>
                      </div>
                    ))}
                    
                    {/* Show message if no logs */}
                    {!isLoading && sortedLogs.length === 0 && (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--divider-color)] flex items-center justify-center">
                          <Eye className="w-8 h-8 text-[var(--sub-text-color)]" />
                        </div>
                        <p className="text-[var(--sub-text-color)] text-lg font-medium">
                          {isAr ? "لا توجد سجلات مؤقت متاحة" : "No timer logs available"}
                        </p>
                        <p className="text-[var(--sub-text-color)] text-sm mt-2">
                          {isAr ? "ابدأ مؤقتك الأول لرؤية السجلات هنا" : "Start your first timer to see logs here"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TimeFocusLogs
