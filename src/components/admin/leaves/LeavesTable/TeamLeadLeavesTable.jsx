"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { useLang } from "../../../../contexts/LangContext"
import { ChevronDown, ChevronUp, Calendar, Users, Download } from "lucide-react"
import * as XLSX from "xlsx"
import toast from "react-hot-toast"
import LeavePopUp from "../leavePopUp/LeavePopUp"
import { useGetAllTeamLeadRequestsQuery } from "../../../../services/apis/LeaveApi"
import { useGetAllLeaveTypesQuery } from "../../../../services/apis/LeaveTypeApi"

function normalizeDecision(status) {
	if (!status) return "Pending"
	const lower = status.toLowerCase()
	if (lower.includes("reject")) return "Rejected"
	if (lower.includes("approve") || lower.includes("confirm")) return "Approved"
	if (lower.includes("pending")) return "Pending"
	if (lower.includes("cancel")) return "Cancelled"
	return status
}

const getStatusBadge = (status, t) => {
	const baseClasses =
		"px-3 py-1 rounded-full text-xs font-medium inline-block border"
	const normalized = normalizeDecision(status)
	const statusLower = normalized?.toLowerCase() || ""
	switch (statusLower) {
		case "pending":
			return (
				<span
					className={`${baseClasses} bg-[var(--pending-leave-box-bg)] text-[var(--warning-color)] border-[var(--warning-color)]`}
				>
					{t("adminLeaves.status.pending", "Pending")}
				</span>
			)
		case "rejected":
			return (
				<span
					className={`${baseClasses} bg-[var(--rejected-leave-box-bg)] text-[var(--error-color)] border-[var(--error-color)]`}
				>
					{t("adminLeaves.status.rejected", "Rejected")}
				</span>
			)
		case "approved":
			return (
				<span
					className={`${baseClasses} bg-[var(--approved-leave-box-bg)] text-[var(--success-color)] border-[var(--success-color)]`}
				>
					{t("adminLeaves.status.approved", "Approved")}
				</span>
			)
		case "cancelled":
			return (
				<span
					className={`${baseClasses} bg-gray-100 text-gray-600 border-gray-200`}
				>
					{t("adminLeaves.status.cancelled", "Cancelled")}
				</span>
			)
		default:
			return (
				<span
					className={`${baseClasses} bg-[var(--container-color)] text-[var(--sub-text-color)] border-[var(--border-color)]`}
				>
					{normalized || status || "Unknown"}
				</span>
			)
	}
}

const TeamLeadLeavesTable = () => {
	const { t } = useTranslation()
	const { isRtl } = useLang()
	const { data: leaveTypesData } = useGetAllLeaveTypesQuery({
		pageNumber: 1,
		pageSize: 100,
		status: 0, // Active types only
	})

	// Pagination states
	const [currentPage, setCurrentPage] = useState(1)
	const [pageSize] = useState(10)

	// Filter states
	const [sortBy, setSortBy] = useState("newest")
	const [leaveTypeFilter, setLeaveTypeFilter] = useState("all")
	const [statusFilter, setStatusFilter] = useState("all")
	const [dateFromFilter, setDateFromFilter] = useState("")
	const [dateToFilter, setDateToFilter] = useState("")

	// Table sorting states
	const [tableSortColumn, setTableSortColumn] = useState(null)
	const [tableSortDirection, setTableSortDirection] = useState('asc')

	// Popup / local override states
	const [selectedLeave, setSelectedLeave] = useState(null)
	const [manualUpdates, setManualUpdates] = useState({})

	const leaveTypeOptions = useMemo(() => {
		const raw =
			leaveTypesData?.value ||
			leaveTypesData?.data ||
			leaveTypesData?.items ||
			leaveTypesData?.results ||
			(Array.isArray(leaveTypesData) ? leaveTypesData : [])
		const list = Array.isArray(raw) ? raw : []
		const uniqueNames = Array.from(
			new Set(
				list
					.map((type) => type?.name)
					.filter((name) => typeof name === "string" && name.trim().length > 0)
					.map((name) => name.trim())
			)
		)
		return uniqueNames.sort((a, b) => a.localeCompare(b))
	}, [leaveTypesData])

	// Fetch leave requests from API
	const { data, isLoading, isError, error, refetch } = useGetAllTeamLeadRequestsQuery({
		pageNumber: currentPage,
		pageSize: pageSize,
	})

	// Parse leave requests from API response
	const leaveRequests = useMemo(() => {
		if (!data) return []
		
		// Handle different response structures
		// Response might be: { value: [...], totalCount: X } or just { value: [...] } or direct array
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
		
		// Debug logging (remove in production if needed)
		if (process.env.NODE_ENV === 'development') {
			console.log('TeamLeadLeavesTable - API Response:', { data, itemsCount: items.length })
		}
		
		return items
	}, [data])

	// Format leave request for display
	const formattedLeaves = useMemo(() => {
		return leaveRequests.map(request => {
			const startDate = request.startDate ? new Date(request.startDate) : null
			const endDate = request.endDate ? new Date(request.endDate) : null
			const teamLeadActionDate = request.teamLeadActionDate ? new Date(request.teamLeadActionDate) : null
			const hrActionDate = request.hrActionDate || request.hrConfirmDate ? new Date(request.hrActionDate || request.hrConfirmDate) : null
			const rawStatus = request.requestStatus || "Pending"
			const rawDecision = request.finalDecision || rawStatus
			const normalizedDecision = normalizeDecision(rawDecision)
			
			return {
				id: request.id,
				name: request.employeeName || "Unknown Employee",
				avatar: null, // API doesn't provide avatar
				type: request.leaveType || "Unknown",
				from: startDate ? startDate.toLocaleDateString() : "N/A",
				fromSort: startDate,
				to: endDate ? endDate.toLocaleDateString() : "N/A",
				toSort: endDate,
				days: request.totalDays || 0,
				status: rawStatus,
				finalDecision: normalizedDecision,
				reason: request.reason || "",
				attachmentUrl: request.attachmentUrl,
				// Approver fields
				teamLeadName: request.teamLeadName || request.teamLeadApprover || "",
				teamLeadActionDate: teamLeadActionDate ? teamLeadActionDate.toLocaleDateString() : "",
				teamLeadActionDateSort: teamLeadActionDate,
				teamLeadComment: request.teamLeadComment || "",
				hrApproverName: request.hrApproverName || request.hrApprover || "",
				hrActionDate: hrActionDate ? hrActionDate.toLocaleDateString() : "",
				hrActionDateSort: hrActionDate,
				hrComment: request.hrComment || "",
				// API fields
				employeeName: request.employeeName,
				leaveType: request.leaveType,
				startDate: request.startDate,
				endDate: request.endDate,
				totalDays: request.totalDays,
				requestStatus: request.requestStatus,
			}
		})
	}, [leaveRequests])

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
	const mergedLeaves = useMemo(() => {
		const map = new Map()
		formattedLeaves.forEach((leave) => {
			map.set(leave.id, { ...leave })
		})
		Object.entries(manualUpdates).forEach(([id, update]) => {
			const existing = map.get(id)
			if (existing) {
				map.set(id, { ...existing, ...update })
			} else {
				map.set(id, { ...update })
			}
		})
		return Array.from(map.values())
	}, [formattedLeaves, manualUpdates])

	const filteredAndSortedData = useMemo(() => {
		let filtered = [...mergedLeaves]

		// Apply filters
		if (statusFilter !== "all") {
			filtered = filtered.filter(leave => {
				return normalizeDecision(leave.status)?.toLowerCase() === statusFilter.toLowerCase()
			})
		}

		if (leaveTypeFilter !== "all") {
			filtered = filtered.filter(leave => {
				return leave.type?.toLowerCase() === leaveTypeFilter.toLowerCase()
			})
		}

		// Apply date range filter
		if (dateFromFilter || dateToFilter) {
			filtered = filtered.filter(leave => {
				if (!leave.fromSort) return false
				let isInRange = true

				if (dateFromFilter) {
					const fromDate = new Date(dateFromFilter)
					isInRange = isInRange && leave.fromSort >= fromDate
				}

				if (dateToFilter) {
					const toDate = new Date(dateToFilter)
					toDate.setHours(23, 59, 59, 999)
					isInRange = isInRange && leave.fromSort <= toDate
				}

				return isInRange
			})
		}

		// Apply header sort
		if (sortBy === "newest") {
			filtered.sort((a, b) => (b.fromSort || 0) - (a.fromSort || 0))
		} else if (sortBy === "oldest") {
			filtered.sort((a, b) => (a.fromSort || 0) - (b.fromSort || 0))
		}

		// Apply table column sort
		if (tableSortColumn) {
			filtered.sort((a, b) => {
				let aVal, bVal

				switch (tableSortColumn) {
					case 'name':
						aVal = a.name?.toLowerCase() || ""
						bVal = b.name?.toLowerCase() || ""
						break
					case 'type':
						aVal = a.type?.toLowerCase() || ""
						bVal = b.type?.toLowerCase() || ""
						break
					case 'from':
						aVal = a.fromSort || 0
						bVal = b.fromSort || 0
						break
					case 'to':
						aVal = a.toSort || 0
						bVal = b.toSort || 0
						break
					case 'days':
						aVal = a.days || 0
						bVal = b.days || 0
						break
					case 'status':
						aVal = a.status?.toLowerCase() || ""
						bVal = b.status?.toLowerCase() || ""
						break
					case 'finalDecision':
						aVal = a.finalDecision?.toLowerCase() || ""
						bVal = b.finalDecision?.toLowerCase() || ""
						break
					case 'reason':
						aVal = a.reason?.toLowerCase() || ""
						bVal = b.reason?.toLowerCase() || ""
						break
					case 'teamLeadApprover':
						aVal = a.teamLeadName?.toLowerCase() || ""
						bVal = b.teamLeadName?.toLowerCase() || ""
						break
					case 'hrApprover':
						aVal = a.hrApproverName?.toLowerCase() || ""
						bVal = b.hrApproverName?.toLowerCase() || ""
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
	}, [mergedLeaves, sortBy, leaveTypeFilter, statusFilter, dateFromFilter, dateToFilter, tableSortColumn, tableSortDirection])

	// Reset current page when filters change
	useEffect(() => {
		setCurrentPage(1)
	}, [sortBy, leaveTypeFilter, statusFilter, dateFromFilter, dateToFilter])

	const getSortIcon = (column) => {
		if (tableSortColumn !== column) {
			return <ChevronDown className="h-3 w-3 text-gray-400" />
		}
		return tableSortDirection === 'asc'
			? <ChevronUp className="h-3 w-3 text-[var(--accent-color)]" />
			: <ChevronDown className="h-3 w-3 text-[var(--accent-color)]" />
	}

	// Handle refetch after actions
	const handleRefetch = useCallback(() => {
		refetch()
	}, [refetch])

	// Handle export to Excel
	const handleExportToExcel = () => {
		if (filteredAndSortedData.length === 0) {
			toast.error(
				t("adminLeaves.export.noData", "No data to export"),
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
		const exportData = filteredAndSortedData.map((leave, index) => ({
			"#": index + 1,
			[t("adminLeaves.table.columns.name", "Name")]: leave.name || "—",
			[t("adminLeaves.table.columns.type", "Leave Type")]: leave.type || "—",
			[t("adminLeaves.table.columns.from", "From Date")]: leave.from || "—",
			[t("adminLeaves.table.columns.to", "To Date")]: leave.to || "—",
			[t("adminLeaves.table.columns.days", "Days")]: leave.days || 0,
			[t("adminLeaves.table.columns.status", "Status")]: leave.finalDecision || leave.status || "—",
			[t("adminLeaves.table.columns.reason", "Reason")]: leave.reason || "—",
			[t("adminLeaves.table.columns.teamLead", "Team Lead Approver")]: leave.teamLeadName || "—",
			[t("adminLeaves.table.columns.teamLeadActionDate", "Team Lead Action Date")]: leave.teamLeadActionDate || "—",
			[t("adminLeaves.table.columns.hrApprover", "HR Approver")]: leave.hrApproverName || "—",
			[t("adminLeaves.table.columns.hrActionDate", "HR Action Date")]: leave.hrActionDate || "—",
		}));

		// Create workbook and worksheet
		const ws = XLSX.utils.json_to_sheet(exportData);
		const wb = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(wb, ws, t("adminLeaves.export.sheetName", "Leave Requests"));

		// Auto-size columns
		const wscols = [
			{ wch: 5 },   // #
			{ wch: 25 },  // Name
			{ wch: 20 },  // Leave Type
			{ wch: 12 },  // From Date
			{ wch: 12 },  // To Date
			{ wch: 8 },   // Days
			{ wch: 15 },  // Status
			{ wch: 30 },  // Reason
			{ wch: 25 },  // Team Lead Approver
			{ wch: 18 },  // Team Lead Action Date
			{ wch: 25 },  // HR Approver
			{ wch: 18 },  // HR Action Date
		];
		ws['!cols'] = wscols;

		// Generate filename with current date
		const now = new Date();
		const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
		const filename = `leave_requests_${dateStr}.xlsx`;

		// Export file
		XLSX.writeFile(wb, filename);

		// Show success toast
		toast.success(
			t("adminLeaves.export.success", "Leave requests exported successfully"),
			{
				duration: 3000,
				style: {
					background: '#10B981',
					color: '#fff',
				},
			}
		);
	}

	const handleActionComplete = useCallback((result) => {
		if (!result?.leaveId) {
			handleRefetch()
			setSelectedLeave(null)
			return
		}

		setManualUpdates((prev) => {
			const existing =
				formattedLeaves.find((leave) => leave.id === result.leaveId) ||
				prev[result.leaveId] ||
				selectedLeave

			if (!existing) return prev

			const decision = normalizeDecision(result.newStatus) || existing.finalDecision || existing.status
			const now = new Date()
			const formattedActionDate = result.actionDate || now.toLocaleDateString()

			const updatedLeave = {
				...existing,
				status: decision,
				finalDecision: decision,
				...(result.action === "teamLeadReview"
					? {
							teamLeadComment: result.comment ?? existing.teamLeadComment,
							teamLeadActionDate: formattedActionDate,
							teamLeadActionDateSort: now,
					  }
					: {}),
				...(result.action !== "teamLeadReview"
					? {
							hrComment: result.comment ?? existing.hrComment,
							hrActionDate: formattedActionDate,
							hrActionDateSort: now,
					  }
					: {}),
			}

			return {
				...prev,
				[result.leaveId]: updatedLeave,
			}
		})

		handleRefetch()
		setSelectedLeave(null)
	}, [formattedLeaves, selectedLeave, handleRefetch])

	return (
		<>
			{selectedLeave && (
				<LeavePopUp
					leaveRequest={selectedLeave}
					userRole="teamLead"
					onClose={() => setSelectedLeave(null)}
					onActionComplete={handleActionComplete}
				/>
			)}
			<div className="bg-[var(--bg-color)] rounded-lg border border-[var(--border-color)]">
				{/* Header with filters */}
				<div className="px-6 py-4 border-b flex justify-center items-center bg-[var(--bg-color)]">
					<div className="flex bg-[var(--bg-color)] p-4 w-[98%] h-max shadow-xl rounded-3xl border border-[var(--border-color)] flex-wrap items-center gap-4 justify-between">
						<div className="flex flex-wrap items-center gap-4">
							<div className="flex items-center gap-2">
								<span className="text-[10px] font-medium text-[var(--sub-text-color)]">
									{t("adminLeaves.table.sortBy", "Sort By")}
								</span>
								<select
									value={sortBy}
									onChange={(e) => setSortBy(e.target.value)}
									className="h-8 px-3 border border-[var(--border-color)] rounded-md text-[10px] bg-[var(--bg-color)] text-[var(--text-color)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-color)] focus:border-[var(--accent-color)]"
								>
									<option value="newest">
										{t("adminLeaves.table.sort.newest", "Newest First")}
									</option>
									<option value="oldest">
										{t("adminLeaves.table.sort.oldest", "Oldest First")}
									</option>
								</select>
							</div>

							<div className="flex items-center gap-2">
								<span className="text-[10px] font-medium text-[var(--sub-text-color)]">
									{t("adminLeaves.table.leaveType.label", "Leave Type")}
								</span>
								<select
									value={leaveTypeFilter}
									onChange={(e) => setLeaveTypeFilter(e.target.value)}
									className="h-8 px-3 border border-[var(--border-color)] rounded-md text-[10px] bg-[var(--bg-color)] text-[var(--text-color)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-color)] focus:border-[var(--accent-color)]"
								>
									<option value="all">
										{t("adminLeaves.table.leaveType.all", "All Types")}
									</option>
									{leaveTypeOptions.map((type) => (
										<option key={type} value={type}>
											{type}
										</option>
									))}
								</select>
							</div>

							<div className="flex items-center gap-2">
								<span className="text-[10px] font-medium text-[var(--sub-text-color)]">
									{t("adminLeaves.table.status.label", "Status")}
								</span>
								<select
									value={statusFilter}
									onChange={(e) => setStatusFilter(e.target.value)}
									className="h-8 px-3 border border-[var(--border-color)] rounded-md text-[10px] bg-[var(--bg-color)] text-[var(--text-color)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-color)] focus:border-[var(--accent-color)]"
								>
									<option value="all">
										{t("adminLeaves.table.status.all", "All Status")}
									</option>
									<option value="approved">
										{t("adminLeaves.table.status.approved", "Approved")}
									</option>
									<option value="rejected">
										{t("adminLeaves.table.status.rejected", "Rejected")}
									</option>
									<option value="pending">
										{t("adminLeaves.table.status.pending", "Pending")}
									</option>
									<option value="cancelled">
										{t("adminLeaves.table.status.cancelled", "Cancelled")}
									</option>
								</select>
							</div>

							<div className="flex items-center gap-2">
								<span className="text-[10px] font-medium text-[var(--sub-text-color)]">
									{t("adminLeaves.table.dateFrom", "Date from")}
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
									{t("adminLeaves.table.dateTo", "Date To")}
								</span>
								<input
									type="date"
									value={dateToFilter}
									onChange={(e) => setDateToFilter(e.target.value)}
									className="h-8 px-3 border border-[var(--border-color)] rounded-md text-[10px] bg-[var(--bg-color)] text-[var(--text-color)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-color)] focus:border-[var(--accent-color)]"
									placeholder="Select end date"
									min={dateFromFilter}
								/>
							</div>
						</div>

						<div className={`flex items-center gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
							<button
								type="button"
								onClick={handleExportToExcel}
								disabled={isLoading || filteredAndSortedData.length === 0}
								className="px-3 py-1.5 rounded-full border text-[10px] font-semibold transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 hover:bg-[var(--hover-color)] cursor-pointer"
								style={{
									borderColor: 'var(--accent-color)',
									backgroundColor: 'var(--bg-color)',
									color: 'var(--accent-color)',
								}}
							>
								<Download className="w-3.5 h-3.5" />
								{t("adminLeaves.export.button", "Export to Excel")}
							</button>
							<div className={`flex items-center gap-1 ${isRtl ? 'flex-row-reverse' : ''}`}>
								<button
									onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
									disabled={currentPage === 1 || isLoading}
									className="h-8 w-8 border border-[var(--border-color)] rounded-md bg-[var(--bg-color)] hover:bg-[var(--hover-color)] flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
								>
									<svg className="h-4 w-4 text-[var(--sub-text-color)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isRtl ? "M15 19l-7-7 7-7" : "M15 19l-7-7 7-7"} />
									</svg>
								</button>
								<button
									onClick={() => setCurrentPage(currentPage + 1)}
									disabled={isLoading || filteredAndSortedData.length < pageSize}
									className="h-8 w-8 border border-[var(--border-color)] rounded-md bg-[var(--bg-color)] hover:bg-[var(--hover-color)] flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
								>
									<svg className="h-4 w-4 text-[var(--sub-text-color)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isRtl ? "M9 5l7 7-7 7" : "M9 5l7 7-7 7"} />
									</svg>
								</button>
							</div>
						</div>
					</div>
				</div>

				{/* Table */}
				<div className="overflow-x-auto">
					{isLoading ? (
						<div className="py-12 px-6 text-center">
							<div className="text-[var(--sub-text-color)]">
								{t("adminLeaves.loading", "Loading leave requests...")}
							</div>
						</div>
					) : isError ? (
						<div className="py-12 px-6 text-center">
							<div className="text-[var(--error-color)] mb-4">
								{t("adminLeaves.error", "Failed to load leave requests")}
							</div>
							{error && (
								<div className="text-sm text-[var(--sub-text-color)] mb-4">
									{error?.data?.message || error?.message || "An error occurred"}
								</div>
							)}
							<button
								onClick={() => refetch()}
								className="btn-secondary"
							>
								{t("adminLeaves.retry", "Retry")}
							</button>
						</div>
					) : filteredAndSortedData.length === 0 ? (
						<div className="py-16 px-6 text-center">
							<Users className="h-16 w-16 text-[var(--sub-text-color)] mx-auto mb-4 opacity-50" />
							<p className="text-lg font-medium text-[var(--text-color)] mb-2">
								{t("adminLeaves.empty.title", "No Team Leave Requests")}
							</p>
							<p className="text-sm text-[var(--sub-text-color)]">
								{t("adminLeaves.empty.teamLead", "No leave requests from your team members yet.")}
							</p>
						</div>
					) : (
						<table className="w-full">
							<thead className="bg-[var(--table-header-bg)]">
								<tr>
									<th
										onClick={() => handleTableSort('name')}
										className="text-left py-3 px-6 text-sm font-medium text-[var(--sub-text-color)] border-b border-[var(--border-color)] cursor-pointer hover:bg-[var(--hover-color)] transition-colors"
									>
										<div className="flex items-center gap-1">
											{t("adminLeaves.table.columns.name", "Name")}
											{getSortIcon('name')}
										</div>
									</th>
									<th
										onClick={() => handleTableSort('type')}
										className="text-left py-3 px-6 text-sm font-medium text-[var(--sub-text-color)] border-b border-[var(--border-color)] cursor-pointer hover:bg-[var(--hover-color)] transition-colors"
									>
										<div className="flex items-center gap-1">
											{t("adminLeaves.table.columns.leaveType", "Leave Type")}
											{getSortIcon('type')}
										</div>
									</th>
									<th
										onClick={() => handleTableSort('from')}
										className="text-left py-3 px-6 text-sm font-medium text-[var(--sub-text-color)] border-b border-[var(--border-color)] cursor-pointer hover:bg-[var(--hover-color)] transition-colors"
									>
										<div className="flex items-center gap-1">
											{t("adminLeaves.table.columns.from", "From")}
											{getSortIcon('from')}
										</div>
									</th>
									<th
										onClick={() => handleTableSort('to')}
										className="text-left py-3 px-6 text-sm font-medium text-[var(--sub-text-color)] border-b border-[var(--border-color)] cursor-pointer hover:bg-[var(--hover-color)] transition-colors"
									>
										<div className="flex items-center gap-1">
											{t("adminLeaves.table.columns.to", "To")}
											{getSortIcon('to')}
										</div>
									</th>
									<th
										onClick={() => handleTableSort('days')}
										className="text-left py-3 px-6 text-sm font-medium text-[var(--sub-text-color)] border-b border-[var(--border-color)] cursor-pointer hover:bg-[var(--hover-color)] transition-colors"
									>
										<div className="flex items-center gap-1">
											{t("adminLeaves.table.columns.days", "Days")}
											{getSortIcon('days')}
										</div>
									</th>
									<th
										onClick={() => handleTableSort('status')}
										className="text-left py-3 px-6 text-sm font-medium text-[var(--sub-text-color)] border-b border-[var(--border-color)] cursor-pointer hover:bg-[var(--hover-color)] transition-colors"
									>
										<div className="flex items-center gap-1">
											{t("adminLeaves.table.columns.status", "Status")}
											{getSortIcon('status')}
										</div>
									</th>
								<th
									onClick={() => handleTableSort('finalDecision')}
									className="text-left py-3 px-6 text-sm font-medium text-[var(--sub-text-color)] border-b border-[var(--border-color)] cursor-pointer hover:bg-[var(--hover-color)] transition-colors"
								>
									<div className="flex items-center gap-1">
										{t("adminLeaves.table.columns.finalDecision", "Final Decision")}
										{getSortIcon('finalDecision')}
									</div>
								</th>
									<th
										onClick={() => handleTableSort('reason')}
										className="text-left py-3 px-6 text-sm font-medium text-[var(--sub-text-color)] border-b border-[var(--border-color)] cursor-pointer hover:bg-[var(--hover-color)] transition-colors"
									>
										<div className="flex items-center gap-1">
											{t("adminLeaves.table.columns.reason", "Reason")}
											{getSortIcon('reason')}
										</div>
									</th>
									<th
										onClick={() => handleTableSort('teamLeadApprover')}
										className="text-left py-3 px-6 text-sm font-medium text-[var(--sub-text-color)] border-b border-[var(--border-color)] cursor-pointer hover:bg-[var(--hover-color)] transition-colors"
									>
										<div className="flex items-center gap-1">
											{t("adminLeaves.table.columns.teamLeadApprover", "Team Lead Approver")}
											{getSortIcon('teamLeadApprover')}
										</div>
									</th>
									<th
										onClick={() => handleTableSort('hrApprover')}
										className="text-left py-3 px-6 text-sm font-medium text-[var(--sub-text-color)] border-b border-[var(--border-color)] cursor-pointer hover:bg-[var(--hover-color)] transition-colors"
									>
										<div className="flex items-center gap-1">
											{t("adminLeaves.table.columns.hrApprover", "HR Approver")}
											{getSortIcon('hrApprover')}
										</div>
									</th>
									<th className="text-left py-3 px-6 text-sm font-medium text-[var(--sub-text-color)] border-b border-[var(--border-color)]">
										{t("adminLeaves.table.columns.action", "Action")}
									</th>
								</tr>
							</thead>
							<tbody className="bg-[var(--table-bg)]">
								{filteredAndSortedData.map((leave) => (
									<tr
										key={leave.id}
										className="border-b border-[var(--border-color)] hover:bg-[var(--hover-color)] transition-colors"
									>
										<td className="py-4 px-6">
											<div className="flex items-center gap-3">
												<div className="h-10 w-10 rounded-full bg-[var(--container-color)] flex items-center justify-center overflow-hidden flex-shrink-0 border border-[var(--border-color)]">
													{leave.avatar ? (
														<img
															src={leave.avatar}
															alt={leave.name}
															className="h-full w-full object-cover"
														/>
													) : (
														<span className="text-sm font-medium text-[var(--sub-text-color)]">
															{leave.name.split(" ").map((n) => n[0]).join("").substring(0, 2)}
														</span>
													)}
												</div>
												<span className="font-medium text-[var(--text-color)] text-sm">
													{leave.name}
												</span>
											</div>
										</td>
										<td className="py-4 px-6 text-[var(--text-color)] text-sm">
											{leave.type}
										</td>
										<td className="py-4 px-6 text-[var(--text-color)] text-sm">
											{leave.from}
										</td>
										<td className="py-4 px-6 text-[var(--text-color)] text-sm">
											{leave.to}
										</td>
										<td className="py-4 px-6 text-[var(--text-color)] text-sm">
											{leave.days}
										</td>
										<td className="py-4 px-6">
											{getStatusBadge(leave.status, t)}
										</td>
										<td className="py-4 px-6">
											{getStatusBadge(leave.finalDecision, t)}
										</td>
										<td className="py-4 px-6 text-[var(--text-color)] text-sm">
											{leave.reason || "-"}
										</td>
										<td className="py-4 px-6 text-[var(--text-color)] text-sm">
											<div>
												<div className="font-medium">{leave.teamLeadName || "-"}</div>
												{leave.teamLeadActionDate && (
													<div className="text-xs text-[var(--sub-text-color)]">
														{leave.teamLeadActionDate}
													</div>
												)}
											</div>
										</td>
										<td className="py-4 px-6 text-[var(--text-color)] text-sm">
											<div>
												<div className="font-medium">{leave.hrApproverName || "-"}</div>
												{leave.hrActionDate && (
													<div className="text-xs text-[var(--sub-text-color)]">
														{leave.hrActionDate}
													</div>
												)}
											</div>
										</td>
										<td className="py-4 px-6">
											{normalizeDecision(leave.status)?.toLowerCase() === "pending" &&
											normalizeDecision(leave.finalDecision)?.toLowerCase() !== "cancelled" ? (
												<button
													className="h-8 w-8 flex items-center justify-center rounded-full bg-[var(--container-color)] border border-[var(--border-color)] hover:bg-[var(--hover-color)] transition-colors"
													onClick={() => setSelectedLeave(leave)}
												>
													<svg
														className="h-5 w-5 text-[var(--accent-color)]"
														fill="none"
														stroke="currentColor"
														viewBox="0 0 24 24"
													>
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															strokeWidth={2}
															d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
														/>
														<path
															strokeLinecap="round"
															strokeLinejoin="round"
															strokeWidth={2}
															d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
														/>
													</svg>
												</button>
											) : (
												<span className="text-xs text-[var(--sub-text-color)]">—</span>
											)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					)}
				</div>
			</div>
		</>
	)
}

export default TeamLeadLeavesTable

