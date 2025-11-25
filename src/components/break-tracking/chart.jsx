"use client";

import React, { useMemo, useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown } from "lucide-react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import {
  useGetCurrentWeekBreakUsageQuery,
  useGetCurrentMonthBreakUsageByTypeQuery,
} from "../../services/apis/DashboardApi";

const breakTypeKeys = {
  Prayer: "breakTime.reasons.Prayer",
  Toilet: "breakTime.reasons.Toilet",
  smooking: "breakTime.reasons.smooking",
  hmam: "breakTime.reasons.hmam",
  drink: "breakTime.reasons.drink",
  sleep: "breakTime.reasons.sleep",
};

const filterOptions = [
  { value: "week", labelKey: "breakChart.week", fallback: "Week" },
  { value: "month", labelKey: "breakChart.month", fallback: "Month" },
];

const colorPalette = [
  "#C8E6E2",
  "#9ED5D1",
  "#63C1BB",
  "#3A9295",
  "#105F68",
  "#60A5FA",
  "#FCD34D",
  "#C084FC",
  "#FB7185",
  "#14B8A6",
];

const parseMinutes = (value) => {
  if (typeof value === "number") return value;
  if (!value) return 0;
  const match = value.toString().match(/-?\d+(\.\d+)?/);
  return match ? parseFloat(match[0]) : 0;
};

ChartJS.register(ArcElement, Tooltip, Legend);

const BreakTypeChart = ({ data = [], isLoading = false }) => {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === "ar";
  const [filter, setFilter] = useState("week");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const accentColor = "#5EC6C6";

  const {
    data: weekBreakUsage = [],
    isLoading: isWeekLoading,
    isFetching: isWeekFetching,
  } = useGetCurrentWeekBreakUsageQuery();

  const {
    data: monthBreakUsage = [],
    isLoading: isMonthLoading,
    isFetching: isMonthFetching,
  } = useGetCurrentMonthBreakUsageByTypeQuery();

  const selectedBreakUsage = filter === "month" ? monthBreakUsage : weekBreakUsage;
  const isChartLoading = filter === "month" 
    ? (isMonthLoading || isMonthFetching) 
    : (isWeekLoading || isWeekFetching);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  const normalizedData = useMemo(() => {
    // Use API data if available, otherwise fallback to props data
    if (Array.isArray(selectedBreakUsage) && selectedBreakUsage.length > 0) {
      return selectedBreakUsage
        .map((item, idx) => {
          const breakName = item?.breakName?.trim() || "";
          const translationKey = breakName ? `breakTime.reasons.${breakName}` : "";
          const minutes = typeof item?.totalMinutes === "number"
            ? item.totalMinutes
            : Number(item?.totalMinutes) || 0;

          return {
            id: `${breakName || "break"}-${idx}`,
            label: breakName ? t(translationKey, breakName) : t("breakChart.unknown", "Other"),
            minutes: Math.max(0, minutes),
            count: 0, // API doesn't provide count
          };
        })
        .filter((item) => item.minutes > 0);
    }

    // Fallback to props data
    const source = Array.isArray(data) ? data : [];
    return source
      .map((item, idx) => {
        const translationKey = breakTypeKeys[item.type] || item.type;
        const minutes = Math.max(0, parseMinutes(item.total));
        return {
          id: `${item.type || "break"}-${idx}`,
          label: t(translationKey, item.type),
          minutes,
          count: item.count || 0,
        };
      })
      .filter((item) => item.minutes > 0);
  }, [selectedBreakUsage, data, t]);

  const totalMinutes = useMemo(
    () => normalizedData.reduce((sum, item) => sum + item.minutes, 0),
    [normalizedData]
  );

  const pieData = useMemo(() => {
    if (!normalizedData.length) {
      return {
        labels: [],
        datasets: [
          {
            data: [],
            backgroundColor: [],
            borderWidth: 0,
          },
        ],
      };
    }

    const colors = normalizedData.map(
      (_, idx) => colorPalette[idx % colorPalette.length]
    );

    return {
      labels: normalizedData.map((item) => item.label),
      datasets: [
        {
          data: normalizedData.map((item) => Number(item.minutes.toFixed(2))),
          backgroundColor: colors,
          borderColor: colors,
          borderWidth: 2,
          hoverOffset: 10,
        },
      ],
    };
  }, [normalizedData]);

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "top",
          labels: {
            color: "var(--text-color)",
            font: { size: 11 },
          },
        },
        title: {
          display: true,
          text: t("breakChart.title", "Break Type Usage"),
          color: "var(--text-color)",
          font: { size: 14, weight: "bold" },
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const label = context.label || "";
              const value = context.parsed || 0;
              if (!totalMinutes) {
                return `${label}: ${value}m`;
              }
              const percent = ((value / totalMinutes) * 100).toFixed(1);
              return `${label}: ${value}m (${percent}%)`;
            },
          },
        },
      },
    }),
    [t, totalMinutes]
  );

  const mostUsedBreak = useMemo(() => {
    if (!normalizedData.length) return null;
    return normalizedData.reduce((prev, current) =>
      current.minutes > prev.minutes ? current : prev
    );
  }, [normalizedData]);

  const options = isArabic ? [...filterOptions].reverse() : filterOptions;
  const hasData = normalizedData.length > 0 && totalMinutes > 0;

  if (isLoading) {
    return (
      <div className="rounded-2xl p-4 sm:p-6 border shadow-lg text-center">
        <div className="animate-pulse flex items-center justify-center h-48 sm:h-72">
          <div className="text-sm sm:text-base" style={{ color: "var(--text-color)" }}>
            {t("common.loading", "Loading...")}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl p-4 sm:p-6 border shadow-lg transition-all duration-300 hover:shadow-xl backdrop-blur-sm w-full"
      style={{
        background: "linear-gradient(135deg, var(--chart-bg), rgba(255,255,255,0.02))",
        borderColor: "var(--chart-border)",
        boxShadow: "0 8px 25px rgba(0,0,0,0.08)",
      }}
    >
      <div
        className={`flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-0 ${
          isArabic ? "sm:flex-row-reverse" : "sm:flex-row"
        }`}
      >
        <div className="w-full sm:w-auto">
          <h3 className="text-base sm:text-lg font-bold" style={{ color: "var(--text-color)" }}>
            {t("breakChart.title", "Break Type Usage")}
          </h3>
          <p className="text-xs sm:text-sm" style={{ color: "var(--sub-text-color)" }}>
            {t("breakChart.subtitle", "Total time spent by break type")}
          </p>
        </div>
        <div className="relative flex items-center w-full sm:w-auto justify-end" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            className={`rounded-full px-4 py-2 pr-8 text-xs sm:text-sm font-semibold focus:outline-none transition-all duration-200 hover:scale-105 flex items-center gap-2 ${
              isArabic ? "flex-row-reverse" : "flex-row"
            }`}
            style={{
              minWidth: "120px",
              background: "#fff",
              color: accentColor,
              border: `1px solid ${accentColor}`,
              direction: isArabic ? "rtl" : "ltr",
            }}
          >
            <span>
              {t(
                filterOptions.find((opt) => opt.value === filter)?.labelKey || "",
                filterOptions.find((opt) => opt.value === filter)?.fallback || ""
              )}
            </span>
            <ChevronDown
              className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform ${isDropdownOpen ? "rotate-180" : ""} ${
                isArabic ? "order-first" : ""
              }`}
              style={{ color: accentColor }}
            />
          </button>
          {isDropdownOpen && (
            <div
              className="absolute top-full mt-1 rounded-lg shadow-lg overflow-hidden z-50"
              style={{
                minWidth: "120px",
                background: "#fff",
                border: `1px solid ${accentColor}`,
                [isArabic ? "left" : "right"]: 0,
              }}
            >
              {(isArabic ? [...options].reverse() : options).map((option) => {
                const label = t(option.labelKey, option.fallback);
                const isActive = option.value === filter;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setFilter(option.value);
                      setIsDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs sm:text-sm font-semibold transition-colors duration-150"
                    style={{
                      color: isActive ? "#fff" : accentColor,
                      background: isActive ? accentColor : "transparent",
                      direction: isArabic ? "rtl" : "ltr",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = accentColor;
                        e.currentTarget.style.color = "#fff";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.color = accentColor;
                      }
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="relative h-64 sm:h-72">
        {hasData ? (
          <Pie data={pieData} options={chartOptions} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center gap-2">
            <span className="text-sm font-semibold" style={{ color: "var(--text-color)" }}>
              {t("breakChart.noData", "No break data available yet")}
            </span>
            <span className="text-xs" style={{ color: "var(--sub-text-color)" }}>
              {t("breakChart.subtitle", "Total time spent by break type")}
            </span>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-opacity-20" style={{ borderColor: "var(--chart-border)" }}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px] sm:text-xs" style={{ color: "var(--sub-text-color)" }}>
          <span className="font-medium text-center sm:text-left">
            {t("breakChart.totalTypes", "Total Types")}: {normalizedData.length}
          </span>
          <span className="font-medium text-center">
            {t("breakChart.totalTime", "Total Time")}: {Math.round(totalMinutes)}m
          </span>
          <span className="font-medium text-center sm:text-right truncate">
            {t("breakChart.mostUsed", "Most Used")}: {mostUsedBreak ? mostUsedBreak.label : "—"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default BreakTypeChart;

