import React from 'react';
import { useTranslation } from 'react-i18next';

// Circular progress component
const CircularProgress = ({ percentage }) => {
  const safePercentage = Number.isFinite(percentage)
    ? Math.min(Math.max(percentage, 0), 100)
    : 0;
  const radius = 18; // Increased radius for better visibility
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (safePercentage / 100) * circumference;

  return (
    <div className="relative w-[40px] h-[40px] flex-shrink-0 flex items-center justify-center">
      <svg 
        className="w-[40px] h-[40px] transform -rotate-90" 
        viewBox="0 0 40 40"
        style={{ overflow: 'visible' }}
      >
        {/* Background circle */}
        <circle 
          cx="20" 
          cy="20" 
          r={radius} 
          stroke="var(--border-color)" 
          strokeWidth="3" 
          fill="none"
          opacity="0.2"
        />
        {/* Progress circle */}
        <circle
          cx="20"
          cy="20"
          r={radius}
          stroke="var(--accent-color)"
          strokeWidth="3"
          fill="none"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-in-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[8px] font-bold gradient-text leading-none text-center">
          {safePercentage % 1 === 0 ? safePercentage.toFixed(0) : safePercentage.toFixed(1)}%
        </span>
      </div>
    </div>
  );
};

const Card = ({ 
  departmentName = "Department Development", 
  memberCount = 20, 
  presentCount = 18, 
  absentCount = 2, 
  percentage = 94.6,
  onView,
}) => {
  const { t } = useTranslation();
  const safeMemberCount = Number.isFinite(memberCount) ? Math.max(memberCount, 0) : 0;
  const safePresentCount = Number.isFinite(presentCount) ? Math.max(presentCount, 0) : 0;
  const safeAbsentCount = Number.isFinite(absentCount) ? Math.max(absentCount, 0) : Math.max(safeMemberCount - safePresentCount, 0);
  const safePercentage = Number.isFinite(percentage) ? Math.min(Math.max(percentage, 0), 100) : 0;

  return (
    <div className="w-[97%] h-max pb-2 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-lg p-2 shadow-sm mb-3 transition-all duration-300 ease-in-out hover:shadow-md hover:scale-[1.01] hover:border-[var(--accent-color)] cursor-pointer">
      {/* Header Section */}
      <div className="flex flex-col items-center text-center gap-0.5 mb-1">
        <h3 className="text-[11px] font-bold text-[var(--text-color)] leading-tight transition-colors duration-200">
          {departmentName}
        </h3>
        <p className="text-[var(--sub-text-color)] text-[9px] font-medium leading-tight transition-colors duration-200">
          {safeMemberCount} {t("adminDashboard.departments.members", "Members")}
        </p>
        {onView && (
          <button
            onClick={onView}
            className="mt-0.5 text-[var(--accent-color)] hover:text-[var(--accent-hover)] text-[9px] font-medium hover:underline transition-all duration-200 leading-none px-1.5 py-0.5 rounded hover:bg-[var(--hover-color)] active:scale-95"
          >
            {t("adminDashboard.departments.viewAll", "View All")}
          </button>
        )}
      </div>

      <div className="flex justify-center mb-2">
        <div className="transition-transform duration-300 hover:scale-110 hover:rotate-3">
          <CircularProgress percentage={safePercentage} />
        </div>
      </div>

      {/* Stats Section */}
      <div className="flex items-center justify-around gap-4">
        <div className="flex flex-col items-center gap-0.5 transition-transform duration-200 hover:scale-105">
          <span className="text-[var(--sub-text-color)] text-[9px] font-medium leading-none">
            {t("adminDashboard.departments.presentToday", "Present Today")}
          </span>
          <span className="text-[var(--text-color)] font-bold text-[10px] leading-none">
            {safePresentCount}
          </span>
        </div>
        <div className="flex flex-col items-center gap-0.5 transition-transform duration-200 hover:scale-105">
          <span className="text-[var(--sub-text-color)] text-[9px] font-medium leading-none">
            {t("adminDashboard.departments.absentToday", "Absent Today")}
          </span>
          <span className="text-[var(--text-color)] font-bold text-[10px] leading-none">
            {safeAbsentCount}
          </span>
        </div>
      </div>
     
    </div>
  );
};

export default Card;