import React from "react";
import { useTranslation } from "react-i18next";
import Card from "../../../Time_Tracking_Components/Stats/Card";

const TeamsStatusCards = () => {
    const { t } = useTranslation();

    const statusCards = [
        {
            header: t("allTeams.statusCards.totalTeams.title"),
            title: t("allTeams.statusCards.totalTeams.count"),
            subTitle: t("allTeams.statusCards.totalTeams.description"),
            rightIcon: <img src="/assets/all-department/teams/tasks.svg" alt="Total Teams" className="w-6 h-6" />,
        },
        {
            header: t("allTeams.statusCards.pendingTasks.title"),
            title: t("allTeams.statusCards.pendingTasks.count"),
            subTitle: t("allTeams.statusCards.pendingTasks.description"),
            rightIcon: <img src="/assets/all-department/teams/pending.svg" alt="Pending Tasks" className="w-6 h-6" />,
        },
        {
            header: t("allTeams.statusCards.attendanceRate.title"),
            title: t("allTeams.statusCards.attendanceRate.count"),
            subTitle: t("allTeams.statusCards.attendanceRate.description"),
            rightIcon: <img src="/assets/all-department/teams/attendance.svg" alt="Attendance Rate" className="w-6 h-6" />,
        },
        {
            header: t("allTeams.statusCards.kpiPerformance.title"),
            title: t("allTeams.statusCards.kpiPerformance.count"),
            subTitle: t("allTeams.statusCards.kpiPerformance.description"),
            rightIcon: <img src="/assets/all-department/teams/kpis.svg" alt="KPI Performance" className="w-6 h-6" />,
        },
    ];

    return (
        <section className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {statusCards.map((card, index) => (
                <Card
                    key={index}
                    header={card.header}
                    title={card.title}
                    subTitle={card.subTitle}
                    rightIcon={card.rightIcon}
                    className="min-h-[120px]"
                />
            ))}
        </section>
    );
};

export default TeamsStatusCards;
