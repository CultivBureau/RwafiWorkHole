import React from 'react'
import SideMenu from '../../../components/side-menu/side-menu'
import NavBar from '../../../components/NavBar/navbar'
import { useLang } from '../../../contexts/LangContext'
import { useTheme } from '../../../contexts/ThemeContext'
import { useTranslation } from "react-i18next";
import Card from '../../../components/Time_Tracking_Components/Stats/Card'
import QuickActions from '../../../components/Performance/Quick-Actions/page'
import KpiBreakdown from '../../../components/Performance/kpi-Breakdown/page'
import KpiTrend from '../../../components/Performance/kpi-trend/page'
import AttendanceOverview from '../../../components/Performance/Attendance-Overview/page'

const Performance = () => {
    const { isRtl } = useLang();
    const { theme } = useTheme();
    const { t } = useTranslation();

    const statusCardsData = [
        {
            header: t('performance.statusCards.myKpiScore'),
            title: '82%',
            rightIcon: <img src="/assets/performance/kpi.svg" alt="performance" />
        },
        {
            header: t('performance.statusCards.tasksCompleted'),
            title: '72%',
            rightIcon: <img src="/assets/performance/tasks.svg" alt="performance" />
        },
        {
            header: t('performance.statusCards.attendanceRate'),
            title: '92%',
            rightIcon: <img src="/assets/performance/rate.svg" alt="performance" />
        },
        {
            header: t('performance.statusCards.hoursLogged'),
            title: '180h',
            rightIcon: <img src="/assets/performance/clock.svg" alt="performance" />
        },
    ]

    return (
        <div
            className="w-full h-screen flex flex-col"
            style={{ background: "var(--bg-all)" }}
        >
            {/* Navigation Bar - Full Width at Top */}
            <NavBar />

            {/* Content Area with SideMenu and Main Content */}
            <div className="flex flex-1 min-h-0" style={{ background: "var(--bg-all)" }}>
                {/* Side Menu - Left side under navbar */}
                <SideMenu />

                {/* Main Content - Rest of the space */}
                <main className="flex-1 overflow-auto p-1 sm:p-2 lg:p-4" style={{ background: "var(--bg-all)" }}>
                    <div
                        className="h-max rounded-2xl border border-gray-200"
                        style={{ background: "var(--bg-color)" }}
                    >
                        {/* Performance content */}
                        <div className="w-full h-max px-1 sm:px-2 lg:px-3">
                            {/* Status Cards - Better responsive for 1024px */}
                            <div className='w-full h-max flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-3 lg:gap-5 pb-1 pt-2 sm:pt-3'>
                                {statusCardsData.map((card, index) => (
                                    <Card
                                        key={index}
                                        header={card.header}
                                        title={card.title}
                                        rightIcon={card.rightIcon}
                                    />
                                ))}
                            </div>

                            {/* KPI Section - Better responsive for 1024px */}
                            <div className='w-full h-max flex flex-col xl:flex-row justify-center items-start gap-2 sm:gap-3 lg:gap-4 pt-3 sm:pt-4 lg:pt-5'>
                                <div className='w-full xl:w-[75%] h-max flex justify-center items-center flex-col'>
                                    <KpiTrend />
                                </div>
                                <div className='w-full xl:w-[25%] h-max flex justify-center items-center'>
                                    <KpiBreakdown />
                                </div>
                            </div>

                            {/* Attendance Overview */}
                            <div className='w-full h-max flex justify-center items-center pt-2 pb-2 sm:pb-3 lg:pb-4'>
                                <AttendanceOverview />
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
}

export default Performance