"use client"
import { useTranslation } from "react-i18next";
import Card from "../Time_Tracking_Components/Stats/Card";
import { ChartColumn, Clock, Activity } from "lucide-react";
import React from "react";
import { useNavigate } from "react-router-dom";

export default function StatusCards({ dashboardData, isLoading, error }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Helper function to format hours to "xh ym" format
  const formatHoursToTimeString = (hours) => {
    if (!hours || hours === 0) return "0h 0m";
    const h = Math.floor(hours);
    const m = Math.floor((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  // Use API response fields with proper fallbacks
  const status = dashboardData?.currentStatus || t("dashboard.statusCards.notClockedIn");
  const isLive = status === "Clocked In" || status === t("dashboard.statusCards.clockedIn");
  
  const leaveStatus = dashboardData?.totalLeaveRequests !== undefined 
    ? dashboardData.totalLeaveRequests.toString() 
    : (dashboardData?.leaveStatus || t("dashboard.statusCards.pending"));
  
  // Hours Worked Today from API
  const hoursWorkedToday = dashboardData?.hoursWorkedToday !== undefined
    ? formatHoursToTimeString(dashboardData.hoursWorkedToday)
    : "0h 0m";
  
  // Attendance Streak Days from API
  const attendanceStreakDays = dashboardData?.attendanceStreakDays !== undefined
    ? dashboardData.attendanceStreakDays
    : 0;

  // Enhanced SVGs with better styling
  const CalendarIcon = (
    <div className="w-full h-full flex items-center justify-center">
      <img src="/assets/dashboard_card/status.svg" alt="calendar" className="w-5 h-5 sm:w-6 sm:h-6 lg:w-5 lg:h-5 xl:w-6 xl:h-6 transition-transform duration-200 hover:scale-110"/>
    </div>
  );
  
  const LeaveIcon = (
    <div className="w-full h-full flex items-center justify-center">
      <img src="/assets/dashboard_card/clock2.svg" alt="leave" className="w-5 h-5 sm:w-6 sm:h-6 lg:w-5 lg:h-5 xl:w-6 xl:h-6 transition-transform duration-200 hover:scale-110" />
    </div>
  );
  
  const ClockIcon = (
    <div className="w-full h-full flex items-center justify-center">
      <img src="/assets/dashboard_card/clock.svg" alt="clock" className="w-5 h-5 sm:w-6 sm:h-6 lg:w-5 lg:h-5 xl:w-6 xl:h-6 transition-transform duration-200 hover:scale-110" />
    </div>
  );
  
  const PerformanceIcon = (
    <div className="w-full h-full flex items-center justify-center">
      <img src="/assets/dashboard_card/performance.svg" alt="performance" className="w-5 h-5 sm:w-6 sm:h-6 lg:w-5 lg:h-5 xl:w-6 xl:h-6 transition-transform duration-200 hover:scale-110" />
    </div>
  );

  // Enhanced chart icon with better styling
  const BarChartIcon = (
    <ChartColumn size={14} className="sm:w-4 sm:h-4 lg:w-3.5 lg:h-3.5 xl:w-4 xl:h-4 transition-all duration-200" strokeWidth={2.5} />
  );

  // Enhanced button with better animations
  const GoToTimeTrackerBtn = (
    <button
      className="w-full flex items-center justify-center gap-2 py-2 sm:py-3 lg:py-2.5 xl:py-3 px-3 sm:px-4 lg:px-3 xl:px-4 rounded-full text-white font-medium text-xs sm:text-sm lg:text-xs xl:text-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 transform active:scale-95"
      style={{
        background: 'linear-gradient(135deg, var(--accent-color), var(--accent-hover))',
      }}
      onClick={() => navigate("/pages/User/time_tracking")}
    >
      <Clock size={14} className="sm:w-4 sm:h-4 lg:w-3.5 lg:h-3.5 xl:w-4 xl:h-4" strokeWidth={2.5} />
      <span className="hidden xs:inline">{t("dashboard.statusCards.goToTimeTracker")}</span>
      <span className="xs:hidden">Tracker</span>
    </button>
  );

  // Calculate bar percentage for hours worked today (assuming 8 hours is full)
  const shiftHours = dashboardData?.shiftHours || 8;
  const hoursWorkedTodayDecimal = dashboardData?.hoursWorkedToday || 0;
  const hoursWorkedTodayBar = Math.min(Math.round((hoursWorkedTodayDecimal / shiftHours) * 100), 100);

  // Enhanced loading state
  if (isLoading) {
    return (
      <div className="w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-3 xl:gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-full h-full min-h-[140px] sm:min-h-[160px] lg:min-h-[150px] xl:min-h-[160px] p-3 sm:p-4 lg:p-3 xl:p-4 rounded-2xl border animate-pulse"
              style={{
                backgroundColor: 'var(--bg-color)',
                borderColor: 'var(--border-color)',
              }}
            >
              <div className="flex items-center justify-between mb-3 sm:mb-4 lg:mb-3 xl:mb-4">
                <div className="h-3 sm:h-4 lg:h-3 xl:h-4 bg-gray-300 rounded w-16 sm:w-20 lg:w-16 xl:w-20"></div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-8 lg:h-8 xl:w-10 xl:h-10 bg-gray-300 rounded-xl"></div>
              </div>
              <div className="h-6 sm:h-8 lg:h-6 xl:h-8 bg-gray-300 rounded w-12 sm:w-16 lg:w-12 xl:w-16 mb-2"></div>
              <div className="h-2 sm:h-3 lg:h-2 xl:h-3 bg-gray-300 rounded w-20 sm:w-24 lg:w-20 xl:w-24"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Enhanced error state
  if (error) {
    return (
      <div className="w-full flex justify-center items-center py-8">
        <div className="text-center">
          <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-10 lg:h-10 xl:w-12 xl:h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Activity className="w-5 h-5 sm:w-6 sm:h-6 lg:w-5 lg:h-5 xl:w-6 xl:h-6 text-red-500" />
          </div>
          <p className="text-red-500 font-medium text-sm sm:text-base lg:text-sm xl:text-base">Error loading dashboard data</p>
          <p className="text-xs sm:text-sm lg:text-xs xl:text-sm text-gray-500 mt-1">Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Enhanced grid with better responsive design for 1025px-1200px */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-3 xl:gap-6">
        <Card
          header={t("dashboard.statusCards.status")}
          title={
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base lg:text-sm xl:text-base">{status}</span>
              {isLive && (
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 lg:w-1.5 lg:h-1.5 xl:w-2 xl:h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-500 font-medium">Live</span>
                </div>
              )}
            </div>
          }
          statusDot={
            <span
              className={`inline-block w-2 h-2 sm:w-2.5 sm:h-2.5 lg:w-2 lg:h-2 xl:w-2.5 xl:h-2.5 rounded-full transition-all duration-500 ${
                // Dynamic status based on clock state
                status === t("dashboard.statusCards.notClockedIn") || status === "Not clocked in"
                  ? "bg-red-500 shadow-lg" // Red when not clocked in
                  : status === "Clocked In" || status === t("dashboard.statusCards.clockedIn")
                  ? "bg-green-500 shadow-lg animate-pulse" // Green pulsing when clocked in
                  : status === "Clocked Out" || status === t("dashboard.statusCards.clockedOut")
                  ? "bg-gray-400 shadow-lg" // Gray when finished (clocked out)
                  : "bg-yellow-500 shadow-lg" // Yellow for any other status
              }`}
              style={{ 
                boxShadow: status === t("dashboard.statusCards.notClockedIn") || status === "Not clocked in"
                  ? '0 0 8px rgba(239, 68, 68, 0.4)' // Red glow
                  : status === "Clocked In" || status === t("dashboard.statusCards.clockedIn")
                  ? '0 0 8px rgba(34, 197, 94, 0.4)' // Green glow
                  : status === "Clocked Out" || status === t("dashboard.statusCards.clockedOut")
                  ? '0 0 8px rgba(156, 163, 175, 0.4)' // Gray glow
                  : '0 0 8px rgba(234, 179, 8, 0.4)' // Yellow glow
              }}
            ></span>
          }
          rightIcon={CalendarIcon}
          button={GoToTimeTrackerBtn}
          className="h-full min-h-[140px] sm:min-h-[160px] lg:min-h-[150px] xl:min-h-[160px]"
        />
        
        <Card
          header={t("dashboard.statusCards.leaveRequest")}
          title={<span className="text-sm sm:text-base lg:text-sm xl:text-base">{leaveStatus}</span>}
          rightIcon={LeaveIcon}
          footer={BarChartIcon}
          className="h-full min-h-[140px] sm:min-h-[160px] lg:min-h-[150px] xl:min-h-[160px]"
        />
        
        <Card
          header={t("dashboard.statusCards.hoursWorkedToday", "Hours Worked Today")}
          title={
            <span className="transition-all duration-300 flex items-center gap-2">
              <span className="text-sm sm:text-base lg:text-sm xl:text-base">{hoursWorkedToday}</span>
            </span>
          }
          rightIcon={ClockIcon}
          bar={hoursWorkedTodayBar}
          percentage={hoursWorkedTodayBar}
          footer={BarChartIcon}
          className="h-full min-h-[140px] sm:min-h-[160px] lg:min-h-[150px] xl:min-h-[160px]"
        />
        
        <Card
          header={t("dashboard.statusCards.attendanceStreakDays", "Attendance Streak Days")}
          title={
            <span className="text-sm sm:text-base lg:text-sm xl:text-base">
              {attendanceStreakDays} {attendanceStreakDays === 1 ? t("dashboard.statusCards.day", "day") : t("dashboard.statusCards.days", "days")}
            </span>
          }
          rightIcon={PerformanceIcon}
          bar={Math.min(attendanceStreakDays * 10, 100)}
          percentage={Math.min(attendanceStreakDays * 10, 100)}
          footer={BarChartIcon}
          className="h-full min-h-[140px] sm:min-h-[160px] lg:min-h-[150px] xl:min-h-[160px]"
        />
      </div>
    </div>
  );
}
