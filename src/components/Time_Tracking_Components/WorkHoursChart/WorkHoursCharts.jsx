"use client"

import { useState, useEffect, useMemo } from "react"
import { ChevronDown } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Bar } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js"
import { useGetUserClockinLogsQuery } from "../../../services/apis/ClockinLogApi"
import { getAuthToken } from "../../../utils/page"
import { calculateDurationFromUtc } from "../../../utils/timeUtils"

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

// Ensure API timestamps without explicit timezone are treated as UTC
const normalizeUtcString = (value) => {
  if (!value) return null

  if (value instanceof Date) {
    return value.toISOString()
  }

  if (typeof value !== "string") {
    return null
  }

  const trimmed = value.trim()

  // If it's an ISO string without timezone info, assume it's UTC by appending 'Z'
  if (!trimmed.endsWith("Z") && !trimmed.includes("+") && !trimmed.includes("-", 10)) {
    return `${trimmed}Z`
  }

  return trimmed
}

// Helper function to calculate duration in seconds from clock-in/out times
const calculateDuration = (clockinTime, clockoutTime) => {
  const startUtc = normalizeUtcString(clockinTime)
  if (!startUtc) return 0

  const endUtc = clockoutTime ? normalizeUtcString(clockoutTime) : null
  return calculateDurationFromUtc(startUtc, endUtc)
}

// Helper function to get start of week (Monday)
const getWeekStart = (date = new Date()) => {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
  return new Date(d.setDate(diff))
}

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const filterOptions = [
  { value: "week", label: "Week", labelAr: "أسبوع" },
  { value: "month", label: "Month", labelAr: "شهر" },
]

// Use the same bar color for both light and dark mode, but get from CSS variable for live theme update
const getCssVar = (name, fallback) => {
  if (typeof window === "undefined") return fallback
  return getComputedStyle(document.documentElement).getPropertyValue(name)?.trim() || fallback
}

const WorkHoursCharts = () => {
  const { t, i18n } = useTranslation()
  const isAr = i18n.language === "ar"

  // Filter state for week/month
  const [filter, setFilter] = useState("week")
  
  // Get user ID and fetch clock-in logs
  const userId = useMemo(() => deriveUserId(), [])
  const { data: clockinLogsData, isLoading } = useGetUserClockinLogsQuery(
    { userId, pageNumber: 1, pageSize: 50 },
    { skip: !userId }
  )

  // Calculate work hours chart data from clock-in logs
  const workHoursChart = useMemo(() => {
    if (!clockinLogsData || filter === "month") {
      // For month view, return empty for now (can be implemented later)
      return [
        { label: "Mon", hours: 0 },
        { label: "Tue", hours: 0 },
        { label: "Wed", hours: 0 },
        { label: "Thu", hours: 0 },
        { label: "Fri", hours: 0 },
        { label: "Sat", hours: 0 },
        { label: "Sun", hours: 0 }
      ]
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

    // Get week start
    const today = new Date()
    const weekStart = getWeekStart(today)
    weekStart.setHours(0, 0, 0, 0)

    // Group logs by day of week
    const dayHours = new Map()
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    
    items.forEach(log => {
      if (!log?.clockinTime) return

      const normalizedClockIn = normalizeUtcString(log.clockinTime)
      if (!normalizedClockIn) return

      const logDate = new Date(normalizedClockIn)
      if (Number.isNaN(logDate.getTime())) return
      logDate.setHours(0, 0, 0, 0)
      
      // Only include logs from this week
      if (logDate >= weekStart) {
        const dayOfWeek = dayNames[logDate.getDay()]
        const duration = calculateDuration(log.clockinTime, log.clockoutTime)
        const hours = duration / 3600
        dayHours.set(dayOfWeek, (dayHours.get(dayOfWeek) || 0) + hours)
      }
    })

    // Return in order: Mon, Tue, Wed, Thu, Fri, Sat, Sun
    return [
      { label: "Mon", hours: dayHours.get("Mon") || 0 },
      { label: "Tue", hours: dayHours.get("Tue") || 0 },
      { label: "Wed", hours: dayHours.get("Wed") || 0 },
      { label: "Thu", hours: dayHours.get("Thu") || 0 },
      { label: "Fri", hours: dayHours.get("Fri") || 0 },
      { label: "Sat", hours: dayHours.get("Sat") || 0 },
      { label: "Sun", hours: dayHours.get("Sun") || 0 }
    ]
  }, [clockinLogsData, filter])

  // Theme reactivity: update chart colors when theme changes
  const [chartColors, setChartColors] = useState({
    chartBarColor: getCssVar('--chart-bar', '#5EC6C6'),
    chartLabelColor: getCssVar('--chart-label', '#B0B0B0'),
    chartGridColor: getCssVar('--chart-grid', '#E0FFFD'),
    chartBg: getCssVar('--chart-bg', '#fff'),
    chartBorder: getCssVar('--chart-border', '#E0FFFD'),
  })

  useEffect(() => {
    const updateColors = () => {
      setChartColors({
        chartBarColor: getCssVar('--chart-bar', '#5EC6C6'),
        chartLabelColor: getCssVar('--chart-label', '#B0B0B0'),
        chartGridColor: getCssVar('--chart-grid', '#E0FFFD'),
        chartBg: getCssVar('--chart-bg', '#fff'),
        chartBorder: getCssVar('--chart-border', '#E0FFFD'),
      })
    }

    // Listen for theme changes (class or attribute changes on <html> or <body>)
    const observer = new MutationObserver(updateColors)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] })
    observer.observe(document.body, { attributes: true, attributeFilter: ['data-theme', 'class'] })

    // Also update on mount
    updateColors()

    return () => observer.disconnect()
  }, [])

  // Use workHoursChart directly from useMemo
  const chartData = workHoursChart
  const dayLabels = chartData.map((item) => item.label)

  // Calculate maximum hours for scale
  const maxHours = Math.max(8, ...chartData.map((d) => d.hours))

  // Chart.js data configuration
  const chartJsData = {
    labels: dayLabels,
    datasets: [
      {
        label: t("mainContent.workHours"),
        data: chartData.map((item) => item.hours),
        backgroundColor: chartColors.chartBarColor,
        borderRadius: 16,
        barThickness: 32,
      },
    ],
  }

  // Chart.js options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.parsed.y}h`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: Math.ceil(maxHours),
        ticks: {
          stepSize: Math.ceil(maxHours / 4),
          color: chartColors.chartLabelColor,
          font: {
            size: 12,
          },
        },
        grid: {
          color: chartColors.chartGridColor,
          drawBorder: false,
        },
      },
      x: {
        ticks: {
          color: chartColors.chartLabelColor,
          font: {
            size: 12,
          },
        },
        grid: {
          display: false,
        },
      },
    },
  }

  return (
    <div
      className="rounded-2xl p-6 shadow-lg border"
      style={{
        direction: isAr ? "rtl" : "ltr",
        background: chartColors.chartBg,
        borderColor: chartColors.chartBorder,
      }}
    >
      {/* Header + Filter */}
      <div className="flex items-center justify-between mb-4"> {/* mb-6 → mb-4 */}
        <h2 className="text-xl font-bold" style={{ color: "var(--text-color)" }}> {/* text-2xl → text-xl */}
          {t("mainContent.workHours")}
        </h2>
        <div className="relative flex items-center">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-full px-4 py-1.5 pr-8 text-xs font-semibold appearance-none focus:outline-none transition-all duration-200 hover:scale-105"
            style={{
              minWidth: 100,
              background: chartColors.chartBarColor,
              color: "#fff",
              border: "none",
              direction: isAr ? "rtl" : "ltr"
            }}
          >
            {(isAr ? [...filterOptions].reverse() : filterOptions).map((option) => (
              <option key={option.value} value={option.value}>
                {isAr ? option.labelAr : option.label}
              </option>
            ))}
          </select>
          <ChevronDown
            className={`absolute ${isAr ? "left-3" : "right-3"} top-1/2 transform -translate-y-1/2 w-3 h-3`} // left-4/right-4 w-4 h-4 → left-3/right-3 w-3 h-3
            style={{ color: "#fff" }}
          />
        </div>
      </div>
      {/* Chart */}
      <div className="relative h-60"> {/* h-72 → h-60 */}
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <span className="text-xs text-gray-600">Loading...</span> {/* text-gray-600 → text-xs text-gray-600 */}
          </div>
        ) : (
          <Bar data={chartJsData} options={chartOptions} />
        )}
      </div>
    </div>
  )
}

export default WorkHoursCharts