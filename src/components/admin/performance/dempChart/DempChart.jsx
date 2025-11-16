"use client"

import React, { useEffect, useRef } from "react"
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useLang } from "../../../../contexts/LangContext";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  Title,
  Tooltip,
  Legend,
} from "chart.js"

ChartJS.register(CategoryScale, LinearScale, BarElement, BarController, Title, Tooltip, Legend)

const DempChart = () => {
  const { t } = useTranslation();
  const { isRtl } = useLang();
  const navigate = useNavigate();
  const chartRef = useRef(null)
  const chartInstance = useRef(null)

  // Navigation handler
  const handleViewAllDepartments = () => {
    navigate('/pages/admin/all-departments');
  };

  const DepartmentData = [
    { department: t("adminPerformance.departments.development", "Development"), efficiency: 90 },
    { department: t("adminPerformance.departments.business", "Business"), efficiency: 80 },
    { department: t("adminPerformance.departments.sales", "Sales"), efficiency: 75 },
    { department: t("adminPerformance.departments.marketing", "Marketing"), efficiency: 85 },
    { department: t("adminPerformance.departments.hr", "HR"), efficiency: 80 },
    { department: t("adminPerformance.departments.finance", "Finance"), efficiency: 70 },
    { department: t("adminPerformance.departments.support", "Support"), efficiency: 60 },
    { department: t("adminPerformance.departments.it", "IT"), efficiency: 75 },
    { department: t("adminPerformance.departments.admin", "Admin"), efficiency: 80 },
    { department: t("adminPerformance.departments.rnd", "R&D"), efficiency: 90 },
    { department: t("adminPerformance.departments.logistics", "Logistics"), efficiency: 70 },
    { department: t("adminPerformance.departments.operations", "Operations"), efficiency: 80 },
  ]

  const KeyInsights = [
    {
      status: t("adminPerformance.insights.bestPerforming", "Best Performing"),
      department: t("adminPerformance.departments.development", "Development"),
      desc: t("adminPerformance.insights.highestKpi", "Highest average KPI this period"),
      efficiency: "90%",
    },
    {
      status: t("adminPerformance.insights.needsAttention", "Needs Attention"),
      department: t("adminPerformance.departments.sales", "Sales"),
      desc: t("adminPerformance.insights.belowAverageKpi", "Below average KPI this period"),
      efficiency: "60%"
    },
  ]

  useEffect(() => {
    const ctx = chartRef.current?.getContext("2d")
    if (!ctx) return

    if (chartInstance.current) {
      chartInstance.current.destroy()
    }

    const rootStyles = getComputedStyle(document.documentElement)
    const chartBarColor = rootStyles.getPropertyValue("--accent-color").trim() || "#15919B"
    const chartBgColor = rootStyles.getPropertyValue("--bg-color").trim() || "#fff"
    const chartGridColor = rootStyles.getPropertyValue("--border-color").trim() || "#E0FFFD"
    const chartLabelColor = rootStyles.getPropertyValue("--sub-text-color").trim() || "#6b7280"

    chartInstance.current = new ChartJS(ctx, {
      type: "bar",
      data: {
        labels: DepartmentData.map((item) => item.department.toUpperCase()),
        datasets: [
          {
            data: DepartmentData.map((item) => item.efficiency),
            backgroundColor: chartBarColor,
            borderColor: chartBarColor,
            borderWidth: 0,
            borderRadius: 8,
            borderSkipped: false,
            barThickness: 8,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: chartBgColor,
            titleColor: "#333",
            bodyColor: "#333",
            borderColor: chartGridColor,
            borderWidth: 1,
            cornerRadius: 8,
            displayColors: false,
            callbacks: {
              title: (context) => context[0].label,
              label: (context) => `${context.parsed.y}% ${t("adminPerformance.chart.efficiency", "efficiency")}`,
            },
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
            ticks: {
              color: chartLabelColor,
              font: {
                size: window.innerWidth < 640 ? 8 : window.innerWidth < 1024 ? 9 : 10,
                family: "Poppins",
                weight: "400",
              },
              maxRotation: window.innerWidth < 768 ? 90 : 45,
              minRotation: window.innerWidth < 768 ? 90 : 45,
              padding: window.innerWidth < 640 ? 4 : 8,
              align: "center",
              autoSkip: false,
            },
            border: {
              display: false,
            },
          },
          y: {
            beginAtZero: true,
            max: 100,
            grid: {
              color: chartGridColor,
              borderDash: [2, 2],
            },
            ticks: {
              color: chartLabelColor,
              font: {
                size: window.innerWidth < 640 ? 10 : 12,
                family: "Poppins",
              },
              callback: (value) => value + "%",
              stepSize: 20,
            },
            border: {
              display: false,
            },
          },
        },
        layout: {
          padding: {
            top: window.innerWidth < 640 ? 10 : 20,
            right: window.innerWidth < 640 ? 10 : 20,
            bottom: window.innerWidth < 640 ? 20 : 30,
            left: window.innerWidth < 640 ? 10 : 20,
          },
        },
        elements: {
          bar: {
            borderRadius: 8,
            borderSkipped: false,
          },
        },
        interaction: {
          intersect: false,
          mode: "index",
        },
      },
    })

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }
    }
  }, [t])

  return (
    <div className="w-full h-max pb-3 sm:pb-4 lg:pb-5 flex flex-col xl:flex-row bg-[var(--bg-color)] gap-3 sm:gap-4 lg:gap-6">
      {/* Chart Section */}
      <div className="w-full xl:w-[70%] h-full bg-[var(--bg-color)] p-3 sm:p-4 lg:p-6 rounded-lg border border-gray-100">
        <div className="mb-4 sm:mb-5 lg:mb-6 text-start">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 gap-3 sm:gap-4">
            <div className="flex-1">
              <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 mb-1">
                {t("adminPerformance.chart.departmentKpiOverview", "Department KPI Overview")}
              </h2>
              <p className="text-xs sm:text-sm text-gray-500">
                {t("adminPerformance.chart.averageKpiScore", "Average KPI score per department")}
              </p>
            </div>
            <div className="flex gap-1 bg-gray-50 rounded-lg p-1 w-full sm:w-auto">
              <button className="flex-1 sm:flex-none px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-600 hover:text-gray-900 transition-colors rounded-md">
                {t("adminPerformance.periods.quarter", "Quarter")}
              </button>
              <button className="flex-1 sm:flex-none px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-600 hover:text-gray-900 transition-colors rounded-md">
                {t("adminPerformance.periods.semester", "Semester")}
              </button>
              <button className="flex-1 sm:flex-none px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-teal-500 text-white rounded-md font-medium">
                {t("adminPerformance.periods.annual", "Annual")}
              </button>
            </div>
          </div>
        </div>

        <div className="h-[250px] sm:h-[300px] md:h-[350px] lg:h-[400px]">
          <canvas ref={chartRef}></canvas>
        </div>
      </div>

      {/* Enhanced Key Insights Section */}
      <div className="w-full xl:w-[30%] h-full flex flex-col justify-start rounded-2xl shadow-lg border border-gray-100 items-center bg-[var(--bg-color)] p-3 sm:p-4 md:p-5 lg:p-6 gap-3 sm:gap-4 md:gap-5 lg:gap-6">

        {/* All Department Button - Enhanced Responsive with Navigation */}
        <div className="w-full flex justify-center items-center">
          <button
            onClick={handleViewAllDepartments}
            className="w-full h-9 sm:h-10 md:h-11 lg:h-12 px-3 sm:px-4 md:px-5 bg-teal-50 rounded-full text-teal-600 flex justify-center items-center gap-2 sm:gap-3 font-medium hover:bg-teal-100 transition-colors cursor-pointer"
          >
            <img
              src="/assets/AdminPerformance/btn.svg"
              alt=""
              className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5"
            />
            <span className="text-[11px] sm:text-xs md:text-sm font-medium">
              {t("adminPerformance.buttons.allDepartment", "All Department")}
            </span>
          </button>
        </div>

        {/* Key Insights Content - Enhanced Responsive */}
        <div className="w-full flex flex-col justify-start items-start gap-3 sm:gap-4">

          {/* Header Section - Enhanced Layout */}
          <div className="w-full">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
              {/* Text Content */}
              <div className="flex-1">
                <h3 className="text-sm sm:text-[15px] md:text-base lg:text-[17px] font-semibold text-teal-600 mb-1">
                  {t("adminPerformance.insights.keyInsights", "Key Insights")}
                </h3>
                <span className="text-gray-500 text-[9px] sm:text-[10px] md:text-xs leading-tight">
                  {t("adminPerformance.insights.quickHighlights", "Quick highlights of team and department performance")}
                </span>
              </div>

              {/* Icon - More Responsive */}
              <div className="flex justify-center sm:justify-end items-center mt-2 sm:mt-0">
                <img
                  src="/assets/AdminPerformance/key.svg"
                  alt="Insights"
                  className="w-16 h-14 xs:w-20 xs:h-16 sm:w-12 sm:h-10 md:w-16 md:h-14 lg:w-[85px] lg:h-[75px] xl:w-20 xl:h-18 object-contain"
                />
              </div>
            </div>
          </div>

          {/* Insights Cards - Enhanced Responsive */}
          {KeyInsights.map((item, idx) => (
            <div key={idx} className="w-full flex flex-col gap-2 sm:gap-3">

              {/* Status Button - Enhanced */}
              <button className="w-full h-8 sm:h-9 md:h-10 bg-gray-50 rounded-full flex justify-center items-center gap-2 text-gray-600 hover:bg-gray-100 transition-colors px-3 sm:px-4">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  {item.status === t("adminPerformance.insights.bestPerforming", "Best Performing") ? (
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  ) : (
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  )}
                </svg>
                <span className="text-[11px] sm:text-xs md:text-sm font-medium truncate">{item.status}</span>
              </button>

              {/* Department Card - Enhanced */}
              <div className="w-full bg-color rounded-xl p-3 sm:p-4 md:p-5 border border-gray-100 shadow-sm flex items-center gap-2 sm:gap-3 hover:shadow-md transition-shadow">

                {/* Efficiency Badge - Enhanced */}
                <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-teal-100 rounded-lg flex justify-center items-center flex-shrink-0">
                  <span className="text-xs sm:text-sm md:text-base lg:text-lg font-bold text-teal-600">
                    {item.efficiency}
                  </span>
                </div>

                {/* Content - Enhanced */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 text-xs sm:text-sm md:text-base truncate mb-1">
                    {item.department}
                  </h4>
                  <p className="text-gray-500 text-[9px] sm:text-[10px] md:text-xs leading-tight">
                    {item.desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default DempChart
