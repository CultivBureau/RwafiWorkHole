"use client"

import { useState, useMemo, useEffect } from "react"
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useGetUserClockinLogsQuery } from "../../services/apis/ClockinLogApi"
import { getAuthToken, getUserInfo } from "../../utils/page"
import { utcToLocalTime, utcToLocalDate, calculateDurationFromUtc, isUtcDateToday } from '../../utils/timeUtils'
import { isWithinShiftRadius } from '../../utils/locationUtils'

const deriveUserId = () => {
  const userInfo = getUserInfo()
  if (userInfo?.id) return userInfo.id
  if (userInfo?.userId) return userInfo.userId
  const msKey = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
  if (userInfo?.[msKey]) return userInfo[msKey]

  const token = getAuthToken()
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]))
      if (payload?.sub) return payload.sub
      if (payload?.nameid) return payload.nameid
      if (payload?.userId) return payload.userId
    } catch {
      return null
    }
  }
  return null
}

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

	useEffect(() => {
		setCurrentPage(1)
	}, [sortBy, location, status, dateFrom, dateTo])

	const userId = useMemo(() => deriveUserId(), [])
	const {
		data,
		isLoading,
		isError,
		error,
		refetch,
	} = useGetUserClockinLogsQuery(
		{ userId, pageNumber: currentPage, pageSize },
		{ skip: !userId }
	)

	const attendanceLogs = useMemo(() => {
		if (!data) return []

		let items = []
		if (Array.isArray(data)) {
			items = data
		} else if (data?.value && Array.isArray(data.value)) {
			items = data.value
		} else if (data?.data && Array.isArray(data.data)) {
			items = data.data
		} else if (data?.items && Array.isArray(data.items)) {
			items = data.items
		} else if (data?.results && Array.isArray(data.results)) {
			items = data.results
		}

		return items.map((log) => {
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
	}, [data, locale])

	const pagination = useMemo(() => {
		const total = data?.totalCount ?? data?.total ?? data?.pagination?.total ?? attendanceLogs.length
		const totalPages =
			data?.totalPages ??
			data?.pagination?.totalPages ??
			(total ? Math.max(1, Math.ceil(total / pageSize)) : (attendanceLogs.length === pageSize ? currentPage + 1 : currentPage))

		return {
			page: currentPage,
			limit: pageSize,
			total,
			totalPages,
		}
	}, [attendanceLogs.length, currentPage, data, pageSize])

	useEffect(() => {
		if (pagination.totalPages && currentPage > pagination.totalPages) {
			setCurrentPage(Math.max(1, pagination.totalPages))
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [pagination.totalPages])

	// Client-side filters (on current page only)
	const filtered = useMemo(() => {
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

					<div className={`text-sm font-medium ${isArabic ? 'text-right' : 'text-left'}`} style={{ color: 'var(--sub-text-color)' }}>
						{t("attendanceTable.showing", { count: filtered.length, total: pagination.total })}
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
						{isLoading ? (
							<tr>
								<td colSpan={9} className="text-center py-8">{t("attendanceTable.loading")}</td>
							</tr>
						) : isError ? (
							<tr>
								<td colSpan={9} className="text-center py-8">
									<div className="flex flex-col items-center gap-2">
										<span>{t("attendanceTable.errorLoading", "Failed to load attendance logs")}</span>
										{error && (
											<span className="text-sm text-[var(--sub-text-color)]">
												{error?.data?.message || error?.message || "An error occurred"}
											</span>
										)}
										<button onClick={() => refetch()} className="btn-secondary">
											{t("attendanceTable.retry", "Retry")}
										</button>
									</div>
								</td>
							</tr>
						) : filtered.length === 0 ? (
							<tr>
								<td colSpan={9} className="text-center py-8">{t("attendanceTable.noData")}</td>
							</tr>
						) : (
							filtered.map((record, index) => (
								<tr
									key={index}
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
					{t("attendanceTable.pageOf", { page: pagination.page, total: pagination.totalPages })}
				</div>
				<div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
					<button
						className="p-2 rounded-lg border transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
						onClick={() => setCurrentPage(Math.max(1, pagination.page - 1))}
						disabled={pagination.page === 1}
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
						onClick={() => setCurrentPage(Math.min(pagination.totalPages, pagination.page + 1))}
						disabled={pagination.page === pagination.totalPages}
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
