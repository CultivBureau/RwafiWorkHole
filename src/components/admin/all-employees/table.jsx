import React, { useState, useEffect, useRef, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronLeft, ChevronRight, Search, LayoutGrid, TableIcon, Plus, Eye, Edit, Trash2, RotateCcw, Loader2 } from "lucide-react";
import EmployeeCard from "./employee-card";
import EditEmployeePopup from "./edit-employee";
import toast from "react-hot-toast";
import { useGetAllUsersQuery, useDeleteUserMutation, useRestoreUserMutation } from "../../../services/apis/UserApi";
import { useGetAllDepartmentsQuery } from "../../../services/apis/DepartmentApi";
import { useGetAllRolesQuery } from "../../../services/apis/RoleApi";
import { useHasPermission } from "../../../hooks/useHasPermission";

const EmployeesTable = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const isArabic = i18n.language === "ar";
    const [searchTerm, setSearchTerm] = useState("");
    const [joinDateFilter, setJoinDateFilter] = useState("");
    const [departmentFilter, setDepartmentFilter] = useState("");
    const [roleFilter, setRoleFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [viewMode, setViewMode] = useState("grid"); // "grid" or "table"
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const joinDateInputRef = useRef(null);
    
    // Permission checks
    const canCreate = useHasPermission('User.Create');
    const canUpdate = useHasPermission('User.Update');
    const canDelete = useHasPermission('User.Delete');
    const canViewAllProfiles = useHasPermission('User.Profile.ViewAll');

    // Responsive items per page based on screen size and view mode
    const getItemsPerPage = () => {
        if (viewMode === "grid") {
            // For grid: 8 on desktop (4x2), 4 on mobile (2x2)
            return window.innerWidth < 768 ? 4 : 8;
        } else {
            // For table: same as before
            return 6;
        }
    };

    const [itemsPerPage, setItemsPerPage] = useState(getItemsPerPage());

    // Update items per page on resize
    useEffect(() => {
        const handleResize = () => {
            setItemsPerPage(getItemsPerPage());
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [viewMode]);

    // Update items per page when view mode changes
    useEffect(() => {
        setItemsPerPage(getItemsPerPage());
    }, [viewMode]);

    // API calls
    const userQueryParams = useMemo(() => {
        const params = { pageNumber: 1, pageSize: 100 };
        if (departmentFilter && departmentFilter !== "") {
            params.departmentId = departmentFilter;
        }
        if (searchTerm) {
            params.name = searchTerm;
        }
        return params;
    }, [departmentFilter, searchTerm]);

    const { data: usersResponse, isLoading: isLoadingUsers, isError: isErrorUsers } = useGetAllUsersQuery(userQueryParams);
    const [deleteUserMutation, { isLoading: isDeleting }] = useDeleteUserMutation();
    const [restoreUserMutation, { isLoading: isRestoring }] = useRestoreUserMutation();
    const [pendingAction, setPendingAction] = useState(null); // { employee, action: 'delete' | 'restore' }
    const { data: departmentsResponse } = useGetAllDepartmentsQuery({ pageNumber: 1, pageSize: 100 });
    const { data: rolesResponse } = useGetAllRolesQuery({ pageNumber: 1, pageSize: 100 });

    // Transform API data to component format
    const employeesData = useMemo(() => {
        if (!usersResponse?.value) return [];
        
        return usersResponse.value.map(user => {
            // Format name
            const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.userName || user.email || "Unknown";
            
            // Format hire date
            const hireDate = user.hireDate 
                ? new Date(user.hireDate).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: '2-digit', 
                    day: '2-digit' 
                })
                : "";
            
            // Convert status boolean to string
            const statusString = user.status === true ? "Active" : "Inactive";
            
            // Get first department name (or combine multiple)
            const departments = user.departments || [];
            const departmentNames = departments.map(dept => dept.name).filter(Boolean);
            const primaryDepartment = departmentNames[0] || "N/A";
            
            // Get job title
            const position = user.jobTitle || "N/A";
            
            // Get roles - primary role for display
            const roles = user.roles || [];
            const primaryRole = roles[0] || "N/A";
            
            // Get team names
            const teams = user.teams || [];
            const teamNames = teams.map(team => team.name).filter(Boolean);
            
            // Generate avatar URL
            const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=15919B&color=fff&size=150`;
            
            return {
                id: user.id,
                name: fullName,
                position: position, // jobTitle
                role: primaryRole, // primary role
                department: primaryDepartment,
                departments: departmentNames, // For filtering and display
                teams: teamNames, // For display
                joinDate: hireDate,
                status: statusString,
                avatar: avatar,
                employeeId: user.userName || user.email || `EMP-${user.id.substring(0, 8)}`,
                email: user.email,
                roles: roles, // All roles for filtering
                rawData: user // Keep raw data for edit/view
            };
        });
    }, [usersResponse]);

    // Get unique values for filters from API data
    const uniqueDepartments = useMemo(() => {
        const deptSet = new Set();
        employeesData.forEach(emp => {
            if (emp.departments && emp.departments.length > 0) {
                emp.departments.forEach(dept => deptSet.add(dept));
            }
        });
        return Array.from(deptSet).sort();
    }, [employeesData]);

    const uniqueRoles = useMemo(() => {
        const roleSet = new Set();
        employeesData.forEach(emp => {
            if (emp.roles && emp.roles.length > 0) {
                emp.roles.forEach(role => roleSet.add(role));
            }
        });
        return Array.from(roleSet).sort();
    }, [employeesData]);

    const uniqueJoinDates = useMemo(() => {
        return [...new Set(employeesData.map(emp => emp.joinDate))].sort();
    }, [employeesData]);

    // Filter data
    const filteredEmployees = useMemo(() => {
        return employeesData.filter(employee => {
            const matchesSearch = !searchTerm || 
                employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                employee.email?.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesJoinDate = !joinDateFilter || 
                employee.joinDate.includes(joinDateFilter);
            
            const matchesDepartment = !departmentFilter || 
                employee.departments.includes(departmentFilter);
            
            const matchesRole = !roleFilter || 
                employee.roles.includes(roleFilter);
            
            const matchesStatus = !statusFilter || 
                employee.status === statusFilter;
            
            return matchesSearch && matchesJoinDate && matchesDepartment && matchesRole && matchesStatus;
        });
    }, [employeesData, searchTerm, joinDateFilter, departmentFilter, roleFilter, statusFilter]);

    // Pagination
    const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedEmployees = filteredEmployees.slice(startIndex, startIndex + itemsPerPage);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, joinDateFilter, departmentFilter, roleFilter, statusFilter, viewMode, itemsPerPage]);


    // Clear all filters
    const clearAllFilters = () => {
        setSearchTerm("");
        setJoinDateFilter("");
        setDepartmentFilter("");
        setRoleFilter("");
        setStatusFilter("");
    };

    // Active filters count
    const activeFiltersCount = [joinDateFilter, departmentFilter, roleFilter, statusFilter].filter(filter => filter !== "").length;

    // Active filters chips
    const activeFilters = [
        { key: 'joinDate', value: joinDateFilter, setter: setJoinDateFilter },
        { key: 'department', value: departmentFilter, setter: setDepartmentFilter },
        { key: 'role', value: roleFilter, setter: setRoleFilter },
        { key: 'status', value: statusFilter, setter: setStatusFilter }
    ].filter(filter => filter.value !== "");

    // Responsive FilterSelect
    const FilterSelect = ({ value, onChange, options, placeholder }) => (
        <div className="relative w-full mb-2 md:mb-0">
            <select
                value={value || ""}
                onChange={onChange}
                className="w-full border text-center rounded-full px-4 py-2 text-xs font-medium gradient-text transition-all duration-200 appearance-none"
                style={{
                    borderColor: 'var(--border-color)',
                    backgroundColor: 'var(--bg-color)',
                    color: value ? 'var(--accent-color)' : 'var(--sub-text-color)',
                    direction: isArabic ? 'rtl' : 'ltr',
                    cursor: 'pointer'
                }}
            >
                <option value="" disabled className="gradient-text">{placeholder}</option>
                {options.map((option) => (
                    <option key={option} value={option} style={{ color: 'var(--text-color)' }}>
                        {option}
                    </option>
                ))}
            </select>
            <ChevronDown
                className={`absolute top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none gradient-text ${isArabic ? 'left-4' : 'right-4'}`}
            />
        </div>
    );

    // Action confirmation helpers
    const isProcessingAction = isDeleting || isRestoring;

    const requestEmployeeAction = (employee, forcedAction = null) => {
        const isActive = (employee.status || "").toLowerCase() === "active";
        setPendingAction({
            employee,
            action: forcedAction || (isActive ? "delete" : "restore")
        });
    };

    const handleDeleteOrRestoreEmployee = async () => {
        if (!pendingAction) return;
        const { employee, action } = pendingAction;
        const userId = employee?.id;
        if (!userId) {
            toast.error(t("employees.messages.missingId", "Employee ID not found"));
            return;
        }

        const isDeleteAction = action === "delete";

        const toastId = toast.loading(isDeleteAction
            ? t("employees.messages.deleting", "Deleting employee...")
            : t("employees.messages.restoring", "Restoring employee..."));

        try {
            if (isDeleteAction) {
                await deleteUserMutation(userId).unwrap();
            } else {
                await restoreUserMutation(userId).unwrap();
            }
            toast.success(
                isDeleteAction
                    ? t("employees.messages.deleteSuccess", "Employee deleted successfully")
                    : t("employees.messages.restoreSuccess", "Employee restored successfully")
            );
        } catch (error) {
            const errorMessage =
                error?.data?.errorMessage ||
                error?.data?.message ||
                error?.message ||
                (isDeleteAction
                    ? t("employees.messages.deleteFailed", "Failed to delete employee")
                    : t("employees.messages.restoreFailed", "Failed to restore employee"));
            toast.error(errorMessage);
        } finally {
            toast.dismiss(toastId);
            setPendingAction(null);
        }
    };

    // Enhanced Action buttons for table
    const ActionButtons = ({ employee }) => {
        const isActiveEmployee = (employee.status || "").toLowerCase() === "active";
        const actionTitle = isActiveEmployee
            ? t("employees.actions.delete", "Delete")
            : t("employees.actions.restore", "Restore");

        return (
        <div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
            {canViewAllProfiles && (
                <button
                    className="p-2 rounded-lg hover:bg-[var(--hover-color)] transition-all hover:scale-110"
                    title={t("employees.actions.view", "View")}
                    onClick={(e) => { e.stopPropagation(); handleViewEmployee(employee); }}
                >
                    <Eye className="w-5 h-5" style={{ color: 'var(--accent-color)' }} />
                </button>
            )}
            {canUpdate && (
                <button
                    className="p-2 rounded-lg hover:bg-[var(--hover-color)] transition-all hover:scale-110"
                    title={t("employees.actions.edit", "Edit")}
                    onClick={(e) => { e.stopPropagation(); setSelectedEmployee(employee); setIsEditOpen(true); }}
                >
                    <Edit className="w-5 h-5" style={{ color: 'var(--accent-color)' }} />
                </button>
            )}
            {canDelete && (
                <button
                    className={`p-2 rounded-lg transition-all hover:scale-110 ${isActiveEmployee ? 'hover:bg-red-50' : 'hover:bg-[var(--hover-color)]'}`}
                    title={actionTitle}
                    onClick={(e) => {
                        e.stopPropagation();
                        requestEmployeeAction(employee);
                    }}
                >
                    {isActiveEmployee ? (
                        <Trash2 className="w-5 h-5" style={{ color: 'var(--error-color)' }} />
                    ) : (
                        <RotateCcw className="w-5 h-5" style={{ color: 'var(--accent-color)' }} />
                    )}
                </button>
            )}
        </div>
        );
    };

    const handleAddNewEmployee = () => {
        navigate("/pages/admin/new-employee");
    };

    const handleViewEmployee = (employee) => {
        // Navigate to profile page with employee data
        navigate("/pages/User/profile", { 
            state: { 
                employeeData: employee.rawData || employee,
                isAdminView: true 
            } 
        });
    };

    return (
        <>
        <div className="w-full" dir={isArabic ? "rtl" : "ltr"}>
            {/* Filters and Controls Container */}
            <div
                className="rounded-xl border shadow-sm p-3 md:p-3 mb-2"
                style={{
                    backgroundColor: 'var(--bg-color)',
                    borderColor: 'var(--border-color)',
                    boxShadow: 'var(--shadow-color)'
                }}
            >
                {/* First Row - Search and Filter Buttons */}
                <div className={`grid grid-cols-1 md:grid-cols-8 gap-2 md:gap-3 mb-4 items-center ${isArabic ? 'direction-rtl' : ''}`}>
                    {/* Search - Takes 3 columns on desktop, full width on mobile */}
                    <div className="md:col-span-3 col-span-1 w-full mb-2 md:mb-0 relative">
                        <Search
                            className={`absolute top-1/2 transform -translate-y-1/2 w-4 h-4 ${isArabic ? 'right-3' : 'left-3'}`}
                            style={{ color: 'var(--sub-text-color)' }}
                        />
                        <input
                            type="text"
                            placeholder={t("employees.search.placeholder", "Search employees...")}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full border rounded-xl py-2 text-sm focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all duration-200"
                            style={{
                                borderColor: 'var(--border-color)',
                                backgroundColor: 'var(--bg-color)',
                                color: 'var(--text-color)',
                                paddingLeft: isArabic ? '16px' : '40px',
                                paddingRight: isArabic ? '40px' : '16px',
                                focusRingColor: 'var(--accent-color)'
                            }}
                        />
                    </div>

                    {/* Each filter/select is full width on mobile, 1 col on desktop */}
                    <div className="md:col-span-1 col-span-1 w-full">
                        <div className="relative w-full">
                            <input
                                ref={joinDateInputRef}
                                type="date"
                                value={joinDateFilter}
                                onChange={(e) => setJoinDateFilter(e.target.value)}
                                className="w-full border rounded-full px-4 py-2 text-xs font-medium transition-all duration-200 opacity-0 absolute inset-0 cursor-pointer"
                                style={{
                                    colorScheme: 'var(--theme)'
                                }}
                            />
                            <div
                                className="w-full border text-center rounded-full px-4 py-2 text-xs font-medium gradient-text transition-all duration-200"
                                style={{
                                    borderColor: 'var(--border-color)',
                                    backgroundColor: 'var(--bg-color)',
                                    color: 'var(--accent-color)',
                                    cursor: 'pointer'
                                }}
                                onClick={() => {
                                    if (joinDateInputRef.current) {
                                        if (typeof joinDateInputRef.current.showPicker === 'function') {
                                            joinDateInputRef.current.showPicker();
                                        } else {
                                            joinDateInputRef.current.focus();
                                            joinDateInputRef.current.click();
                                        }
                                    }
                                }}
                            >
                                {joinDateFilter ? new Date(joinDateFilter).toLocaleDateString() : t("employees.filters.joinDate")}
                            </div>
                        </div>
                    </div>
                    <div className="md:col-span-1 col-span-1 w-full">
                        <FilterSelect
                            value={departmentFilter}
                            onChange={(e) => setDepartmentFilter(e.target.value)}
                            options={uniqueDepartments}
                            placeholder={t("employees.filters.department")}
                        />
                    </div>
                    <div className="md:col-span-1 col-span-1 w-full">
                        <FilterSelect
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            options={uniqueRoles}
                            placeholder={t("employees.filters.role")}
                        />
                    </div>
                    <div className="md:col-span-1 col-span-1 w-full">
                        <FilterSelect
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            options={["Active", "Inactive", "Pending"]}
                            placeholder={t("employees.filters.status")}
                        />
                    </div>
                    <div className="md:col-span-1 col-span-1 w-full">
                        {activeFiltersCount > 0 ? (
                            <button
                                onClick={clearAllFilters}
                                className="w-full px-3 py-1 rounded-xl text-xs md:text-sm font-medium transition-all duration-200 border gradient-bg"
                                style={{
                                    color: 'white',
                                    borderColor: 'var(--accent-color)'
                                }}
                            >
                                <span className="hidden md:inline">{t("employees.clearAll", "Clear All")}</span>
                                <span className="md:hidden">Clear</span>
                            </button>
                        ) : (
                            <div className="w-full h-full"></div>
                        )}
                    </div>
                </div>

                {/* Second Row - View Toggle, Add Button, and Active Filters */}
                <div className={`flex flex-col md:flex-row items-center justify-between gap-2 md:gap-3 ${isArabic ? 'flex-row-reverse' : ''}`}>
                    {/* Left side - Active Filters Chips */}
                    <div className={`flex flex-wrap items-center gap-2 flex-1 w-full md:w-auto ${isArabic ? 'flex-row-reverse' : ''}`}>
                        {activeFilters.length > 0 && (
                            <>
                                {activeFilters.map((filter) => (
                                    <div
                                        key={filter.key}
                                        className="flex items-center gap-2 px-2 md:px-3 py-1 rounded-full text-xs border"
                                        style={{
                                            backgroundColor: 'var(--menu-active-bg)',
                                            borderColor: 'var(--accent-color)',
                                            color: 'var(--text-color)'
                                        }}
                                    >
                                        <span>{filter.value}</span>
                                        <button
                                            onClick={() => filter.setter("")}
                                            className="w-3 h-3 md:w-4 md:h-4 rounded-full flex items-center justify-center hover:bg-red-100 transition-colors"
                                            style={{ color: 'var(--accent-color)' }}
                                        >
                                            <span className="text-xs">×</span>
                                        </button>
                                    </div>
                                ))}
                                {/* Results Count */}
                                <div className="text-xs md:text-sm font-medium ml-2" style={{ color: 'var(--sub-text-color)' }}>
                                    {filteredEmployees.length} {t("employees.results", "results")}
                                </div>
                            </>
                        )}
                        {activeFilters.length === 0 && (
                            <div className="text-xs md:text-sm font-medium" style={{ color: 'var(--sub-text-color)' }}>
                                {filteredEmployees.length} {t("employees.results", "results")}
                            </div>
                        )}
                    </div>

                    {/* Right side - View Toggle and Add Button */}
                    <div className={`flex items-center gap-3 md:gap-4 w-full md:w-auto justify-end`}>
                        {/* View Mode Toggle */}
                        <div
                            className="flex items-center rounded-xl p-1"
                            style={{
                                backgroundColor: 'var(--menu-active-bg)',
                                border: '1px solid var(--border-color)'
                            }}
                        >
                            <button
                                onClick={() => setViewMode("grid")}
                                className={`p-1.5 md:p-2 rounded-lg transition-all duration-200 ${viewMode === "grid" ? 'shadow-sm' : ''}`}
                                style={{
                                    backgroundColor: viewMode === "grid" ? 'var(--accent-color)' : 'transparent',
                                    color: viewMode === "grid" ? 'white' : 'var(--sub-text-color)'
                                }}
                            >
                                <LayoutGrid className="w-3 h-3 md:w-4 md:h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode("table")}
                                className={`p-1.5 md:p-2 rounded-lg transition-all duration-200 ${viewMode === "table" ? 'shadow-sm' : ''}`}
                                style={{
                                    backgroundColor: viewMode === "table" ? 'var(--accent-color)' : 'transparent',
                                    color: viewMode === "table" ? 'white' : 'var(--sub-text-color)'
                                }}
                            >
                                <TableIcon className="w-3 h-3 md:w-4 md:h-4" />
                            </button>
                        </div>

                        {/* Add New Employee Button */}
                        {canCreate && (
                            <button
                                onClick={handleAddNewEmployee}
                                className="gradient-bg flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl text-xs md:text-sm font-medium text-white transition-all duration-200 hover:shadow-lg"
                                style={{
                                    border: '1px solid var(--accent-color)'
                                }}
                            >
                                <Plus className="w-3 h-3 md:w-4 md:h-4" />
                                <span className="hidden sm:inline">{t("employees.addNew", "Add New Employee")}</span>
                                <span className="sm:hidden">{t("employees.add", "Add")}</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Content Container */}
            <div
                className="rounded-xl border shadow-sm"
                style={{
                    backgroundColor: 'var(--bg-color)',
                    borderColor: 'var(--border-color)',
                    height: '400px md:525px', // Responsive height
                    boxShadow: 'var(--shadow-color)'
                }}
            >
                {isLoadingUsers ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <div className="w-16 h-16 border-4 border-[var(--accent-color)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-[var(--sub-text-color)]">{t("employees.loading", "Loading employees...")}</p>
                        </div>
                    </div>
                ) : isErrorUsers ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <p className="text-red-500 mb-4">{t("employees.error", "Failed to load employees")}</p>
                            <button 
                                onClick={() => window.location.reload()} 
                                className="px-4 py-2 bg-[var(--accent-color)] text-white rounded-lg"
                            >
                                {t("employees.retry", "Retry")}
                            </button>
                        </div>
                    </div>
                ) : filteredEmployees.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <p className="text-[var(--sub-text-color)] mb-2">{t("employees.noResults", "No employees found")}</p>
                            {activeFiltersCount > 0 && (
                                <button 
                                    onClick={clearAllFilters}
                                    className="text-[var(--accent-color)] text-sm"
                                >
                                    {t("employees.clearFilters", "Clear filters")}
                                </button>
                            )}
                        </div>
                    </div>
                ) : viewMode === "grid" ? (
                    /* Grid View - Responsive */
                    <div className="h-full flex flex-col">
                        <div className="flex-1 p-2 md:p-4" style={{ height: 'calc(100% - 60px)' }}>
                            <div className="grid grid-cols-2 md:grid-cols-4 grid-rows-2 gap-2 md:gap-4 h-full">
                                {/* Render cards based on responsive layout */}
                                {Array.from({ length: itemsPerPage }).map((_, index) => {
                                    const employee = paginatedEmployees[index];
                                    return employee ? (
                                        <EmployeeCard
                                            key={employee.id}
                                            name={employee.name}
                                            position={employee.position}
                                            role={employee.role}
                                            department={employee.department}
                                            departments={employee.departments}
                                            teams={employee.teams}
                                            joinDate={employee.joinDate}
                                            status={employee.status}
                                            avatar={employee.avatar}
                                            onCardClick={() => handleViewEmployee(employee)}
                                            onView={() => handleViewEmployee(employee)}
                                            onEdit={() => { setSelectedEmployee(employee); setIsEditOpen(true); }}
                                            onDelete={(action) => requestEmployeeAction(employee, action)}
                                            canViewAllProfiles={canViewAllProfiles}
                                            canUpdate={canUpdate}
                                            canDelete={canDelete}
                                            className="h-full"
                                        />
                                    ) : (
                                        <div key={`empty-${index}`} className="h-full" />
                                    );
                                })}
                            </div>
                        </div>

                        {/* Pagination for Grid */}
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
                            <div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
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
                                    <ChevronLeft className="w-3 h-3 md:w-4 md:h-4" />
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
                                    <ChevronRight className="w-3 h-3 md:w-4 md:h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Table View - Responsive with horizontal scroll */
                    <div className="h-full flex flex-col">
                        <div className="flex-1 overflow-x-auto" style={{ height: 'calc(100% - 60px)' }}>
                            <table className="w-full min-w-[800px]">
                                <thead className="sticky top-0 z-10" style={{ background: 'linear-gradient(135deg, var(--gradient-start), var(--gradient-end))' }}>
                                    <tr>
                                        <th className={`px-4 md:px-6 py-4 text-xs font-bold uppercase tracking-wider ${isArabic ? 'text-right' : 'text-left'}`}
                                            style={{ color: 'white', minWidth: '180px' }}>
                                            {t("employees.table.employee", "Employee")}
                                        </th>
                                        <th className={`px-4 md:px-6 py-4 text-xs font-bold uppercase tracking-wider ${isArabic ? 'text-right' : 'text-left'}`}
                                            style={{ color: 'white', minWidth: '120px' }}>
                                            {t("employees.table.role", "Role")}
                                        </th>
                                        <th className={`px-4 md:px-6 py-4 text-xs font-bold uppercase tracking-wider ${isArabic ? 'text-right' : 'text-left'}`}
                                            style={{ color: 'white', minWidth: '140px' }}>
                                            {t("employees.table.jobTitle", "Job Title")}
                                        </th>
                                        <th className={`px-4 md:px-6 py-4 text-xs font-bold uppercase tracking-wider ${isArabic ? 'text-right' : 'text-left'}`}
                                            style={{ color: 'white', minWidth: '140px' }}>
                                            {t("employees.table.department", "Department")}
                                        </th>
                                        <th className={`px-4 md:px-6 py-4 text-xs font-bold uppercase tracking-wider ${isArabic ? 'text-right' : 'text-left'}`}
                                            style={{ color: 'white', minWidth: '120px' }}>
                                            {t("employees.table.team", "Team")}
                                        </th>
                                        <th className={`px-4 md:px-6 py-4 text-xs font-bold uppercase tracking-wider ${isArabic ? 'text-right' : 'text-left'}`}
                                            style={{ color: 'white', minWidth: '110px' }}>
                                            {t("employees.table.joinDate", "Join Date")}
                                        </th>
                                        <th className={`px-4 md:px-6 py-4 text-xs font-bold uppercase tracking-wider ${isArabic ? 'text-right' : 'text-left'}`}
                                            style={{ color: 'white', minWidth: '100px' }}>
                                            {t("employees.table.status", "Status")}
                                        </th>
                                        {/* Actions column - Only show if user has any action permissions */}
                                        {(canViewAllProfiles || canUpdate || canDelete) && (
                                            <th className={`px-4 md:px-6 py-4 text-xs font-bold uppercase tracking-wider ${isArabic ? 'text-right' : 'text-left'}`}
                                                style={{ color: 'white', minWidth: '120px' }}>
                                                {t("employees.table.action", "Action")}
                                            </th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedEmployees.map((employee) => (
                                        <tr
                                            key={employee.id}
                                            className={`transition-all duration-300 group border-b-2 ${
                                                canViewAllProfiles ? 'cursor-pointer' : 'cursor-default'
                                            }`}
                                            style={{
                                                borderColor: 'var(--border-color)',
                                                backgroundColor: 'var(--bg-color)'
                                            }}
                                            onClick={canViewAllProfiles ? () => handleViewEmployee(employee) : undefined}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.backgroundColor = 'var(--hover-color)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor = 'var(--bg-color)';
                                            }}
                                        >
                                            {/* Employee Info */}
                                            <td className={`px-4 md:px-6 py-5 ${isArabic ? 'text-right' : 'text-left'}`}>
                                                <div className={`flex items-center gap-3 ${isArabic ? 'flex-row-reverse' : ''}`}>
                                                    <div className="relative">
                                                        <img
                                                            src={employee.avatar}
                                                            alt={employee.name}
                                                            className="w-11 h-11 rounded-full object-cover flex-shrink-0 ring-2"
                                                            style={{ ringColor: 'var(--accent-color)' }}
                                                            onError={(e) => {
                                                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name)}&background=15919B&color=fff&size=44`;
                                                            }}
                                                        />
                                                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full gradient-bg border-2 border-white"></div>
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="text-sm font-bold truncate" style={{ color: 'var(--text-color)' }}>
                                                            {employee.name}
                                                        </div>
                                                        <div className="text-xs truncate font-medium" style={{ color: 'var(--accent-color)' }}>
                                                            {employee.employeeId}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            
                                            {/* Role - Separate Column */}
                                            <td className={`px-4 md:px-6 py-5 text-sm ${isArabic ? 'text-right' : 'text-left'}`}>
                                                <span
                                                    className="inline-flex items-center px-0 py-1 rounded-full text-xs font-bold "
                                                    style={{
                                                        backgroundColor: 'var(--accent-color)/10',
                                                        color: 'var(--accent-color)',
                                                        borderColor: 'var(--accent-color)/20'
                                                    }}
                                                >
                                                    {employee.role || 'N/A'}
                                                </span>
                                            </td>

                                            {/* Job Title - Separate Column */}
                                            <td className={`px-4 md:px-6 py-5 text-sm font-semibold ${isArabic ? 'text-right' : 'text-left'}`}
                                                style={{ color: 'var(--text-color)' }}>
                                                {employee.position || '-'}
                                            </td>

                                            {/* Department - Separate Column with Hover Tooltip */}
                                            <td className={`px-4 md:px-6 py-5 text-sm ${isArabic ? 'text-right' : 'text-left'}`}>
                                                {employee.departments && employee.departments.length > 0 ? (
                                                    <div className="relative group/dept inline-block">
                                                        <div className="flex flex-wrap gap-1.5">
                                                            <span 
                                                                className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold border-2"
                                                                style={{
                                                                    backgroundColor: 'var(--container-color)',
                                                                    color: 'var(--text-color)',
                                                                    borderColor: 'var(--border-color)'
                                                                }}
                                                            >
                                                                {employee.departments[0]}
                                                            </span>
                                                            {employee.departments.length > 1 && (
                                                                <span 
                                                                    className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold border-2"
                                                                    style={{
                                                                        backgroundColor: 'var(--accent-color)',
                                                                        color: 'white',
                                                                        borderColor: 'var(--accent-color)'
                                                                    }}
                                                                >
                                                                    +{employee.departments.length - 1}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {/* Hover Tooltip */}
                                                        {employee.departments.length > 1 && (
                                                            <div className={`absolute ${isArabic ? 'left-0' : 'right-0'} top-full mt-2 hidden group-hover/dept:block z-50 w-max max-w-xs`}>
                                                                <div className="rounded-xl border-2 shadow-2xl p-4" style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--accent-color)' }}>
                                                                    <p className="text-xs font-bold mb-3 gradient-text">
                                                                        {t("employees.allDepartments", "All Departments")}
                                                                    </p>
                                                                    <div className="space-y-2">
                                                                        {employee.departments.map((dept, idx) => (
                                                                            <div key={idx} className="flex items-center gap-2">
                                                                                <span className="w-2 h-2 rounded-full gradient-bg" />
                                                                                <span className="text-sm font-medium" style={{ color: 'var(--text-color)' }}>{dept}</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-sm" style={{ color: 'var(--sub-text-color)' }}>-</span>
                                                )}
                                            </td>

                                            {/* Team - Separate Column with Hover Tooltip */}
                                            <td className={`px-4 md:px-6 py-5 text-sm ${isArabic ? 'text-right' : 'text-left'}`}>
                                                {employee.teams && employee.teams.length > 0 ? (
                                                    <div className="relative group/team inline-block">
                                                        <div className="flex flex-wrap gap-1.5">
                                                            <span 
                                                                className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold border-2"
                                                                style={{
                                                                    backgroundColor: 'var(--container-color)',
                                                                    color: 'var(--text-color)',
                                                                    borderColor: 'var(--border-color)'
                                                                }}
                                                            >
                                                                {employee.teams[0]}
                                                            </span>
                                                            {employee.teams.length > 1 && (
                                                                <span 
                                                                    className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold border-2"
                                                                    style={{
                                                                        backgroundColor: 'var(--accent-color)',
                                                                        color: 'white',
                                                                        borderColor: 'var(--accent-color)'
                                                                    }}
                                                                >
                                                                    +{employee.teams.length - 1}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {/* Hover Tooltip */}
                                                        {employee.teams.length > 1 && (
                                                            <div className={`absolute ${isArabic ? 'left-0' : 'right-0'} top-full mt-2 hidden group-hover/team:block z-50 w-max max-w-xs`}>
                                                                <div className="rounded-xl border-2 shadow-2xl p-4" style={{ backgroundColor: 'var(--bg-color)', borderColor: 'var(--accent-color)' }}>
                                                                    <p className="text-xs font-bold mb-3 gradient-text">
                                                                        {t("employees.allTeams", "All Teams")}
                                                                    </p>
                                                                    <div className="space-y-2">
                                                                        {employee.teams.map((team, idx) => (
                                                                            <div key={idx} className="flex items-center gap-2">
                                                                                <span className="w-2 h-2 rounded-full gradient-bg" />
                                                                                <span className="text-sm font-medium" style={{ color: 'var(--text-color)' }}>{team}</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-sm" style={{ color: 'var(--sub-text-color)' }}>-</span>
                                                )}
                                            </td>

                                            {/* Join Date */}
                                            <td className={`px-4 md:px-6 py-5 text-sm font-medium ${isArabic ? 'text-right' : 'text-left'}`}
                                                style={{ color: 'var(--accent-color)' }}>
                                                {employee.joinDate}
                                            </td>

                                            {/* Status */}
                                            <td className={`px-4 md:px-6 py-5 ${isArabic ? 'text-right' : 'text-left'}`}>
                                                <span
                                                    className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 shadow-sm ${employee.status === "Active"
                                                        ? 'bg-green-100 text-green-700 border-green-200'
                                                        : employee.status === "Inactive"
                                                            ? 'bg-red-100 text-red-700 border-red-200'
                                                            : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                                                        }`}
                                                >
                                                    {employee.status}
                                                </span>
                                            </td>

                                            {/* Actions - Only show if user has any action permissions */}
                                            {(canViewAllProfiles || canUpdate || canDelete) && (
                                                <td className={`px-4 md:px-6 py-5 ${isArabic ? 'text-right' : 'text-left'}`}>
                                                    <ActionButtons employee={employee} />
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination for Table */}
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
                            <div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
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
                                    <ChevronLeft className="w-3 h-3 md:w-4 md:h-4" />
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
                                    <ChevronRight className="w-3 h-3 md:w-4 md:h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
        {/* Popups */}
        <EditEmployeePopup
            employee={selectedEmployee}
            isOpen={isEditOpen}
            onClose={() => setIsEditOpen(false)}
            onSave={(updated) => { console.log('Updated employee', updated); }}
        />
        {pendingAction && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}>
                <div
                    className="w-full max-w-sm rounded-2xl border shadow-2xl p-6 space-y-4"
                    style={{ backgroundColor: "var(--bg-color)", borderColor: "var(--border-color)" }}
                >
                    <h3 className="text-lg font-bold" style={{ color: "var(--text-color)" }}>
                        {pendingAction.action === "delete"
                            ? t("employees.actions.delete", "Delete")
                            : t("employees.actions.restore", "Restore")}
                    </h3>
                    <p className="text-sm" style={{ color: "var(--sub-text-color)" }}>
                        {pendingAction.action === "delete"
                            ? t("employees.messages.deleteConfirm", "Are you sure you want to delete this employee?")
                            : t("employees.messages.restoreConfirm", "Are you sure you want to restore this employee?")}
                    </p>
                    <div className="flex gap-3">
                        <button
                            className="flex-1 px-4 py-2 rounded-xl border text-sm font-semibold transition-all"
                            style={{
                                borderColor: "var(--border-color)",
                                color: "var(--text-color)",
                                backgroundColor: "var(--bg-color)"
                            }}
                            onClick={() => setPendingAction(null)}
                            disabled={isProcessingAction}
                        >
                            {t("common.cancel", "Cancel")}
                        </button>
                        <button
                            className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all flex items-center justify-center gap-2"
                            style={{
                                background: pendingAction.action === "delete"
                                    ? "linear-gradient(135deg, #F87171 0%, #EF4444 100%)"
                                    : "linear-gradient(135deg, #15919B 0%, #09D1C7 100%)"
                            }}
                            onClick={handleDeleteOrRestoreEmployee}
                            disabled={isProcessingAction}
                        >
                            {isProcessingAction && <Loader2 className="w-4 h-4 animate-spin" />}
                            <span>
                                {pendingAction.action === "delete"
                                    ? t("employees.actions.delete", "Delete")
                                    : t("employees.actions.restore", "Restore")}
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        )}
        </>
    );
};

export default EmployeesTable;
