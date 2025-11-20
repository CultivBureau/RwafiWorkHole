import React from "react";
import { useTranslation } from "react-i18next";
import { useGetEmployeeLeaveSummaryQuery } from "../../services/apis/DashboardApi";

const CompactLeaveSummaryCards = () => {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === "ar";

  // Fetch leave summary from API
  const { data, isLoading, error } = useGetEmployeeLeaveSummaryQuery();
  
  // Extract data from API response (response has a 'value' wrapper)
  const apiData = data?.value || {};
  const availableLeaves = apiData?.annualLeaveBalance ?? 0;
  const statusCounts = {
    rejectedLeaves: apiData?.rejectedRequests ?? 0,
    pendingLeaves: apiData?.pendingRequests ?? 0,
    approvedLeaves: apiData?.approvedRequests ?? 0,
  };

  const summaryCardsData = [
    {
      id: 1,
      count: isLoading ? "..." : availableLeaves,
      title: t("leaves.summaryCards.availableLeaves"),
      boxClass: "available-leave-box",
    },
    {
      id: 2,
      count: isLoading ? "..." : (statusCounts.rejectedLeaves ?? 0),
      title: t("leaves.summaryCards.rejectedLeaves"),
      boxClass: "rejected-leave-box",
    },
    {
      id: 3,
      count: isLoading ? "..." : (statusCounts.pendingLeaves ?? 0),
      title: t("leaves.summaryCards.pendingLeaves"),
      boxClass: "pending-leave-box",
    },
    {
      id: 4,
      count: isLoading ? "..." : (statusCounts.approvedLeaves ?? 0),
      title: t("leaves.summaryCards.approvedLeaves"),
      boxClass: "approved-leave-box",
    },
  ];

  return (
    <div className="w-full h-full border rounded-xl shadow-sm py-4 sm:py-5 md:py-6 lg:py-4 xl:py-5 2xl:py-8 px-3 sm:px-4 md:px-5 lg:px-3 xl:px-4 2xl:px-6" style={{ border: `1px solid var(--border-color)` }}>
      <div
        className="grid grid-cols-2 gap-3 sm:gap-4 lg:gap-3 xl:gap-4 2xl:gap-6"
        dir={isArabic ? "rtl" : "ltr"}
      >
        {summaryCardsData.map((card) => (
          <div
            key={card.id}
            className="rounded-lg sm:rounded-xl lg:rounded-lg xl:rounded-xl 2xl:rounded-2xl p-3 sm:p-4 lg:p-3 xl:p-4 2xl:p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:scale-105"
            style={{
              backgroundColor: "var(--bg-color)",
              border: `1px solid var(--border-color)`,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05), 0 2px 6px rgba(0, 0, 0, 0.03)',
            }}
          >
            <div className="flex items-center gap-3 sm:gap-4 lg:gap-3 xl:gap-4 2xl:gap-6">
              {/* Colored Box with Number - Bigger and more responsive */}
              <div
                className={`w-12 h-12 sm:w-14 sm:h-14 lg:w-12 lg:h-12 xl:w-14 xl:h-14 2xl:w-20 2xl:h-20 rounded-lg sm:rounded-xl lg:rounded-lg xl:rounded-xl 2xl:rounded-2xl flex items-center justify-center text-sm sm:text-base lg:text-sm xl:text-base 2xl:text-2xl font-bold flex-shrink-0 transition-all duration-300 hover:scale-110 ${card.boxClass}`}
              >
                {card.count}
              </div>

              {/* Title - Bigger and more responsive */}
              <div className="flex-1 min-w-0">
                <h3
                  className="text-xs sm:text-sm lg:text-xs xl:text-sm 2xl:text-lg font-semibold leading-tight break-words transition-all duration-200"
                  style={{ color: "var(--text-color)" }}
                >
                  {card.title}
                </h3>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CompactLeaveSummaryCards;