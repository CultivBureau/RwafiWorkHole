"use client"

import { useState, useMemo, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useLang } from "../../../../contexts/LangContext"
import { ChevronDown, ChevronUp, Calendar } from "lucide-react"
import LeavePopUp from "../leavePopUp/LeavePopUp"
import { useGetAllHrRequestsQuery } from "../../../../services/apis/LeaveApi"

const getStatusBadge = (status, t) => {
	const baseClasses =
		"px-3 py-1 rounded-full text-xs font-medium inline-block border"
	const statusLower = status?.toLowerCase() || ""
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
		case "confirmed":
			return (
				<span
					className={`${baseClasses} bg-[var(--approved-leave-box-bg)] text-[var(--success-color)] border-[var(--success-color)]`}
				>
					{t("adminLeaves.status.confirmed", "Confirmed")}
				</span>
			)
		default:
			return (
				<span
					className={`${baseClasses} bg-[var(--container-color)] text-[var(--sub-text-color)] border-[var(--border-color)]`}
				>
					{status || "Unknown"}
				</span>
			)
	}
}

const HrLeavesTable = () => {
	const { t } = useTranslation()
	const { isRtl } = useLang()

	// Pagination states
	const [currentPage, setCurrentPage] = useState(1)
	const [pageSize] = useState(100) // Increased to show more items per page

	// Filter states
	const [sortBy, setSortBy] = useState("newest")
	const [leaveTypeFilter, setLeaveTypeFilter] = useState("all")
	const [statusFilter, setStatusFilter] = useState("all")
	const [dateFromFilter, setDateFromFilter] = useState("")
	const [dateToFilter, setDateToFilter] = useState("")

	// Table sorting states
	const [tableSortColumn, setTableSortColumn] = useState(null)
	const [tableSortDirection, setTableSortDirection] = useState('asc')

	// Popup state
	const [selectedLeave, setSelectedLeave] = useState(null)

	// Fetch leave requests from API (only approved requests)
	const { data, isLoading, isError, refetch } = useGetAllHrRequestsQuery({
		pageNumber: currentPage,
		pageSize: pageSize,
	})

	// Parse leave requests from API response
	const leaveRequests = useMemo(() => {
		if (!data) return []
		const items = data?.value || data?.data || data?.items || data || []
		const parsed = Array.isArray(items) ? items : []
		// Debug: Log to verify data is being received
		if (process.env.NODE_ENV === 'development') {
			console.log('HrLeavesTable - API Response:', { 
				data, 
				itemsCount: parsed.length,
				sampleItem: parsed[0] 
			})
		}
		return parsed
	}, [data])

	// Format leave request for display
	// HR can see ALL leave requests in the company (no filtering)
	// HR can only take action (confirm/reject) on requests with status "TeamLeadApproved"
	// For all other statuses, HR can only view the request details
	const formattedLeaves = useMemo(() => {
		// Show ALL requests from the API - no filtering
		const formatted = leaveRequests.map(request => {
			const startDate = request.startDate ? new Date(request.startDate) : null
			const endDate = request.endDate ? new Date(request.endDate) : null
			
			// Get team lead approval information from teamLeadApprovals array
			const teamLeadApprovals = request.teamLeadApprovals || []
			const approvedTeamLeads = teamLeadApprovals.filter(
				approval => approval.status === "TeamLeadApproved" || 
				           (approval.status || "").toLowerCase().includes("teamleadapproved")
			)
			
			// Get the most recent team lead approval (latest timestamp)
			const latestTeamLeadApproval = approvedTeamLeads.length > 0
				? approvedTeamLeads.reduce((latest, current) => {
						const currentTime = new Date(current.timestamp || 0).getTime()
						const latestTime = new Date(latest.timestamp || 0).getTime()
						return currentTime > latestTime ? current : latest
					}, approvedTeamLeads[0])
				: null
			
			const teamLeadActionDate = latestTeamLeadApproval?.timestamp 
				? new Date(latestTeamLeadApproval.timestamp) 
				: (request.teamLeadActionDate ? new Date(request.teamLeadActionDate) : null)
			
			const hrActionDate = request.hrActionDate ? new Date(request.hrActionDate) : null
			
			// Get team lead name from the latest approval or fallback to old fields
			const teamLeadName = latestTeamLeadApproval?.teamLeadName || 
			                    request.teamLeadName || 
			                    request.teamLeadApprover || 
			                    ""
			
			// Get team lead comment from the latest approval or fallback
			const teamLeadComment = latestTeamLeadApproval?.comment || 
			                       request.teamLeadComment || 
			                       ""
			
			return {
				id: request.id,
				name: request.employeeName || "Unknown Employee",
				avatar: null,
				type: request.leaveType || "Unknown",
				from: startDate ? startDate.toLocaleDateString() : "N/A",
				fromSort: startDate,
				to: endDate ? endDate.toLocaleDateString() : "N/A",
				toSort: endDate,
				days: request.totalDays || 0,
				status: request.requestStatus || "Approved",
				reason: request.reason || "",
				attachmentUrl: request.attachmentUrl || (request.attachments && request.attachments.length > 0 ? request.attachments[0] : null),
				// Team Lead Approver fields
				teamLeadName: teamLeadName,
				teamLeadComment: teamLeadComment,
				teamLeadActionDate: teamLeadActionDate ? teamLeadActionDate.toLocaleDateString() : "",
				teamLeadActionDateSort: teamLeadActionDate,
				// HR Approver fields
				hrApproverName: request.hrName || request.hrApproverName || request.hrApprover || "",
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
				// Store full teamLeadApprovals array for reference
				teamLeadApprovals: teamLeadApprovals,
			}
		})
		
		// Debug: Log formatted leaves to verify data
		if (process.env.NODE_ENV === 'development') {
			console.log('HrLeavesTable - Formatted Leaves:', { 
				count: formatted.length,
				statuses: formatted.map(l => ({ id: l.id, name: l.name, status: l.status })),
				teamLeadApproved: formatted.filter(l => l.status === "TeamLeadApproved" || l.status?.toLowerCase().includes("teamleadapproved"))
			})
		}
		
		return formatted
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
	const filteredAndSortedData = useMemo(() => {
		let filtered = [...formattedLeaves]

		// Apply filters
		if (statusFilter !== "all") {
			filtered = filtered.filter(leave => {
				const status = leave.status?.toLowerCase() || ""
				const isConfirmed = status.includes("confirmed") || 
				                   status === "confirmed" ||
				                   leave.hrActionDate || 
				                   leave.hrApproverName
				const isRejected = status.includes("rejected") || 
				                  status === "rejected"
				
				if (statusFilter === "approved") {
					// Show approved by team lead but NOT yet confirmed by HR
					return !isConfirmed && !isRejected && (status.includes("approved") || status === "approved")
				} else if (statusFilter === "confirmed") {
					// Show confirmed by both team lead and HR
					return isConfirmed
				} else if (statusFilter === "rejected") {
					// Show rejected
					return isRejected
				}
				
				// Fallback to exact match for other statuses
				return status === statusFilter.toLowerCase()
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
					case 'reason':
						aVal = a.reason?.toLowerCase() || ""
						bVal = b.reason?.toLowerCase() || ""
						break
					case 'teamLead':
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
	}, [formattedLeaves, sortBy, leaveTypeFilter, statusFilter, dateFromFilter, dateToFilter, tableSortColumn, tableSortDirection])

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
	const handleRefetch = () => {
		refetch()
	}

	return (
		<>
			{selectedLeave && (
				<LeavePopUp
					leaveRequest={selectedLeave}
					userRole="hr"
					onClose={() => setSelectedLeave(null)}
					onActionComplete={handleRefetch}
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
									<option value="annual">
										{t("adminLeaves.table.leaveType.annual", "Annual")}
									</option>
									<option value="sick">
										{t("adminLeaves.table.leaveType.sick", "Sick")}
									</option>
									<option value="emergency">
										{t("adminLeaves.table.leaveType.emergency", "Emergency")}
									</option>
									<option value="unpaid">
										{t("adminLeaves.table.leaveType.unpaid", "Unpaid")}
									</option>
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
										{t("adminLeaves.table.status.approvedFromTeamLead", "Approved from Team Lead")}
									</option>
									<option value="confirmed">
										{t("adminLeaves.table.status.confirmed", "Confirmed")}
									</option>
									<option value="rejected">
										{t("adminLeaves.table.status.rejected", "Rejected")}
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
							<button
								onClick={() => refetch()}
								className="btn-secondary"
							>
								{t("adminLeaves.retry", "Retry")}
							</button>
						</div>
					) : filteredAndSortedData.length === 0 ? (
						<div className="py-16 px-6 text-center">
							<Calendar className="h-16 w-16 text-[var(--sub-text-color)] mx-auto mb-4 opacity-50" />
							<p className="text-lg font-medium text-[var(--text-color)] mb-2">
								{t("adminLeaves.empty.hr.title", "No Approved Leave Requests")}
							</p>
							<p className="text-sm text-[var(--sub-text-color)] mb-1">
								{t("adminLeaves.empty.hr.message", "No approved leave requests found.")}
							</p>
							<p className="text-xs text-[var(--sub-text-color)]">
								{t("adminLeaves.empty.hr.subtitle", "Waiting for team leader approval.")}
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
										onClick={() => handleTableSort('reason')}
										className="text-left py-3 px-6 text-sm font-medium text-[var(--sub-text-color)] border-b border-[var(--border-color)] cursor-pointer hover:bg-[var(--hover-color)] transition-colors"
									>
										<div className="flex items-center gap-1">
											{t("adminLeaves.table.columns.reason", "Reason")}
											{getSortIcon('reason')}
										</div>
									</th>
									<th
										onClick={() => handleTableSort('teamLead')}
										className="text-left py-3 px-6 text-sm font-medium text-[var(--sub-text-color)] border-b border-[var(--border-color)] cursor-pointer hover:bg-[var(--hover-color)] transition-colors"
									>
										<div className="flex items-center gap-1">
											{t("adminLeaves.table.columns.teamLeadApprover", "Team Lead Approver")}
											{getSortIcon('teamLead')}
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

export default HrLeavesTable

