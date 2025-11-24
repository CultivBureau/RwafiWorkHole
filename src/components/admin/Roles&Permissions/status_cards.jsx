import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import Card from "../../Time_Tracking_Components/Stats/Card";
import { useGetRoleStatisticsQuery } from "../../../services/apis/RoleApi";

// Helper function to convert camelCase to Title Case
const formatHeader = (key) => {
    return key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .trim();
};

const StatusCards = () => {
    const { t, i18n } = useTranslation();
    const isArabic = i18n.language === "ar";
    const { data: statsData, isLoading } = useGetRoleStatisticsQuery();

    // Dynamically create cards from API response fields
    const statusCards = useMemo(() => {
        const stats = statsData?.value || {};
        const currentLanguage = i18n.language;
        const iconMap = {
            usersWithAdminAccess: <img src="/assets/RolesAndPermissions/custom.svg" alt="Users With Admin Access" className="w-6 h-6" />,
            totalRoles: <img src="/assets/RolesAndPermissions/total.svg" alt="Total Roles" className="w-6 h-6" />,
            activeRoles: <img src="/assets/RolesAndPermissions/active.svg" alt="Active Roles" className="w-6 h-6" />,
            usersWithoutRole: <img src="/assets/RolesAndPermissions/totalusers.svg" alt="Users Without Role" className="w-6 h-6" />,
        };

        // Create cards for each field in the API response
        return Object.entries(stats).map(([key, value]) => {
            const translationKey = `roles.statusCards.${key}`;
            const translatedHeader = t(translationKey);
            const header =
                translatedHeader === translationKey ? formatHeader(key) : translatedHeader;

            return {
                id: `${currentLanguage}-${key}`,
                header,
                title: isLoading ? "..." : (value ?? 0).toString(),
                rightIcon:
                    iconMap[key] || (
                        <img
                            src="/assets/RolesAndPermissions/total.svg"
                            alt={formatHeader(key)}
                            className="w-6 h-6"
                        />
                    ),
            };
        });
    }, [statsData, isLoading, t, i18n.language]);

    const gridColsClass = statusCards.length === 1 ? "lg:grid-cols-1" : 
                          statusCards.length === 2 ? "lg:grid-cols-2" : 
                          statusCards.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-4";

    return (
        <section className={`w-full grid grid-cols-1 md:grid-cols-2 ${gridColsClass} gap-4 mb-6`} dir={isArabic ? 'rtl' : 'ltr'}>
            {statusCards.map((card, index) => (
                <Card
                    key={card.id || index}
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