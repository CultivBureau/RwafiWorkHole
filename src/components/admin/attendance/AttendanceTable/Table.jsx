"use client"

import { useState, useMemo, useEffect } from "react"
import { useTranslation } from "react-i18next";
import { useLang } from "../../../../contexts/LangContext";
import { ChevronDown, ChevronUp, Users, Download } from "lucide-react";
import * as XLSX from "xlsx";
import toast from "react-hot-toast";
import { useLazyGetCompanyClockinLogsQuery } from "../../../../services/apis/ClockinLogApi";
import { utcToLocalTime, utcToLocalDate, calculateDurationFromUtc } from '../../../../utils/timeUtils';
import { isWithinShiftRadius } from '../../../../utils/locationUtils';

const formatDate = (isoString, locale) => {
  // API returns UTC time, convert to local date for display
  return utcToLocalDate(isoString, locale);
};

const formatTime = (isoString, locale) => {
  // API returns UTC time, convert to local time for display
  return utcToLocalTime(isoString, locale);
};

const calculateDuration = (startIso, endIso) => {
  // API returns UTC times, calculate duration correctly
  if (!startIso || !endIso) return { label: "—", minutes: 0 };
  
  const diffSeconds = calculateDurationFromUtc(startIso, endIso);
  if (diffSeconds <= 0) return { label: "—", minutes: 0 };
  
  const totalMinutes = Math.floor(diffSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const labelParts = [];
  if (hours > 0) labelParts.push(`${hours}h`);
  if (minutes > 0) labelParts.push(`${minutes}m`);
  const label = labelParts.length > 0 ? labelParts.join(" ") : "0m";
  return { label, minutes: totalMinutes };
};

const determineStatus = (log) => {
  if (!log?.clockinTime && !log?.clockoutTime) return "Absent";
  if (log?.isLate) return "Late arrival";
  return "On Time";
};

const determineLocation = (log) => {
  if (!log) return "Unknown";
  // API uses "office" field: true = office, false = remote/home
  // But we also check distance as a fallback to ensure accuracy
  if (log.office === true) return "Work from office";
  if (log.office === false) {
    // Double-check: if clock-in location is within shift radius, it should be office
    const shiftLat = log?.shiftRule?.latitude;
    const shiftLng = log?.shiftRule?.longitude;
    const radiusMeters = log?.shiftRule?.radiusMeters;
    const clockinLocation = log?.clockinLocation;
    
    if (clockinLocation && shiftLat && shiftLng && radiusMeters !== undefined) {
      const withinRadius = isWithinShiftRadius(clockinLocation, shiftLat, shiftLng, radiusMeters);
      if (withinRadius) {
        // Location is within radius, so it should be office
        return "Work from office";
      }
    }
    return "Work from home";
  }
  // Fallback to officeRemote for backward compatibility
  if (log.officeRemote === true) return "Work from office";
  if (log.officeRemote === false) return "Work from home";
  if (log.clockinLocation || log.clockoutLocation) return "On-site";
  return "Unknown";
};

const getInitials = (name = "") => {
  if (!name) return "--";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("");
};

const parseBreakDuration = (duration) => {
  if (!duration) return 0;
  const parts = duration.split(':');
  if (parts.length === 3) {
    const hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;
    const seconds = parseInt(parts[2], 10) || 0;
    return hours * 60 + minutes + seconds / 60;
  }
  return 0;
};

const SERVER_PAGE_SIZE = 50;
const MAX_PAGES = 100;

const extractLogsFromResponse = (response) => {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.value)) return response.value;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.items)) return response.items;
  if (Array.isArray(response?.results)) return response.results;
  return [];
};

const AttendanceTable = () => {
  const { t, i18n } = useTranslation();
  const { isRtl } = useLang();
  const locale = i18n.language === "ar" ? "ar-EG" : "en-US";

  // Filter states
  const [sortBy, setSortBy] = useState("newest")
  const [locationFilter, setLocationFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFromFilter, setDateFromFilter] = useState("")
  const [dateToFilter, setDateToFilter] = useState("")

  // Table sorting states
  const [tableSortColumn, setTableSortColumn] = useState(null)
  const [tableSortDirection, setTableSortDirection] = useState('asc')

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const [rawLogs, setRawLogs] = useState([])
  const [isFetchingLogs, setIsFetchingLogs] = useState(false)
  const [fetchError, setFetchError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [fetchLogsTrigger] = useLazyGetCompanyClockinLogsQuery()

  useEffect(() => {
    let isCancelled = false;
    const fetchAllLogs = async () => {
      setIsFetchingLogs(true);
      setFetchError(null);
      const aggregated = [];
      let page = 1;

      try {
        // Determine isAbsent parameter based on status filter
        let isAbsentParam = undefined;
        if (statusFilter === "absent") {
          // Only absent records
          isAbsentParam = true;
        } else if (statusFilter === "onTime" || statusFilter === "late") {
          // Exclude absent records for "On Time" and "Late arrival"
          isAbsentParam = false;
        }
        // If "all", isAbsentParam remains undefined (not sent to API)

        while (!isCancelled && page <= MAX_PAGES) {
          const response = await fetchLogsTrigger(
            { 
              pageNumber: page, 
              pageSize: SERVER_PAGE_SIZE,
              isAbsent: isAbsentParam
            },
            true
          ).unwrap();

          const pageLogs = extractLogsFromResponse(response);
          aggregated.push(...pageLogs);

          if (pageLogs.length < SERVER_PAGE_SIZE) {
            break;
          }
          page += 1;
        }

        if (!isCancelled) {
          setRawLogs(aggregated);
        }
      } catch (err) {
        if (!isCancelled) {
          if (aggregated.length > 0) {
            setRawLogs(aggregated);
          }
          setFetchError(err);
        }
      } finally {
        if (!isCancelled) {
          setIsFetchingLogs(false);
        }
      }
    };

    fetchAllLogs();
    return () => {
      isCancelled = true;
    };
  }, [fetchLogsTrigger, reloadKey, statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [rawLogs]);

  // Map API data to table format
  const companyLogs = useMemo(() => {
    if (!rawLogs?.length) return []

    const items = Array.isArray(rawLogs) ? rawLogs : []

    return items.map((log) => {
      const userFirstName = log?.user?.firstName || ""
      const userLastName = log?.user?.lastName || ""
      const username = log?.user?.userName || ""
      const fullName = `${userFirstName} ${userLastName}`.trim() || username || t("adminAttendance.table.unknownUser", "Unknown Employee")

      const primaryDateIso = log?.clockinTime || log?.clockoutTime || log?.createdAt || log?.updatedAt
      const dateObject = primaryDateIso ? new Date(primaryDateIso) : null
      const dateSort = dateObject && !Number.isNaN(dateObject.getTime()) ? dateObject : new Date(0)

      const checkIn = formatTime(log?.clockinTime, locale)
      const checkOut = formatTime(log?.clockoutTime, locale)
      const timeDiff = calculateDuration(log?.clockinTime, log?.clockoutTime)
      const status = determineStatus(log)
      const location = determineLocation(log)
      const shiftName = log?.shiftRule?.name || "—"

      return {
        id: log?.id,
        name: fullName,
        avatar: null,
        date: formatDate(primaryDateIso, locale),
        dateSort,
        checkIn,
        checkInSort: log?.clockinTime ? new Date(log.clockinTime).getTime() : 0,
        checkOut,
        checkOutSort: log?.clockoutTime ? new Date(log.clockoutTime).getTime() : 0,
        workHours: timeDiff.label,
        workHoursSort: timeDiff.minutes,
        status,
        location,
        email: log?.user?.email || "—",
        reason: log?.reason || "",
        clockinLocation: log?.clockinLocation || "",
        clockoutLocation: log?.clockoutLocation || "",
        shiftName,
        breakDuration: log?.breakDuration || null,
        raw: log,
      }
    })
  }, [rawLogs, locale, t])

  // Handle table column sorting
  const handleTableSort = (column) => {
    if (tableSortColumn === column) {
      setTableSortDirection(tableSortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setTableSortColumn(column)
      setTableSortDirection('asc')
    }
  }

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    let filtered = [...companyLogs]

    // Apply filters
    if (statusFilter !== "all") {
      filtered = filtered.filter(employee => {
        if (statusFilter === "onTime") return employee.status === "On Time"
        if (statusFilter === "absent") return employee.status === "Absent"
        if (statusFilter === "late") return employee.status === "Late arrival"
        return true
      })
    }

    if (locationFilter !== "all") {
      filtered = filtered.filter(employee => {
        if (locationFilter === "office") return employee.location === "Work from office"
        if (locationFilter === "home") return employee.location === "Work from home"
        return true
      })
    }

    // Apply date range filter
    if (dateFromFilter || dateToFilter) {
      filtered = filtered.filter(employee => {
        const employeeDate = employee.dateSort
        let isInRange = true

        if (dateFromFilter) {
          const fromDate = new Date(dateFromFilter)
          isInRange = isInRange && employeeDate >= fromDate
        }

        if (dateToFilter) {
          const toDate = new Date(dateToFilter)
          // Set to end of day for inclusive comparison
          toDate.setHours(23, 59, 59, 999)
          isInRange = isInRange && employeeDate <= toDate
        }

        return isInRange
      })
    }

    // Apply header sort
    if (sortBy === "newest") {
      filtered.sort((a, b) => b.dateSort - a.dateSort)
    } else if (sortBy === "oldest") {
      filtered.sort((a, b) => a.dateSort - b.dateSort)
    }

    // Apply table column sort
    if (tableSortColumn) {
      filtered.sort((a, b) => {
        let aVal, bVal

        switch (tableSortColumn) {
          case 'name':
            aVal = a.name.toLowerCase()
            bVal = b.name.toLowerCase()
            break
          case 'date':
            aVal = a.dateSort
            bVal = b.dateSort
            break
          case 'checkIn':
            aVal = a.checkInSort
            bVal = b.checkInSort
            break
          case 'checkOut':
            aVal = a.checkOutSort
            bVal = b.checkOutSort
            break
          case 'workHours':
            aVal = a.workHoursSort
            bVal = b.workHoursSort
            break
          case 'status':
            aVal = a.status.toLowerCase()
            bVal = b.status.toLowerCase()
            break
          case 'location':
            aVal = a.location.toLowerCase()
            bVal = b.location.toLowerCase()
            break
          case 'shift':
            aVal = (a.shiftName || "").toLowerCase()
            bVal = (b.shiftName || "").toLowerCase()
            break
          case 'reason':
            aVal = (a.reason || "").toLowerCase()
            bVal = (b.reason || "").toLowerCase()
            break
      case 'breakDuration':
        aVal = parseBreakDuration(a.breakDuration)
        bVal = parseBreakDuration(b.breakDuration)
        break
          default:
            return 0
        }

        if (tableSortDirection === 'asc') {
          return aVal < bVal ? -1 : aVal > bVal ? 1 : 0
        } else {
          return aVal > bVal ? -1 : aVal < bVal ? 1 : 0
        }
      })
    }

    return filtered
  }, [companyLogs, sortBy, locationFilter, statusFilter, dateFromFilter, dateToFilter, tableSortColumn, tableSortDirection])

  // Pagination
  const totalRecords = filteredAndSortedData.length
  const totalPages = totalRecords === 0 ? 1 : Math.ceil(totalRecords / itemsPerPage)
  const startIndex = totalRecords === 0 ? 0 : (currentPage - 1) * itemsPerPage
  const currentData = filteredAndSortedData.slice(startIndex, startIndex + itemsPerPage)
  const showingFrom = totalRecords === 0 ? 0 : startIndex + 1
  const showingTo = totalRecords === 0 ? 0 : startIndex + currentData.length

  // Reset current page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [sortBy, locationFilter, statusFilter, dateFromFilter, dateToFilter])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const handleRefresh = () => setReloadKey((prev) => prev + 1)

  const handleExportToExcel = () => {
    if (filteredAndSortedData.length === 0) {
      toast.error(
        t("adminAttendance.table.export.noData", "No data to export"),
        {
          duration: 3000,
          style: {
            background: '#EF4444',
            color: '#fff',
          },
        }
      );
      return;
    }

    // Prepare data for Excel export
    const exportData = filteredAndSortedData.map((employee, index) => ({
      "#": index + 1,
      [t("adminAttendance.table.columns.employeeName", "Employees Name")]: employee.name,
      [t("adminAttendance.table.columns.email", "Email")]: employee.email || "—",
      [t("adminAttendance.table.columns.date", "Date")]: employee.date,
      [t("adminAttendance.table.columns.checkIn", "Check-in")]: employee.checkIn,
      [t("adminAttendance.table.columns.checkOut", "Check-out")]: employee.checkOut,
      [t("adminAttendance.table.columns.workHours", "Work hours")]: employee.workHours,
      [t("adminAttendance.table.columns.status", "Status")]: employee.status,
      [t("adminAttendance.table.columns.location", "Location")]: employee.location,
      [t("adminAttendance.table.columns.shift", "Shift")]: employee.shiftName,
      [t("adminAttendance.table.columns.reason", "Reason")]: employee.reason || "—",
      [t("adminAttendance.table.columns.breakDuration", "Break Duration")]: employee.breakDuration || "—",
    }));

    // Create workbook and worksheet
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, t("adminAttendance.table.export.sheetName", "Attendance"));

    // Auto-size columns
    const maxWidth = 50;
    const wscols = [
      { wch: 5 },   // #
      { wch: 25 },  // Employee Name
      { wch: 25 },  // Email
      { wch: 12 },  // Date
      { wch: 12 },  // Check-in
      { wch: 12 },  // Check-out
      { wch: 12 },  // Work Hours
      { wch: 15 },  // Status
      { wch: 20 },  // Location
      { wch: 15 },  // Shift
      { wch: 30 },  // Reason
      { wch: 15 },  // Break Duration
    ];
    ws['!cols'] = wscols;

    // Generate filename with current date
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const filename = `attendance_${dateStr}.xlsx`;

    // Export file
    XLSX.writeFile(wb, filename);

    // Show success toast
    toast.success(
      t("adminAttendance.table.export.success", "Attendance data exported successfully"),
      {
        duration: 3000,
        style: {
          background: '#10B981',
          color: '#fff',
        },
      }
    );
  }

  const getStatusBadge = (status) => {
    const baseClasses = "px-3 py-1 rounded-full text-xs font-medium inline-block border";
    switch (status) {
      case "On Time":
        return <span className={`${baseClasses} bg-[var(--success-color)]/10 text-[var(--success-color)]/70 border-[var(--success-color)]/30`}>
          {t("adminAttendance.table.status.onTime", "On Time")}
        </span>
      case "Absent":
        return <span className={`${baseClasses} bg-[var(--error-color)]/10 text-[var(--error-color)]/70 border-[var(--error-color)]/30`}>
          {t("adminAttendance.table.status.absent", "Absent")}
        </span>
      case "Late arrival":
        return <span className={`${baseClasses} bg-[var(--warning-color)]/10 text-[var(--warning-color)]/70 border-[var(--warning-color)]/30`}>
          {t("adminAttendance.table.status.lateArrival", "Late arrival")}
        </span>
      default:
        return <span className={`${baseClasses} bg-[var(--container-color)] text-[var(--sub-text-color)] border-[var(--border-color)]`}>{status}</span>
    }
  }

  const getLocationBadge = (location) => {
    const baseClasses = "px-3 py-1 rounded-full text-xs font-medium inline-block border";
    switch (location) {
      case "Work from office":
        return (
          <span className={`${baseClasses} bg-[var(--accent-color)]/10 text-[var(--accent-color)]/70 border-[var(--accent-color)]/30`}>
            {t("adminAttendance.table.location.workFromOffice", "Work from office")}
          </span>
        );
      case "Work from home":
        return (
          <span className={`${baseClasses} bg-[var(--sub-text-color)]/10 text-[var(--sub-text-color)]/70 border-[var(--border-color)]/50`}>
            {t("adminAttendance.table.location.workFromHome", "Work from home")}
          </span>
        );
      default:
        return <span className="text-[var(--sub-text-color-2)] text-sm">—</span>;
    }
  };

  const getTimeStyle = (status, time) => {
    if (status === "Absent" && typeof time === "string" && time.includes("00:00")) {
      return "text-[var(--error-color)] text-sm"
    }
    return "text-[var(--text-color)] text-sm"
  }

  const getSortIcon = (column) => {
    if (tableSortColumn !== column) {
      return <ChevronDown className="h-3 w-3 text-gray-400" />
    }
    return tableSortDirection === 'asc'
      ? <ChevronUp className="h-3 w-3 text-[var(--accent-color)]" />
      : <ChevronDown className="h-3 w-3 text-[var(--accent-color)]" />
  }

  return (
    <div className="bg-[var(--bg-color)] rounded-lg border border-[var(--border-color)]">
      {/* Header with filters */}
      <div className="px-6 py-4 border-b flex justify-center items-center bg-[var(--bg-color)]">
        <div className="flex bg-[var(--bg-color)] p-4 w-[98%] h-max shadow-md rounded-3xl border border-[var(--border-color)] flex-wrap items-center gap-4 justify-between">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-medium text-[var(--sub-text-color)]">
                {t("adminAttendance.table.sortBy", "Sort By")}
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-8 px-3 border border-[var(--border-color)] rounded-md text-[10px] bg-[var(--bg-color)] text-[var(--text-color)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-color)] focus:border-[var(--accent-color)]"
              >
                <option value="newest">
                  {t("adminAttendance.table.sort.newestFirst", "Newest First")}
                </option>
                <option value="oldest">
                  {t("adminAttendance.table.sort.oldestFirst", "Oldest First")}
                </option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-medium text-[var(--sub-text-color)]">
                {t("adminAttendance.table.location.title", "Location")}
              </span>
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="h-8 px-3 border border-[var(--border-color)] rounded-md text-[10px] bg-[var(--bg-color)] text-[var(--text-color)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-color)] focus:border-[var(--accent-color)]"
              >
                <option value="all">
                  {t("adminAttendance.table.location.all", "All")}
                </option>
                <option value="office">
                  {t("adminAttendance.table.location.office", "Office")}
                </option>
                <option value="home">
                  {t("adminAttendance.table.location.home", "Home")}
                </option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-medium text-[var(--sub-text-color)]">
                {t("adminAttendance.table.status.title", "Status")}
              </span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-8 px-3 border border-[var(--border-color)] rounded-md text-[10px] bg-[var(--bg-color)] text-[var(--text-color)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-color)] focus:border-[var(--accent-color)]"
              >
                <option value="all">
                  {t("adminAttendance.table.status.allStatus", "All Status")}
                </option>
                <option value="onTime">
                  {t("adminAttendance.table.status.onTime", "On Time")}
                </option>
                <option value="absent">
                  {t("adminAttendance.table.status.absent", "Absent")}
                </option>
                <option value="late">
                  {t("adminAttendance.table.status.lateArrival", "Late arrival")}
                </option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-medium text-[var(--sub-text-color)]">
                {t("adminAttendance.table.dateFrom", "Date from")}
              </span>
              <input
                type="date"
                value={dateFromFilter}
                onChange={(e) => setDateFromFilter(e.target.value)}
                className="h-8 px-3 border border-[var(--border-color)] rounded-md text-[10px] bg-[var(--bg-color)] text-[var(--text-color)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-color)] focus:border-[var(--accent-color)]"
                placeholder="Select start date"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-medium text-[var(--sub-text-color)]">
                {t("adminAttendance.table.dateTo", "Date To")}
              </span>
              <input
                type="date"
                value={dateToFilter}
                onChange={(e) => setDateToFilter(e.target.value)}
                className="h-8 px-3 border border-[var(--border-color)] rounded-md text-[10px] bg-[var(--bg-color)] text-[var(--text-color)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-color)] focus:border-[var(--accent-color)]"
                placeholder="Select end date"
                min={dateFromFilter} // Prevents selecting end date before start date
              />
            </div>
          </div>

          <div className={`flex items-center gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <span className="text-[10px] text-[var(--sub-text-color)]">
              {t("adminAttendance.table.pageOf", {
                page: currentPage,
                total: totalPages || 1,
                defaultValue: `Page ${currentPage} of ${totalPages || 1} page`
              })}
            </span>
            <div className={`flex items-center gap-1 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="h-8 w-8 border border-[var(--border-color)] rounded-md bg-[var(--bg-color)] hover:bg-[var(--hover-color)] flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="h-4 w-4 text-[var(--sub-text-color)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isRtl ? "M15 19l-7-7 7-7" : "M15 19l-7-7 7-7"} />
                </svg>
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="h-8 w-8 border border-[var(--border-color)] rounded-md bg-[var(--bg-color)] hover:bg-[var(--hover-color)] flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="h-4 w-4 text-[var(--sub-text-color)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isRtl ? "M9 5l7 7-7 7" : "M9 5l7 7-7 7"} />
                </svg>
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <div className="text-xs font-medium text-[var(--sub-text-color)]">
              {t("attendanceTable.showing", { count: currentData.length, total: totalRecords })}
              {totalRecords > 0 && (
                <span className="block text-[10px] mt-0.5">
                  {`${showingFrom}-${showingTo}`}
                </span>
              )}
            </div>
            {/* <button
              type="button"
              onClick={handleRefresh}
              disabled={isFetchingLogs}
              className="px-3 py-1.5 rounded-full border text-[10px] font-semibold transition-colors duration-200 disabled:opacity-50 flex items-center gap-1.5"
              style={{
                borderColor: 'var(--border-color)',
                backgroundColor: 'var(--bg-color)',
                color: 'var(--text-color)',
              }}
            >
              {t("attendanceTable.refresh", "Refresh")}
            </button> */}
            <button
              type="button"
              onClick={handleExportToExcel}
              disabled={isFetchingLogs || filteredAndSortedData.length === 0}
              className="px-3 py-1.5 rounded-full border text-[10px] font-semibold transition-colors duration-200 disabled:opacity-50 flex items-center gap-1.5 hover:bg-[var(--hover-color)]"
              style={{
                borderColor: 'var(--accent-color)',
                backgroundColor: 'var(--bg-color)',
                color: 'var(--accent-color)',
              }}
            >
              <Download className="w-3.5 h-3.5" />
              {t("adminAttendance.table.export.button", "Export to Excel")}
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[var(--table-header-bg)]">
            <tr>
              <th
                onClick={() => handleTableSort('name')}
                className="text-left py-3 px-6 text-sm font-medium text-[var(--sub-text-color)] border-b border-[var(--border-color)] cursor-pointer hover:bg-[var(--hover-color)] transition-colors"
              >
                <div className="flex items-center gap-1">
                  {t("adminAttendance.table.columns.employeeName", "Employees Name")}
                  {getSortIcon('name')}
                </div>
              </th>
              <th
                onClick={() => handleTableSort('date')}
                className="text-left py-3 px-6 text-sm font-medium text-[var(--sub-text-color)] border-b border-[var(--border-color)] cursor-pointer hover:bg-[var(--hover-color)] transition-colors"
              >
                <div className="flex items-center gap-1">
                  {t("adminAttendance.table.columns.date", "Date")}
                  {getSortIcon('date')}
                </div>
              </th>
              <th
                onClick={() => handleTableSort('checkIn')}
                className="text-left py-3 px-6 text-sm font-medium text-[var(--sub-text-color)] border-b border-[var(--border-color)] cursor-pointer hover:bg-[var(--hover-color)] transition-colors"
              >
                <div className="flex items-center gap-1">
                  {t("adminAttendance.table.columns.clockIn", "Clock in")}
                  {getSortIcon('checkIn')}
                </div>
              </th>
              <th
                onClick={() => handleTableSort('checkOut')}
                className="text-left py-3 px-6 text-sm font-medium text-[var(--sub-text-color)] border-b border-[var(--border-color)] cursor-pointer hover:bg-[var(--hover-color)] transition-colors"
              >
                <div className="flex items-center gap-1">
                  {t("adminAttendance.table.columns.clockOut", "Clock out")}
                  {getSortIcon('checkOut')}
                </div>
              </th>
              <th
                onClick={() => handleTableSort('workHours')}
                className="text-left py-3 px-6 text-sm font-medium text-[var(--sub-text-color)] border-b border-[var(--border-color)] cursor-pointer hover:bg-[var(--hover-color)] transition-colors"
              >
                <div className="flex items-center gap-1">
                  {t("adminAttendance.table.columns.workHours", "Work hours")}
                  {getSortIcon('workHours')}
                </div>
              </th>
              <th
                onClick={() => handleTableSort('status')}
                className="text-left py-3 px-6 text-sm font-medium text-[var(--sub-text-color)] border-b border-[var(--border-color)] cursor-pointer hover:bg-[var(--hover-color)] transition-colors"
              >
                <div className="flex items-center gap-1">
                  {t("adminAttendance.table.columns.status", "Status")}
                  {getSortIcon('status')}
                </div>
              </th>
              <th
                onClick={() => handleTableSort('location')}
                className="text-left py-3 px-6 text-sm font-medium text-[var(--sub-text-color)] border-b border-[var(--border-color)] cursor-pointer hover:bg-[var(--hover-color)] transition-colors"
              >
                <div className="flex items-center gap-1">
                  {t("adminAttendance.table.columns.location", "Location")}
                  {getSortIcon('location')}
                </div>
              </th>
              <th
                onClick={() => handleTableSort('shift')}
                className="text-left py-3 px-6 text-sm font-medium text-[var(--sub-text-color)] border-b border-[var(--border-color)] cursor-pointer hover:bg-[var(--hover-color)] transition-colors"
              >
                <div className="flex items-center gap-1">
                  {t("adminAttendance.table.columns.shift", "Shift")}
                  {getSortIcon('shift')}
                </div>
              </th>
              <th
                onClick={() => handleTableSort('reason')}
                className="text-left py-3 px-6 text-sm font-medium text-[var(--sub-text-color)] border-b border-[var(--border-color)] cursor-pointer hover:bg-[var(--hover-color)] transition-colors"
              >
                <div className="flex items-center gap-1">
                  {t("adminAttendance.table.columns.reason", "Reason")}
                  {getSortIcon('reason')}
                </div>
              </th>
              <th
                onClick={() => handleTableSort('breakDuration')}
                className="text-left py-3 px-6 text-sm font-medium text-[var(--sub-text-color)] border-b border-[var(--border-color)] cursor-pointer hover:bg-[var(--hover-color)] transition-colors"
              >
                <div className="flex items-center gap-1">
                  {t("adminAttendance.table.columns.breakDuration", "Break Duration")}
                  {getSortIcon('breakDuration')}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="bg-[var(--table-bg)]">
            {isFetchingLogs ? (
              <tr>
                <td colSpan={10} className="py-16 px-6 text-center text-[var(--sub-text-color)]">
                  {t("adminAttendance.table.loading", "Loading attendance records...")}
                </td>
              </tr>
            ) : fetchError ? (
              <tr>
                <td colSpan={10} className="py-16 px-6">
                  <div className="flex flex-col items-center gap-3 text-[var(--sub-text-color)]">
                    <span>{t("adminAttendance.table.errorLoading", "Failed to load attendance records")}</span>
                    {fetchError && (
                      <span className="text-sm text-[var(--sub-text-color)]/80">
                        {fetchError?.data?.errorMessage || fetchError?.error || fetchError?.message || "An error occurred"}
                      </span>
                    )}
                    <button onClick={handleRefresh} className="btn-secondary">
                      {t("adminAttendance.table.retry", "Retry")}
                    </button>
                  </div>
                </td>
              </tr>
            ) : filteredAndSortedData.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-16 px-6">
                  <div className="flex flex-col items-center gap-4 text-[var(--sub-text-color)]">
                    <Users className="h-12 w-12 opacity-60" />
                    <div className="text-lg font-medium text-[var(--text-color)]">
                      {t("adminAttendance.table.emptyTitle", "No clock-in logs yet")}
                    </div>
                    <div className="text-sm text-center max-w-md">
                      {t("adminAttendance.table.emptyDescription", "When team members start clocking in, their activity will appear here.")}
                    </div>
                    {/* <button onClick={handleRefresh} className="btn-secondary">
                      {t("adminAttendance.table.refresh", "Refresh")}
                    </button> */}
                  </div>
                </td>
              </tr>
            ) : (
              currentData.map((employee) => (
              <tr key={employee.id} className="border-b border-[var(--border-color)] hover:bg-[var(--hover-color)] transition-colors">
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-[var(--container-color)] flex items-center justify-center overflow-hidden flex-shrink-0 border border-[var(--border-color)]">
                      {employee.avatar ? (
                        <img
                          src={employee.avatar}
                          alt={employee.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-medium text-[var(--sub-text-color)]">
                          {getInitials(employee.name)}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium text-[var(--text-color)] text-sm">{employee.name}</span>
                      <span className="text-xs text-[var(--sub-text-color)]">
                        {employee.email || t("adminAttendance.table.noEmail", "No email")}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-6 text-gray-500 text-sm">{employee.date}</td>
                <td className={`py-4 px-6 ${getTimeStyle(employee.status, employee.checkIn)}`}>
                  {employee.checkIn}
                </td>
                <td className={`py-4 px-6 ${getTimeStyle(employee.status, employee.checkOut)}`}>
                  {employee.checkOut}
                </td>
                <td className="py-4 px-6 text-gray-500 text-sm font-medium">{employee.workHours}</td>
                <td className="py-4 px-6">{getStatusBadge(employee.status)}</td>
                <td className="py-4 px-6">{getLocationBadge(employee.location)}</td>
                <td className="py-4 px-6 text-sm text-[var(--text-color)]">{employee.shiftName}</td>
                <td className="py-4 px-6 text-sm text-[var(--text-color)]">
                  {employee.reason
                    ? employee.reason
                    : <span className="text-[var(--sub-text-color)]">—</span>}
                </td>
                <td className="py-4 px-6 text-sm text-[var(--text-color)]">
                  {employee.breakDuration
                    ? employee.breakDuration
                    : <span className="text-[var(--sub-text-color)]">—</span>}
                </td>
              </tr>
            ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AttendanceTable
