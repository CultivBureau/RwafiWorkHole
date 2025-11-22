import React, { useEffect, useState, useRef, useMemo } from "react";
import Card from "./Card";
const WorkedIcon = "/assets/time_tracking/worked.svg";
const BreakIcon = "/assets/time_tracking/break-icon.svg";
const OvertimeIcon = "/assets/time_tracking/overtime.svg";
import { useTranslation } from "react-i18next";
import TimerCard from "./TimerCard";
import { useGetUserClockinLogsQuery } from "../../../services/apis/ClockinLogApi";
import { getAuthToken } from "../../../utils/page";

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

// Helper function to calculate duration in seconds from clock-in/out times
const calculateDuration = (clockinTime, clockoutTime) => {
  if (!clockinTime) return 0
  const start = new Date(clockinTime)
  const end = clockoutTime ? new Date(clockoutTime) : new Date()
  return Math.max(0, Math.floor((end - start) / 1000))
}

// Helper function to format seconds to "xh ym"
const formatTimeFromSeconds = (seconds) => {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return `${h}h ${m}m`
}

// Helper function to get start of week (Monday)
const getWeekStart = (date = new Date()) => {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
  return new Date(d.setDate(diff))
}

const Stats = () => {
  const { t } = useTranslation();
  
  // Get user ID and fetch clock-in logs
  const userId = useMemo(() => deriveUserId(), [])
  const { data: clockinLogsData } = useGetUserClockinLogsQuery(
    { userId, pageNumber: 1, pageSize: 50 },
    { skip: !userId }
  )

  const [activeWorkSeconds, setActiveWorkSeconds] = useState(0);
  const timerRef = useRef(null);

  // Find active clock-in and calculate metrics
  const { activeClockIn, stats } = useMemo(() => {
    if (!clockinLogsData) {
      return {
        activeClockIn: null,
        stats: {
          thisWeek: "0h 0m",
          breaksTaken: "0h 0m",
          totalOvertime: "0h 0m",
          currentStatus: "Clocked Out",
          clockInTime: null,
          dailyShift: "0h 0m",
        }
      }
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

    // Find today's active clock-in
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const activeClockIn = items.find(log => {
      if (!log?.clockinTime) return false
      const clockInDate = new Date(log.clockinTime)
      clockInDate.setHours(0, 0, 0, 0)
      return clockInDate.getTime() === today.getTime() && !log?.clockoutTime
    }) || null

    const clockInTime = activeClockIn?.clockinTime || null
    const currentStatus = activeClockIn ? "Clocked In" : "Clocked Out"

    // Calculate today's hours
    const todayLogs = items.filter(log => {
      if (!log?.clockinTime) return false
      const logDate = new Date(log.clockinTime)
      logDate.setHours(0, 0, 0, 0)
      return logDate.getTime() === today.getTime()
    })
    const todaySeconds = todayLogs.reduce((sum, log) => {
      return sum + calculateDuration(log.clockinTime, log.clockoutTime)
    }, 0)
    const dailyShift = formatTimeFromSeconds(todaySeconds)

    // Calculate this week's hours
    const weekStart = getWeekStart(today)
    weekStart.setHours(0, 0, 0, 0)
    const weekLogs = items.filter(log => {
      if (!log?.clockinTime) return false
      const logDate = new Date(log.clockinTime)
      logDate.setHours(0, 0, 0, 0)
      return logDate >= weekStart
    })
    const weekSeconds = weekLogs.reduce((sum, log) => {
      return sum + calculateDuration(log.clockinTime, log.clockoutTime)
    }, 0)
    const thisWeek = formatTimeFromSeconds(weekSeconds)

    // Calculate overtime
    const dailyHours = new Map()
    items.forEach(log => {
      if (!log?.clockinTime) return
      const logDate = new Date(log.clockinTime)
      logDate.setHours(0, 0, 0, 0)
      const dateKey = logDate.toISOString().split('T')[0]
      const duration = calculateDuration(log.clockinTime, log.clockoutTime)
      const hours = duration / 3600
      dailyHours.set(dateKey, (dailyHours.get(dateKey) || 0) + hours)
    })
    let totalOvertimeSeconds = 0
    dailyHours.forEach((hours) => {
      if (hours > 8) {
        totalOvertimeSeconds += (hours - 8) * 3600
      }
    })
    const totalOvertime = formatTimeFromSeconds(totalOvertimeSeconds)

    return {
      activeClockIn,
      stats: {
        thisWeek,
        breaksTaken: "0h 0m", // No BreakLog API available
        totalOvertime,
        currentStatus,
        clockInTime,
        dailyShift,
      }
    }
  }, [clockinLogsData])

  // احسب وقت البداية من الـ backend لو موجود
  const clockInTime = stats.clockInTime;

  // شغل التايمر لو المستخدم Clocked In
  useEffect(() => {
    if (stats.currentStatus === "Clocked In" && clockInTime) {
      // Parse clockInTime as UTC (API returns UTC)
      // Ensure the string is treated as UTC by adding 'Z' if it's not present
      let utcString = clockInTime;
      if (typeof utcString === 'string' && !utcString.endsWith('Z') && !utcString.includes('+') && !utcString.includes('-', 10)) {
        utcString = utcString + 'Z';
      }
      
      // Parse as UTC - JavaScript Date will correctly handle the conversion
      const start = new Date(utcString);
      
      // Debug logging in development
      if (import.meta.env.DEV) {
        console.log('Stats Timer initialization:', {
          clockInTime,
          utcString,
          startUTC: start.toISOString(),
          startLocal: start.toLocaleString(),
          now: new Date().toLocaleString(),
          diffSeconds: Math.floor((new Date().getTime() - start.getTime()) / 1000),
        });
      }
      
      const updateTimer = () => {
        const now = new Date();
        // Calculate difference in milliseconds, then convert to seconds
        // Both dates are in the same timezone (milliseconds since epoch), so this is correct
        const diff = Math.floor((now.getTime() - start.getTime()) / 1000);
        setActiveWorkSeconds(Math.max(0, diff)); // Ensure non-negative
      };
      updateTimer();
      timerRef.current = setInterval(updateTimer, 1000); // Update every second for accuracy
      return () => clearInterval(timerRef.current);
    } else {
      setActiveWorkSeconds(0);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [stats.currentStatus, clockInTime]);

  // دالة لتحويل الثواني إلى "xh ym"
  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  // احسب dailyShift ديناميكي لو المستخدم Clocked In
  const dynamicDailyShift = stats.currentStatus === "Clocked In" && clockInTime
    ? formatTime(activeWorkSeconds)
    : stats.dailyShift;

  // دالة لتحويل "3h 30m" أو "16m" أو "2h" إلى دقائق
  function parseTimeString(str) {
    const hMatch = str.match(/(\d+)h/);
    const mMatch = str.match(/(\d+)m/);
    const hours = hMatch ? parseInt(hMatch[1]) : 0;
    const minutes = mMatch ? parseInt(mMatch[1]) : 0;
    return hours * 60 + minutes;
  }

  // احسب thisWeek ديناميكي (أضف وقت اليوم الحالي لو المستخدم Clocked In)
  const weekMinutes = (() => {
    const weekBase = parseTimeString(stats.thisWeek);
    const todayMinutes = stats.currentStatus === "Clocked In" && clockInTime
      ? Math.floor(activeWorkSeconds / 60)
      : 0;
    return weekBase + todayMinutes;
  })();
  const dynamicThisWeek = `${Math.floor(weekMinutes / 60)}h ${weekMinutes % 60}m`;

  const Card_Data = [
    {
      header: t("stats.thisWeek"),
      title: dynamicThisWeek,
      subTitle: t("stats.totalHoursWorked"),
      rightIcon: <img src={WorkedIcon} alt="Worked" />,
      bar: 75,
    },
    {
      header: t("stats.breaksTaken"),
      title: stats.breaksTaken,
      subTitle: t("breakTime.breakSummary"),
      rightIcon: <img src={BreakIcon} alt="Break" />,
      bar: 30,
    },
    {
      header: t("stats.totalOvertime"),
      title: stats.totalOvertime,
      subTitle: t("stats.extraHoursThisMonth"),
      rightIcon: <img src={OvertimeIcon} alt="Overtime" />,
      bar: 60,
      percentage: 1.3,
    },
  ];

  return (
    <section
      className="w-full rounded-2xl min-h-[140px] flex flex-col max-[1200px]:flex-wrap sm:flex-row justify-center items-stretch gap-4 sm:gap-6 p-4 sm:p-6"
      style={{ backgroundColor: "var(--bg-color)" }}
    >
     
      {Card_Data.map((card, index) => (
        <Card key={index} {...card} className="h-full" />
      ))}
       <TimerCard />
    </section>
  );
};

export default Stats;
