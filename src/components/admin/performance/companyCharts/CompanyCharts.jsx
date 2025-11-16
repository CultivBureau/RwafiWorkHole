import React from 'react'
import { useLang } from '../../../../contexts/LangContext'
import { useTheme } from '../../../../contexts/ThemeContext'
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Eye } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const CompanyCharts = () => {
  const { isRtl } = useLang();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Navigation handler
  const handleViewLogs = () => {
    navigate('/pages/admin/attendance');
  };

  // Fake data for Present vs Absent for each month for 1 year
  const AttendanceOverviewData = [
    { month: t("navbar.months.0", "Jan"), present: 20, absent: 5 },
    { month: t("navbar.months.1", "Feb"), present: 18, absent: 7 },
    { month: t("navbar.months.2", "Mar"), present: 22, absent: 3 },
    { month: t("navbar.months.3", "Apr"), present: 19, absent: 6 },
    { month: t("navbar.months.4", "May"), present: 21, absent: 4 },
    { month: t("navbar.months.5", "Jun"), present: 20, absent: 5 },
    { month: t("navbar.months.6", "Jul"), present: 23, absent: 2 },
    { month: t("navbar.months.7", "Aug"), present: 18, absent: 7 },
    { month: t("navbar.months.8", "Sep"), present: 20, absent: 5 },
    { month: t("navbar.months.9", "Oct"), present: 22, absent: 3 },
    { month: t("navbar.months.10", "Nov"), present: 19, absent: 6 },
    { month: t("navbar.months.11", "Dec"), present: 21, absent: 4 },
  ];

  // Calculate overall presence and absence rates
  const totalPresent = AttendanceOverviewData.reduce((sum, month) => sum + month.present, 0);
  const totalAbsent = AttendanceOverviewData.reduce((sum, month) => sum + month.absent, 0);
  const totalDays = totalPresent + totalAbsent;
  const presenceRate = Math.round((totalPresent / totalDays) * 100);
  const absenceRate = Math.round((totalAbsent / totalDays) * 100);

  // Create gradient for present bars
  const createGradient = (ctx) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, '#09D1C7');
    gradient.addColorStop(1, '#15919B');
    return gradient;
  };

  // Convert data to percentages for each month
  const chartData = {
    labels: AttendanceOverviewData.map(item => item.month),
    datasets: [
      {
        label: t("adminPerformance.chart.present", "Present"),
        data: AttendanceOverviewData.map(item => {
          const total = item.present + item.absent;
          return (item.present / total) * 100;
        }),
        backgroundColor: (context) => {
          const chart = context.chart;
          const { ctx } = chart;
          if (!ctx) {
            return null;
          }
          return createGradient(ctx);
        },
        hoverBackgroundColor: (context) => {
          const chart = context.chart;
          const { ctx } = chart;
          if (!ctx) {
            return null;
          }
          return createGradient(ctx);
        },
        borderRadius: 12,
        borderSkipped: false,
        maxBarThickness: 35,
        categoryPercentage: 0.8,
        barPercentage: 0.9,
      },
      {
        label: t("adminPerformance.chart.absent", "Absent"),
        data: AttendanceOverviewData.map(item => {
          const total = item.present + item.absent;
          return (item.absent / total) * 100;
        }),
        backgroundColor: 'rgba(176, 176, 176, 0.45)',
        hoverBackgroundColor: 'rgba(176, 176, 176, 0.6)',
        borderRadius: 12,
        borderSkipped: false,
        maxBarThickness: 35,
        categoryPercentage: 0.8,
        barPercentage: 0.9,
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
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#26C8B9',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 10,
        callbacks: {
          label: function (context) {
            const dataIndex = context.dataIndex;
            const monthData = AttendanceOverviewData[dataIndex];
            if (context.dataset.label === t("adminPerformance.chart.present", "Present")) {
              return `${t("adminPerformance.chart.present", "Present")}: ${monthData.present} ${t("adminPerformance.chart.days", "days")} (${Math.round(context.parsed.y)}%)`;
            } else {
              return `${t("adminPerformance.chart.absent", "Absent")}: ${monthData.absent} ${t("adminPerformance.chart.days", "days")} (${Math.round(context.parsed.y)}%)`;
            }
          }
        }
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#9CA3AF',
          font: {
            size: window.innerWidth < 640 ? 10 : window.innerWidth < 1024 ? 11 : 12,
          },
        },
        grid: {
          display: false,
        },
        border: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          color: '#9CA3AF',
          font: {
            size: window.innerWidth < 640 ? 10 : window.innerWidth < 1024 ? 11 : 12,
          },
          callback: function (value) {
            return value + '%';
          },
          stepSize: 25,
        },
        grid: {
          color: 'rgba(156, 163, 175, 0.2)',
          borderDash: [5, 5],
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
  };

  return (
    <div className='w-full h-auto bg-[var(--bg-color)] border border-[var(--border-color)] rounded-[10px] p-2 sm:p-3 md:p-4 lg:p-4 xl:p-6 shadow-sm'>
      {/* Header Section */}
      <div className='flex flex-col xl:flex-row xl:justify-between xl:items-start gap-3 sm:gap-4 mb-3 sm:mb-4 lg:mb-6'>
        {/* Left side - Title and Legend */}
        <div className='flex flex-col 2xl:flex-row text-start gap-2 sm:gap-3 lg:gap-4'>
          <div className="mb-2 sm:mb-0">
            <p className='text-[10px] sm:text-[11px] lg:text-[13px] text-[var(--sub-text-color)] mb-1'>
              {t("adminPerformance.chart.presenceVsAbsence", "Presence vs absence")}
            </p>
            <h2 className='text-[14px] sm:text-[16px] lg:text-[18px] xl:text-[20px] font-semibold text-[var(--text-color)]'>
              {t("adminPerformance.chart.companyAttendanceOverview", "Company Attendance Overview")}
            </h2>
          </div>

          {/* Legend */}
          <div className='flex items-center flex-row gap-3 sm:gap-4 mb-2 sm:mb-0'>
            <div className='flex items-center gap-2'>
              <div className='w-[6px] h-[6px] sm:w-[8px] sm:h-[8px] lg:w-[10px] lg:h-[10px] rounded-full gradient-bg'></div>
              <span className='text-[10px] sm:text-[12px] lg:text-[14px] text-[var(--sub-text-color)]'>
                {t("adminPerformance.chart.present", "Present")}
              </span>
            </div>
            <div className='flex items-center gap-2'>
              <div className='w-[6px] h-[6px] sm:w-[8px] sm:h-[8px] lg:w-[10px] lg:h-[10px] rounded-full' style={{ backgroundColor: 'rgba(176, 176, 176, 0.45)' }}></div>
              <span className='text-[10px] sm:text-[12px] lg:text-[14px] text-[var(--sub-text-color)]'>
                {t("adminPerformance.chart.absent", "Absent")}
              </span>
            </div>
          </div>

          {/* Stats Cards */}
          <div className='flex flex-col sm:flex-row gap-2 sm:gap-3 lg:gap-4'>
            {/* Presence Rate Card */}
            <div className='px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 lg:py-3 pl-2 bg-[var(--bg-color)] border border-[var(--border-color)] rounded-[12px] hover:shadow-md transition-shadow'>
              <div className='flex items-center gap-2 sm:gap-3'>
                <div className='w-[24px] h-[24px] sm:w-[28px] sm:h-[28px] lg:w-[34px] lg:h-[34px] bg-[#E0F7FA] flex justify-center items-center shadow-sm rounded-lg'>
                  <span className='text-[8px] sm:text-[9px] lg:text-[11px] font-semibold text-[#26C8B9]'>
                    {presenceRate}%
                  </span>
                </div>
                <span className='text-[9px] sm:text-[10px] lg:text-[12px] font-semibold text-[var(--text-color)] whitespace-nowrap'>
                  {t("adminPerformance.stats.presenceRate", "Presence Rate")}
                </span>
              </div>
            </div>

            {/* Absence Rate Card */}
            <div className='px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 lg:py-3 pl-2 bg-[var(--bg-color)] border border-[var(--border-color)] rounded-[12px] hover:shadow-md transition-shadow'>
              <div className='flex items-center gap-2 sm:gap-3'>
                <div className='w-[24px] h-[24px] sm:w-[28px] sm:h-[28px] lg:w-[34px] lg:h-[34px] bg-[#FFEBEE] flex justify-center items-center shadow-sm rounded-lg'>
                  <span className='text-[8px] sm:text-[9px] lg:text-[11px] font-semibold text-[#D32F2F]'>
                    {absenceRate}%
                  </span>
                </div>
                <span className='text-[9px] sm:text-[10px] lg:text-[12px] font-semibold text-[var(--text-color)] whitespace-nowrap'>
                  {t("adminPerformance.stats.absenceRate", "Absence Rate")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - View Logs with Navigation */}
        <div className='flex flex-col sm:flex-row items-start sm:items-center gap-4'>
          {/* View Logs Button */}
          <button
            onClick={handleViewLogs}
            className='flex items-center gap-2 border border-[var(--border-color)] px-2 sm:px-3 lg:px-4 py-1 sm:py-1.5 lg:py-2 text-[#26C8B9] hover:bg-[var(--hover-color)] rounded-lg transition-colors cursor-pointer'
          >
            <Eye size={12} className='sm:size-[14px] lg:size-[16px]' />
            <span className='text-[10px] sm:text-[12px] lg:text-[14px] font-medium'>
              {t("adminPerformance.buttons.viewLogs", "View Logs")}
            </span>
          </button>
        </div>
      </div>

      {/* Chart Container */}
      <div className='w-full h-[150px] xs:h-[180px] sm:h-[200px] md:h-[220px] lg:h-[250px] xl:h-[300px]'>
        <Bar data={chartData} options={chartOptions} />
      </div>
    </div>
  );
};

export default CompanyCharts;