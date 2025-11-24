import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import Card from "../../Time_Tracking_Components/Stats/Card";
import { useGetDepartmentStatisticsQuery } from "../../../services/apis/DepartmentApi";

// Helper function to convert camelCase to Title Case
const formatHeader = (key) => {
    return key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .trim();
};

const StatusCards = () => {
    const { t } = useTranslation();
    const { data: statsData, isLoading } = useGetDepartmentStatisticsQuery();

    // Extract statistics from API response
    const stats = statsData?.value || {};

    // Dynamically create cards from API response fields
    const statusCards = useMemo(() => {
        const iconMap = {
            totalDepartments: <img src="/assets/all-department/total.svg" alt={t("allDepartments.cards.totalDepartments")} className="w-6 h-6" />,
            totalTeams: <img src="/assets/all-department/employees.svg" alt={t("allDepartments.cards.totalTeams")} className="w-6 h-6" />,
            largestDepartmentHeadcount: <img src="/assets/all-department/highest.svg" alt={t("allDepartments.cards.largestDepartmentHeadcount")} className="w-6 h-6" />,
            smallestDepartmentHeadcount: <img src="/assets/all-department/issues.svg" alt={t("allDepartments.cards.smallestDepartmentHeadcount")} className="w-6 h-6" />,
        };

        // Create cards for each field in the API response
        return Object.entries(stats).map(([key, value]) => {
            const translationKey = `allDepartments.cards.${key}`;
            const translated = t(translationKey);
            const header = translated === translationKey ? formatHeader(key) : translated;

            return {
                header,
                title: isLoading ? "..." : (value ?? 0).toString(),
                rightIcon:
                    iconMap[key] || (
                        <img
                            src="/assets/all-department/total.svg"
                            alt={header}
                            className="w-6 h-6"
                        />
                    ),
            };
        });
    }, [stats, isLoading, t]);

    const gridColsClass = statusCards.length === 1 ? "lg:grid-cols-1" : 
                          statusCards.length === 2 ? "lg:grid-cols-2" : 
                          statusCards.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-4";

    return (
        <section className={`w-full grid grid-cols-1 md:grid-cols-2 ${gridColsClass} gap-4 mb-6`}>
            {statusCards.map((card, index) => (
                <Card
                    key={index}
                    header={card.header}
                    title={card.title}
                    rightIcon={card.rightIcon}
                    className="min-h-[120px]"
                />
            ))}
        </section>
    );
};

export default StatusCards;