import React, { useState } from 'react'
import { Calendar, ChevronDown } from 'lucide-react'
import { useLang } from '../../../contexts/LangContext'
import { useTheme } from '../../../contexts/ThemeContext'
import { useTranslation } from "react-i18next";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const KpiTrend = () => {
    const { isRtl } = useLang();
    const { theme } = useTheme();
    const { t } = useTranslation();
    const [selectedPeriod, setSelectedPeriod] = useState('overYear');

    const periodOptions = [
        { value: 'overWeek', label: t('performance.periods.overWeek') },
        { value: 'overMonth', label: t('performance.periods.overMonth') },
        { value: 'overYear', label: t('performance.periods.overYear') }
    ];

    // Sample DataKpi for demonstration - adjusted for wave-like pattern
    const DataKpi = [
        { month: 'Jan', points: 55 },
        { month: 'Feb', points: 65 },
        { month: 'Mar', points: 45 },
        { month: 'Apr', points: 60 },
        { month: 'May', points: 82 },
        { month: 'Jun', points: 75 },
        { month: 'Jul', points: 65 },
        { month: 'Aug', points: 70 },
        { month: 'Sep', points: 68 },
        { month: 'Oct', points: 55 },
        { month: 'Nov', points: 45 },
        { month: 'Dec', points: 75 }
    ];

    // Create gradient for the chart
    const createGradient = (ctx, chartArea) => {
        const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
        gradient.addColorStop(0, '#26C8B9');
        gradient.addColorStop(0.5, 'rgba(38, 200, 185, 0.3)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0.1)');
        return gradient;
    };

    // Chart configuration
    const chartData = {
        labels: DataKpi.map(item => item.month.toUpperCase()),
        datasets: [
            {
                label: 'KPI Performance',
                data: DataKpi.map(item => item.points),
                borderColor: '#26C8B9',
                backgroundColor: (context) => {
                    const chart = context.chart;
                    const { ctx, chartArea } = chart;
                    if (!chartArea) {
                        return null;
                    }
                    return createGradient(ctx, chartArea);
                },
                borderWidth: 3,
                fill: true,
                tension: 0.5,
                pointBackgroundColor: '#26C8B9',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 3,
                pointRadius: 6,
                pointHoverRadius: 8,
                pointHoverBackgroundColor: '#26C8B9',
                pointHoverBorderColor: '#ffffff',
                pointHoverBorderWidth: 4,
                cubicInterpolationMode: 'monotone',
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                backgroundColor: 'rgba(38, 200, 185, 0.9)',
                titleColor: '#ffffff',
                bodyColor: '#ffffff',
                borderColor: '#26C8B9',
                borderWidth: 2,
                cornerRadius: 8,
                displayColors: false,
                callbacks: {
                    label: function (context) {
                        return `${context.parsed.y}%`;
                    }
                }
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                max: 100,
                ticks: {
                    color: '#B0B0B0',
                    font: {
                        size: 12,
                    },
                    callback: function (value) {
                        return value + '%';
                    },
                    stepSize: 20,
                },
                grid: {
                    color: 'rgba(176, 176, 176, 0.1)',
                    borderDash: [5, 5],
                },
                border: {
                    display: false,
                },
            },
            x: {
                ticks: {
                    color: '#B0B0B0',
                    font: {
                        size: 12,
                    },
                },
                grid: {
                    display: false,
                },
                border: {
                    display: false,
                },
            },
        },
        interaction: {
            intersect: false,
            mode: 'index',
        },
        elements: {
            line: {
                borderJoinStyle: 'round',
            },
            point: {
                hoverBorderWidth: 4,
            }
        },
    };

    // Calculate metrics
    const highestScore = Math.max(...DataKpi.map(item => item.points));
    const highestScoreMonth = DataKpi.find(item => item.points === highestScore);

    const lowestScore = Math.min(...DataKpi.map(item => item.points));
    const lowestScoreMonth = DataKpi.find(item => item.points === lowestScore);

    // Calculate change from previous month (assuming current month is the last one)
    const currentMonth = DataKpi[DataKpi.length - 1];
    const previousMonth = DataKpi[DataKpi.length - 2];
    const changeFromPreviousMonth = currentMonth.points - previousMonth.points;

    const cards = [
        {
            id: 1,
            percentage: highestScore,
            month: highestScoreMonth.month,
            title: t('performance.kpiTrend.highestScore'),
            bgColor: '#E0F7FA',
            textColor: '#26C8B9',
            progressColor: '#26C8B9',
            progressWidth: (highestScore / 100) * 100
        },
        {
            id: 2,
            percentage: lowestScore,
            month: lowestScoreMonth.month,
            title: t('performance.kpiTrend.lowestScore'),
            bgColor: '#FFEBEE',
            textColor: '#D32F2F',
            progressColor: '#D32F2F',
            progressWidth: (lowestScore / 100) * 100
        },
        {
            id: 3,
            percentage: Math.abs(changeFromPreviousMonth),
            month: t('performance.kpiTrend.vsLastMonth'),
            title: t('performance.kpiTrend.changeFromPrevious'),
            bgColor: '#E8EAF6',
            textColor: '#3F51B5',
            progressColor: '#3F51B5',
            progressWidth: (Math.abs(changeFromPreviousMonth) / 100) * 100
        }
    ];

    return (
        <div className='w-full max-w-7xl mx-auto px-1 sm:px-2 lg:px-4 xl:px-8 pb-2 sm:pb-3 lg:pb-5 pt-2 sm:pt-3 lg:pt-5 gap-2 sm:gap-3 lg:gap-4 flex flex-col justify-center items-center'>
            {/* Chart Section */}
            <div className='w-full min-h-[200px] sm:min-h-[250px] lg:min-h-[280px] xl:min-h-[300px] bg-[var(--bg-color)] border border-[var(--border-color)] rounded-[10px] p-2 sm:p-3 lg:p-4 xl:p-6 shadow-sm'>
                {/* Chart Header */}
                <div className='flex flex-col text-start sm:flex-row sm:justify-between sm:items-center mb-2 sm:mb-3 lg:mb-4 gap-2 sm:gap-3'>
                    <div className='flex-1'>
                        <h3 className='text-[11px] sm:text-[12px] lg:text-[14px] xl:text-[18px] font-semibold text-[var(--text-color)] mb-1'>
                            {t('performance.kpiTrend.title')}
                        </h3>
                        <p className='text-[8px] sm:text-[9px] lg:text-[11px] xl:text-[14px] text-[var(--sub-text-color)]'>
                            {t('performance.kpiTrend.subtitle')}
                        </p>
                    </div>

                    {/* Period Selector */}
                    <div className='relative self-start sm:self-auto'>
                        <select
                            value={selectedPeriod}
                            onChange={(e) => setSelectedPeriod(e.target.value)}
                            className={`appearance-none border border-[var(--border-color)] rounded-lg px-2 sm:px-3 py-1 sm:py-2 text-[9px] sm:text-[10px] lg:text-[12px] text-[var(--sub-text-color)] bg-[var(--bg-color)] hover:bg-[var(--hover-color)] transition-colors cursor-pointer ${isRtl ? 'pl-6 pr-2' : 'pr-6 pl-2'
                                }`}
                            style={{ direction: isRtl ? 'rtl' : 'ltr' }}
                        >
                            {periodOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <ChevronDown
                            size={10}
                            className={`sm:size-[12px] lg:size-[14px] text-[var(--sub-text-color)] absolute top-1/2 transform -translate-y-1/2 pointer-events-none ${isRtl ? 'left-2' : 'right-2'
                                }`}
                        />
                    </div>
                </div>

                {/* Chart Container */}
                <div className='h-[120px] sm:h-[140px] lg:h-[180px] xl:h-[240px] w-full'>
                    <Line data={chartData} options={chartOptions} />
                </div>
            </div>

            {/* Cards Section */}
            <div className='w-full bg-[var(--bg-color)] shadow-lg rounded-[10px] p-2 sm:p-3 lg:p-4'>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 lg:gap-4'>
                    {cards.map((card) => (
                        <div key={card.id} className='min-h-[60px] sm:min-h-[70px] lg:min-h-[80px] xl:min-h-[90px] text-start bg-[var(--bg-color)] border border-[var(--border-color)] rounded-[6px] p-2 sm:p-3 flex items-center gap-2 sm:gap-3'>
                            {/* Left side - Percentage box */}
                            <div
                                className='w-[35px] h-[35px] sm:w-[40px] sm:h-[40px] lg:w-[50px] lg:h-[50px] xl:w-[55px] xl:h-[55px] rounded-[8px] flex items-center justify-center flex-shrink-0'
                                style={{ backgroundColor: card.bgColor }}
                            >
                                <span
                                    className='text-[10px] sm:text-[11px] lg:text-[13px] xl:text-[14px] font-bold'
                                    style={{ color: card.textColor }}
                                >
                                    {card.percentage}%
                                </span>
                            </div>

                            {/* Right side - Content */}
                            <div className='flex-1 h-full flex flex-col justify-between py-1 min-w-0'>
                                <div className='flex items-center gap-1 mb-1'>
                                    <Calendar
                                        size={8}
                                        className='sm:size-[10px] lg:size-[12px] flex-shrink-0'
                                        style={{ color: card.textColor }}
                                    />
                                    <span
                                        className='text-[9px] sm:text-[10px] lg:text-[12px] xl:text-[14px] font-bold truncate'
                                        style={{ color: card.textColor }}
                                    >
                                        {card.month}
                                    </span>
                                </div>

                                <p className='text-[7px] sm:text-[8px] lg:text-[9px] xl:text-[10px] text-[var(--sub-text-color)] font-normal leading-tight mb-1 sm:mb-2 line-clamp-2'>
                                    {card.title}
                                </p>

                                {/* Progress bar */}
                                <div className='w-full h-[3px] sm:h-[4px] lg:h-[5px] xl:h-[6px] bg-[#E0E0E0] rounded-[3px] overflow-hidden'>
                                    <div
                                        className='h-full rounded-[3px] transition-all duration-300'
                                        style={{
                                            backgroundColor: card.progressColor,
                                            width: `${card.progressWidth}%`
                                        }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default KpiTrend;