import Card from "../Time_Tracking_Components/Stats/Card";
import { useTranslation } from "react-i18next";

const AttendanceStats = ({ stats, isLoading = false }) => {
  const { t } = useTranslation();

  const breaksTakenToday = stats?.breaksTakenToday ?? 0;
  const totalBreakTimeToday = stats?.totalBreakTimeToday ?? "--";
  const remainingBreakAllowance = stats?.remainingBreakAllowance ?? "--";
  const averageBreakDurationThisWeek = stats?.averageBreakDurationThisWeek ?? "--";

  const statsData = [
    {
      header: t("breakStats.breaksTakenToday", "Breaks Taken Today"),
      title: isLoading ? "..." : breaksTakenToday,
      subTitle: t("breakStats.breaksToday", "Number of breaks today"),
      rightIcon: (
        <img
          src="/assets/break_tracking/break-time.svg"
          alt="breaks taken"
          className="w-5 h-5 sm:w-6 sm:h-6 lg:w-5 lg:h-5 xl:w-6 xl:h-6 2xl:w-8 2xl:h-8 drop-shadow-lg transition-transform duration-200 hover:scale-110"
        />
      ),
    },
    {
      header: t("breakStats.totalBreakTimeToday", "Total Break Time Today"),
      title: isLoading ? "..." : totalBreakTimeToday,
      subTitle: t("breakStats.timeTakenToday", "Time taken today"),
      rightIcon: (
        <img
          src="/assets/break_tracking/most-break.svg"
          alt="break time"
          className="w-5 h-5 sm:w-6 sm:h-6 lg:w-5 lg:h-5 xl:w-6 xl:h-6 2xl:w-8 2xl:h-8 drop-shadow-lg transition-transform duration-200 hover:scale-110"
        />
      ),
    },
    {
      header: t("breakStats.remainingBreakAllowance", "Remaining Break Allowance"),
      title: isLoading ? "..." : remainingBreakAllowance,
      subTitle: t("breakStats.remainingTime", "Remaining time available"),
      rightIcon: (
        <img
          src="/assets/break_tracking/avg-break.svg"
          alt="remaining"
          className="w-5 h-5 sm:w-6 sm:h-6 lg:w-5 lg:h-5 xl:w-6 xl:h-6 2xl:w-8 2xl:h-8 drop-shadow-lg transition-transform duration-200 hover:scale-110"
        />
      ),
    },
    {
      header: t("breakStats.averageBreakDurationThisWeek", "Avg Break Duration This Week"),
      title: isLoading ? "..." : averageBreakDurationThisWeek,
      subTitle: t("breakStats.averageThisWeek", "Average this week"),
      rightIcon: (
        <img
          src="/assets/break_tracking/overlimit.svg"
          alt="average"
          className="w-5 h-5 sm:w-6 sm:h-6 lg:w-5 lg:h-5 xl:w-6 xl:h-6 2xl:w-8 2xl:h-8 drop-shadow-lg transition-transform duration-200 hover:scale-110"
        />
      ),
    },
  ];

  // Enhanced loading state
  if (isLoading) {
    return (
      <div className="w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 lg:gap-2 xl:gap-3 2xl:gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-full h-full min-h-[100px] sm:min-h-[120px] lg:min-h-[110px] xl:min-h-[120px] 2xl:min-h-[140px] p-2 sm:p-3 md:p-4 lg:p-2 xl:p-3 2xl:p-4 rounded-2xl border animate-pulse"
              style={{
                backgroundColor: 'var(--bg-color)',
                borderColor: 'var(--border-color)',
              }}
            >
              <div className="flex items-center justify-between mb-2 sm:mb-3 lg:mb-2 xl:mb-3 2xl:mb-4">
                <div className="h-2 sm:h-3 lg:h-2 xl:h-3 2xl:h-4 bg-gray-300 rounded w-12 sm:w-16 lg:w-12 xl:w-16 2xl:w-20"></div>
                <div className="w-5 h-5 sm:w-6 sm:h-6 lg:w-5 lg:h-5 xl:w-6 xl:h-6 2xl:w-8 2xl:h-8 bg-gray-300 rounded-xl"></div>
              </div>
              <div className="h-4 sm:h-6 lg:h-4 xl:h-6 2xl:h-8 bg-gray-300 rounded w-8 sm:w-12 lg:w-8 xl:w-12 2xl:w-16 mb-1 sm:mb-2 lg:mb-1 xl:mb-2 2xl:mb-2"></div>
              <div className="h-1.5 sm:h-2 lg:h-1.5 xl:h-2 2xl:h-3 bg-gray-300 rounded w-16 sm:w-20 lg:w-16 xl:w-20 2xl:w-24"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Enhanced grid optimized for 1024px-1250px range */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 lg:gap-2 xl:gap-3 2xl:gap-6">
        {statsData.map((stat, index) => (
          <Card
            key={index}
            header={stat.header}
            title={
              <span className="text-xs sm:text-sm lg:text-xs xl:text-sm 2xl:text-base transition-all duration-200">
                {stat.title}
              </span>
            }
            subTitle={
              <span className="text-[10px] sm:text-xs lg:text-[10px] xl:text-xs 2xl:text-sm transition-all duration-200">
                {stat.subTitle}
              </span>
            }
            rightIcon={stat.rightIcon}
            className="h-full min-h-[100px] sm:min-h-[120px] lg:min-h-[110px] xl:min-h-[120px] 2xl:min-h-[140px] backdrop-blur-sm transition-all duration-300 hover:shadow-lg"
            style={{
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.04)',
              background: 'linear-gradient(135deg, var(--bg-color), rgba(255, 255, 255, 0.02))'
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default AttendanceStats;
