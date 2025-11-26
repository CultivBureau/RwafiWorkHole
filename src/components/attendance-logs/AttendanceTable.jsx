"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useLazyGetUserClockinLogsQuery } from "../../services/apis/ClockinLogApi"
import { utcToLocalTime, utcToLocalDate, calculateDurationFromUtc } from '../../utils/timeUtils'
import { isWithinShiftRadius } from '../../utils/locationUtils'
import { deriveUserId } from "../../utils/userHelpers"

const SERVER_PAGE_SIZE = 50
const MAX_PAGES = 40

const formatDate = (iso, locale) => {
  // API returns UTC time, convert to local date for display
  return utcToLocalDate(iso, locale)
}

const formatDay = (iso, locale) => {
  if (!iso) return "—"
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleDateString(locale, { weekday: "long" })
}

const formatTime = (iso, locale) => {
  // API returns UTC time, convert to local time for display
  return utcToLocalTime(iso, locale)
}

const calculateDuration = (startIso, endIso) => {
  // API returns UTC times, calculate duration correctly
  if (!startIso || !endIso) return { label: "0h", minutes: 0 }
  
  const diffSeconds = calculateDurationFromUtc(startIso, endIso)
  if (diffSeconds <= 0) return { label: "0h", minutes: 0 }
  
  const diffMinutes = Math.floor(diffSeconds / 60)
  const hours = Math.floor(diffMinutes / 60)
  const minutes = diffMinutes % 60
  const parts = []
  if (hours > 0) parts.push(`${hours}h`)
  if (minutes > 0) parts.push(`${minutes}m`)
  return { label: parts.length ? parts.join(" ") : "0h", minutes: diffMinutes }
}

const deriveStatus = (log) => {
  if (!log?.clockinTime && !log?.clockoutTime) return "absent"
  if (log?.isLate) return "late"
  return "present"
}

const deriveLocation = (log) => {
  // API uses "office" field: true = office, false = remote/home
  // But we also check distance as a fallback to ensure accuracy
  if (log?.office === true) return "office"
  if (log?.office === false) {
    // Double-check: if clock-in location is within shift radius, it should be office
    const shiftLat = log?.shiftRule?.latitude
    const shiftLng = log?.shiftRule?.longitude
    const radiusMeters = log?.shiftRule?.radiusMeters
    const clockinLocation = log?.clockinLocation
    
    if (clockinLocation && shiftLat && shiftLng && radiusMeters !== undefined) {
      const withinRadius = isWithinShiftRadius(clockinLocation, shiftLat, shiftLng, radiusMeters)
      if (withinRadius) {
        // Location is within radius, so it should be office
        return "office"
      }
    }
    return "home"
  }
  // Fallback to officeRemote for backward compatibility
  if (log?.officeRemote === true) return "office"
  if (log?.officeRemote === false) return "home"
  return "unknown"
}

const extractLogsFromResponse = (response) => {
  if (!response) return []
  if (Array.isArray(response)) return response
  if (Array.isArray(response?.value)) return response.value
  if (Array.isArray(response?.data)) return response.data
  if (Array.isArray(response?.items)) return response.items
  if (Array.isArray(response?.results)) return response.results
  return []
}

const AttendanceTable = () => {
	const { t, i18n } = useTranslation()
	const isArabic = i18n.language === "ar"
	const locale = isArabic ? "ar-EG" : "en-US"

	const [sortBy, setSortBy] = useState("newest")
	const [location, setLocation] = useState("all")
	const [status, setStatus] = useState("all")
	const [dateFrom, setDateFrom] = useState("")
	const [dateTo, setDateTo] = useState("")
	const [currentPage, setCurrentPage] = useState(1)
	const pageSize = 8
	const [rawLogs, setRawLogs] = useState([])
	const [isFetchingLogs, setIsFetchingLogs] = useState(false)
	const [fetchError, setFetchError] = useState(null)
	const [reloadKey, setReloadKey] = useState(0)
	const [fetchLogsTrigger] = useLazyGetUserClockinLogsQuery()

	useEffect(() => {
		setCurrentPage(1)
	}, [sortBy, location, status, dateFrom, dateTo])

	useEffect(() => {
		setCurrentPage(1)
	}, [rawLogs])

	const userId = useMemo(() => deriveUserId(), [])

	useEffect(() => {
		let isCancelled = false
		const fetchAllLogs = async () => {
			if (!userId) {
				setRawLogs([])
				setFetchError(null)
				setIsFetchingLogs(false)
				return
			}

			setIsFetchingLogs(true)
			setFetchError(null)
			const aggregated = []
			let page = 1

			try {
				while (!isCancelled && page <= MAX_PAGES) {
					const response = await fetchLogsTrigger(
						{ userId, pageNumber: page, pageSize: SERVER_PAGE_SIZE },
						true
					).unwrap()

					const pageLogs = extractLogsFromResponse(response)
					aggregated.push(...pageLogs)

					if (pageLogs.length < SERVER_PAGE_SIZE) {
						break
					}
					page += 1
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
	}, [userId, fetchLogsTrigger, reloadKey])

	const attendanceLogs = useMemo(() => {
		if (!rawLogs?.length) return []

		return rawLogs.map((log) => {
			const primaryDateIso = log?.clockinTime || log?.clockoutTime || log?.createdAt || log?.updatedAt
			const dateObj = primaryDateIso ? new Date(primaryDateIso) : null
			const duration = calculateDuration(log?.clockinTime, log?.clockoutTime)
			const statusValue = deriveStatus(log)
			const locationValue = deriveLocation(log)

			return {
				id: log?.id,
				dateIso: primaryDateIso,
				dateSort: dateObj && !Number.isNaN(dateObj.getTime()) ? dateObj : new Date(0),
				dayLabel: formatDay(primaryDateIso, locale),
				checkInIso: log?.clockinTime || null,
				checkOutIso: log?.clockoutTime || null,
				workHoursLabel: duration.label,
				workMinutes: duration.minutes,
				status: statusValue,
				location: locationValue,
				officeName: log?.company?.name || log?.shiftRule?.name || null,
				breakDuration: log?.breakDuration || null,
			}
		})
	}, [rawLogs, locale])

	// Client-side filters (on current page only)
	const filteredRecords = useMemo(() => {
		let result = [...attendanceLogs]

		if (location !== "all") {
			if (location === "office") result = result.filter((r) => r.location === "office")
			if (location === "home") result = result.filter((r) => r.location === "home")
		}
		if (status !== "all") {
			result = result.filter((r) => r.status === status)
		}
		if (dateFrom) {
			const from = new Date(dateFrom)
			result = result.filter((r) => r.dateSort >= from)
		}
		if (dateTo) {
			const to = new Date(dateTo)
			to.setHours(23, 59, 59, 999)
			result = result.filter((r) => r.dateSort <= to)
		}
		// Sort
		result.sort((a, b) =>
			sortBy === "newest"
				? b.dateSort - a.dateSort
				: a.dateSort - b.dateSort
		)
		return result
	}, [attendanceLogs, location, status, dateFrom, dateTo, sortBy])

	const totalRecords = filteredRecords.length
	const totalPages = totalRecords === 0 ? 1 : Math.ceil(totalRecords / pageSize)
	const startIndex = Math.max(0, (currentPage - 1) * pageSize)
	const paginatedRecords = filteredRecords.slice(startIndex, startIndex + pageSize)
	const showingFrom = totalRecords === 0 ? 0 : startIndex + 1
	const showingTo = totalRecords === 0 ? 0 : startIndex + paginatedRecords.length

	useEffect(() => {
		const computedTotalPages = totalRecords === 0 ? 1 : Math.ceil(totalRecords / pageSize)
		if (currentPage > computedTotalPages) {
			setCurrentPage(computedTotalPages)
		}
	}, [currentPage, pageSize, totalRecords])

	const handleRefresh = () => setReloadKey((prev) => prev + 1)

	const getStatusBadge = (value) => {
		switch (value) {
			case "present":
				return (
					<span className="px-3 py-1 rounded-full text-xs font-medium inline-block min-w-[80px] text-center"
						style={{ backgroundColor: 'var(--tag-bg)', color: 'var(--tag-text)' }}>
						{t("attendanceTable.status.present")}
					</span>
				)
			case "absent":
				return (
					<span className="px-3 py-1 rounded-full text-xs font-medium inline-block min-w-[80px] text-center bg-red-100 text-red-700">
						{t("attendanceTable.status.absent")}
					</span>
				)
			case "late":
				return (
					<span className="px-3 py-1 rounded-full text-xs font-medium inline-block min-w-[80px] text-center bg-yellow-100 text-yellow-700">
						{t("attendanceTable.status.late")}
					</span>
				)
			default:
				return (
					<span className="px-3 py-1 rounded-full text-xs font-medium inline-block min-w-[80px] text-center"
						style={{ backgroundColor: 'var(--tag-bg)', color: 'var(--tag-text)' }}>
						{value}
					</span>
				)
		}
	}

	const getLocationBadge = (loc) => {
		if (loc === "office")
			return <span className="px-3 py-1 rounded-full text-xs font-medium inline-block min-w-[80px] text-center bg-blue-100 text-blue-700">{t("attendanceTable.location.office")}</span>
		if (loc === "home")
			return <span className="px-3 py-1 rounded-full text-xs font-medium inline-block min-w-[80px] text-center bg-blue-100 text-blue-700">{t("attendanceTable.location.home")}</span>
		return <span style={{ color: 'var(--sub-text-color)' }} className="text-sm">------</span>
	}

	const SelectField = ({ value, onChange, options, label }) => (
		<div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
			<span className="text-xs font-medium whitespace-nowrap" style={{ color: 'var(--sub-text-color)' }}>
				{label}
			</span>
			<div className="relative">
				<select
					value={value}
					onChange={onChange}
					className="border rounded-full px-3 py-1.5 text-xs appearance-none focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all duration-200 min-w-[100px] font-medium"
					style={{
						borderColor: 'var(--border-color)',
						backgroundColor: 'var(--bg-color)',
						color: 'var(--text-color)',
						focusRingColor: 'var(--accent-color)',
						paddingRight: isArabic ? '12px' : '28px',
						paddingLeft: isArabic ? '28px' : '12px',
						direction: isArabic ? 'rtl' : 'ltr',
						boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
						height: '32px'
					}}
				>
					{options.map((option) => (
						<option key={option.value} value={option.value}>
							{option.label}
						</option>
					))}
				</select>
				<ChevronDown
					className={`absolute top-1/2 transform -translate-y-1/2 w-3 h-3 pointer-events-none ${isArabic ? 'left-2' : 'right-2'
						}`}
					style={{ color: 'var(--sub-text-color)' }}
				/>
			</div>
		</div>
	)

	const DateField = ({ value, onChange, label }) => (
		<div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
			<span className="text-xs font-medium whitespace-nowrap" style={{ color: 'var(--sub-text-color)' }}>
				{label}
			</span>
			<input
				type="date"
				value={value}
				onChange={onChange}
				className="border rounded-full px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all duration-200 min-w-[100px] font-medium date-input"
				style={{
					borderColor: 'var(--border-color)',
					backgroundColor: 'var(--bg-color)',
					color: 'var(--text-color)',
					focusRingColor: 'var(--accent-color)',
					direction: isArabic ? 'rtl' : 'ltr',
					boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
					height: '32px'
				}}
			/>
		</div>
	)

	// دالة لتحويل الوقت من ISO إلى صيغة 12 ساعة
	// Use utcToLocalTime to ensure correct UTC to local time conversion
	const formatTo12Hour = (timeIso) => {
		if (!timeIso) return "—"
		// Use the utcToLocalTime utility which handles UTC conversion correctly
		return formatTime(timeIso, locale)
	}

	// Clock in/out handlers - disabled for static data
	const handleClockIn = async (body) => {
		// Static data - no action needed
	}

	const handleClockOut = async (body) => {
		// Static data - no action needed
	}

	return (
		<div
			className="rounded-xl border shadow-sm"
			style={{
				backgroundColor: 'var(--bg-color)',
				borderColor: 'var(--border-color)'
			}}
			dir={isArabic ? "rtl" : "ltr"}
		>
			{/* Filters */}
			<div
				className="p-6 border-b"
				style={{ borderColor: 'var(--divider-color)' }}
			>
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div className="flex flex-wrap items-center gap-3">
						<SelectField
							value={sortBy}
							onChange={(e) => setSortBy(e.target.value)}
							options={[
								{ value: "newest", label: t("attendanceTable.sort.newestFirst") },
								{ value: "oldest", label: t("attendanceTable.sort.oldestFirst") }
							]}
							label={t("attendanceTable.sortBy")}
						/>

						<SelectField
							value={location}
							onChange={(e) => setLocation(e.target.value)}
							options={[
								{ value: "all", label: t("attendanceTable.location.all") },
								{ value: "office", label: t("attendanceTable.location.office") },
								{ value: "home", label: t("attendanceTable.location.home") }
							]}
							label={t("attendanceTable.location.title")}
						/>

						<SelectField
							value={status}
							onChange={(e) => setStatus(e.target.value)}
							options={[
								{ value: "all", label: t("attendanceTable.status.all") },
								{ value: "present", label: t("attendanceTable.status.present") },
								{ value: "absent", label: t("attendanceTable.status.absent") },
								{ value: "late", label: t("attendanceTable.status.late") }
							]}
							label={t("attendanceTable.status.title")}
						/>

						<DateField
							value={dateFrom}
							onChange={(e) => setDateFrom(e.target.value)}
							label={t("attendanceTable.dateFrom")}
						/>

						<DateField
							value={dateTo}
							onChange={(e) => setDateTo(e.target.value)}
							label={t("attendanceTable.dateTo")}
						/>
					</div>

				</div>
			</div>

			{/* Table */}
			<div className="overflow-x-auto">
				<table className="w-full">
					<thead style={{ backgroundColor: 'var(--table-header-bg)' }}>
						<tr>
							<th className={`px-6 py-4 text-xs font-semibold uppercase tracking-wider ${isArabic ? 'text-right' : 'text-left'}`}
								style={{ color: 'var(--table-header-text)' }}>
								{t("attendanceTable.columns.date")}
							</th>
							<th className={`px-6 py-4 text-xs font-semibold uppercase tracking-wider ${isArabic ? 'text-right' : 'text-left'}`}
								style={{ color: 'var(--table-header-text)' }}>
								{t("attendanceTable.columns.day")}
							</th>
							<th className={`px-6 py-4 text-xs font-semibold uppercase tracking-wider ${isArabic ? 'text-right' : 'text-left'}`}
								style={{ color: 'var(--table-header-text)' }}>
								{t("attendanceTable.columns.checkIn")}
							</th>
							<th className={`px-6 py-4 text-xs font-semibold uppercase tracking-wider ${isArabic ? 'text-right' : 'text-left'}`}
								style={{ color: 'var(--table-header-text)' }}>
								{t("attendanceTable.columns.checkOut")}
							</th>
							<th className={`px-6 py-4 text-xs font-semibold uppercase tracking-wider ${isArabic ? 'text-right' : 'text-left'}`}
								style={{ color: 'var(--table-header-text)' }}>
								{t("attendanceTable.columns.workHours")}
							</th>
							<th className={`px-6 py-4 text-xs font-semibold uppercase tracking-wider ${isArabic ? 'text-right' : 'text-left'}`}
								style={{ color: 'var(--table-header-text)' }}>
								{t("attendanceTable.columns.status")}
							</th>
							<th className={`px-6 py-4 text-xs font-semibold uppercase tracking-wider ${isArabic ? 'text-right' : 'text-left'}`}
								style={{ color: 'var(--table-header-text)' }}>
								{t("attendanceTable.columns.location")}
							</th>
							<th className={`px-6 py-4 text-xs font-semibold uppercase tracking-wider ${isArabic ? 'text-right' : 'text-left'}`}
								style={{ color: 'var(--table-header-text)' }}>
								{t("attendanceTable.columns.office")}
							</th>
							<th className={`px-6 py-4 text-xs font-semibold uppercase tracking-wider ${isArabic ? 'text-right' : 'text-left'}`}
								style={{ color: 'var(--table-header-text)' }}>
								{t("attendanceTable.columns.breakDuration")}
							</th>
						</tr>
					</thead>
					<tbody>
						{isFetchingLogs ? (
							<tr>
								<td colSpan={9} className="text-center py-8">{t("attendanceTable.loading")}</td>
							</tr>
						) : fetchError ? (
							<tr>
								<td colSpan={9} className="text-center py-8">
									<div className="flex flex-col items-center gap-2">
										<span>{t("attendanceTable.errorLoading", "Failed to load attendance logs")}</span>
										{fetchError && (
											<span className="text-sm text-[var(--sub-text-color)]">
												{fetchError?.data?.errorMessage || fetchError?.error || fetchError?.message || "An error occurred"}
											</span>
										)}
										<button onClick={handleRefresh} className="btn-secondary">
											{t("attendanceTable.retry", "Retry")}
										</button>
									</div>
								</td>
							</tr>
						) : paginatedRecords.length === 0 ? (
							<tr>
								<td colSpan={9} className="text-center py-8">{t("attendanceTable.noData")}</td>
							</tr>
						) : (
							paginatedRecords.map((record, index) => (
								<tr
									key={record.id || `${record.dateIso}-${index}`}
									className="transition-colors duration-200 cursor-pointer hover:shadow-sm"
									style={{
										borderBottom: '1px solid var(--table-border)',
										backgroundColor: index % 2 === 0 ? 'var(--table-row-bg)' : 'var(--table-row-alt-bg)'
									}}
									onMouseEnter={(e) => {
										e.currentTarget.style.backgroundColor = 'var(--table-header-bg)';
										e.currentTarget.style.transform = 'translateY(-1px)';
									}}
									onMouseLeave={(e) => {
										e.currentTarget.style.backgroundColor =
											index % 2 === 0 ? 'var(--table-row-bg)' : 'var(--table-row-alt-bg)';
										e.currentTarget.style.transform = 'translateY(0)';
									}}
								>
									<td className={`px-6 py-4 text-sm font-medium ${isArabic ? 'text-right' : 'text-left'}`}
										style={{ color: 'var(--table-text)' }}>
										{formatDate(record.dateIso, locale)}
									</td>
									<td className={`px-6 py-4 text-sm ${isArabic ? 'text-right' : 'text-left'}`}
										style={{ color: 'var(--table-text)' }}>
										{record.dayLabel}
									</td>
									<td className={`px-6 py-4 text-sm ${isArabic ? 'text-right' : 'text-left'}`}
										style={{ color: 'var(--table-text)' }}>
										{formatTo12Hour(record.checkInIso)}
									</td>
									<td className={`px-6 py-4 text-sm ${isArabic ? 'text-right' : 'text-left'}`}
										style={{ color: 'var(--table-text)' }}>
										{formatTo12Hour(record.checkOutIso)}
									</td>
									<td className={`px-6 py-4 text-sm ${isArabic ? 'text-right' : 'text-left'}`}
										style={{ color: 'var(--table-text)' }}>
										{record.workHoursLabel}
									</td>
									<td className={`px-6 py-4 ${isArabic ? 'text-right' : 'text-left'}`}>
										{getStatusBadge(record.status)}
									</td>
									<td className={`px-6 py-4 ${isArabic ? 'text-right' : 'text-left'}`}>
										{getLocationBadge(record.location)}
									</td>
									<td className={`px-6 py-4 text-sm ${isArabic ? 'text-right' : 'text-left'}`}
										style={{ color: 'var(--table-text)' }}>
										{record.officeName || <span style={{ color: 'var(--sub-text-color)' }}>—</span>}
									</td>
									<td className={`px-6 py-4 text-sm ${isArabic ? 'text-right' : 'text-left'}`}
										style={{ color: 'var(--table-text)' }}>
										{record.breakDuration || <span style={{ color: 'var(--sub-text-color)' }}>—</span>}
									</td>
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>

			{/* Pagination */}
			<div
				className={`px-6 py-4 border-t flex items-center justify-between ${isArabic ? 'flex-row-reverse' : ''}`}
				style={{ borderColor: 'var(--divider-color)' }}
			>
				<div className="text-sm font-medium" style={{ color: 'var(--sub-text-color)' }}>
					{t("attendanceTable.pageOf", { page: currentPage, total: totalPages })}
				</div>
				<div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
					<button
						className="p-2 rounded-lg border transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
						onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
						disabled={currentPage === 1 || totalRecords === 0}
						style={{
							borderColor: 'var(--border-color)',
							backgroundColor: 'var(--bg-color)',
							color: 'var(--text-color)'
						}}
					>
						{isArabic ? <ChevronLeft className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
					</button>
					<button
						className="p-2 rounded-lg border transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
						onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
						disabled={currentPage >= totalPages || totalRecords === 0}
						style={{
							borderColor: 'var(--border-color)',
							backgroundColor: 'var(--bg-color)',
							color: 'var(--text-color)'
						}}
					>
						{isArabic ? <ChevronRight className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
					</button>
				</div>
			</div>
		</div>
	)
}

export default AttendanceTable
