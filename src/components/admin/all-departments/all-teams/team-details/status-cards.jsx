import React from "react";
import { useTranslation } from "react-i18next";
import Card from "../../../../Time_Tracking_Components/Stats/Card";

const TeamDetailsStatusCards = ({ teamData }) => {
    const { t } = useTranslation();

    // Use only real team data from API
    const data = teamData;
    
    // If no data, show empty/zero values
    if (!data) {
        return null; // Don't render if no team data
    }

    // Only show cards if we have real data from API
    const statusCards = [
        data.kpiScore !== undefined && {
            header: t('teamDetails.statusCards.teamKpiScore'),
            title: `${data.kpiScore}%`,
            subTitle: t('teamDetails.statusCards.overallPerformance'),
            rightIcon: <img src="/assets/all-department/teams/team-details/kpis.svg" alt="KPI Score" className="w-6 h-6" />,
        },
        (data.tasksCompleted !== undefined || data.tasksTotal !== undefined) && {
            header: t('teamDetails.statusCards.tasksProgress'),
            title: `${data.tasksCompleted || 0} / ${data.tasksTotal || 0}`,
            subTitle: t('teamDetails.statusCards.completedVsAssigned'),
            rightIcon: <img src="/assets/all-department/teams/team-details/progress.svg" alt="Tasks Progress" className="w-6 h-6" />,
        },
        data.attendanceRate !== undefined && {
            header: t('teamDetails.statusCards.averageAttendance'),
            title: `${data.attendanceRate}%`,
            subTitle: t('teamDetails.statusCards.presenceRate'),
            rightIcon: <img src="/assets/all-department/teams/team-details/attendance.svg" alt="Attendance" className="w-6 h-6" />,
        },
        data.topPerformer?.name && {
            header: t('teamDetails.statusCards.topPerformer'),
            title: `${data.topPerformer.name}${data.topPerformer.percentage ? ` (${data.topPerformer.percentage}%)` : ''}`,
            subTitle: t('teamDetails.statusCards.bestPerforming'),
            rightIcon: <img src="/assets/all-department/teams/team-details/performer.svg" alt="Top Performer" className="w-6 h-6" />,
        },
    ].filter(Boolean); // Remove falsy values

    return (
        <section className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" style={{ minHeight: 'auto' }}>
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

export default TeamDetailsStatusCards;
