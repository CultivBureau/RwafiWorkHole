import { TrendingUp, TrendingDown } from "lucide-react";
import Card from "../Time_Tracking_Components/Stats/Card";
import { useTranslation } from "react-i18next";

// Static leave stats data
const staticLeaveStats = {
  leaveTypeCounts: {
    annualLeaves: 15,
    sickLeaves: 10,
    emergencyLeaves: 5,
    unpaidLeaves: 0
  }
};

const LeaveStatusCards = () => {
    const { t, i18n } = useTranslation();
    const isArabic = i18n.language === "ar";

    // Use static data instead of API call
    const stats = staticLeaveStats;
    const isLoading = false;
    
    // Static leave type counts
    const leaveTypeCounts = stats?.leaveTypeCounts || {};

    const statusCardsData = [
        {
            header: t("leaves.statusCards.annualLeave"),
            title: isLoading ? "..." : (leaveTypeCounts.annualLeaves ?? 0),
            subTitle: t("leaves.statusCards.daysLeftThisYear"),
            rightIcon: (
                <img
                    src="/assets/leaves/anual.svg"
                    alt="annual leave"
                    className="w-6 h-6 sm:w-8 sm:h-8 lg:w-6 lg:h-6 xl:w-8 xl:h-8 2xl:w-8 2xl:h-8 transition-transform duration-200 hover:scale-110"
                />
            ),
        },
        {
            header: t("leaves.statusCards.sickLeave"),
            title: leaveTypeCounts.sickLeaves ?? 0,
            subTitle: t("leaves.statusCards.daysLeft"),
            rightIcon: (
                <img
                    src="/assets/leaves/sick.svg"
                    alt="sick leave"
                    className="w-6 h-6 sm:w-8 sm:h-8 lg:w-6 lg:h-6 xl:w-8 xl:h-8 2xl:w-8 2xl:h-8 transition-transform duration-200 hover:scale-110"
                />
            ),
        },
        {
            header: t("leaves.statusCards.emergencyLeave"),
            title: leaveTypeCounts.emergencyLeaves ?? 0,
            subTitle: t("leaves.statusCards.daysLeft"),
            rightIcon: (
                <img
                    src="/assets/leaves/emergency.svg"
                    alt="emergency leave"
                    className="w-6 h-6 sm:w-8 sm:h-8 lg:w-6 lg:h-6 xl:w-8 xl:h-8 2xl:w-8 2xl:h-8 transition-transform duration-200 hover:scale-110"
                />
            ),
        },
        {
            header: t("leaves.statusCards.unpaidLeave"),
            title: leaveTypeCounts.unpaidLeaves ?? 0,
            subTitle: t("leaves.statusCards.daysLeft"),
            rightIcon: (
                <img
                    src="/assets/leaves/unpaid.svg"
                    alt="unpaid leave"
                    className="w-6 h-6 sm:w-8 sm:h-8 lg:w-6 lg:h-6 xl:w-8 xl:h-8 2xl:w-8 2xl:h-8 transition-transform duration-200 hover:scale-110"
                />
            ),
        },
    ];

    return (
        <div className="w-full">
            {/* Enhanced grid optimized for 1024px-1300px range */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-3 xl:gap-4 2xl:gap-6">
                {statusCardsData.map((card, index) => (
                    <Card
                        key={index}
                        header={card.header}
                        title={
                            <span className="text-sm sm:text-base lg:text-sm xl:text-base 2xl:text-base transition-all duration-200">
                                {card.title}
                            </span>
                        }
                        rightIcon={card.rightIcon}
                        className="h-full min-h-[120px] sm:min-h-[140px] lg:min-h-[130px] xl:min-h-[140px] 2xl:min-h-[160px]"
                    />
                ))}
            </div>
        </div>
    );
};

export default LeaveStatusCards;

