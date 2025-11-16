import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import Card from "../../Time_Tracking_Components/Stats/Card";
import { useGetUserStatisticsQuery } from "../../../services/apis/UserApi";

// Helper function to convert camelCase to Title Case
const formatHeader = (key) => {
    return key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .trim();
};

const StatusCards = () => {
    const { t } = useTranslation();
    const { data: statsData, isLoading } = useGetUserStatisticsQuery();

    // Extract statistics from API response
    const stats = statsData?.value || {};

    // Dynamically create cards from API response fields
    const statusCards = useMemo(() => {
        const iconMap = {
            totalEmployees: <img src="/assets/all_employees/employees.svg" alt="Total Employees" className="w-6 h-6" />,
            newHiresLast30Days: <img src="/assets/all_employees/new.svg" alt="New Hires" className="w-6 h-6" />,
        };

        // Create cards for each field in the API response
        return Object.entries(stats).map(([key, value]) => ({
            header: formatHeader(key),
            title: isLoading ? "..." : (value ?? 0).toString(),
            rightIcon: iconMap[key] || <img src="/assets/all_employees/employees.svg" alt={formatHeader(key)} className="w-6 h-6" />,
        }));
    }, [stats, isLoading]);

    const gridColsClass = statusCards.length === 1 ? "lg:grid-cols-1" : 
                          statusCards.length === 2 ? "lg:grid-cols-2" : "lg:grid-cols-3";

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