"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import { useLang } from "../../../contexts/LangContext"
import { Users, Download, ChevronDown, ChevronUp } from "lucide-react"
import { useLazyGetAllBreakLogsQuery, useLazyGetUserBreakLogsQuery } from "../../../services/apis/BreakApi"
import { useGetAllUsersQuery } from "../../../services/apis/UserApi"
import { utcToLocalTime, utcToLocalDate, calculateDurationFromUtc } from '../../../utils/timeUtils'
import * as XLSX from "xlsx"
import toast from "react-hot-toast"

const SERVER_PAGE_SIZE = 50
const MAX_PAGES = 100

const extractLogsFromResponse = (response) => {
  if (!response) return []
  if (Array.isArray(response)) return response
  if (Array.isArray(response?.value)) return response.value
  if (Array.isArray(response?.data)) return response.data
  if (Array.isArray(response?.items)) return response.items
  if (Array.isArray(response?.results)) return response.results
  return []
}

const BreakLogsTable = () => {
  const { t, i18n } = useTranslation()
  const { isRtl } = useLang()
  const locale = i18n.language === "ar" ? "ar-EG" : "en-US"

  // Filter states
  const [selectedUserId, setSelectedUserId] = useState("all")
  const [userSearchTerm, setUserSearchTerm] = useState("")
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState("all") // "all", "ongoing", "completed", "exceeded"
  const [sortBy, setSortBy] = useState("newest")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Table sorting states
  const [tableSortColumn, setTableSortColumn] = useState(null)
  const [tableSortDirection, setTableSortDirection] = useState('asc')

  // Data states
  const [rawLogs, setRawLogs] = useState([])
  const [isFetchingLogs, setIsFetchingLogs] = useState(false)
  const [fetchError, setFetchError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  const [fetchAllLogsTrigger] = useLazyGetAllBreakLogsQuery()
  const [fetchUserLogsTrigger] = useLazyGetUserBreakLogsQuery()

  // Fetch users for dropdown
  const { data: usersResponse, isLoading: isLoadingUsers } = useGetAllUsersQuery({
    pageNumber: 1,
    pageSize: 500
  })

  const allUsers = useMemo(() => {
    const items = usersResponse?.value || usersResponse?.data || usersResponse?.items || usersResponse || []
    return Array.isArray(items) ? items : []
  }, [usersResponse])

  // Filter users by search term
  const filteredUsers = useMemo(() => {
    if (!userSearchTerm) return allUsers
    const search = userSearchTerm.toLowerCase()
    return allUsers.filter(user => {
      const firstName = (user.firstName || "").toLowerCase()
      const lastName = (user.lastName || "").toLowerCase()
      const email = (user.email || "").toLowerCase()
      const userName = (user.userName || "").toLowerCase()
      return firstName.includes(search) || lastName.includes(search) || email.includes(search) || userName.includes(search)
    })
  }, [allUsers, userSearchTerm])

  const selectedUser = useMemo(() => {
    if (selectedUserId === "all") return null
    return allUsers.find(u => (u.id || u.userId) === selectedUserId) || null
  }, [allUsers, selectedUserId])

  const userDropdownRef = useRef(null)

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setIsUserDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Fetch break logs
  useEffect(() => {
    let isCancelled = false
    const fetchAllLogs = async () => {
      setIsFetchingLogs(true)
      setFetchError(null)
      const aggregated = []
      let page = 1

      try {
        if (selectedUserId === "all") {
          // Fetch all company break logs
          while (!isCancelled && page <= MAX_PAGES) {
            const response = await fetchAllLogsTrigger(
              { 
                pageNumber: page, 
                pageSize: SERVER_PAGE_SIZE
              },
              true
            ).unwrap()
            const pageLogs = extractLogsFromResponse(response)
            aggregated.push(...pageLogs)
            if (pageLogs.length < SERVER_PAGE_SIZE) {
              break
            }
            page += 1
          }
        } else {
          // Fetch logs for specific user
          while (!isCancelled && page <= MAX_PAGES) {
            const response = await fetchUserLogsTrigger(
              { 
                userId: selectedUserId,
                pageNumber: page, 
                pageSize: SERVER_PAGE_SIZE
              },
              true
            ).unwrap()
            const pageLogs = extractLogsFromResponse(response)
            aggregated.push(...pageLogs)
            if (pageLogs.length < SERVER_PAGE_SIZE) {
              break
            }
            page += 1
          }
        }

        if (!isCancelled) {
          setRawLogs(aggregated)
        }
      } catch (err) {
        if (!isCancelled) {
          if (aggregated.length > 0) {
            setRawLogs(aggregated)
          }
          setFetchError(err)
        }
      } finally {
        if (!isCancelled) {
          setIsFetchingLogs(false)
        }
      }
    }

    fetchAllLogs()
    return () => {
      isCancelled = true
    }
  }, [fetchAllLogsTrigger, fetchUserLogsTrigger, reloadKey, selectedUserId])

  useEffect(() => {
    setCurrentPage(1)
  }, [rawLogs])

  // Map API data to table format
  const breakLogs = useMemo(() => {
    if (!rawLogs?.length) return []

    return rawLogs.map((log) => {
      const userFirstName = log?.user?.firstName || ""
      const userLastName = log?.user?.lastName || ""
      const username = log?.user?.userName || ""
      const fullName = `${userFirstName} ${userLastName}`.trim() || username || t("breakLogs.unknownUser", "Unknown User")

      const startBreakIso = log?.startBreak
      const endBreakIso = log?.endBreak
      const breakName = log?.break?.name || "—"
      const breakDuration = log?.break?.duration || 0

      // Calculate actual duration
      let actualDuration = { label: "—", minutes: 0 }
      if (startBreakIso && endBreakIso) {
        const durationSeconds = calculateDurationFromUtc(startBreakIso, endBreakIso)
        const totalMinutes = Math.floor(durationSeconds / 60)
        const hours = Math.floor(totalMinutes / 60)
        const minutes = totalMinutes % 60
        const labelParts = []
        if (hours > 0) labelParts.push(`${hours}h`)
        if (minutes > 0) labelParts.push(`${minutes}m`)
        actualDuration = { 
          label: labelParts.length > 0 ? labelParts.join(" ") : "0m",
          minutes: totalMinutes
        }
      } else if (startBreakIso) {
        // Ongoing break
        const durationSeconds = calculateDurationFromUtc(startBreakIso, new Date().toISOString())
        const totalMinutes = Math.floor(durationSeconds / 60)
        const hours = Math.floor(totalMinutes / 60)
        const minutes = totalMinutes % 60
        const labelParts = []
        if (hours > 0) labelParts.push(`${hours}h`)
        if (minutes > 0) labelParts.push(`${minutes}m`)
        actualDuration = { 
          label: labelParts.length > 0 ? labelParts.join(" ") : "0m",
          minutes: totalMinutes
        }
      }

      // Determine status: if exceeded, show "Exceeded", else if completed show "Completed", else "Ongoing"
      const exceeded = breakDuration > 0 && actualDuration.minutes > breakDuration
      const status = endBreakIso 
        ? (exceeded ? "Exceeded" : "Completed")
        : "Ongoing"

      const dateObject = startBreakIso ? new Date(startBreakIso) : null
      const dateSort = dateObject && !Number.isNaN(dateObject.getTime()) ? dateObject : new Date(0)

      return {
        id: log?.id,
        name: fullName,
        email: log?.user?.email || "—",
        date: startBreakIso ? utcToLocalDate(startBreakIso, locale) : "—",
        dateSort,
        breakType: breakName,
        startTime: startBreakIso ? utcToLocalTime(startBreakIso, locale) : "—",
        startTimeSort: startBreakIso ? new Date(startBreakIso).getTime() : 0,
        endTime: endBreakIso ? utcToLocalTime(endBreakIso, locale) : "—",
        endTimeSort: endBreakIso ? new Date(endBreakIso).getTime() : 0,
        duration: actualDuration.label,
        durationSort: actualDuration.minutes,
        status,
        exceeded,
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
    let filtered = [...breakLogs]

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(log => {
        if (statusFilter === "ongoing") return log.status === "Ongoing"
        if (statusFilter === "completed") return log.status === "Completed"
        if (statusFilter === "exceeded") return log.status === "Exceeded"
        return true
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
          case 'breakType':
            aVal = (a.breakType || "").toLowerCase()
            bVal = (b.breakType || "").toLowerCase()
            break
          case 'startTime':
            aVal = a.startTimeSort
            bVal = b.startTimeSort
            break
          case 'endTime':
            aVal = a.endTimeSort
            bVal = b.endTimeSort
            break
          case 'duration':
            aVal = a.durationSort
            bVal = b.durationSort
            break
          case 'status':
            aVal = a.status.toLowerCase()
            bVal = b.status.toLowerCase()
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
  }, [breakLogs, statusFilter, sortBy, tableSortColumn, tableSortDirection])

  // Pagination
  const totalRecords = filteredAndSortedData.length
  const totalPages = totalRecords === 0 ? 1 : Math.ceil(totalRecords / itemsPerPage)
  const startIndex = totalRecords === 0 ? 0 : (currentPage - 1) * itemsPerPage
  const currentData = filteredAndSortedData.slice(startIndex, startIndex + itemsPerPage)
  const showingFrom = totalRecords === 0 ? 0 : startIndex + 1
  const showingTo = totalRecords === 0 ? 0 : startIndex + currentData.length

  useEffect(() => {
    setCurrentPage(1)
  }, [selectedUserId, statusFilter, sortBy])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const handleRefresh = () => setReloadKey((prev) => prev + 1)

  const handleExportToExcel = () => {
    if (filteredAndSortedData.length === 0) {
      toast.error(
        t("breakLogs.export.noData", "No data to export"),
        {
          duration: 3000,
          style: {
            background: '#EF4444',
            color: '#fff',
          },
        }
      )
      return
    }

    const exportData = filteredAndSortedData.map((log, index) => {
      // Get the correct status for export (status already includes "Exceeded" when applicable)
      const exportStatus = log.status === "Ongoing"
        ? t("breakLogs.status.ongoing", "Ongoing")
        : log.status === "Completed"
        ? t("breakLogs.status.completed", "Completed")
        : log.status === "Exceeded"
        ? t("breakLogs.status.exceeded", "Exceeded")
        : log.status

      return {
        "#": index + 1,
        [t("breakLogs.table.columns.employeeName", "Employee Name")]: log.name,
        [t("breakLogs.table.columns.email", "Email")]: log.email || "—",
        [t("breakLogs.table.columns.date", "Date")]: log.date,
        [t("breakLogs.table.columns.breakType", "Break Type")]: log.breakType,
        [t("breakLogs.table.columns.startTime", "Start Time")]: log.startTime,
        [t("breakLogs.table.columns.endTime", "End Time")]: log.endTime,
        [t("breakLogs.table.columns.duration", "Duration")]: log.duration,
        [t("breakLogs.table.columns.status", "Status")]: exportStatus,
      }
    })

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, t("breakLogs.export.sheetName", "Break Logs"))

    const wscols = [
      { wch: 5 },   // #
      { wch: 25 },  // Employee Name
      { wch: 25 },  // Email
      { wch: 12 },  // Date
      { wch: 15 },  // Break Type
      { wch: 12 },  // Start Time
      { wch: 12 },  // End Time
      { wch: 12 },  // Duration
      { wch: 12 },  // Status
    ]
    ws['!cols'] = wscols

    const now = new Date()
    const dateStr = now.toISOString().split('T')[0]
    const filename = `break_logs_${dateStr}.xlsx`

    XLSX.writeFile(wb, filename)

    toast.success(
      t("breakLogs.export.success", "Break logs exported successfully"),
      {
        duration: 3000,
        style: {
          background: '#10B981',
          color: '#fff',
        },
      }
    )
  }

  const getStatusBadge = (status, exceeded) => {
    const baseClasses = "px-3 py-1 rounded-full text-xs font-medium inline-block border"
    if (status === "Ongoing") {
      return <span className={`${baseClasses} bg-[var(--warning-color)]/10 text-[var(--warning-color)]/70 border-[var(--warning-color)]/30`}>
        {t("breakLogs.status.ongoing", "Ongoing")}
      </span>
    }
    if (status === "Exceeded" || (exceeded && status === "Completed")) {
      return <span className={`${baseClasses} bg-[var(--error-color)]/10 text-[var(--error-color)]/70 border-[var(--error-color)]/30`}>
        {t("breakLogs.status.exceeded", "Exceeded")}
      </span>
    }
    return <span className={`${baseClasses} bg-[var(--success-color)]/10 text-[var(--success-color)]/70 border-[var(--success-color)]/30`}>
      {t("breakLogs.status.completed", "Completed")}
    </span>
  }

  const getInitials = (name = "") => {
    if (!name) return "--"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
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
            {/* User Filter */}
            <div className="flex items-center gap-2 relative" ref={userDropdownRef}>
              <span className="text-[10px] font-medium text-[var(--sub-text-color)] whitespace-nowrap">
                {t("breakLogs.filters.user", "User")}
              </span>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                  className="h-8 px-3 border border-[var(--border-color)] rounded-md text-[10px] bg-[var(--bg-color)] text-[var(--text-color)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-color)] focus:border-[var(--accent-color)] flex items-center gap-2 min-w-[200px] justify-between"
                  style={{ direction: isRtl ? 'rtl' : 'ltr' }}
                >
                  <span className="truncate">
                    {selectedUserId === "all" 
                      ? t("breakLogs.filters.allUsers", "All Users")
                      : selectedUser 
                        ? `${selectedUser.firstName || ""} ${selectedUser.lastName || ""}`.trim() || selectedUser.userName || selectedUser.email
                        : t("breakLogs.filters.selectUser", "Select User")}
                  </span>
                  <ChevronDown className={`w-3 h-3 flex-shrink-0 transition-transform ${isUserDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {isUserDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--bg-color)] border border-[var(--border-color)] rounded-md shadow-lg z-50 max-h-[300px] overflow-hidden flex flex-col">
                    <div className="p-2 border-b border-[var(--border-color)]">
                      <input
                        type="text"
                        placeholder={t("breakLogs.filters.searchUser", "Search user...")}
                        value={userSearchTerm}
                        onChange={(e) => setUserSearchTerm(e.target.value)}
                        className="w-full h-8 px-2 border border-[var(--border-color)] rounded text-[10px] bg-[var(--input-bg)] text-[var(--text-color)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-color)]"
                        style={{ direction: isRtl ? 'rtl' : 'ltr' }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="overflow-y-auto">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedUserId("all")
                          setIsUserDropdownOpen(false)
                          setUserSearchTerm("")
                        }}
                        className={`w-full text-left px-3 py-2 text-[10px] hover:bg-[var(--hover-color)] transition-colors ${selectedUserId === "all" ? 'bg-[var(--accent-color)]/10 text-[var(--accent-color)]' : 'text-[var(--text-color)]'}`}
                        style={{ direction: isRtl ? 'rtl' : 'ltr' }}
                      >
                        {t("breakLogs.filters.allUsers", "All Users")}
                      </button>
                      {isLoadingUsers ? (
                        <div className="px-3 py-2 text-[10px] text-[var(--sub-text-color)] text-center">
                          {t("common.loading", "Loading...")}
                        </div>
                      ) : filteredUsers.length === 0 ? (
                        <div className="px-3 py-2 text-[10px] text-[var(--sub-text-color)] text-center">
                          {t("breakLogs.filters.noUsers", "No users found")}
                        </div>
                      ) : (
                        filteredUsers.map((user) => {
                          const userId = user.id || user.userId
                          const displayName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.userName || user.email
                          return (
                            <button
                              key={userId}
                              type="button"
                              onClick={() => {
                                setSelectedUserId(userId)
                                setIsUserDropdownOpen(false)
                                setUserSearchTerm("")
                              }}
                              className={`w-full text-left px-3 py-2 text-[10px] hover:bg-[var(--hover-color)] transition-colors ${selectedUserId === userId ? 'bg-[var(--accent-color)]/10 text-[var(--accent-color)]' : 'text-[var(--text-color)]'}`}
                              style={{ direction: isRtl ? 'rtl' : 'ltr' }}
                            >
                              {displayName}
                            </button>
                          )
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-medium text-[var(--sub-text-color)] whitespace-nowrap">
                {t("breakLogs.filters.status", "Status")}
              </span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-8 px-3 border border-[var(--border-color)] rounded-md text-[10px] bg-[var(--bg-color)] text-[var(--text-color)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-color)] focus:border-[var(--accent-color)]"
                style={{ direction: isRtl ? 'rtl' : 'ltr' }}
              >
                <option value="all">
                  {t("breakLogs.filters.allStatus", "All Status")}
                </option>
                <option value="ongoing">
                  {t("breakLogs.status.ongoing", "Ongoing")}
                </option>
                <option value="completed">
                  {t("breakLogs.status.completed", "Completed")}
                </option>
                <option value="exceeded">
                  {t("breakLogs.status.exceeded", "Exceeded")}
                </option>
              </select>
            </div>

            {/* Sort By */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-medium text-[var(--sub-text-color)]">
                {t("breakLogs.filters.sortBy", "Sort By")}
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-8 px-3 border border-[var(--border-color)] rounded-md text-[10px] bg-[var(--bg-color)] text-[var(--text-color)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-color)] focus:border-[var(--accent-color)]"
                style={{ direction: isRtl ? 'rtl' : 'ltr' }}
              >
                <option value="newest">
                  {t("breakLogs.filters.newestFirst", "Newest First")}
                </option>
                <option value="oldest">
                  {t("breakLogs.filters.oldestFirst", "Oldest First")}
                </option>
              </select>
            </div>
          </div>

          <div className={`flex items-center gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <span className="text-[10px] text-[var(--sub-text-color)]">
              {t("breakLogs.pageOf", {
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
              {t("breakLogs.showing", { count: currentData.length, total: totalRecords })}
              {totalRecords > 0 && (
                <span className="block text-[10px] mt-0.5">
                  {`${showingFrom}-${showingTo}`}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isFetchingLogs}
              className="px-3 py-1.5 rounded-full border text-[10px] font-semibold transition-colors duration-200 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              style={{
                borderColor: 'var(--border-color)',
                backgroundColor: 'var(--bg-color)',
                color: 'var(--text-color)',
              }}
            >
              {t("breakLogs.refresh", "Refresh")}
            </button>
            <button
              type="button"
              onClick={handleExportToExcel}
              disabled={isFetchingLogs || filteredAndSortedData.length === 0}
              className="px-3 py-1.5 rounded-full border text-[10px] font-semibold transition-colors duration-200 disabled:opacity-50 flex items-center gap-1.5 hover:bg-[var(--hover-color)] cursor-pointer"
              style={{
                borderColor: 'var(--accent-color)',
                backgroundColor: 'var(--bg-color)',
                color: 'var(--accent-color)',
              }}
            >
              <Download className="w-3.5 h-3.5" />
              {t("breakLogs.export.button", "Export to Excel")}
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
                  {t("breakLogs.table.columns.employeeName", "Employee Name")}
                  {getSortIcon('name')}
                </div>
              </th>
              <th
                onClick={() => handleTableSort('date')}
                className="text-left py-3 px-6 text-sm font-medium text-[var(--sub-text-color)] border-b border-[var(--border-color)] cursor-pointer hover:bg-[var(--hover-color)] transition-colors"
              >
                <div className="flex items-center gap-1">
                  {t("breakLogs.table.columns.date", "Date")}
                  {getSortIcon('date')}
                </div>
              </th>
              <th
                onClick={() => handleTableSort('breakType')}
                className="text-left py-3 px-6 text-sm font-medium text-[var(--sub-text-color)] border-b border-[var(--border-color)] cursor-pointer hover:bg-[var(--hover-color)] transition-colors"
              >
                <div className="flex items-center gap-1">
                  {t("breakLogs.table.columns.breakType", "Break Type")}
                  {getSortIcon('breakType')}
                </div>
              </th>
              <th
                onClick={() => handleTableSort('startTime')}
                className="text-left py-3 px-6 text-sm font-medium text-[var(--sub-text-color)] border-b border-[var(--border-color)] cursor-pointer hover:bg-[var(--hover-color)] transition-colors"
              >
                <div className="flex items-center gap-1">
                  {t("breakLogs.table.columns.startTime", "Start Time")}
                  {getSortIcon('startTime')}
                </div>
              </th>
              <th
                onClick={() => handleTableSort('endTime')}
                className="text-left py-3 px-6 text-sm font-medium text-[var(--sub-text-color)] border-b border-[var(--border-color)] cursor-pointer hover:bg-[var(--hover-color)] transition-colors"
              >
                <div className="flex items-center gap-1">
                  {t("breakLogs.table.columns.endTime", "End Time")}
                  {getSortIcon('endTime')}
                </div>
              </th>
              <th
                onClick={() => handleTableSort('duration')}
                className="text-left py-3 px-6 text-sm font-medium text-[var(--sub-text-color)] border-b border-[var(--border-color)] cursor-pointer hover:bg-[var(--hover-color)] transition-colors"
              >
                <div className="flex items-center gap-1">
                  {t("breakLogs.table.columns.duration", "Duration")}
                  {getSortIcon('duration')}
                </div>
              </th>
              <th
                onClick={() => handleTableSort('status')}
                className="text-left py-3 px-6 text-sm font-medium text-[var(--sub-text-color)] border-b border-[var(--border-color)] cursor-pointer hover:bg-[var(--hover-color)] transition-colors"
              >
                <div className="flex items-center gap-1">
                  {t("breakLogs.table.columns.status", "Status")}
                  {getSortIcon('status')}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="bg-[var(--table-bg)]">
            {isFetchingLogs ? (
              <tr>
                <td colSpan={7} className="py-16 px-6 text-center text-[var(--sub-text-color)]">
                  {t("breakLogs.loading", "Loading break logs...")}
                </td>
              </tr>
            ) : fetchError ? (
              <tr>
                <td colSpan={7} className="py-16 px-6">
                  <div className="flex flex-col items-center gap-3 text-[var(--sub-text-color)]">
                    <span>{t("breakLogs.errorLoading", "Failed to load break logs")}</span>
                    {fetchError && (
                      <span className="text-sm text-[var(--sub-text-color)]/80">
                        {fetchError?.data?.errorMessage || fetchError?.error || fetchError?.message || "An error occurred"}
                      </span>
                    )}
                    <button onClick={handleRefresh} className="btn-secondary">
                      {t("breakLogs.retry", "Retry")}
                    </button>
                  </div>
                </td>
              </tr>
            ) : filteredAndSortedData.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-16 px-6">
                  <div className="flex flex-col items-center gap-4 text-[var(--sub-text-color)]">
                    <Users className="h-12 w-12 opacity-60" />
                    <div className="text-lg font-medium text-[var(--text-color)]">
                      {t("breakLogs.emptyTitle", "No break logs yet")}
                    </div>
                    <div className="text-sm text-center max-w-md">
                      {t("breakLogs.emptyDescription", "When employees take breaks, their activity will appear here.")}
                    </div>
                    <button onClick={handleRefresh} className="btn-secondary ">
                      {t("breakLogs.refresh", "Refresh")}
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              currentData.map((log) => (
                <tr key={log.id} className="border-b border-[var(--border-color)] hover:bg-[var(--hover-color)] transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-[var(--container-color)] flex items-center justify-center overflow-hidden flex-shrink-0 border border-[var(--border-color)]">
                        <span className="text-sm font-medium text-[var(--sub-text-color)]">
                          {getInitials(log.name)}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-[var(--text-color)] text-sm">{log.name}</span>
                        <span className="text-xs text-[var(--sub-text-color)]">
                          {log.email || t("breakLogs.noEmail", "No email")}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-gray-500 text-sm">{log.date}</td>
                  <td className="py-4 px-6 text-sm text-[var(--text-color)]">{log.breakType}</td>
                  <td className="py-4 px-6 text-gray-500 text-sm">{log.startTime}</td>
                  <td className="py-4 px-6 text-gray-500 text-sm">{log.endTime}</td>
                  <td className="py-4 px-6 text-gray-500 text-sm font-medium">{log.duration}</td>
                  <td className="py-4 px-6">{getStatusBadge(log.status, log.exceeded)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default BreakLogsTable

