import React, { useEffect, useRef, useState } from 'react'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js"
import { useTranslation } from "react-i18next"
import { ChevronDown, TrendingUp, AlertTriangle } from 'lucide-react'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const departments = [
  "Design Department",
  "Development Department",
  "Marketing Department"
]

const departmentData = {
  "Design Department": {
    best: [
      { team: "UX Team", amount: "$0", description: "This team has no penalties or warnings" },
      { team: "Product Team", amount: "$0", description: "Excellent compliance record" },
      { team: "Research Team", amount: "$50", description: "Minor warnings only" }
    ],
    attention: [
      { team: "Branding Team", amount: "$8,000", description: "High penalties recorded this month" },
      { team: "UI Team", amount: "$7,500", description: "High penalties recorded this month" },
      { team: "Motion Graphics", amount: "$12,000", description: "Critical attention required" }
    ]
  },
  "Development Department": {
    best: [
      { team: "Backend Team", amount: "$0", description: "No penalties or warnings" },
      { team: "DevOps Team", amount: "$0", description: "Excellent compliance record" }
    ],
    attention: [
      { team: "Frontend Team", amount: "$6,000", description: "High penalties recorded this month" },
      { team: "API Team", amount: "$5,500", description: "High penalties recorded this month" }
    ]
  },
  "Marketing Department": {
    best: [
      { team: "Content Team", amount: "$0", description: "No penalties or warnings" },
      { team: "Social Team", amount: "$0", description: "Excellent compliance record" }
    ],
    attention: [
      { team: "Ads Team", amount: "$9,000", description: "High penalties recorded this month" },
      { team: "SEO Team", amount: "$4,500", description: "High penalties recorded this month" }
    ]
  }
}

const TeamOverView = () => {
  const { t } = useTranslation()
  const chartRef = useRef(null)
  const chartInstance = useRef(null)
  const [activeFilter, setActiveFilter] = useState("Annual")
  const [selectedDepartment, setSelectedDepartment] = useState(departments[0])
  const [showDepartmentDropdown, setShowDepartmentDropdown] = useState(false)
  const [showBestPopup, setShowBestPopup] = useState(false)
  const [showAttentionPopup, setShowAttentionPopup] = useState(false)

  const chartData = {
    "Monthly": [
      { name: "UX TEAM", value: 12000 },
      { name: "UI TEAM", value: 6500 },
      { name: "BRANDING TEAM", value: 18000 },
      { name: "GRAPHIC TEAM", value: 14500 },
      { name: "DESIGN", value: 3800 },
      { name: "MOTION GRAPHICS", value: 32000 },
      { name: "DESIGN", value: 19500 },
    ],
    "Quarter": [
      { name: "UX TEAM", value: 22000 },
      { name: "UI TEAM", value: 7800 },
      { name: "BRANDING TEAM", value: 22000 },
      { name: "GRAPHIC TEAM", value: 16200 },
      { name: "DESIGN", value: 4500 },
      { name: "MOTION GRAPHICS", value: 38500 },
      { name: "DESIGN", value: 23000 },
    ],
    "Annual": [
      { name: "UX TEAM", value: 16000 },
      { name: "UI TEAM", value: 8000 },
      { name: "BRANDING TEAM", value: 26000 },
      { name: "GRAPHIC TEAM", value: 17000 },
      { name: "DESIGN", value: 5500 },
      { name: "MOTION GRAPHICS", value: 33000 },
      { name: "DESIGN", value: 25500 },
    ]
  }

  const currentData = chartData[activeFilter] || chartData["Annual"]
  const maxValue = Math.max(...currentData.map(item => item.value))
  const dynamicMax = Math.ceil(maxValue / 10000) * 10000 + 10000

  useEffect(() => {
    const ctx = chartRef.current?.getContext("2d")
    if (!ctx) return

    if (chartInstance.current) {
      chartInstance.current.destroy()
    }

    const getComputedStyle = window.getComputedStyle(document.documentElement)
    const subTextColor = getComputedStyle.getPropertyValue('--sub-text-color').trim()
    const chartGridColor = getComputedStyle.getPropertyValue('--chart-grid').trim()

    chartInstance.current = new ChartJS(ctx, {
      type: "bar",
      data: {
        labels: currentData.map((item) => item.name),
        datasets: [
          {
            data: currentData.map((item) => item.value),
            backgroundColor: currentData.map((item) => {
              return item.value === maxValue ? "#EF4444" : "#B91C1C"
            }),
            borderColor: "transparent",
            borderWidth: 0,
            borderRadius: {
              topLeft: 6,
              topRight: 6,
            },
            borderSkipped: false,
            barThickness: 10,
            maxBarThickness: 45,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 500,
          easing: 'easeOutQuart'
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            enabled: false,
            external: (context) => {
              const tooltip = context.tooltip
              let tooltipEl = document.getElementById("penalty-tooltip")

              if (!tooltipEl) {
                tooltipEl = document.createElement("div")
                tooltipEl.id = "penalty-tooltip"
                document.body.appendChild(tooltipEl)
              }

              if (tooltip.opacity === 0) {
                tooltipEl.style.opacity = "0"
                return
              }

              if (tooltip.body) {
                const dataIndex = tooltip.dataPoints[0].dataIndex
                const value = currentData[dataIndex].value

                const innerHtml = `
                  <div style="
                    background: #EF4444;
                    border-radius: 8px;
                    padding: 6px 12px;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-family: system-ui, -apple-system, sans-serif;
                    font-size: 12px;
                    color: white;
                    box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
                    font-weight: 600;
                  ">
                    <div style="
                      width: 6px;
                      height: 6px;
                      background: white;
                      border-radius: 50%;
                      flex-shrink: 0;
                    "></div>
                    <span>$${value.toLocaleString()}</span>
                  </div>
                `

                tooltipEl.innerHTML = innerHtml
              }

              const position = context.chart.canvas.getBoundingClientRect()
              tooltipEl.style.opacity = "1"
              tooltipEl.style.position = "absolute"
              tooltipEl.style.left = position.left + window.pageXOffset + tooltip.caretX - 40 + "px"
              tooltipEl.style.top = position.top + window.pageYOffset + tooltip.caretY - 40 + "px"
              tooltipEl.style.pointerEvents = "none"
              tooltipEl.style.zIndex = "1000"
              tooltipEl.style.transition = "all 0.2s ease"
            },
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
            ticks: {
              color: subTextColor,
              font: {
                size: 9,
                family: "system-ui, -apple-system, sans-serif",
                weight: "400",
              },
              maxRotation: 45,
              minRotation: 45,
              padding: 8,
              autoSkip: false,
            },
            border: {
              display: false,
            },
          },
          y: {
            beginAtZero: true,
            max: dynamicMax,
            grid: {
              color: chartGridColor,
              borderDash: [4, 4],
              drawOnChartArea: true,
              drawTicks: false,
            },
            ticks: {
              color: subTextColor,
              font: {
                size: 11,
                family: "system-ui, -apple-system, sans-serif",
                weight: "400",
              },
              callback: (value) => {
                if (value >= 1000) {
                  return value / 1000 + "k"
                }
                return value
              },
              stepSize: 10000,
              padding: 10,
            },
            border: {
              display: false,
            },
          },
        },
        layout: {
          padding: {
            top: 20,
            right: 8,
            bottom: 40,
            left: 8,
          },
        },
        onHover: (event, elements) => {
          event.native.target.style.cursor = elements.length > 0 ? "pointer" : "default"
        },
      },
    })

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy()
      }
    }
  }, [activeFilter, currentData, maxValue, dynamicMax])

  const filters = ["Monthly", "Quarter", "Annual"]

  return (
    <div className='w-full h-[450px] rounded-xl p-5' style={{ backgroundColor: "var(--bg-color)", boxShadow: "var(--shadow-sm)" }}>
      <div className="w-full h-full flex gap-5">
        {/* Chart Section */}
        <div className='w-[60%] h-full flex flex-col'>
          {/* Header */}
          <div className="mb-4">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h2 className="text-[12px] font-bold mb-1" style={{ color: "var(--text-color)" }}>
                  Team Penalties Overview
                </h2>
                <p className="text-[8px]" style={{ color: "var(--sub-text-color)" }}>
                  Shows total penalties for each team in this department
                </p>
              </div>
              
              {/* Filter Buttons */}
              <div className="flex items-center bg-[#F8F8FF] rounded-[20px] ml-1 p-2 gap-1.5">
                {filters.map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
                      activeFilter === filter
                        ? "text-white shadow-sm"
                        : "hover:bg-[var(--hover-color)]"
                    }`}
                    style={{
                      background: activeFilter === filter 
                        ? "linear-gradient(135deg, #09D1C7 0%, #15919B 100%)" 
                        : "transparent",
                      color: activeFilter === filter ? "white" : "var(--sub-text-color)"
                    }}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Chart Container */}
          <div className="flex-1 relative min-h-0">
            <canvas ref={chartRef}></canvas>
          </div>
        </div>

        {/* Right Section */}
        <div className="w-[40%] h-full flex flex-col gap-3">
          {/* Department Dropdown */}
          <div className="relative w-full">
            <button
              onClick={() => setShowDepartmentDropdown(!showDepartmentDropdown)}
              className="w-full h-10 px-3 rounded-xl flex justify-between items-center gap-2 font-semibold shadow-sm text-xs transition-all duration-200 hover:shadow-md"
              style={{ 
                background: "linear-gradient(135deg, #09D1C7 0%, #15919B 100%)",
                border: "1px solid transparent",
                color: "white"
              }}
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
                  </svg>
                </div>
                <span className="text-xs font-bold">{selectedDepartment}</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-white transition-transform ${showDepartmentDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            {showDepartmentDropdown && (
              <div className="absolute top-12 left-0 w-full rounded-lg shadow-lg z-10 overflow-hidden" style={{ backgroundColor: "var(--bg-color)", border: "1px solid var(--border-color)" }}>
                {departments.map((dept) => (
                  <button
                    key={dept}
                    onClick={() => {
                      setSelectedDepartment(dept)
                      setShowDepartmentDropdown(false)
                    }}
                    className="w-full px-3 py-2 text-left text-xs hover:bg-[var(--hover-color)] transition-colors"
                    style={{ color: "var(--text-color)" }}
                  >
                    {dept}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Best Compliance Team Section */}
          <div className="flex flex-col gap-2">
            <button
              onClick={() => setShowBestPopup(true)}
              className="w-full h-9 rounded-xl flex items-center justify-between gap-2 px-3 text-xs transition-all duration-200 hover:shadow-sm cursor-pointer"
              style={{ 
                background: "linear-gradient(135deg, var(--hover-color), var(--container-color))",
                border: "1px solid var(--border-color)"
              }}
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" style={{ color: "var(--accent-color)" }} />
                <span className="text-xs font-semibold" style={{ color: "var(--accent-color)" }}>
                  Best Compliance Team
                </span>
              </div>
              <ChevronDown className="w-3 h-3" style={{ color: "var(--accent-color)" }} />
            </button>

            {/* Best Team Card */}
            <div className="w-full rounded-xl p-3 flex items-center gap-3" style={{ backgroundColor: "rgba(9, 209, 199, 0.05)", border: "1px solid var(--border-color)" }}>
              <div className="px-3 py-1.5 h-auto flex justify-center items-center rounded-lg" style={{ background: "linear-gradient(135deg, #09D1C7 0%, #15919B 100%)" }}>
                <span className="text-sm font-bold text-white">{departmentData[selectedDepartment].best[0].amount}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-xs mb-0.5" style={{ color: "var(--text-color)" }}>
                  {departmentData[selectedDepartment].best[0].team}
                </h4>
                <p className="text-[10px] leading-tight" style={{ color: "var(--sub-text-color)" }}>
                  {departmentData[selectedDepartment].best[0].description}
                </p>
              </div>
            </div>
          </div>

          {/* Needs Attention Section */}
          <div className="flex flex-col gap-2">
            <button
              onClick={() => setShowAttentionPopup(true)}
              className="w-full h-9 rounded-xl flex items-center justify-between gap-2 px-3 text-xs transition-all duration-200 hover:shadow-sm cursor-pointer"
              style={{ 
                background: "linear-gradient(135deg, var(--hover-color), var(--container-color))",
                border: "1px solid var(--border-color)"
              }}
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" style={{ color: "#6B7280" }} />
                <span className="text-xs font-semibold" style={{ color: "var(--sub-text-color)" }}>
                  Needs Attention
                </span>
              </div>
              <ChevronDown className="w-3 h-3" style={{ color: "var(--sub-text-color)" }} />
            </button>

            {/* Attention Team Cards */}
            <div className="flex flex-col gap-1.5">
              {departmentData[selectedDepartment].attention.slice(0, 2).map((item, idx) => (
                <div key={idx} className="w-full rounded-xl p-3 flex items-center gap-3" style={{ backgroundColor: "rgba(239, 68, 68, 0.05)", border: "1px solid var(--border-color)" }}>
                  <div className="px-3 py-1.5 h-auto flex justify-center items-center rounded-lg" style={{ backgroundColor: "rgba(239, 68, 68, 0.1)" }}>
                    <span className="text-sm font-bold" style={{ color: "#EF4444" }}>{item.amount}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-xs mb-0.5" style={{ color: "var(--text-color)" }}>
                      {item.team}
                    </h4>
                    <p className="text-[10px] leading-tight" style={{ color: "var(--sub-text-color)" }}>
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Popups remain the same */}
      {showBestPopup && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowBestPopup(false)}>
          <div className="rounded-xl shadow-2xl p-5 w-full max-w-md max-h-[80vh] overflow-y-auto" style={{ backgroundColor: "var(--bg-color)" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-base font-bold" style={{ color: "var(--accent-color)" }}>All Best Compliance Teams</h3>
              <button onClick={() => setShowBestPopup(false)} className="text-xl hover:opacity-70 transition-opacity" style={{ color: "var(--sub-text-color)" }}>&times;</button>
            </div>
            <div className="flex flex-col gap-2">
              {departmentData[selectedDepartment].best.map((item, idx) => (
                <div key={idx} className="w-full rounded-lg p-3 flex items-center gap-3" style={{ backgroundColor: "rgba(9, 209, 199, 0.05)", border: "1px solid var(--border-color)" }}>
                  <div className="px-3 py-1.5 flex justify-center items-center rounded-lg" style={{ background: "linear-gradient(135deg, #09D1C7 0%, #15919B 100%)" }}>
                    <span className="text-xs font-bold text-white">{item.amount}</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-xs mb-0.5" style={{ color: "var(--text-color)" }}>{item.team}</h4>
                    <p className="text-[10px]" style={{ color: "var(--sub-text-color)" }}>{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showAttentionPopup && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowAttentionPopup(false)}>
          <div className="rounded-xl shadow-2xl p-5 w-full max-w-md max-h-[80vh] overflow-y-auto" style={{ backgroundColor: "var(--bg-color)" }} onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-base font-bold" style={{ color: "#EF4444" }}>All Needs Attention Teams</h3>
              <button onClick={() => setShowAttentionPopup(false)} className="text-xl hover:opacity-70 transition-opacity" style={{ color: "var(--sub-text-color)" }}>&times;</button>
            </div>
            <div className="flex flex-col gap-2">
              {departmentData[selectedDepartment].attention.map((item, idx) => (
                <div key={idx} className="w-full rounded-lg p-3 flex items-center gap-3" style={{ backgroundColor: "rgba(239, 68, 68, 0.05)", border: "1px solid var(--border-color)" }}>
                  <div className="px-3 py-1.5 flex justify-center items-center rounded-lg" style={{ backgroundColor: "rgba(239, 68, 68, 0.1)" }}>
                    <span className="text-xs font-bold" style={{ color: "#EF4444" }}>{item.amount}</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-xs mb-0.5" style={{ color: "var(--text-color)" }}>{item.team}</h4>
                    <p className="text-[10px]" style={{ color: "var(--sub-text-color)" }}>{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TeamOverView
