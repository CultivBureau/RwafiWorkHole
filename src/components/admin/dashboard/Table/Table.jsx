import React, { useState, useEffect, useMemo } from 'react';
import { Search, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useGetCompanyClockinLogsQuery } from '../../../../services/apis/ClockinLogApi';
import { utcToLocalTime } from '../../../../utils/timeUtils';
import { isWithinShiftRadius } from '../../../../utils/locationUtils';

const formatTime = (isoString, locale) => {
  // API returns UTC time, convert to local time for display
  return utcToLocalTime(isoString, locale);
};

const AttendanceTable = () => {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === "ar";
  const locale = isArabic ? "ar-EG" : "en-US";

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [locationFilter, setLocationFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [currentPage, setCurrentPage] = useState(1);
  const [tableSortColumn, setTableSortColumn] = useState(null);
  const [tableSortDirection, setTableSortDirection] = useState('asc');
  const itemsPerPage = 6; // Show 6 items per page like employees table

  // Get today's date at midnight for filtering
  const getTodayStart = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  };

  const getTodayEnd = () => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return today;
  };

  // Fetch company clock-in logs
  const { data, isLoading, isError, error, refetch } = useGetCompanyClockinLogsQuery({
    pageNumber: currentPage,
    pageSize: 100, // Fetch more to filter today's records
  });

  // Map API data to table format
  const employeeData = useMemo(() => {
    if (!data) return [];

    let items = [];
    if (Array.isArray(data)) {
      items = data;
    } else if (data?.value && Array.isArray(data.value)) {
      items = data.value;
    } else if (data?.data && Array.isArray(data.data)) {
      items = data.data;
    } else if (data?.items && Array.isArray(data.items)) {
      items = data.items;
    } else if (data?.results && Array.isArray(data.results)) {
      items = data.results;
    }

    // Filter for today's records only
    const todayStart = getTodayStart();
    const todayEnd = getTodayEnd();

    const todayItems = items.filter((log) => {
      const clockinDate = log?.clockinTime ? new Date(log.clockinTime) : null;
      const clockoutDate = log?.clockoutTime ? new Date(log.clockoutTime) : null;
      const primaryDate = clockinDate || clockoutDate || new Date(log?.createdAt) || new Date(log?.updatedAt);
      
      return primaryDate >= todayStart && primaryDate <= todayEnd;
    });

    return todayItems.map((log) => {
      const userFirstName = log?.user?.firstName || "";
      const userLastName = log?.user?.lastName || "";
      const username = log?.user?.userName || "";
      const fullName = `${userFirstName} ${userLastName}`.trim() || username || t("adminDashboard.table.unknownEmployee", "Unknown Employee");
      const jobTitle = log?.user?.jobTitle || "";
      const checkInTime = formatTime(log?.clockinTime, locale);
      const checkInSort = log?.clockinTime ? new Date(log.clockinTime).getTime() : 0;
      const isLate = log?.isLate || false;
      
      // API uses "office" field: true = office, false = remote/home
      // But we also check distance as a fallback to ensure accuracy
      let office = log?.office ?? log?.officeRemote; // Fallback to officeRemote for backward compatibility

      // Double-check: if clock-in location is within shift radius, it should be office
      if (office === false) {
        const shiftLat = log?.shiftRule?.latitude;
        const shiftLng = log?.shiftRule?.longitude;
        const radiusMeters = log?.shiftRule?.radiusMeters;
        const clockinLocation = log?.clockinLocation;
        
        if (clockinLocation && shiftLat && shiftLng && radiusMeters !== undefined) {
          const withinRadius = isWithinShiftRadius(clockinLocation, shiftLat, shiftLng, radiusMeters);
          if (withinRadius) {
            // Location is within radius, so it should be office
            office = true;
          }
        }
      }

      // Determine type: true = office, false = remote/home
      let type = "Office";
      if (office === true) {
        type = "Office";
      } else if (office === false) {
        type = "Remote";
      }

      // Determine status
      const status = isLate ? "Late" : "On Time";

      return {
        id: log?.id,
        name: fullName,
        nameSort: fullName.toLowerCase(),
        designation: jobTitle || t("adminDashboard.table.noRole", "No Role"),
        designationSort: (jobTitle || "").toLowerCase(),
        type: type,
        typeSort: type.toLowerCase(),
        checkInTime: checkInTime,
        checkInSort: checkInSort,
        status: status,
        statusSort: status.toLowerCase(),
        avatar: null,
      };
    });
  }, [data, locale, t]);

  // Handle table column sorting
  const handleTableSort = (column) => {
    if (tableSortColumn === column) {
      setTableSortDirection(tableSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setTableSortColumn(column);
      setTableSortDirection('asc');
    }
  };

  // Filter data
  const filteredEmployees = useMemo(() => {
    let filtered = employeeData.filter(employee => {
      return (
        employee.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (roleFilter === "All" || employee.designation.toLowerCase().includes(roleFilter.toLowerCase())) &&
        (locationFilter === "All" || employee.type === locationFilter) &&
        (statusFilter === "All Status" || employee.status === statusFilter)
      );
    });

    // Apply table column sort
    if (tableSortColumn) {
      filtered.sort((a, b) => {
        let aVal, bVal;

        switch (tableSortColumn) {
          case 'name':
            aVal = a.nameSort;
            bVal = b.nameSort;
            break;
          case 'designation':
            aVal = a.designationSort;
            bVal = b.designationSort;
            break;
          case 'type':
            aVal = a.typeSort;
            bVal = b.typeSort;
            break;
          case 'checkInTime':
            aVal = a.checkInSort;
            bVal = b.checkInSort;
            break;
          case 'status':
            aVal = a.statusSort;
            bVal = b.statusSort;
            break;
          default:
            return 0;
        }

        if (tableSortDirection === 'asc') {
          return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        } else {
          return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
        }
      });
    }

    return filtered;
  }, [employeeData, searchTerm, roleFilter, locationFilter, statusFilter, tableSortColumn, tableSortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedEmployees = filteredEmployees.slice(startIndex, startIndex + itemsPerPage);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter, locationFilter, statusFilter]);

  const getSortIcon = (column) => {
    if (tableSortColumn !== column) {
      return <ChevronDown className="h-3 w-3 text-gray-400" />;
    }
    return tableSortDirection === 'asc'
      ? <ChevronUp className="h-3 w-3 text-[var(--accent-color)]" />
      : <ChevronDown className="h-3 w-3 text-[var(--accent-color)]" />;
  };

  const getInitials = (name = "") => {
    if (!name) return "--";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2);
  };

  return (
    <div className="w-full p-2 sm:p-4" dir={isArabic ? "rtl" : "ltr"}>
      {/* Header */}
      <h1 className={`text-lg sm:text-xl font-semibold text-[var(--text-color)] mb-3 sm:mb-4 ${isArabic ? 'text-right' : 'text-left'}`}>
        {t("adminDashboard.table.attendanceOverview", "Attendance Overview")}
      </h1>

      {/* Filters Section */}
      <div className="shadow-md border border-[var(--border-color)] rounded-4xl p-3 sm:p-4 md:p-5 mb-4">
        {/* Search and Filters Row */}
        <div className={`flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 md:gap-4 ${isArabic ? 'sm:flex-row-reverse' : ''}`}>
          {/* Search Input */}
          <div className="relative w-full sm:w-[25%] sm:flex-shrink-0">
            <Search className={`absolute top-1/2 transform -translate-y-1/2 text-[var(--sub-text-color)] w-3.5 h-3.5 ${isArabic ? 'right-2.5' : 'left-2.5'}`} />
            <input
              type="text"
              placeholder={t("adminDashboard.table.search", "Search")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full py-2 px-3 text-sm bg-[var(--bg-color)] border border-[var(--border-color)] rounded-full focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
              style={{
                paddingLeft: isArabic ? '12px' : '32px',
                paddingRight: isArabic ? '32px' : '12px'
              }}
            />
          </div>

          {/* Filter Dropdowns Container */}
          <div className={`flex flex-row flex-nowrap gap-2 sm:gap-3 w-full sm:flex-1 overflow-x-auto ${isArabic ? 'flex-row-reverse' : ''}`}>
            {/* Role Filter */}
            <div className={`flex flex-row items-center gap-1.5 flex-shrink-0 ${isArabic ? 'flex-row-reverse' : ''}`}>
              <span className={`text-xs text-[var(--sub-text-color)] whitespace-nowrap ${isArabic ? 'text-right' : 'text-left'}`}>
                {t("employees.table.role", "Role")}
              </span>
              <div className="relative flex-shrink-0">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-[100px] sm:w-[120px] h-[32px] appearance-none bg-[var(--bg-color)] border border-[var(--border-color)] rounded-full px-3 py-1.5 pr-7 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  dir={isArabic ? 'rtl' : 'ltr'}
                >
                  <option value="All">{t("adminDashboard.table.all", "All")}</option>
                  <option value="Design">Design</option>
                  <option value="Development">Development</option>
                  <option value="Marketing">Marketing</option>
                </select>
                <ChevronDown className={`absolute top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-[var(--sub-text-color)] pointer-events-none ${isArabic ? 'left-1.5' : 'right-1.5'}`} />
              </div>
            </div>

            {/* Location Filter */}
            <div className={`flex flex-row items-center gap-1.5 flex-shrink-0 ${isArabic ? 'flex-row-reverse' : ''}`}>
              <span className={`text-xs text-[var(--sub-text-color)] whitespace-nowrap ${isArabic ? 'text-right' : 'text-left'}`}>
                {t("adminDashboard.table.location", "Location")}
              </span>
              <div className="relative flex-shrink-0">
                <select
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="w-[80px] sm:w-[100px] h-[32px] appearance-none bg-[var(--bg-color)] border border-[var(--border-color)] rounded-full px-3 py-1.5 pr-7 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  dir={isArabic ? 'rtl' : 'ltr'}
                >
                  <option value="All">{t("adminDashboard.table.all", "All")}</option>
                  <option value="Office">{t("adminDashboard.table.office", "Office")}</option>
                  <option value="Remote">{t("adminDashboard.table.remote", "Remote")}</option>
                </select>
                <ChevronDown className={`absolute top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-[var(--sub-text-color)] pointer-events-none ${isArabic ? 'left-1.5' : 'right-1.5'}`} />
              </div>
            </div>

            {/* Status Filter */}
            <div className={`flex flex-row items-center gap-1.5 flex-shrink-0 ${isArabic ? 'flex-row-reverse' : ''}`}>
              <span className={`text-xs text-[var(--sub-text-color)] whitespace-nowrap ${isArabic ? 'text-right' : 'text-left'}`}>
                {t("adminDashboard.table.status", "Status")}
              </span>
              <div className="relative flex-shrink-0">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-[90px] sm:w-[110px] h-[32px] appearance-none bg-[var(--bg-color)] border border-[var(--border-color)] rounded-full px-3 py-1.5 pr-7 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  dir={isArabic ? 'rtl' : 'ltr'}
                >
                  <option value="All Status">{t("adminDashboard.table.allStatus", "All Status")}</option>
                  <option value="On Time">{t("adminDashboard.table.onTime", "On Time")}</option>
                  <option value="Late">{t("adminDashboard.table.late", "Late")}</option>
                </select>
                <ChevronDown className={`absolute top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-[var(--sub-text-color)] pointer-events-none ${isArabic ? 'left-1.5' : 'right-1.5'}`} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table Container with Pagination */}
      <div className="bg-[var(--bg-color)] rounded-2xl border border-[var(--border-color)] overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden md:block">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--table-header-bg)]">
                <tr>
                  <th
                    onClick={() => handleTableSort('name')}
                    className="text-[var(--sub-text-color)] font-medium text-xs py-2.5 px-4 border-b border-[var(--border-color)] cursor-pointer hover:bg-[var(--hover-color)] transition-colors text-center"
                  >
                    <div className="flex items-center justify-center gap-1">
                      {t("adminDashboard.table.employeeName", "Employee Name")}
                      {getSortIcon('name')}
                    </div>
                  </th>
                  <th
                    onClick={() => handleTableSort('designation')}
                    className="text-[var(--sub-text-color)] font-medium text-xs py-2.5 px-4 border-b border-[var(--border-color)] cursor-pointer hover:bg-[var(--hover-color)] transition-colors text-center"
                  >
                    <div className="flex items-center justify-center gap-1">
                      {t("employees.table.role", "Role")}
                      {getSortIcon('designation')}
                    </div>
                  </th>
                  <th
                    onClick={() => handleTableSort('type')}
                    className="text-[var(--sub-text-color)] font-medium text-xs py-2.5 px-4 border-b border-[var(--border-color)] cursor-pointer hover:bg-[var(--hover-color)] transition-colors text-center"
                  >
                    <div className="flex items-center justify-center gap-1">
                      {t("adminDashboard.table.type", "Type")}
                      {getSortIcon('type')}
                    </div>
                  </th>
                  <th
                    onClick={() => handleTableSort('checkInTime')}
                    className="text-[var(--sub-text-color)] font-medium text-xs py-2.5 px-4 border-b border-[var(--border-color)] cursor-pointer hover:bg-[var(--hover-color)] transition-colors text-center"
                  >
                    <div className="flex items-center justify-center gap-1">
                      {t("adminDashboard.table.checkInTime", "Check In Time")}
                      {getSortIcon('checkInTime')}
                    </div>
                  </th>
                  <th
                    onClick={() => handleTableSort('status')}
                    className="text-[var(--sub-text-color)] font-medium text-xs py-2.5 px-4 border-b border-[var(--border-color)] cursor-pointer hover:bg-[var(--hover-color)] transition-colors text-center"
                  >
                    <div className="flex items-center justify-center gap-1">
                      {t("adminDashboard.table.status", "Status")}
                      {getSortIcon('status')}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-[var(--table-bg)]">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="py-16 px-6 text-center text-[var(--sub-text-color)]">
                      {t("adminDashboard.table.loading", "Loading attendance records...")}
                    </td>
                  </tr>
                ) : isError ? (
                  <tr>
                    <td colSpan={5} className="py-16 px-6">
                      <div className="flex flex-col items-center gap-3 text-[var(--sub-text-color)]">
                        <span>{t("adminDashboard.table.errorLoading", "Failed to load attendance records")}</span>
                        {error && (
                          <span className="text-sm text-[var(--sub-text-color)]/80">
                            {error?.data?.message || error?.message || "An error occurred"}
                          </span>
                        )}
                        <button onClick={() => refetch()} className="btn-secondary">
                          {t("adminDashboard.table.retry", "Retry")}
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : paginatedEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 px-6">
                      <div className="flex flex-col items-center gap-4 text-[var(--sub-text-color)]">
                        <Users className="h-12 w-12 opacity-60" />
                        <div className="text-lg font-medium text-[var(--text-color)]">
                          {t("adminDashboard.table.noRecordsToday", "No attendance records for today")}
                        </div>
                        <div className="text-sm text-center max-w-md">
                          {t("adminDashboard.table.noRecordsTodayDescription", "When team members clock in today, their activity will appear here.")}
                        </div>
                        <button onClick={() => refetch()} className="btn-secondary">
                          {t("adminDashboard.table.refresh", "Refresh")}
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedEmployees.map((employee) => (
                    <tr
                      key={employee.id}
                      className="border-b border-[var(--border-color)] hover:bg-[var(--hover-color)] transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[var(--container-color)] border border-[var(--border-color)] flex items-center justify-center overflow-hidden flex-shrink-0">
                            {employee.avatar ? (
                              <img
                                src={employee.avatar}
                                alt={employee.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-[var(--sub-text-color)] text-xs font-medium">
                                {getInitials(employee.name)}
                              </span>
                            )}
                          </div>
                          <span className="font-medium text-[var(--text-color)] text-sm">{employee.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-[var(--text-color)] text-sm text-center">{employee.designation}</td>
                      <td className="py-3 px-4 text-[var(--text-color)] text-sm text-center">{employee.type}</td>
                      <td className="py-3 px-4 text-[var(--text-color)] text-sm text-center">{employee.checkInTime}</td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex px-3 py-1 text-center rounded-full text-xs font-medium border ${employee.status === "On Time"
                            ? "bg-[var(--success-color)]/10 text-[var(--success-color)]/70 border-[var(--success-color)]/30"
                            : "bg-[var(--warning-color)]/10 text-[var(--warning-color)]/70 border-[var(--warning-color)]/30"
                            }`}
                        >
                          {employee.status === "On Time"
                            ? t("adminDashboard.table.onTime", "On Time")
                            : t("adminDashboard.table.late", "Late")
                          }
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden">
          <div className={`${isArabic ? 'text-right' : 'text-left'}`}>
            {isLoading ? (
              <div className="p-4 text-center text-[var(--sub-text-color)]">
                {t("adminDashboard.table.loading", "Loading attendance records...")}
              </div>
            ) : isError ? (
              <div className="p-4 text-center">
                <div className="flex flex-col items-center gap-2 text-[var(--sub-text-color)]">
                  <span>{t("adminDashboard.table.errorLoading", "Failed to load attendance records")}</span>
                  <button onClick={() => refetch()} className="btn-secondary text-xs px-3 py-1">
                    {t("adminDashboard.table.retry", "Retry")}
                  </button>
                </div>
              </div>
            ) : paginatedEmployees.length === 0 ? (
              <div className="p-8 text-center">
                <div className="flex flex-col items-center gap-4 text-[var(--sub-text-color)]">
                  <Users className="h-12 w-12 opacity-60" />
                  <div className="text-base font-medium text-[var(--text-color)]">
                    {t("adminDashboard.table.noRecordsToday", "No attendance records for today")}
                  </div>
                  <div className="text-sm text-center">
                    {t("adminDashboard.table.noRecordsTodayDescription", "When team members clock in today, their activity will appear here.")}
                  </div>
                  <button onClick={() => refetch()} className="btn-secondary text-xs px-3 py-1">
                    {t("adminDashboard.table.refresh", "Refresh")}
                  </button>
                </div>
              </div>
            ) : (
              paginatedEmployees.map((employee, index) => (
                <div
                  key={employee.id}
                  className={`p-4 hover:bg-[var(--hover-color)] transition-colors ${index !== paginatedEmployees.length - 1 ? 'border-b border-[var(--border-color)]' : ''}`}
                >
                  <div className={`flex items-center gap-3 mb-3 ${isArabic ? 'flex-row-reverse' : ''}`}>
                    <div className="w-10 h-10 rounded-full bg-[var(--container-color)] border border-[var(--border-color)] flex items-center justify-center overflow-hidden flex-shrink-0">
                      {employee.avatar ? (
                        <img
                          src={employee.avatar}
                          alt={employee.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-[var(--sub-text-color)] text-xs font-medium">
                          {getInitials(employee.name)}
                        </span>
                      )}
                    </div>
                    <div className={`flex-1 ${isArabic ? 'text-right' : 'text-left'}`}>
                      <h3 className="font-medium text-[var(--text-color)] text-sm">{employee.name}</h3>
                      <p className="text-[var(--sub-text-color)] text-xs">{employee.designation}</p>
                    </div>
                    <span
                      className={`inline-flex px-3 py-1 text-center rounded-full text-xs font-medium border ${employee.status === "On Time"
                        ? "bg-[var(--success-color)]/10 text-[var(--success-color)]/70 border-[var(--success-color)]/30"
                        : "bg-[var(--warning-color)]/10 text-[var(--warning-color)]/70 border-[var(--warning-color)]/30"
                        }`}
                    >
                      {employee.status === "On Time"
                        ? t("adminDashboard.table.onTime", "On Time")
                        : t("adminDashboard.table.late", "Late")
                      }
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className={isArabic ? 'text-right' : 'text-left'}>
                      <span className="text-[var(--sub-text-color)]">{t("adminDashboard.table.type", "Type")}: </span>
                      <span className="text-[var(--text-color)]">{employee.type}</span>
                    </div>
                    <div className={isArabic ? 'text-right' : 'text-left'}>
                      <span className="text-[var(--sub-text-color)]">{t("adminDashboard.table.checkInTime", "Check In")}: </span>
                      <span className="text-[var(--text-color)]">{employee.checkInTime}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pagination Footer */}
        <div
          className={`px-3 md:px-6 py-3 border-t flex items-center justify-between h-[60px] ${isArabic ? 'flex-row-reverse' : ''}`}
          style={{ borderColor: 'var(--divider-color)' }}
        >
          <div className="text-xs md:text-sm font-medium" style={{ color: 'var(--sub-text-color)' }}>
            <span className="hidden md:inline">
              {t("employees.pagination.page", "Page")} {currentPage} {t("employees.pagination.of", "of")} {totalPages}
              ({filteredEmployees.length} {t("employees.pagination.total", "total employees")})
            </span>
            <span className="md:hidden">
              {currentPage}/{totalPages} ({filteredEmployees.length})
            </span>
          </div>
          <div className={`flex items-center gap-2 `}>
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-1.5 md:p-2 rounded-xl border transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                borderColor: 'var(--border-color)',
                backgroundColor: 'var(--bg-color)',
                color: 'var(--text-color)'
              }}
            >
              {isArabic ? <ChevronRight className="w-3 h-3 md:w-4 md:h-4" /> : <ChevronLeft className="w-3 h-3 md:w-4 md:h-4" />}
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 md:p-2 rounded-xl border transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                borderColor: 'var(--border-color)',
                backgroundColor: 'var(--bg-color)',
                color: 'var(--text-color)'
              }}
            >
              {isArabic ? <ChevronLeft className="w-3 h-3 md:w-4 md:h-4" /> : <ChevronRight className="w-3 h-3 md:w-4 md:h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceTable;
