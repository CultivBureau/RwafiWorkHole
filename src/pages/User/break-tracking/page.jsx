import React, { useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import SideMenu from "../../../components/side-menu/side-menu";
import NavBar from "../../../components/NavBar/navbar";
import StatusCards from "../../../components/break-tracking/status-cards";
import BreakTime from "../../../components/break-tracking/break-time";
import BreakTypeChart from "../../../components/break-tracking/chart";
import BreakHistoryTable from "../../../components/break-tracking/table";
import { useLang } from "../../../contexts/LangContext";
import { useMeQuery } from "../../../services/apis/AuthApi";
import {
  useGetUserBreakLogsQuery,
  useStartBreakMutation,
  useEndBreakMutation,
  useGetAllBreaksQuery,
} from "../../../services/apis/BreakApi";
import {
  getCurrentUtcTime,
  calculateDurationFromUtc,
  utcToLocalDate,
  isUtcDateToday,
  getDeviceLocale,
} from "../../../utils/timeUtils";

const PAGE_SIZE = 10;

const formatDurationLabel = (totalSeconds) => {
  if (!totalSeconds || totalSeconds <= 0) return "--";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes.toString().padStart(2, "0")}m`;
  }
  return `${minutes}m`;
};

const BreakTrackingPage = () => {
  const { isRtl } = useLang();
  const { data: meData } = useMeQuery();
  const userId = meData?.value?.id || meData?.id;

  const [pageNumber, setPageNumber] = useState(1);

  const {
    data: breakLogsResponse,
    isLoading: isLogsLoading,
    refetch: refetchLogs,
  } = useGetUserBreakLogsQuery(
    { userId, pageNumber, pageSize: PAGE_SIZE },
    { skip: !userId }
  );

  const {
    data: breakDefinitionsResponse,
    isLoading: isBreakDefinitionsLoading,
  } = useGetAllBreaksQuery({ pageNumber: 1, pageSize: 100 });

  const [startBreakMutation, { isLoading: isStarting } ] = useStartBreakMutation();
  const [endBreakMutation, { isLoading: isEnding }] = useEndBreakMutation();

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

  const breakLogsRaw = useMemo(() => {
    const raw = breakLogsResponse?.value || breakLogsResponse?.data || breakLogsResponse || [];
    return Array.isArray(raw) ? raw : [];
  }, [breakLogsResponse]);

  const processedLogs = useMemo(() => {
    const locale = getDeviceLocale();
    return breakLogsRaw.map((log) => {
      // Parse UTC times from API
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
      
      // Format date in user's local timezone using timeUtils
      const localDate = startUtc
        ? utcToLocalDate(startUtc, locale, {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          })
        : "--";
      
      return {
        id: log.id,
        raw: log,
        date: localDate,
        breakType: log.break?.name || "--",
        durationLabel: formatDurationLabel(durationSeconds),
        durationSeconds,
        startTime: startUtc || null,
        endTime: endUtc || null,
        exceeded,
      };
    });
  }, [breakLogsRaw]);

  const activeBreakLog = useMemo(
    () => breakLogsRaw.find((log) => !log.endBreak),
    [breakLogsRaw]
  );

  const dashboardStats = useMemo(() => {
    if (processedLogs.length === 0) {
      return {
        todaysBreakTime: "--",
        mostUsedBreak: "--",
        avgBreakPerDay: "--",
        breaksOverLimit: "--",
      };
    }

    // Filter today's breaks using timeUtils
    const todaysSeconds = processedLogs
      .filter((record) => {
        // Check if the start time is today in local timezone
        return record.startTime && isUtcDateToday(record.startTime);
      })
      .reduce((sum, record) => sum + record.durationSeconds, 0);

    const totalsByType = processedLogs.reduce((acc, record) => {
      const key = record.breakType || "Unknown";
      if (!acc[key]) {
        acc[key] = { count: 0, seconds: 0 };
      }
      acc[key].count += 1;
      acc[key].seconds += record.durationSeconds;
      return acc;
    }, {});

    const mostUsed = Object.entries(totalsByType).reduce(
      (max, [type, value]) => {
        if (!max || value.count > max.count) {
          return { type, count: value.count };
        }
        return max;
      },
      null
    );

    const uniqueDates = Array.from(
      new Set(processedLogs.map((record) => record.date).filter(Boolean))
    );
    const totalSeconds = processedLogs.reduce(
      (sum, record) => sum + record.durationSeconds,
      0
    );
    const averageSeconds = uniqueDates.length
      ? Math.floor(totalSeconds / uniqueDates.length)
      : 0;

    const breaksOverLimit = processedLogs.filter((record) => record.exceeded)
      .length;

    return {
      todaysBreakTime: formatDurationLabel(todaysSeconds),
      mostUsedBreak: mostUsed?.type || "--",
      avgBreakPerDay: formatDurationLabel(averageSeconds),
      breaksOverLimit,
    };
  }, [processedLogs]);

  const chartData = useMemo(() => {
    const totalsByType = processedLogs.reduce((acc, record) => {
      const key = record.breakType || "Unknown";
      if (!acc[key]) {
        acc[key] = { count: 0, seconds: 0 };
      }
      acc[key].count += 1;
      acc[key].seconds += record.durationSeconds;
      return acc;
    }, {});

    return Object.entries(totalsByType).map(([type, value]) => ({
      type,
      total: `${Math.round(value.seconds / 60)} min`,
      count: value.count,
    }));
  }, [processedLogs]);

  const hasNextPage = processedLogs.length === PAGE_SIZE;

  const handlePageChange = (nextPage) => {
    setPageNumber(nextPage);
  };

  const handleStartBreak = async (breakId) => {
    try {
      // Send UTC time to API using timeUtils
      const utcDateTime = getCurrentUtcTime();
      await startBreakMutation({
        breakId,
        utcDateTime,
      }).unwrap();
      toast.success("Break started");
      setPageNumber(1);
      // Refetch logs to get the updated active break
      await refetchLogs();
    } catch (error) {
      const message = error?.data?.errorMessage || "Failed to start break";
      toast.error(message);
      throw error;
    }
  };

  const handleEndBreak = async () => {
    try {
      // Send UTC time to API using timeUtils
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

  return (
    <div
      className="w-full h-screen flex flex-col"
      style={{ background: "var(--bg-all)" }}
      dir={isRtl ? "rtl" : "ltr"}
    >
      {/* Navigation Bar - Full Width at Top */}
      <NavBar />

      {/* Content Area with SideMenu and Main Content */}
      <div className="flex flex-1 min-h-0" style={{ background: "var(--bg-all)" }}>
        {/* Side Menu - Left side under navbar */}
        <SideMenu />

        {/* Main Content - Optimized for 1024px-1250px range */}
        <main className="flex-1 overflow-auto p-2 sm:p-3 md:p-4 lg:p-3 xl:p-4 2xl:p-6" style={{ background: "var(--bg-all)" }}>
          <div
            className="h-max rounded-xl lg:rounded-2xl border border-gray-200"
            style={{ background: "var(--bg-color)" }}
          >
            {/* Break Tracking content with responsive padding for 1024px-1250px */}
            <div className="w-full h-max p-3 sm:p-4 md:p-5 lg:p-4 xl:p-5 2xl:p-8">
              {/* Status Cards Row */}
              <div className="w-full mb-3 sm:mb-4 md:mb-5 lg:mb-4 xl:mb-6 2xl:mb-8">
                <StatusCards stats={dashboardStats} isLoading={isLogsLoading} />
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-5 lg:gap-3 xl:gap-4 2xl:gap-6 mb-3 sm:mb-4 md:mb-5 lg:mb-4 xl:mb-6 2xl:mb-8">
                {/* Break Time Controls - Left Column */}
                <div className="lg:col-span-1">
                  <BreakTime
                    breakOptions={breakOptions}
                    activeBreakLog={activeBreakLog}
                    onStartBreak={handleStartBreak}
                    onEndBreak={handleEndBreak}
                    isStarting={isStarting}
                    isEnding={isEnding}
                    isLoadingBreakOptions={isBreakDefinitionsLoading}
                  />
                </div>
                {/* Break Type Usage Chart - Right Column */}
                <div className="lg:col-span-1">
                  <BreakTypeChart data={chartData} isLoading={isLogsLoading} />
                </div>
              </div>
              
              {/* Break History Table - Full Width */}
              <div className="w-full">
                <BreakHistoryTable
                  logs={processedLogs}
                  isLoading={isLogsLoading}
                  page={pageNumber}
                  pageSize={PAGE_SIZE}
                  hasNextPage={hasNextPage}
                  onPageChange={handlePageChange}
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default BreakTrackingPage;
