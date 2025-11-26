"use client"

import { useState, useMemo, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useLang } from "../../../../contexts/LangContext"
import { ChevronDown, ChevronUp, Calendar } from "lucide-react"
import LeavePopUp from "../leavePopUp/LeavePopUp"

// Sample leave request data with enhanced fields for sorting
const leaveData = [
	{
		id: 1,
		name: "Darlene Robertson",
		avatar: "/assets/AdminDashboard/avatar.svg",
		type: "Annual",
		from: "31 Dec 2024",
		fromSort: new Date("2024-12-31"),
		to: "10 Jan 2025",
		toSort: new Date("2025-01-10"),
		days: 1,
		status: "Pending",
		reason: "Travelling to village",
		approver: "--------",
	},
	{
		id: 2,
		name: "Cody Fisher",
		avatar: "/assets/AdminDashboard/avatar.svg",
		type: "Sick",
		from: "31 Dec 2024",
		fromSort: new Date("2024-12-31"),
		to: "31 Dec 2024",
		toSort: new Date("2024-12-31"),
		days: 2,
		status: "Rejected",
		reason: "Sorry.! I can't approve",
		approver: "Avinash",
		comment: "Get well soon!",
	},
	{
		id: 3,
		name: "Savannah Nguyen",
		avatar: "/assets/AdminDashboard/avatar.svg",
		type: "Emergency",
		from: "25 Dec 2024",
		fromSort: new Date("2024-12-25"),
		to: "25 Dec 2024",
		toSort: new Date("2024-12-25"),
		days: 1,
		status: "Pending",
		reason: "Travelling to village",
		approver: "--------",
	},
	{
		id: 4,
		name: "Marvin McKinney",
		avatar: "/assets/AdminDashboard/avatar.svg",
		type: "Unpaid",
		from: "10 Dec 2024",
		fromSort: new Date("2024-12-10"),
		to: "13 Dec 2024",
		toSort: new Date("2024-12-13"),
		days: 3,
		status: "Pending",
		reason: "Travelling to village",
		approver: "--------",
	},
	{
		id: 5,
		name: "Jacob Jones",
		avatar: "/assets/AdminDashboard/avatar.svg",
		type: "Annual",
		from: "8 Nov 2024",
		fromSort: new Date("2024-11-08"),
		to: "13 Nov 2024",
		toSort: new Date("2024-11-13"),
		days: 5,
		status: "Pending",
		reason: "Travelling to village",
		approver: "--------",
	},
	{
		id: 6,
		name: "Kristin Watson",
		avatar: "/assets/AdminDashboard/avatar.svg",
		type: "Annual",
		from: "8 Nov 2024",
		fromSort: new Date("2024-11-08"),
		to: "13 Nov 2024",
		toSort: new Date("2024-11-13"),
		days: 5,
		status: "Approved",
		reason: "Travelling to village",
		approver: "Avinash",
		comment: "Enjoy your vacation!",
	},
	{
		id: 7,
		name: "Devon Lane",
		avatar: "/assets/AdminDashboard/avatar.svg",
		type: "Sick",
		from: "5 Nov 2024",
		fromSort: new Date("2024-11-05"),
		to: "7 Nov 2024",
		toSort: new Date("2024-11-07"),
		days: 3,
		status: "Approved",
		reason: "Medical treatment",
		approver: "Avinash",
		comment: "Take care!",
	},
	{
		id: 8,
		name: "Arlene McCoy",
		avatar: "/assets/AdminDashboard/avatar.svg",
		type: "Emergency",
		from: "1 Nov 2024",
		fromSort: new Date("2024-11-01"),
		to: "2 Nov 2024",
		toSort: new Date("2024-11-02"),
		days: 2,
		status: "Approved",
		reason: "Family emergency",
		approver: "Avinash",
		comment: "Hope everything is okay",
	},
	{
		id: 9,
		name: "Eleanor Pena",
		avatar: "/assets/AdminDashboard/avatar.svg",
		type: "Annual",
		from: "25 Oct 2024",
		fromSort: new Date("2024-10-25"),
		to: "30 Oct 2024",
		toSort: new Date("2024-10-30"),
		days: 6,
		status: "Approved",
		reason: "Vacation with family",
		approver: "Avinash",
		comment: "Have a great time!",
	},
	{
		id: 10,
		name: "Cameron Williamson",
		avatar: "/assets/AdminDashboard/avatar.svg",
		type: "Unpaid",
		from: "20 Oct 2024",
		fromSort: new Date("2024-10-20"),
		to: "22 Oct 2024",
		toSort: new Date("2024-10-22"),
		days: 3,
		status: "Rejected",
		reason: "Personal reasons",
		approver: "Avinash",
		comment: "Cannot approve at this time",
	},
]

const getStatusBadge = (status, t) => {
	const baseClasses =
		"px-3 py-1 rounded-full text-xs font-medium inline-block border"
	switch (status) {
		case "Pending":
			return (
				<span
					className={`${baseClasses} bg-[var(--pending-leave-box-bg)] text-[var(--warning-color)] border-[var(--warning-color)]`}
				>
					{t("adminLeaves.status.pending", "Pending")}
				</span>
			)
		case "Rejected":
			return (
				<span
					className={`${baseClasses} bg-[var(--rejected-leave-box-bg)] text-[var(--error-color)] border-[var(--error-color)]`}
				>
					{t("adminLeaves.status.rejected", "Rejected")}
				</span>
			)
		case "Approved":
			return (
				<span
					className={`${baseClasses} bg-[var(--approved-leave-box-bg)] text-[var(--success-color)] border-[var(--success-color)]`}
				>
					{t("adminLeaves.status.approved", "Approved")}
				</span>
			)
		default:
			return (
				<span
					className={`${baseClasses} bg-[var(--container-color)] text-[var(--sub-text-color)] border-[var(--border-color)]`}
				>
					{status}
				</span>
			)
	}
}

const LeavesTable = () => {
	const { t } = useTranslation()
	const { isRtl } = useLang()

	// Filter states
	const [sortBy, setSortBy] = useState("newest")
	const [leaveTypeFilter, setLeaveTypeFilter] = useState("all")
	const [statusFilter, setStatusFilter] = useState("all")
	const [dateFromFilter, setDateFromFilter] = useState("")
	const [dateToFilter, setDateToFilter] = useState("")

	// Table sorting states
	const [tableSortColumn, setTableSortColumn] = useState(null)
	const [tableSortDirection, setTableSortDirection] = useState('asc')

	// Pagination states
	const [currentPage, setCurrentPage] = useState(1)
	const itemsPerPage = 10

	// Popup state
	const [selectedLeave, setSelectedLeave] = useState(null)

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
		let filtered = [...leaveData]

		// Apply filters
		if (statusFilter !== "all") {
			filtered = filtered.filter(leave => {
				return leave.status.toLowerCase() === statusFilter.toLowerCase()
			})
		}

		if (leaveTypeFilter !== "all") {
			filtered = filtered.filter(leave => {
				return leave.type.toLowerCase() === leaveTypeFilter.toLowerCase()
			})
		}

		// Apply date range filter (using 'from' date for filtering)
		if (dateFromFilter || dateToFilter) {
			filtered = filtered.filter(leave => {
				const leaveDate = leave.fromSort
				let isInRange = true

				if (dateFromFilter) {
					const fromDate = new Date(dateFromFilter)
					isInRange = isInRange && leaveDate >= fromDate
				}

				if (dateToFilter) {
					const toDate = new Date(dateToFilter)
					// Set to end of day for inclusive comparison
					toDate.setHours(23, 59, 59, 999)
					isInRange = isInRange && leaveDate <= toDate
				}

				return isInRange
			})
		}

		// Apply header sort
		if (sortBy === "newest") {
			filtered.sort((a, b) => b.fromSort - a.fromSort)
		} else if (sortBy === "oldest") {
			filtered.sort((a, b) => a.fromSort - b.fromSort)
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
					case 'type':
						aVal = a.type.toLowerCase()
						bVal = b.type.toLowerCase()
						break
					case 'from':
						aVal = a.fromSort
						bVal = b.fromSort
						break
					case 'to':
						aVal = a.toSort
						bVal = b.toSort
						break
					case 'days':
						aVal = a.days
						bVal = b.days
						break
					case 'status':
						aVal = a.status.toLowerCase()
						bVal = b.status.toLowerCase()
						break
					case 'reason':
						aVal = a.reason.toLowerCase()
						bVal = b.reason.toLowerCase()
						break
					case 'approver':
						aVal = a.approver.toLowerCase()
						bVal = b.approver.toLowerCase()
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
	}, [sortBy, leaveTypeFilter, statusFilter, dateFromFilter, dateToFilter, tableSortColumn, tableSortDirection])

	// Pagination
	const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage)
	const startIndex = (currentPage - 1) * itemsPerPage
	const endIndex = startIndex + itemsPerPage
	const currentData = filteredAndSortedData.slice(startIndex, endIndex)

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

	return (
		<>
			{selectedLeave && (
				<LeavePopUp
					name={selectedLeave.name}
					avatar={selectedLeave.avatar}
					type={selectedLeave.type}
					from={selectedLeave.from}
					to={selectedLeave.to}
					days={selectedLeave.days}
					status={selectedLeave.status}
					reason={selectedLeave.reason}
					approver={{
						name: selectedLeave.approver,
						role: selectedLeave.status === "Approved" ? "Team Lead" : "",
						avatar: selectedLeave.approverAvatar,
					}}
					comment={selectedLeave.comment}
					onClose={() => setSelectedLeave(null)}
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
									<option value="pending">
										{t("adminLeaves.table.status.pending", "Pending")}
									</option>
									<option value="approved">
										{t("adminLeaves.table.status.approved", "Approved")}
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
					</div>
				</div>

				{/* Table */}
				<div className="overflow-x-auto">
					{currentData.length === 0 ? (
						<div className="py-16 px-6 text-center">
							<Calendar className="h-16 w-16 text-[var(--sub-text-color)] mx-auto mb-4 opacity-50" />
							<p className="text-lg font-medium text-[var(--text-color)] mb-2">
								{t("adminLeaves.empty.general.title", "No Leave Requests")}
							</p>
							<p className="text-sm text-[var(--sub-text-color)]">
								{t("adminLeaves.empty.general.message", "No leave requests found matching your filters.")}
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
									onClick={() => handleTableSort('approver')}
									className="text-left py-3 px-6 text-sm font-medium text-[var(--sub-text-color)] border-b border-[var(--border-color)] cursor-pointer hover:bg-[var(--hover-color)] transition-colors"
								>
									<div className="flex items-center gap-1">
										{t("adminLeaves.table.columns.approver", "Approver")}
										{getSortIcon('approver')}
									</div>
								</th>
								<th className="text-left py-3 px-6 text-sm font-medium text-[var(--sub-text-color)] border-b border-[var(--border-color)]">
									{t("adminLeaves.table.columns.action", "Action")}
								</th>
							</tr>
						</thead>
						<tbody className="bg-[var(--table-bg)]">
							{currentData.map((leave, index) => (
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
														{leave.name.split(" ").map((n) => n[0]).join("")}
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
										{leave.reason}
									</td>
									<td className="py-4 px-6 text-[var(--text-color)] text-sm">
										{leave.approver}
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

export default LeavesTable
