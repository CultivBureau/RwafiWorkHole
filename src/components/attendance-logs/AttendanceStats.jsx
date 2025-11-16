import { TrendingUp, TrendingDown } from "lucide-react"
import Card from "../Time_Tracking_Components/Stats/Card"
import { useTranslation } from "react-i18next"

// Static attendance stats data
const staticStats = {
  totalDaysPresent: 22,
  totalDaysAbsent: 1,
  lateArrivals: 2,
  avgClockIn: "09:05 AM"
};

const AttendanceStats = () => {
  const { t } = useTranslation()

  // Use static data instead of API call
  const stats = staticStats;
  const isLoading = false;

  const statsData = [
    {
      header: t("attendanceStats.totalDaysPresent"),
      title: stats?.totalDaysPresent ?? 0,
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
      title: stats?.totalDaysAbsent ?? 0,
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
      title: stats?.lateArrivals ?? 0,
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
      title: stats?.avgClockIn ?? "--",
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
