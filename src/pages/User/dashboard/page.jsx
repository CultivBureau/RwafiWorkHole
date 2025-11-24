import React, { useState, useMemo } from "react";
import SideMenu from "../../../components/side-menu/side-menu";
import NavBar from "../../../components/NavBar/navbar";
import ActivityHeatmap from "../../../components/dashboard/activity-heatmap";
import StatusCards from "../../../components/dashboard/status-cards";
import QuickActions from "../../../components/dashboard/quick-actions";
import BreakTime from "../../../components/dashboard/break-time";
import { useLang } from "../../../contexts/LangContext";
import { useMeQuery } from "../../../services/apis/AuthApi";
import {
  useGetUserBreakLogsQuery,
  useStartBreakMutation,
  useEndBreakMutation,
  useGetAllBreaksQuery,
} from "../../../services/apis/BreakApi";
import { useGetEmployeeDashboardCardsQuery } from "../../../services/apis/DashboardApi";
import { toast } from "react-hot-toast";
import { getCurrentUtcTime, calculateDurationFromUtc, utcToLocalDate, utcToLocalTime, getDeviceLocale } from "../../../utils/timeUtils";

// Static dashboard data
const staticDashboardData = {
  currentStatus: "Clocked In",
  todayAttendance: {
    clockIn: "09:00 AM",
    clockOut: null,
    workedHours: "4h 30m",
    status: "Present"
  },
  weeklyStats: {
    workedDays: 5,
    totalHours: "42h 15m",
    averageHours: "8h 27m"
  },
  monthlyStats: {
    present: 22,
    absent: 1,
    late: 2,
    earlyLeave: 1
  },
  activityHeatmap: Array.from({ length: 30 }, (_, i) => ({
    date: new Date(2024, new Date().getMonth(), i + 1).toISOString().split('T')[0],
    value: Math.floor(Math.random() * 8) + 1
  })),
  quickActions: [
    { id: 1, name: "Clock In", icon: "clock_in" },
    { id: 2, name: "My Tasks", icon: "task" },
    { id: 3, name: "Leave Request", icon: "leave" },
    { id: 4, name: "KPIs", icon: "kpis" }
  ]
};

const Dashboard = () => {
  const { lang, isRtl } = useLang();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const { data: meData } = useMeQuery();
  const userId = meData?.value?.id || meData?.id;

  // Fetch break data using the same API hooks as break tracking page
  const {
    data: breakLogsResponse,
    isLoading: isLogsLoading,
    refetch: refetchLogs,
  } = useGetUserBreakLogsQuery(
    { userId, pageNumber: 1, pageSize: 10 },
    { skip: !userId }
  );

  const {
    data: breakDefinitionsResponse,
    isLoading: isBreakDefinitionsLoading,
  } = useGetAllBreaksQuery({ pageNumber: 1, pageSize: 100 });

  const [startBreakMutation, { isLoading: isStarting }] = useStartBreakMutation();
  const [endBreakMutation, { isLoading: isEnding }] = useEndBreakMutation();

  // Process break options
  const breakOptions = useMemo(() => {
    const raw =
      breakDefinitionsResponse?.value ||
      breakDefinitionsResponse?.data ||
      breakDefinitionsResponse?.items ||
      breakDefinitionsResponse || [];

    if (!Array.isArray(raw)) return [];
    return raw
      .filter((item) => item)
      .map((item) => ({
        id: item.id,
        name: item.name,
        duration: item.duration,
        status: item.status,
      }))
      .filter((item) => item.status !== false);
  }, [breakDefinitionsResponse]);

  // Get active break log
  const breakLogsRaw = useMemo(() => {
    const raw = breakLogsResponse?.value || breakLogsResponse?.data || breakLogsResponse || [];
    return Array.isArray(raw) ? raw : [];
  }, [breakLogsResponse]);

  const activeBreakLog = useMemo(
    () => breakLogsRaw.find((log) => !log.endBreak),
    [breakLogsRaw]
  );

  // Process break logs for display
  const processedLogs = useMemo(() => {
    const locale = getDeviceLocale();
    return breakLogsRaw
      .filter((log) => log.endBreak) // Only show completed breaks
      .map((log) => {
        const startUtc = log.startBreak;
        const endUtc = log.endBreak;
        const breakDurationMinutes = log.break?.duration || 0;
        
        // Calculate duration using timeUtils
        const durationSeconds = startUtc
          ? calculateDurationFromUtc(startUtc, endUtc || null)
          : 0;
        
        const exceeded = breakDurationMinutes
          ? durationSeconds / 60 > breakDurationMinutes
          : false;
        
        // Format date in user's local timezone
        const localDate = startUtc
          ? utcToLocalDate(startUtc, locale, {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
            })
          : "--";
        
        return {
          id: log.id,
          date: localDate,
          breakType: log.break?.name || "--",
          duration: `${Math.round(durationSeconds / 60)} min`,
          durationSeconds,
          startTime: startUtc || null,
          endTime: endUtc || null,
          exceeded,
        };
      })
      .sort((a, b) => {
        // Sort by start time, newest first
        if (!a.startTime || !b.startTime) return 0;
        return new Date(b.startTime) - new Date(a.startTime);
      })
      .slice(0, 4); // Get newest 4
  }, [breakLogsRaw]);

  // Break handlers
  const handleStartBreak = async (breakId) => {
    try {
      const utcDateTime = getCurrentUtcTime();
      await startBreakMutation({
        breakId,
        utcDateTime,
      }).unwrap();
      toast.success("Break started");
      await refetchLogs();
    } catch (error) {
      const message = error?.data?.errorMessage || "Failed to start break";
      toast.error(message);
      throw error;
    }
  };

  const handleEndBreak = async () => {
    try {
      const utcDateTime = getCurrentUtcTime();
      await endBreakMutation({
        utcDateTime,
      }).unwrap();
      toast.success("Break ended");
      refetchLogs();
    } catch (error) {
      const message = error?.data?.errorMessage || "Failed to end break";
      toast.error(message);
      throw error;
    }
  };

  // Fetch employee dashboard cards from API
  const { data: dashboardCardsData, isLoading: isLoadingDashboardCards, isError: isDashboardCardsError, refetch: refetchDashboardCards } = useGetEmployeeDashboardCardsQuery();

  // Helper function to format hours to "xh ym" format
  const formatHoursToTimeString = (hours) => {
    if (!hours || hours === 0) return "0h 0m";
    const h = Math.floor(hours);
    const m = Math.floor((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  // Merge API data with static data
  const dashboardData = useMemo(() => {
    const baseData = { ...staticDashboardData };
    
    if (dashboardCardsData) {
      // Update status based on isClockedIn
      baseData.currentStatus = dashboardCardsData.isClockedIn 
        ? "Clocked In" 
        : "Not clocked in";
      
      // Add hours worked today
      baseData.hoursWorkedToday = dashboardCardsData.hoursWorkedToday || 0;
      
      // Update leave status with total leave requests
      baseData.leaveStatus = dashboardCardsData.totalLeaveRequests?.toString() || "0";
      baseData.totalLeaveRequests = dashboardCardsData.totalLeaveRequests || 0;
      
      // Add attendance streak days
      baseData.attendanceStreakDays = dashboardCardsData.attendanceStreakDays || 0;

      // Store last leave request status code for status cards
      baseData.lastLeaveRequestStatus = dashboardCardsData.lastLeaveRequestStatus ?? null;
    }
    
    return baseData;
  }, [dashboardCardsData]);

  const isLoading = isLoadingDashboardCards;
  const error = isDashboardCardsError;
  const refetch = refetchDashboardCards;

  return (
    <div
      className="w-full h-screen flex flex-col"
      style={{ background: "var(--bg-all)" }}
    >
      {/* Navigation Bar - Full Width at Top */}
      <NavBar />

      {/* Content Area with SideMenu and Main Content */}
      <div className="flex flex-1 min-h-0" style={{ background: "var(--bg-all)" }}>
        {/* Side Menu - Always rendered */}
        <SideMenu />

        {/* Main Content - Responsive padding and layout */}
        <main className="flex-1 overflow-auto p-2 sm:p-3 md:p-4 lg:p-4 xl:p-5 2xl:p-6" style={{ background: "var(--bg-all)" }}>
          <div
            className="h-max rounded-xl lg:rounded-2xl border border-gray-200"
            style={{ background: "var(--bg-color)" }}
          >
            {/* Dashboard content with responsive padding */}
            <div className="w-full h-max p-3 sm:p-4 md:p-5 lg:p-5 xl:p-6 2xl:p-8">
              {/* Status Cards - Responsive grid */}
              <div className="w-full mb-4 sm:mb-5 md:mb-6 lg:mb-6 xl:mb-8">
                <StatusCards dashboardData={dashboardData} isLoading={isLoading} error={error} refetch={refetch} />
              </div>

              {/* Quick Actions & Break Time - Responsive layout for 1025px-1200px */}
              <div className="mb-4 sm:mb-5 md:mb-6 lg:mb-6 xl:mb-8 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-3 sm:gap-4 md:gap-5 lg:gap-4 xl:gap-6">
                <div className="w-full">
                  <QuickActions dashboardData={dashboardData} isLoading={isLoading} error={error} refetch={refetch} />
                </div>
                <div className="w-full">
                  <BreakTime
                    breakOptions={breakOptions}
                    activeBreakLog={activeBreakLog}
                    onStartBreak={handleStartBreak}
                    onEndBreak={handleEndBreak}
                    isStarting={isStarting}
                    isEnding={isEnding}
                    isLoadingBreakOptions={isBreakDefinitionsLoading}
                    recentBreaks={processedLogs}
                    isLoadingLogs={isLogsLoading}
                  />
                </div>
              </div>

              {/* Activity Heatmap - Full width and responsive */}
              {/* <div className="w-full">
                <ActivityHeatmap 
                  dashboardData={dashboardData} 
                  isLoading={isLoading} 
                  error={error} 
                  refetch={refetch}
                  selectedMonth={selectedMonth}
                  onMonthChange={setSelectedMonth}
                />
              </div> */}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
