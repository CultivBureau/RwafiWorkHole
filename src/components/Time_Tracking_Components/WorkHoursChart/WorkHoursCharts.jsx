"use client"

import { useState, useEffect, useMemo, useRef } from "react"
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
import {
  useGetCurrentWeekWorkingHoursQuery,
  useGetCurrentMonthWorkingHoursQuery,
} from "../../../services/apis/DashboardApi"

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const filterOptions = [
  { value: "week", label: "Week", labelAr: "أسبوع" },
  { value: "month", label: "Month", labelAr: "شهر" },
]

const weekDayOrder = [
  { key: "Monday", labelEn: "Mon", labelAr: "الاثنين" },
  { key: "Tuesday", labelEn: "Tue", labelAr: "الثلاثاء" },
  { key: "Wednesday", labelEn: "Wed", labelAr: "الأربعاء" },
  { key: "Thursday", labelEn: "Thu", labelAr: "الخميس" },
  { key: "Friday", labelEn: "Fri", labelAr: "الجمعة" },
  { key: "Saturday", labelEn: "Sat", labelAr: "السبت" },
  { key: "Sunday", labelEn: "Sun", labelAr: "الأحد" },
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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  const {
    data: weekWorkingHours = [],
    isLoading: isWeekLoading,
    isFetching: isWeekFetching,
  } = useGetCurrentWeekWorkingHoursQuery()

  const {
    data: monthWorkingHours = [],
    isLoading: isMonthLoading,
    isFetching: isMonthFetching,
  } = useGetCurrentMonthWorkingHoursQuery()

  const weekChartData = useMemo(() => {
    const mapped = (Array.isArray(weekWorkingHours) ? weekWorkingHours : []).reduce(
      (acc, item) => {
        const key = String(item?.dayName || "").toLowerCase()
        const hours = typeof item?.totalHours === "number" ? item.totalHours : Number(item?.totalHours) || 0
        if (key) {
          acc[key] = (acc[key] || 0) + hours
        }
        return acc
      },
      {}
    )

    return weekDayOrder.map((day) => ({
      label: isAr ? day.labelAr : day.labelEn,
      hours: mapped[day.key.toLowerCase()] || mapped[day.labelEn.toLowerCase()] || 0,
    }))
  }, [weekWorkingHours, isAr])

  const monthChartData = useMemo(() => {
    const formatted = (Array.isArray(monthWorkingHours) ? monthWorkingHours : []).map((item, idx) => {
      const weekNumber = Number.isFinite(item?.weekNumber) ? item.weekNumber : idx + 1
      const hours = typeof item?.totalHours === "number" ? item.totalHours : Number(item?.totalHours) || 0
      const label = isAr ? `الأسبوع ${weekNumber}` : `Week ${weekNumber}`
      return { label, hours }
    })

    if (formatted.length > 0) {
      return formatted
    }

    return Array.from({ length: 4 }, (_, index) => ({
      label: isAr ? `الأسبوع ${index + 1}` : `Week ${index + 1}`,
      hours: 0,
    }))
  }, [monthWorkingHours, isAr])

  const chartData = filter === "month" ? monthChartData : weekChartData
  const isChartLoading = filter === "month" ? (isMonthLoading || isMonthFetching) : (isWeekLoading || isWeekFetching)

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
    }

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isDropdownOpen])

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
        <div className="relative flex items-center" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="rounded-full px-4 py-1.5 pr-8 text-xs font-semibold focus:outline-none transition-all duration-200 hover:scale-105 flex items-center gap-2"
            style={{
              minWidth: 100,
              background: "#fff",
              color: chartColors.chartBarColor,
              border: `1px solid ${chartColors.chartBarColor}`,
              direction: isAr ? "rtl" : "ltr"
            }}
          >
            <span>
              {isAr 
                ? filterOptions.find(opt => opt.value === filter)?.labelAr 
                : filterOptions.find(opt => opt.value === filter)?.label}
            </span>
            <ChevronDown
              className={`w-3 h-3 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
              style={{              
                color: chartColors.chartBarColor,
              }}
            />
          </button>
          {isDropdownOpen && (
            <div
              className="absolute top-full mt-1 rounded-lg shadow-lg overflow-hidden z-50"
              style={{
                minWidth: 100,
                background: "#fff",
                border: `1px solid ${chartColors.chartBarColor}`,
                [isAr ? "left" : "right"]: 0,
              }}
            >
              {(isAr ? [...filterOptions].reverse() : filterOptions).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setFilter(option.value)
                    setIsDropdownOpen(false)
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-semibold transition-colors duration-150"
                  style={{
                    color: filter === option.value ? "#fff" : chartColors.chartBarColor,
                    background: filter === option.value ? chartColors.chartBarColor : "transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (filter !== option.value) {
                      e.currentTarget.style.background = chartColors.chartBarColor
                      e.currentTarget.style.color = "#fff"
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (filter !== option.value) {
                      e.currentTarget.style.background = "transparent"
                      e.currentTarget.style.color = chartColors.chartBarColor
                    }
                  }}
                >
                  {isAr ? option.labelAr : option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Chart */}
      <div className="relative h-60"> {/* h-72 → h-60 */}
        {isChartLoading ? (
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