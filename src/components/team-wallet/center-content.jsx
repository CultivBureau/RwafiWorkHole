import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Doughnut, Bar } from "react-chartjs-2";
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const CenterContent = () => {
    const { t, i18n } = useTranslation();
    const direction = i18n.language === "ar" ? "rtl" : "ltr";
    const textAlign = i18n.language === "ar" ? "text-right" : "text-left";



    // State for screen width and responsive layout
    const [screenWidth, setScreenWidth] = useState(window.innerWidth);

    // Define breakpoints
    const isMobile = screenWidth < 768;
    const isTablet = screenWidth >= 768 && screenWidth < 1260;
    const isDesktop = screenWidth >= 1260;

    // State for dropdowns
    const [teamPeriod, setTeamPeriod] = useState("Over Year");
    const [teamType, setTeamType] = useState("Deductions");
    const [deductionsPeriod, setDeductionsPeriod] = useState("Over Year");
    const [bonusesPeriod, setBonusesPeriod] = useState("Over Year");

    // Handle window resize
    useEffect(() => {
        const handleResize = () => {
            setScreenWidth(window.innerWidth);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Sample data for different periods
    const teamDataMonth = [
        { name: "SARAH", value: 40 },
        { name: "ROBERT", value: 15 },
        { name: "EMMA", value: 10 },
        { name: "TYLER", value: 5 },
    ];
    const teamDataYear = [
        { name: "SARAH", value: 60 },
        { name: "ROBERT", value: 25 },
        { name: "EMMA", value: 20 },
        { name: "TYLER", value: 15 },
    ];
    const getTeamData = () => teamPeriod === "Over Year" ? teamDataYear : teamDataMonth;

    // Deductions chart data
    const deductionsData = [
        { title: t("walletCharts.deductions.legend.lateArrivals", "Late Arrivals"), percentage: 60, color: '#dc2626' },
        { title: t("walletCharts.deductions.legend.missedDeadline", "Missed Deadline"), percentage: 20, color: '#374151' },
        { title: t("walletCharts.deductions.legend.absences", "Absences"), percentage: 20, color: '#9ca3af' }
    ];

    // Bonuses chart data
    const bonusesData = [
        { title: t("walletCharts.bonuses.legend.tasks", "Tasks"), percentage: 60, color: '#0d9488' },
        { title: t("walletCharts.bonuses.legend.kpi", "KPI"), percentage: 20, color: '#5eead4' },
        { title: t("walletCharts.bonuses.legend.attendance", "Attendance"), percentage: 20, color: '#67e8f9' }
    ];

    // Bar chart data for team deductions
    const barChartData = {
        labels: getTeamData().map(item => item.name),
        datasets: [
            {
                data: getTeamData().map(item => item.value),
                backgroundColor: teamType === "Deductions" ? '#dc2626' : '#15919B',
                borderRadius: 4,
                borderSkipped: false,
                barPercentage: 0.4,
                categoryPercentage: 0.8,
            }
        ]
    };

    const barChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#ffffff',
                titleColor: '#374151',
                bodyColor: '#374151',
                borderColor: '#e5e7eb',
                borderWidth: 1,
                cornerRadius: 8,
                padding: 10,
            }
        },
        scales: {
            x: {
                display: true,
                grid: {
                    display: false
                },
                ticks: {
                    color: '#9ca3af',
                    font: { size: 10 }
                },
                border: {
                    color: '#9ca3af'
                }
            },
            y: {
                display: true,
                grid: {
                    display: true,
                    color: '#9ca3af'
                },
                ticks: {
                    color: '#9ca3af',
                    font: { size: 10 },
                    callback: function (value) {
                        return value + '%';
                    }
                },
                border: {
                    color: '#9ca3af'
                },
                max: 100
            }
        }
    };

    // Chart configuration function for doughnut charts
    const createChartData = (data) => ({
        labels: data.map(item => item.title),
        datasets: [
            {
                data: data.map(item => item.percentage),
                backgroundColor: data.map(item => item.color),
                hoverBackgroundColor: data.map(item => item.color + 'CC'),
                borderWidth: 0,
                hoverBorderWidth: 3,
                hoverBorderColor: '#ffffff',
                cutout: '65%',
                hoverOffset: 10,
            },
        ],
    });

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                enabled: false
            }
        },
        elements: {
            arc: {
                borderWidth: 0,
                hoverBorderWidth: 2,
                hoverBorderColor: '#ffffff',
            }
        },
        onHover: (event, activeElements) => {
            event.native.target.style.cursor = activeElements.length > 0 ? 'pointer' : 'default';
        }
    };

    // Calculate totals for center display
    const deductionsTotal = deductionsData.reduce((sum, item) => sum + item.percentage, 0);
    const bonusesTotal = bonusesData.reduce((sum, item) => sum + item.percentage, 0);

    // Define grid layout based on screen size
    const getGridLayout = () => {
        if (isMobile) {
            return 'grid-cols-1';
        } else if (isTablet) {
            return 'grid-cols-2';
        } else {
            return 'grid-cols-10';
        }
    };

    // Define column spans based on screen size
    const getTeamChartSpan = () => {
        if (isMobile) {
            return 'col-span-1';
        } else if (isTablet) {
            return 'col-span-2';
        } else {
            return 'col-span-3';
        }
    };

    const getDoughnutChartSpan = () => {
        if (isMobile) {
            return 'col-span-1';
        } else if (isTablet) {
            return 'col-span-1';
        } else {
            return 'col-span-2';
        }
    };

    const getTeamSectionSpan = () => {
        if (isMobile) {
            return 'col-span-1';
        } else if (isTablet) {
            return 'col-span-2';
        } else {
            return 'col-span-3';
        }
    };

    // Define chart sizes based on screen size
    const getDoughnutSize = () => {
        if (isTablet) {
            return 'w-20 h-20';
        } else {
            return 'w-25 h-25';
        }
    };

    return (
        <div
            className={`grid gap-4 mb-4 ${getGridLayout()}`}
            dir={direction}
        >
            {/* Team Deductions Breakdown */}
            <div
                className={`${getTeamChartSpan()} rounded-xl p-3 border h-72 flex flex-col`}
                style={{
                    backgroundColor: 'var(--bg-color)',
                    borderColor: 'var(--border-color)'
                }}
            >
                {/* Header - Title and Period Select (Same Row) */}
                <div className="flex justify-between items-center mb-1">
                    <h4
                        className={`text-xs font-semibold ${textAlign}`}
                        style={{ color: 'var(--text-color)' }}
                    >
                        {t("walletCharts.teamDeductions.header")}
                    </h4>
                    <select
                        value={teamPeriod}
                        onChange={(e) => setTeamPeriod(e.target.value)}
                        className="text-xs border rounded px-2 py-1"
                        style={{
                            backgroundColor: 'var(--table-header-bg)',
                            borderColor: 'var(--border-color)',
                            color: 'var(--sub-text-color)'
                        }}
                    >
                        <option value="Over Year">{t("walletCharts.period.year")}</option>
                        <option value="Over Month">{t("walletCharts.period.month")}</option>
                    </select>
                </div>

                {/* Subtitle and Type Select (Same Row) */}
                <div className="flex justify-between items-center mb-3">
                    <p
                        className={`text-xs ${textAlign}`}
                        style={{ color: 'var(--sub-text-color)' }}
                    >
                        {t("walletCharts.teamDeductions.subtitle")}
                    </p>
                    <select
                        value={teamType}
                        onChange={(e) => setTeamType(e.target.value)}
                        className="text-xs border rounded px-2 py-1"
                        style={{
                            backgroundColor: 'var(--table-header-bg)',
                            borderColor: 'var(--border-color)',
                            color: 'var(--sub-text-color)'
                        }}
                    >
                        <option value="Deductions">{t("walletCharts.teamChart.deductions")}</option>
                        <option value="Bonuses">{t("walletCharts.teamChart.bonuses")}</option>
                    </select>
                </div>

                {/* Chart Container - 80% of height */}
                <div className="flex-1" dir="ltr">
                    <Bar data={barChartData} options={barChartOptions} />
                </div>
            </div>

            {/* Deductions Breakdown */}
            <div
                className={`${getDoughnutChartSpan()} rounded-xl p-3 border h-72 flex flex-col`}
                style={{
                    backgroundColor: 'var(--bg-color)',
                    borderColor: 'var(--border-color)'
                }}
            >
                {/* Header - Title and Select (Same Row) */}
                <div className="flex justify-between items-center h-6 mb-2">
                    <h3
                        className={`text-xs font-semibold ${textAlign}`}
                        style={{ color: 'var(--text-color)' }}
                    >
                        {t("walletCharts.deductions.header")}
                    </h3>
                    <select
                        value={deductionsPeriod}
                        onChange={(e) => setDeductionsPeriod(e.target.value)}
                        className="text-xs border rounded px-1 py-1 w-16"
                        style={{
                            backgroundColor: 'var(--bg-color)',
                            borderColor: 'var(--border-color)',
                            color: 'var(--sub-text-color)'
                        }}
                    >
                        <option value="Over Year">{t("walletCharts.period.year")}</option>
                        <option value="Over Month">{t("walletCharts.period.month")}</option>
                    </select>
                </div>

                {/* Subtitle - 20% of height */}
                <div className="h-12">
                    <p
                        className={`text-xs ${textAlign}`}
                        style={{ color: 'var(--sub-text-color)' }}
                    >
                        {t("walletCharts.deductions.subtitle")}
                    </p>
                </div>

                {/* Doughnut Chart - 50% of height */}
                <div className="h-28 relative flex justify-center items-center">
                    <div className={`${getDoughnutSize()} relative`}>
                        <Doughnut data={createChartData(deductionsData)} options={chartOptions} />
                        {/* Center text overlay */}
                        <div className="absolute inset-0 flex flex-col justify-center items-center pointer-events-none">
                            <div className="text-center">
                                <div
                                    className="text-xs font-bold"
                                    style={{ color: 'var(--text-color)' }}
                                >
                                    {deductionsTotal}
                                </div>
                                <div
                                    className="text-[10px]"
                                    style={{ color: 'var(--sub-text-color)' }}
                                >
                                    {t("walletCharts.totalTasks")}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Legend - 30% of height */}
                <div className="h-20 flex flex-col justify-center space-y-1 overflow-hidden">
                    {deductionsData.map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                            <div className="flex items-center">
                                <div
                                    className="w-2 h-2 rounded-full mr-2 flex-shrink-0"
                                    style={{ backgroundColor: item.color }}
                                ></div>
                                <span
                                    className={`text-[10px] ${textAlign} truncate`}
                                    style={{ color: 'var(--text-color)' }}
                                >
                                    {item.title}
                                </span>
                            </div>
                            <span
                                className={`text-[10px] ${textAlign} flex-shrink-0 ml-1`}
                                style={{ color: 'var(--text-color)' }}
                            >
                                {item.percentage}%
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Bonuses Breakdown */}
            <div
                className={`${getDoughnutChartSpan()} rounded-xl p-3 border h-72 flex flex-col`}
                style={{
                    backgroundColor: 'var(--bg-color)',
                    borderColor: 'var(--border-color)'
                }}
            >
                {/* Header - Title and Select (Same Row) */}
                <div className="flex justify-between items-center h-6 mb-2">
                    <h3
                        className={`text-xs font-semibold ${textAlign}`}
                        style={{ color: 'var(--text-color)' }}
                    >
                        {t("walletCharts.bonuses.header")}
                    </h3>
                    <select
                        value={bonusesPeriod}
                        onChange={(e) => setBonusesPeriod(e.target.value)}
                        className="text-xs border rounded px-1 py-1 w-16"
                        style={{
                            backgroundColor: 'var(--bg-color)',
                            borderColor: 'var(--border-color)',
                            color: 'var(--sub-text-color)'
                        }}
                    >
                        <option value="Over Year">{t("walletCharts.period.year")}</option>
                        <option value="Over Month">{t("walletCharts.period.month")}</option>
                    </select>
                </div>

                {/* Subtitle - 20% of height */}
                <div className="h-12">
                    <p
                        className={`text-xs ${textAlign}`}
                        style={{ color: 'var(--sub-text-color)' }}
                    >
                        {t("walletCharts.bonuses.subtitle")}
                    </p>
                </div>

                {/* Doughnut Chart - 50% of height */}
                <div className="h-28 relative flex justify-center items-center">
                    <div className={`${getDoughnutSize()} relative`}>
                        <Doughnut data={createChartData(bonusesData)} options={chartOptions} />
                        {/* Center text overlay */}
                        <div className="absolute inset-0 flex flex-col justify-center items-center pointer-events-none">
                            <div className="text-center">
                                <div
                                    className="text-xs font-bold"
                                    style={{ color: 'var(--text-color)' }}
                                >
                                    {bonusesTotal}
                                </div>
                                <div
                                    className="text-[10px]"
                                    style={{ color: 'var(--sub-text-color)' }}
                                >
                                    {t("walletCharts.totalTasks")}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Legend - 30% of height */}
                <div className="h-20 flex flex-col justify-center space-y-1 overflow-hidden">
                    {bonusesData.map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                            <div className="flex items-center">
                                <div
                                    className="w-2 h-2 rounded-full mr-2 flex-shrink-0"
                                    style={{ backgroundColor: item.color }}
                                ></div>
                                <span
                                    className={`text-[10px] ${textAlign} truncate`}
                                    style={{ color: 'var(--text-color)' }}
                                >
                                    {item.title}
                                </span>
                            </div>
                            <span
                                className={`text-[10px] ${textAlign} flex-shrink-0 ml-1`}
                                style={{ color: 'var(--text-color)' }}
                            >
                                {item.percentage}%
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Team */}
            <div
                className={`${getTeamSectionSpan()} rounded-xl p-3 border h-72 flex flex-col`}
                style={{
                    backgroundColor: 'var(--bg-color)',
                    borderColor: 'var(--border-color)'
                }}
            >
                <div className="flex justify-between items-center mb-3">
                    <h3
                        className={`text-sm font-semibold ${textAlign}`}
                        style={{ color: 'var(--text-color)' }}
                    >
                        {t("walletCharts.team.header")}
                    </h3>
                </div>

                {/* Team members list - Scrollable */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-2" style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'var(--border-color) transparent'
                }}>
                    {[1, 2, 3, 4].map((_, index) => (
                        <div
                            key={index}
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-opacity-50 transition-all cursor-pointer"
                            style={{
                                backgroundColor: 'transparent',
                                ':hover': { backgroundColor: 'var(--container-color)' }
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--container-color)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                <img
                                    src={`https://i.pravatar.cc/40?img=${index + 1}`}
                                    alt={t("profile.profile")}
                                    className="w-8 h-8 rounded-full flex-shrink-0"
                                />
                                <div className="min-w-0 flex-1">
                                    <p
                                        className={`text-xs font-semibold ${textAlign} truncate`}
                                        style={{ color: 'var(--text-color)' }}
                                    >
                                        {t("navbar.profileName")} {index + 1}
                                    </p>
                                    <p
                                        className={`text-xs ${textAlign} truncate`}
                                        style={{ color: 'var(--sub-text-color)' }}
                                    >
                                        {t("navbar.role")}
                                    </p>
                                </div>
                            </div>
                            <svg
                                className="w-4 h-4 flex-shrink-0"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                style={{ color: 'var(--sub-text-color)' }}
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CenterContent;