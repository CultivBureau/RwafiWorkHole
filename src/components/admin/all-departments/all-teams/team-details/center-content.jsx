import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Calendar, MoreVertical, Search } from 'lucide-react';
import { Line, Doughnut } from 'react-chartjs-2';
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
    ArcElement,
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
    ArcElement
);

const CenterContent = ({ team }) => {
    // Use team data from props if available
    const teamTasks = team?.tasks || [];
    const teamAttendance = team?.attendanceData || [];
    const { t, i18n } = useTranslation();
    const isRtl = i18n.dir() === 'rtl';
    const [selectedPeriod, setSelectedPeriod] = useState('Over Year');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDate, setSelectedDate] = useState('2023-07-29');

    // Use team data from props (tasks and attendance from API)
    const ongoingTasks = teamTasks || [];
    const allAttendanceData = teamAttendance || [];

    // Filter attendance data based on search and date
    const filteredAttendanceData = allAttendanceData.filter(record => {
        const matchesSearch = record.name.toLowerCase().includes(searchTerm.toLowerCase());
        const recordDate = new Date(record.date);
        const filterDate = new Date(selectedDate);
        const matchesDate = recordDate.toDateString() === filterDate.toDateString();
        return matchesSearch && matchesDate;
    });

    // Chart data for task completion trend
    const taskCompletionData = {
        labels: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'],
        datasets: [
            {
                label: 'Task Completion',
                data: [55, 65, 45, 60, 82, 75, 65, 70, 68, 55, 45, 75],
                borderColor: '#26C8B9',
                backgroundColor: (context) => {
                    const chart = context.chart;
                    const { ctx, chartArea } = chart;
                    if (!chartArea) return null;
                    const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                    gradient.addColorStop(0, 'rgba(38, 200, 185, 0.3)');
                    gradient.addColorStop(1, 'rgba(38, 200, 185, 0.05)');
                    return gradient;
                },
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#26C8B9',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 4,
            },
        ],
    };

    const taskCompletionOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(38, 200, 185, 0.9)',
                titleColor: '#ffffff',
                bodyColor: '#ffffff',
                borderColor: '#26C8B9',
                borderWidth: 1,
                cornerRadius: 6,
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                max: 100,
                ticks: {
                    color: '#B0B0B0',
                    font: { size: 10 },
                    callback: (value) => value + '%',
                },
                grid: {
                    color: 'rgba(176, 176, 176, 0.1)',
                    borderDash: [3, 3],
                },
                border: { display: false },
            },
            x: {
                ticks: {
                    color: '#B0B0B0',
                    font: { size: 10 },
                },
                grid: { display: false },
                border: { display: false },
            },
        },
    };

    // Task status breakdown data (matching team wallet style)
    const taskStatusBreakdown = [
        { title: 'In Progress', percentage: 39, color: '#26C8B9' },
        { title: 'Finished', percentage: 26, color: '#81F5EE' },
        { title: 'Overdue', percentage: 24, color: '#D4D4D4' },
        { title: 'Urgent', percentage: 11, color: '#FF6B6B' }
    ];

    // Chart configuration function for doughnut chart (matching team wallet)
    const createTaskStatusChartData = (data) => ({
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

    const taskStatusOptions = {
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

    // Calculate total for center display
    const taskStatusTotal = taskStatusBreakdown.reduce((sum, item) => sum + item.percentage, 0);

    return (
        <div className="w-full">
            <div className="grid grid-cols-1 lg:grid-cols-10 gap-4" style={{ height: 'auto', minHeight: '400px' }}>
                {/* Ongoing Tasks Section - 30% width */}
                <div className="lg:col-span-3 bg-[var(--bg-color)] rounded-xl p-4 border border-[var(--border-color)] shadow-sm" style={{ minHeight: '400px' }}>
                    <div className={`flex items-center justify-between mb-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                        <h3 className="text-lg font-semibold text-[var(--text-color)]">
                            {t('teamDetails.centerContent.ongoingTasks')}
                        </h3>
                        <button className="text-sm text-[var(--accent-color)] hover:text-[var(--accent-hover-color)]">
                            {t('teamDetails.centerContent.viewAll')}
                        </button>
                    </div>
                    
                    <div className="space-y-3 overflow-y-auto" style={{ maxHeight: '350px' }}>
                        {ongoingTasks.map((task) => (
                            <div key={task.id} className="bg-[var(--bg-color)] rounded-lg p-3 border border-[var(--border-color)] shadow-sm">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-medium text-[var(--text-color)] text-sm">
                                        {task.title}
                                    </h4>
                                    <MoreVertical size={16} className="text-[var(--sub-text-color)]" />
                                </div>
                                
                                <div className="flex items-center gap-2 mb-2">
                                    <img
                                        src={task.avatar}
                                        alt={task.assignee}
                                        className="w-6 h-6 rounded-full"
                                    />
                                    <div>
                                        <p className="text-xs font-medium text-[var(--text-color)]">
                                            {task.assignee}
                                        </p>
                                        <p className="text-xs text-[var(--sub-text-color)]">
                                            {task.role}
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="mb-2">
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="text-[var(--sub-text-color)]">{task.startDate}</span>
                                        <span className="text-[var(--text-color)] font-medium">{task.progress}%</span>
                                        <span className="text-[var(--sub-text-color)]">{task.endDate}</span>
                                    </div>
                                    <div className="w-full bg-[var(--hover-color)] rounded-full h-1.5">
                                        <div
                                            className="gradient-bg h-1.5 rounded-full transition-all duration-300"
                                            style={{ width: `${task.progress}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Middle Chart Section - 25% width */}
                <div className="lg:col-span-2 bg-[var(--bg-color)] rounded-xl p-4 flex flex-col border border-[var(--border-color)] shadow-sm" style={{ minHeight: '400px' }}>
                    {/* Header - Title */}
                    <div className={`flex justify-between items-center h-6 mb-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                        <h3 className="text-sm font-semibold text-[var(--text-color)]">
                            {t('teamDetails.centerContent.taskStatusOverview')}
                        </h3>
                    </div>

                    {/* Subtitle */}
                    <div className="h-8 mb-3">
                        <p className={`text-xs text-[var(--sub-text-color)] ${isRtl ? 'text-right' : 'text-left'}`}>
                            {t('teamDetails.centerContent.currentDistribution')}
                        </p>
                    </div>

                    {/* Doughnut Chart */}
                    <div className="flex-1 relative flex justify-center items-center">
                        <div className="w-36 h-36 relative">
                            <Doughnut data={createTaskStatusChartData(taskStatusBreakdown)} options={taskStatusOptions} />
                            {/* Center text overlay */}
                            <div className="absolute inset-0 flex flex-col justify-center items-center pointer-events-none">
                                <div className="text-center">
                                    <div className="text-lg font-bold text-[var(--text-color)]">
                                        120
                                    </div>
                                    <div className="text-xs text-[var(--sub-text-color)]">
                                        {t('teamDetails.centerContent.totalTasks')}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="flex flex-col justify-center space-y-2 mt-3">
                        {taskStatusBreakdown.map((item, index) => (
                            <div key={index} className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <div
                                        className="w-2 h-2 rounded-full mr-2 flex-shrink-0"
                                        style={{ backgroundColor: item.color }}
                                    />
                                    <span className="text-xs text-[var(--text-color)] truncate">
                                        {item.title}
                                    </span>
                                </div>
                                <span className="text-xs text-[var(--text-color)] flex-shrink-0 ml-1">
                                    {item.percentage}%
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Section - 45% width (split vertically) */}
                <div className="lg:col-span-5 flex flex-col gap-4" style={{ minHeight: '400px' }}>
                    {/* Top Half - Attendance Table */}
                    <div className="bg-[var(--bg-color)] rounded-xl p-4 border border-[var(--border-color)] shadow-sm" style={{ minHeight: '180px' }}>
                        {/* Header with Search and Date Filter */}
                        <div className={`flex items-center justify-between mb-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                            {/* Search */}
                            <div className="relative flex-1 max-w-48">
                                <Search className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 text-[var(--sub-text-color)]`} size={14} />
                                <input
                                    type="text"
                                    placeholder={t('teamDetails.centerContent.search')}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className={`w-full ${isRtl ? 'pr-9 pl-3' : 'pl-9 pr-3'} py-1.5 text-sm bg-[var(--container-color)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent text-[var(--text-color)] placeholder-[var(--sub-text-color)] ${isRtl ? 'text-right' : 'text-left'}`}
                                />
                            </div>
                            
                            {/* Date Filter */}
                            <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                <span className="text-sm text-[var(--sub-text-color)]">{t('teamDetails.centerContent.dateFrom')}:</span>
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="text-sm px-3 py-1.5 bg-[var(--container-color)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] focus:border-transparent text-[var(--text-color)]"
                                    style={{ colorScheme: 'var(--theme)' }}
                                />
                            </div>
                        </div>
                        
                        {/* Table */}
                        <div className="rounded-lg border border-[var(--border-color)] overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-[var(--container-color)] sticky top-0 z-10">
                                    <tr>
                                        <th className={`${isRtl ? 'text-right' : 'text-left'} py-2 px-4 text-sm font-medium text-[var(--sub-text-color)]`}>{t('teamDetails.centerContent.employeesName')}</th>
                                        <th className={`${isRtl ? 'text-right' : 'text-left'} py-2 px-4 text-sm font-medium text-[var(--sub-text-color)]`}>{t('teamDetails.centerContent.date')}</th>
                                        <th className={`${isRtl ? 'text-right' : 'text-left'} py-2 px-4 text-sm font-medium text-[var(--sub-text-color)]`}>{t('teamDetails.centerContent.checkIn')}</th>
                                        <th className={`${isRtl ? 'text-right' : 'text-left'} py-2 px-4 text-sm font-medium text-[var(--sub-text-color)]`}>{t('teamDetails.centerContent.checkOut')}</th>
                                    </tr>
                                </thead>
                            </table>
                            
                            {/* Scrollable Table Body - Max 3 rows */}
                            <div className="overflow-y-auto" style={{ maxHeight: '144px' }}>
                                <table className="w-full">
                                    <tbody className="bg-[var(--bg-color)] divide-y divide-[var(--border-color)]">
                                        {filteredAttendanceData.length > 0 ? (
                                            filteredAttendanceData.map((record, index) => (
                                                <tr key={index} className="hover:bg-[var(--container-color)] transition-colors">
                                                    <td className="py-2 px-4">
                                                        <div className="flex items-center gap-3">
                                                            <img
                                                                src={record.avatar}
                                                                alt={record.name}
                                                                className="w-8 h-8 rounded-full"
                                                            />
                                                            <span className="text-sm font-medium text-[var(--text-color)]">{record.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-2 px-4 text-sm text-[var(--text-color)]">{record.date}</td>
                                                    <td className={`py-2 px-4 text-sm font-medium ${record.isAbsent ? 'text-red-500' : 'text-[var(--text-color)]'}`}>
                                                        {record.checkIn}
                                                    </td>
                                                    <td className={`py-2 px-4 text-sm font-medium ${record.isAbsent ? 'text-red-500' : 'text-[var(--text-color)]'}`}>
                                                        {record.checkOut}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="4" className="py-6 px-4 text-center text-sm text-[var(--sub-text-color)]">
                                                    No attendance records found for the selected criteria.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Half - Task Completion Chart */}
                    <div className="bg-[var(--bg-color)] rounded-xl p-4 border border-[var(--border-color)] shadow-sm" style={{ minHeight: '200px' }}>
                        <div className={`flex items-center justify-between mb-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                            <h3 className="text-lg font-semibold text-[var(--text-color)]">
                                {t('teamDetails.centerContent.taskCompletion')}
                            </h3>
                            <div className="relative">
                                <select
                                    value={selectedPeriod}
                                    onChange={(e) => setSelectedPeriod(e.target.value)}
                                    className={`text-xs px-2 py-1 bg-[var(--bg-color)] border border-[var(--border-color)] rounded appearance-none ${isRtl ? 'pl-6 text-right' : 'pr-6 text-left'}`}
                                >
                                    <option value="Over Year">{t('teamDetails.centerContent.overYear')}</option>
                                    <option value="Over Month">{t('teamDetails.centerContent.overMonth')}</option>
                                    <option value="Over Week">{t('teamDetails.centerContent.overWeek')}</option>
                                </select>
                                <ChevronDown size={12} className={`absolute ${isRtl ? 'left-1' : 'right-1'} top-1/2 transform -translate-y-1/2 text-[var(--sub-text-color)] pointer-events-none`} />
                            </div>
                        </div>
                        
                        <div className="h-[calc(100%-3rem)]">
                            <Line data={taskCompletionData} options={taskCompletionOptions} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CenterContent;
