import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown } from "lucide-react";

// Types translation keys
const breakTypeKeys = {
  "Prayer": "breakTime.reasons.Prayer",
  "Toilet": "breakTime.reasons.Toilet",
  "smooking": "breakTime.reasons.smooking",
  "hmam": "breakTime.reasons.hmam",
  "drink": "breakTime.reasons.drink",
  "sleep": "breakTime.reasons.sleep"
};

// لون موحد لكل البارات
const unifiedColor = "#75C8CF";

const BreakTypeChart = ({ data = [], isLoading = false }) => {
  const { t, i18n } = useTranslation();
  const [filter, setFilter] = useState("week");
  
  const breakData = useMemo(() => data, [data]);
  const timeValues = breakData.map(b => parseInt(b.total?.toString().replace(" min", "")) || 0);
  const maxTime = Math.max(...timeValues, 10);

  const isArabic = i18n.language === "ar";

  // Filter options with translations
  const filterOptions = [
    { value: "week", label: t('breakChart.week', 'Week') },
    { value: "month", label: t('breakChart.month', 'Month') }
  ];

  const options = isArabic ? [...filterOptions].reverse() : filterOptions;

  // Dynamic Y-axis configuration based on selected period
  const getYAxisConfig = () => {
    if (filter === "month") {
      return {
        labels: [6, 5, 4, 3, 2, 1, 0],
        maxValue: 6,
        unit: isArabic ? "س" : "h" // Hours
      };
    } else {
      return {
        labels: [60, 50, 40, 30, 20, 10, 0],
        maxValue: 60,
        unit: isArabic ? "د" : "m" // Minutes
      };
    }
  };

  // Show loading indicator if loading
  if (isLoading) {
    return (
      <div className="rounded-2xl p-4 sm:p-6 border shadow-lg text-center">
        <div className="animate-pulse flex items-center justify-center h-48 sm:h-72">
          <div className="text-sm sm:text-base" style={{ color: "var(--text-color)" }}>
            {t('common.loading', 'Loading...')}
          </div>
        </div>
      </div>
    );
  }

  const yAxisConfig = getYAxisConfig();

  return (
    <div
      className="rounded-2xl p-4 sm:p-6 border shadow-lg transition-all duration-300 hover:shadow-xl backdrop-blur-sm w-full"
      style={{
        background: "linear-gradient(135deg, var(--chart-bg), rgba(255,255,255,0.02))",
        borderColor: "var(--chart-border)",
        boxShadow: "0 8px 25px rgba(0,0,0,0.08)"
      }}
    >
      {/* Header + Filter */}
      <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-0 ${isArabic ? "sm:flex-row-reverse" : "sm:flex-row"}`}>
        <div className="w-full sm:w-auto">
          <h3 className="text-base sm:text-lg font-bold" style={{ color: "var(--text-color)" }}>
            {t('breakChart.title', 'Break Type Usage')}
          </h3>
          <p className="text-xs sm:text-sm" style={{ color: "var(--sub-text-color)" }}>
            {t('breakChart.subtitle', 'Total time spent by break type')}
          </p>
        </div>
        <div className="relative flex items-center w-full sm:w-auto justify-end">
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className={`rounded-full py-2 text-xs sm:text-sm font-semibold appearance-none focus:outline-none transition-all duration-200 hover:scale-105 w-full sm:w-auto ${isArabic
                ? 'pl-8 sm:pl-10 pr-4 sm:pr-5 text-right'
                : 'pr-8 sm:pr-10 pl-4 sm:pl-5 text-left'
              }`}
            style={{
              minWidth: "100px",
              maxWidth: "120px",
              background: unifiedColor,
              color: "#fff",
              border: "none",
              direction: isArabic ? "rtl" : "ltr"
            }}
          >
            {options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown
            className={`absolute top-1/2 transform -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 ${isArabic ? "left-3 sm:left-4" : "right-3 sm:right-4"
              }`}
            style={{ color: "#fff" }}
          />
        </div>
      </div>

      {/* Chart */}
      <div className="relative h-48 sm:h-64 md:h-72 overflow-hidden">
        {/* Y-axis labels */}
        <div
          className="absolute left-0 top-0 h-full flex flex-col justify-between text-[10px] sm:text-xs font-semibold pr-1 sm:pr-2"
          style={{ height: "100%", color: "var(--chart-label)" }}
        >
          <span>{maxTime}m</span>
          <span>{Math.floor(maxTime * 2 / 3)}m</span>
          <span>{Math.floor(maxTime / 3)}m</span>
          <span>0</span>
        </div>

        {/* Grid lines */}
        <div className="absolute left-6 sm:left-8 md:left-10 right-0 top-0 h-full">
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              className="absolute w-full h-px"
              style={{
                top: `${(i / 3) * 100}%`,
                background: "var(--chart-grid)",
                opacity: 0.4
              }}
            />
          ))}
          <div
            className="absolute w-full h-px border-t-2 border-dashed"
            style={{
              top: "0%",
              borderColor: "var(--chart-dashed)",
              opacity: 0.6
            }}
          />
        </div>

        {/* Bars */}
        <div className={`absolute ${isArabic ? 'right-8 sm:right-10 md:right-12' : 'left-8 sm:left-10 md:left-12'} ${isArabic ? 'left-0' : 'right-0'} top-0 h-full flex items-end justify-between px-1 sm:px-2 md:px-4`}>
          {(isArabic ? [...breakData].reverse() : breakData).map((breakItem, index) => {
            const time = parseInt(breakItem.total?.toString().replace(" min", "")) || 0;
            const count = breakItem.count || 0;
            const height = maxTime > 0 ? (time / maxTime) * 100 : 0;
            const breakTypeKey = breakTypeKeys[breakItem.type] || breakItem.type;

            return (
              <div key={index} className="flex flex-col items-center flex-1 group" style={{ maxWidth: breakData.length > 6 ? "60px" : "80px" }}>
                <div className="relative">
                  <div
                    className="rounded-t-xl transition-all duration-300 hover:scale-110 cursor-pointer group-hover:shadow-lg mx-auto"
                    style={{
                      width: breakData.length > 6 ? "24px" : breakData.length > 4 ? "32px" : "40px",
                      height: `${Math.max(height * (window.innerHeight > 640 ? 1.92 : 1.44), 2)}px`,
                      minHeight: "2px",
                      maxHeight: window.innerHeight > 640 ? "192px" : "144px",
                      background: unifiedColor,
                      boxShadow: "0 4px 15px rgba(117,200,207,0.3)"
                    }}
                  />
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-10">
                    <div className="bg-black text-white text-[10px] sm:text-xs rounded-lg px-2 py-1 whitespace-nowrap shadow-lg">
                      <div className="font-semibold">{t(breakTypeKey, breakItem.type)}</div>
                      <div>{t('breakChart.count', 'Count')}: {count}</div>
                      <div>{t('breakChart.total', 'Total')}: {breakItem.total}</div>
                    </div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black"></div>
                  </div>
                </div>
                <span
                  className="text-[9px] sm:text-xs mt-1 sm:mt-2 text-center font-semibold transition-all duration-200 group-hover:scale-105 group-hover:text-opacity-80 leading-tight"
                  style={{
                    color: "var(--sub-text-color)",
                    maxWidth: "100%",
                    wordBreak: "break-word",
                    hyphens: "auto"
                  }}
                >
                  {t(breakTypeKey, breakItem.type)}
                </span>
                <span
                  className="text-[8px] sm:text-[10px] mt-0.5 sm:mt-1 text-center font-medium opacity-70 transition-all duration-200 group-hover:opacity-100"
                  style={{ color: "var(--sub-text-color2)" }}
                >
                  ({count}x)
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chart Legend/Summary */}
      <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-opacity-20" style={{ borderColor: "var(--chart-border)" }}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-0 text-[10px] sm:text-xs" style={{ color: "var(--sub-text-color)" }}>
          <span className="font-medium text-center sm:text-left">
            {t('breakChart.totalTypes', 'Total Types')}: {breakData.length}
          </span>
          <span className="font-medium text-center">
            {t('breakChart.totalTime', 'Total Time')}: {timeValues.reduce((sum, time) => sum + time, 0)}m
          </span>
          <span className="font-medium text-center sm:text-right truncate">
            {t('breakChart.mostUsed', 'Most Used')}: {
              breakData.length > 0
                ? (breakData.reduce((a, b) => {
                    const totalA = parseInt(a.total?.toString().replace(' min', '')) || 0;
                    const totalB = parseInt(b.total?.toString().replace(' min', '')) || 0;
                    return totalA >= totalB ? a : b;
                  }, breakData[0]).type || 'N/A')
                : 'N/A'
            }
          </span>
        </div>
      </div>
    </div>
  );
};

export default BreakTypeChart;
