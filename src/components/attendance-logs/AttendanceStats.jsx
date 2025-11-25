import { useMemo } from "react"
import { TrendingUp, TrendingDown } from "lucide-react"
import Card from "../Time_Tracking_Components/Stats/Card"
import { useTranslation } from "react-i18next"
import { skipToken } from "@reduxjs/toolkit/query/react"
import { useGetCurrentAttendanceSummaryQuery } from "../../services/apis/ClockinLogApi"
import { deriveUserId } from "../../utils/userHelpers"
import { getUserInfo } from "../../utils/page"

// Helper function to format time string like "11:25:54.8350000" to "11:25 AM"
const formatTimeString = (timeString) => {
  if (!timeString || timeString === "--") return "--";
  
  try {
    // Parse time string like "11:25:54.8350000"
    const [hours, minutes] = timeString.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return timeString;
    
    // Create a date object with today's date and the parsed time
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    
    // Format to 12-hour format
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } catch (error) {
    return timeString; // Fallback to original if conversion fails
  }
};

const AttendanceStats = () => {
  const { t } = useTranslation()

  const userId = deriveUserId()
  const companyId = useMemo(() => getUserInfo()?.companyId, [])
  const queryArg = userId ? { userId, companyId } : skipToken
  
  // Fetch current attendance summary from API
  const { data: attendanceSummary, isLoading, isError } = useGetCurrentAttendanceSummaryQuery(queryArg);
  
  // Format the stats data
  const stats = {
    totalDaysPresent: isError ? 0 : attendanceSummary?.totalDaysPresent ?? 0,
    totalDaysAbsent: isError ? 0 : attendanceSummary?.totalDaysAbsent ?? 0,
    lateArrivals: isError ? 0 : attendanceSummary?.lateArrivals ?? 0,
    avgClockIn: isError ? "--" : formatTimeString(attendanceSummary?.averageClockInTime) ?? "--"
  };

  const statsData = [
    {
      header: t("attendanceStats.totalDaysPresent"),
      title: isLoading ? "..." : (stats?.totalDaysPresent ?? 0),
      subTitle: t("attendanceStats.hoursWorked"),
      rightIcon: <img src="/assets/attendance_logs/logs.svg" alt="present" className="w-8 h-8" />,
      trend: {
        icon: <TrendingUp className="w-4 h-4 text-green-500" />,
        text: "", // You can add trend logic if you have it
        color: "text-green-600"
      }
    },
    {
      header: t("attendanceStats.totalDaysAbsent"),
      title: isLoading ? "..." : (stats?.totalDaysAbsent ?? 0),
      subTitle: t("attendanceStats.breakToday"),
      rightIcon: <img src="/assets/attendance_logs/absent.svg" alt="absent" className="w-8 h-8" />,
      trend: {
        icon: <TrendingDown className="w-4 h-4 text-red-500" />,
        text: "",
        color: "text-red-600"
      }
    },
    {
      header: t("attendanceStats.lateArrivals"),
      title: isLoading ? "..." : (stats?.lateArrivals ?? 0),
      subTitle: t("attendanceStats.lateThisMonth"),
      rightIcon: <img src="/assets/attendance_logs/late.svg" alt="late" className="w-8 h-8" />,
      trend: {
        icon: <TrendingDown className="w-4 h-4 text-red-500" />,
        text: "",
        color: "text-red-600"
      }
    },
    {
      header: t("attendanceStats.averageClockIn"),
      title: isLoading ? "..." : (stats?.avgClockIn ?? "--"),
      subTitle: t("attendanceStats.basedOnMonth"),
      rightIcon: <img src="/assets/attendance_logs/avg.svg" alt="average" className="w-8 h-8" />,
      trend: {
        icon: <TrendingUp className="w-4 h-4 text-green-500" />,
        text: "",
        color: "text-green-600"
      }
    },
  ]

  return (
    <div className="w-full flex flex-col sm:flex-row justify-center items-stretch gap-4 sm:gap-6 mb-6">
      {statsData.map((stat, index) => (
        <Card
          key={index}
          header={stat.header}
          title={stat.title}
          rightIcon={stat.rightIcon}
          className="h-full"
          bottomContent={
            stat.trend.text && (
              <div className="flex items-center">
                {stat.trend.icon}
                <span className={`text-xs font-medium ${stat.trend.color}`}>
                  {stat.trend.text}
                </span>
              </div>
            )
          }
        />
      ))}
    </div>
  )
}

export default AttendanceStats
