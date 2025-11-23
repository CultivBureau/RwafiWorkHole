"use client"

import React, { useState, useMemo, useEffect } from "react"
import { UserPlus, UserMinus, Search, Users } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useGetAllUsersQuery } from "../../../services/apis/UserApi"
import { useGetAllDepartmentsQuery } from "../../../services/apis/DepartmentApi"
import { useGetTeamsByDepartmentQuery } from "../../../services/apis/TeamApi"
import { useAssignUserToRoleMutation, useRemoveUserFromRoleMutation, useGetRoleByIdQuery, useGetRoleUsersQuery } from "../../../services/apis/RoleApi"
import { useGetAllRolesQuery } from "../../../services/apis/RoleApi"
import toast from "react-hot-toast"

const AssignRoleUsersTable = ({ roleId, roleName }) => {
    const { t, i18n } = useTranslation();
    const isArabic = i18n.language === "ar";

    // State
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedDepartment, setSelectedDepartment] = useState("all")
    const [selectedTeam, setSelectedTeam] = useState("all")
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage] = useState(10)

    // Fetch role details
    const { data: roleResponse } = useGetRoleByIdQuery(roleId, { skip: !roleId });
    const roleData = roleResponse?.value;

    // Fetch users who have this role
    const { data: roleUsersResponse, refetch: refetchRoleUsers } = useGetRoleUsersQuery(
        { id: roleId, pageNumber: 1, pageSize: 100 },
        { skip: !roleId }
    );

    // Get list of user IDs who have this role
    const usersWithRoleIds = useMemo(() => {
        if (!roleUsersResponse?.value) return new Set();
        return new Set(roleUsersResponse.value.map(user => user.userId || user.id));
    }, [roleUsersResponse]);

    // Fetch all roles to map role IDs to names
    const { data: allRolesResponse } = useGetAllRolesQuery({ pageNumber: 1, pageSize: 100 });
    const rolesMap = useMemo(() => {
        if (!allRolesResponse?.value) return {};
        const map = {};
        allRolesResponse.value.forEach(role => {
            map[role.id] = role.name;
        });
        return map;
    }, [allRolesResponse]);

    // Fetch users with filters
    const userQueryParams = useMemo(() => {
        const params = { pageNumber: 1, pageSize: 100 };
        if (selectedDepartment !== "all") params.departmentId = selectedDepartment;
        if (selectedTeam !== "all") params.teamId = selectedTeam;
        if (searchTerm) params.name = searchTerm;
        return params;
    }, [selectedDepartment, selectedTeam, searchTerm]);

    const { data: usersResponse, isLoading: isLoadingUsers, refetch: refetchUsers } = useGetAllUsersQuery(userQueryParams);
    
    // Fetch departments and teams for filters
    const { data: departmentsResponse } = useGetAllDepartmentsQuery({ pageNumber: 1, pageSize: 100 });
    const { data: departmentTeamsResponse } = useGetTeamsByDepartmentQuery(selectedDepartment, { 
        skip: selectedDepartment === "all" 
    });

    // Mutations
    const [assignUserToRole, { isLoading: isAssigning }] = useAssignUserToRoleMutation();
    const [removeUserFromRole, { isLoading: isRemoving }] = useRemoveUserFromRoleMutation();

    // Transform users data - handle new response structure
    const usersData = useMemo(() => {
        if (!usersResponse?.value) return [];
        return usersResponse.value.map(user => {
            // Extract departments - from user.departments array
            const departments = user.departments || [];
            const departmentNames = departments.map(dept => dept.name).filter(Boolean);
            
            // Extract teams - from user.teams array
            const teams = user.teams || [];
            const teamNames = teams.map(team => team.name).filter(Boolean);
            
            // Extract roles - from user.roles array (array of role names)
            const roles = user.roles || [];
            
            return {
                id: user.id,
                userId: user.id,
                firstName: user.firstName || "",
                lastName: user.lastName || "",
                email: user.email || "",
                roles: roles, // Array of role names
                departmentNames: departmentNames, // Array of department names
                teamNames: teamNames, // Array of team names
                departments: departments, // Full department objects for filtering
                teams: teams, // Full team objects for filtering
            };
        });
    }, [usersResponse]);

    // Get departments and teams for dropdowns
    const departments = useMemo(() => {
        if (!departmentsResponse?.value) return [];
        return departmentsResponse.value.map(dept => ({
            id: dept.id,
            name: dept.name
        }));
    }, [departmentsResponse]);

    const teams = useMemo(() => {
        if (selectedDepartment !== "all" && departmentTeamsResponse?.value) {
            return departmentTeamsResponse.value.map(team => ({
                id: team.id,
                name: team.name
            }));
        }
        return [];
    }, [selectedDepartment, departmentTeamsResponse]);

    // Check if user has this role - check against role name in user.roles array
    const userHasRole = (user) => {
        // Check if user is in the list of users with this role (from API)
        if (usersWithRoleIds.has(user.id)) return true;
        
        // Check if roleName is in user's roles array
        if (roleName && user.roles && Array.isArray(user.roles)) {
            return user.roles.includes(roleName);
        }
        
        return false;
    };

    // Filter users based on department and team filters
    const filteredUsers = useMemo(() => {
        let filtered = usersData;
        
        // Apply search filter
        if (searchTerm) {
            filtered = filtered.filter(user => {
                const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
                const email = (user.email || "").toLowerCase();
                const search = searchTerm.toLowerCase();
                return fullName.includes(search) || email.includes(search);
            });
        }
        
        // Apply department filter
        if (selectedDepartment !== "all") {
            filtered = filtered.filter(user => {
                return user.departments?.some(dept => dept.id === selectedDepartment);
            });
        }
        
        // Apply team filter
        if (selectedTeam !== "all") {
            filtered = filtered.filter(user => {
                return user.teams?.some(team => team.id === selectedTeam);
            });
        }
        
        // Sort: users with role first, then users without role
        return filtered.sort((a, b) => {
            const aHasRole = userHasRole(a);
            const bHasRole = userHasRole(b);
            if (aHasRole && !bHasRole) return -1;
            if (!aHasRole && bHasRole) return 1;
            return 0; // Keep original order within each group
        });
    }, [usersData, searchTerm, selectedDepartment, selectedTeam, roleName, usersWithRoleIds]);

    // Group users by role assignment status
    const groupedUsers = useMemo(() => {
        const usersWithRole = filteredUsers.filter(user => userHasRole(user));
        const usersWithoutRole = filteredUsers.filter(user => !userHasRole(user));
        return { usersWithRole, usersWithoutRole };
    }, [filteredUsers, roleName, usersWithRoleIds]);

    // Pagination
    const totalItems = filteredUsers.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    
    // Get users for current page, split by groups
    const currentPageData = useMemo(() => {
        const usersWithRole = groupedUsers.usersWithRole;
        const usersWithoutRole = groupedUsers.usersWithoutRole;
        
        // Calculate which users to show on current page
        let pageUsersWithRole = [];
        let pageUsersWithoutRole = [];
        let showWithRoleHeader = false;
        let showWithoutRoleHeader = false;
        
        if (startIndex < usersWithRole.length) {
            // Some users with role are on this page
            const usersWithRoleStart = startIndex;
            const usersWithRoleEnd = Math.min(usersWithRole.length, endIndex);
            pageUsersWithRole = usersWithRole.slice(usersWithRoleStart, usersWithRoleEnd);
            showWithRoleHeader = usersWithRoleStart === 0 || (startIndex === 0);
        }
        
        const remainingSlots = itemsPerPage - pageUsersWithRole.length;
        if (remainingSlots > 0 && usersWithoutRole.length > 0) {
            // Calculate start index for users without role
            const usersWithoutRoleStart = Math.max(0, startIndex - usersWithRole.length);
            const usersWithoutRoleEnd = Math.min(usersWithoutRole.length, usersWithoutRoleStart + remainingSlots);
            
            if (usersWithoutRoleStart < usersWithoutRole.length) {
                pageUsersWithoutRole = usersWithoutRole.slice(usersWithoutRoleStart, usersWithoutRoleEnd);
                showWithoutRoleHeader = usersWithoutRoleStart === 0 || (startIndex >= usersWithRole.length);
            }
        }
        
        return {
            usersWithRole: pageUsersWithRole,
            usersWithoutRole: pageUsersWithoutRole,
            showWithRoleHeader: pageUsersWithRole.length > 0,
            showWithoutRoleHeader: pageUsersWithoutRole.length > 0
        };
    }, [groupedUsers, startIndex, endIndex, itemsPerPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedDepartment, selectedTeam]);

    // Reset team filter when department changes
    useEffect(() => {
        setSelectedTeam("all");
    }, [selectedDepartment]);

    // Handle add role
    const handleAddRole = async (userId) => {
        try {
            await assignUserToRole({ id: roleId, userId }).unwrap();
            toast.success(t('roles.assignUsersPage.addSuccess') || 'User added to role successfully');
            // Refetch both users list and role users list
            refetchUsers();
            refetchRoleUsers();
        } catch (error) {
            toast.error(error?.data?.errorMessage || t('roles.assignUsersPage.addError') || 'Failed to add user to role');
        }
    };

    // Handle remove role
    const handleRemoveRole = async (userId) => {
        try {
            await removeUserFromRole({ id: roleId, userId }).unwrap();
            toast.success(t('roles.assignUsersPage.removeSuccess') || 'User removed from role successfully');
            // Refetch both users list and role users list
            refetchUsers();
            refetchRoleUsers();
        } catch (error) {
            toast.error(error?.data?.errorMessage || t('roles.assignUsersPage.removeError') || 'Failed to remove user from role');
        }
    };

    if (isLoadingUsers) {
        return (
            <div className="flex items-center justify-center py-8" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
                <span className="text-[var(--sub-text-color)]">{t('common.loading') || 'Loading...'}</span>
            </div>
        );
    }

    return (
        <div className="flex flex-col" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
            {/* Enhanced Filters Section */}
            <div className="mb-6 flex-shrink-0">
                <div className="bg-[var(--container-color)] p-6 w-full rounded-2xl border-2 border-[var(--border-color)] shadow-md">
                    <div className="flex flex-wrap items-center gap-4">
                        {/* Search - Takes most space */}
                        <div className="flex-1 min-w-[280px]">
                            <div className="relative">
                                <div className={`absolute inset-y-0 ${isArabic ? 'right-3' : 'left-3'} flex items-center pointer-events-none`}>
                                    <Search 
                                        className="w-4 h-4"
                                        style={{ color: "var(--sub-text-color)" }}
                                    />
                                </div>
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder={t('roles.assignUsersPage.filters.search') || t('roles.searchUsers') || 'Search by name or email...'}
                                    className="w-full py-2.5 rounded-xl border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                                    style={{
                                        backgroundColor: "var(--input-bg)",
                                        borderColor: "var(--border-color)",
                                        color: "var(--text-color)",
                                        fontSize: "13px",
                                        direction: isArabic ? "rtl" : "ltr",
                                        paddingLeft: isArabic ? "1rem" : "2.5rem",
                                        paddingRight: isArabic ? "2.5rem" : "1rem",
                                    }}
                                />
                            </div>
                        </div>

                        {/* Filters Row */}
                        <div className="flex items-center gap-3 flex-wrap">
                            {/* Department Filter */}
                            <div className="flex items-center gap-2 bg-[var(--bg-color)] px-4 py-2 rounded-xl border-2 border-[var(--border-color)]">
                                <span className="text-sm font-semibold text-[var(--text-color)] whitespace-nowrap">
                                    {t('roles.assignUsersPage.filters.department') || 'Department'}:
                                </span>
                                <select
                                    value={selectedDepartment}
                                    onChange={(e) => setSelectedDepartment(e.target.value)}
                                    className="bg-transparent text-sm font-medium text-[var(--accent-color)] focus:outline-none cursor-pointer"
                                    dir={isArabic ? 'rtl' : 'ltr'}
                                >
                                    <option value="all">{t('roles.assignUsersPage.filters.all') || 'All'}</option>
                                    {departments.map(dept => (
                                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Team Filter */}
                            <div className="flex items-center gap-2 bg-[var(--bg-color)] px-4 py-2 rounded-xl border-2 border-[var(--border-color)]">
                                <span className="text-sm font-semibold text-[var(--text-color)] whitespace-nowrap">
                                    {t('roles.assignUsersPage.filters.team') || 'Team'}:
                                </span>
                                <select
                                    value={selectedTeam}
                                    onChange={(e) => setSelectedTeam(e.target.value)}
                                    className="bg-transparent text-sm font-medium text-[var(--accent-color)] focus:outline-none cursor-pointer disabled:opacity-50"
                                    dir={isArabic ? 'rtl' : 'ltr'}
                                    disabled={selectedDepartment === "all"}
                                >
                                    <option value="all">{t('roles.assignUsersPage.filters.all') || 'All'}</option>
                                    {teams.map(team => (
                                        <option key={team.id} value={team.id}>{team.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Pagination Info */}
                            <div className={`flex items-center gap-3 ml-auto ${isArabic ? 'flex-row-reverse' : ''}`}>
                                <span className="text-sm font-medium text-[var(--sub-text-color)] whitespace-nowrap">
                                    {t('leaves.table.page')} {currentPage} / {totalPages} ({totalItems} {t('leaves.table.entries')})
                                </span>
                                <div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                        className="w-9 h-9 rounded-xl bg-[var(--bg-color)] border-2 border-[var(--border-color)] hover:border-[var(--accent-color)] flex items-center justify-center transition-all hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                                    >
                                        <svg className="w-5 h-5 text-[var(--accent-color)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isArabic ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"} />
                                        </svg>
                                            </button>
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages || totalPages === 0}
                                        className="w-9 h-9 rounded-xl bg-[var(--bg-color)] border-2 border-[var(--border-color)] hover:border-[var(--accent-color)] flex items-center justify-center transition-all hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                                    >
                                        <svg className="w-5 h-5 text-[var(--accent-color)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isArabic ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"} />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Enhanced Table */}
            <div className="flex-1 overflow-auto rounded-2xl border-2 border-[var(--border-color)]">
                <table className="min-w-full w-full" style={{ background: "var(--bg-color)" }}>
                    <thead className="sticky top-0 z-10" style={{ background: "linear-gradient(135deg, var(--gradient-start), var(--gradient-end))" }}>
                        <tr>
                            <th className={`py-4 px-6 text-sm font-bold text-white ${isArabic ? 'text-right' : 'text-left'}`}>
                                {t('roles.assignUsersPage.table.name') || 'Name'}
                            </th>
                            <th className={`py-4 px-6 text-sm font-bold text-white ${isArabic ? 'text-right' : 'text-left'}`}>
                                {t('roles.assignUsersPage.table.email') || 'Email'}
                            </th>
                            <th className={`py-4 px-6 text-sm font-bold text-white ${isArabic ? 'text-right' : 'text-left'}`}>
                                {t('roles.assignUsersPage.table.department') || 'Department'}
                            </th>
                            <th className={`py-4 px-6 text-sm font-bold text-white ${isArabic ? 'text-right' : 'text-left'}`}>
                                {t('roles.assignUsersPage.table.team') || 'Team'}
                            </th>
                            <th className={`py-4 px-6 text-sm font-bold text-white ${isArabic ? 'text-right' : 'text-left'}`}>
                                {t('roles.assignUsersPage.table.actions') || 'Actions'}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="py-16 text-center">
                                    <div className="flex flex-col items-center gap-3">
                                        <Users className="w-16 h-16 text-[var(--sub-text-color)] opacity-50" />
                                        <span className="text-[var(--sub-text-color)] text-base font-medium" dir={isArabic ? 'rtl' : 'ltr'}>
                                            {t('roles.assignUsersPage.noUsers') || 'No users found'}
                                        </span>
                                        <span className="text-[var(--sub-text-color)] text-sm" dir={isArabic ? 'rtl' : 'ltr'}>
                                            {t('roles.assignUsersPage.tryDifferentFilters') || 'Try adjusting your filters'}
                                        </span>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            <>
                                {/* Users With Role Section */}
                                {currentPageData.showWithRoleHeader && (
                                    <tr className="sticky top-0 z-20">
                                        <td colSpan={5} className="py-4 px-6 bg-gradient-to-r from-[var(--accent-color)]/20 to-[var(--accent-color)]/10 border-b-2 border-[var(--accent-color)]/30">
                                            <div className={`flex items-center justify-between ${isArabic ? 'flex-row-reverse' : ''}`}>
                                                <div className={`flex items-center gap-3 ${isArabic ? 'flex-row-reverse' : ''}`}>
                                                    <div className="w-2 h-2 rounded-full bg-[var(--accent-color)]"></div>
                                                    <h3 className="text-sm font-bold text-[var(--text-color)] uppercase">
                                                        {t('roles.assignUsersPage.usersWithRole') || 'Users With Role'}
                                                    </h3>
                                                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-[var(--accent-color)]/20 text-[var(--accent-color)]">
                                                        {groupedUsers.usersWithRole.length}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                                
                                {currentPageData.usersWithRole.map((user, index) => (
                                    <tr 
                                        key={user.id}
                                        className="border-b border-[var(--border-color)] transition-all hover:bg-[var(--hover-color)] group"
                                        style={{ 
                                            background: 'var(--bg-color)'
                                        }}
                                    >
                                        <td className={`py-5 px-6 ${isArabic ? 'text-right' : 'text-left'}`}>
                                            <div className="flex items-center gap-3">

                                                <span className="font-semibold text-[var(--text-color)] text-sm">
                                                    {user.firstName} {user.lastName}
                                                </span>
                                            </div>
                                        </td>
                                        <td className={`py-5 px-6 text-[var(--sub-text-color)] text-sm ${isArabic ? 'text-right' : 'text-left'}`}>
                                            {user.email}
                                        </td>
                                        <td className={`py-5 px-6 text-[var(--text-color)] text-sm ${isArabic ? 'text-right' : 'text-left'}`}>
                                            {user.departmentNames && user.departmentNames.length > 0 ? (
                                                <div className={`flex flex-wrap items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                                                    {user.departmentNames.map((dept, idx) => (
                                                        <div key={idx} className={`flex items-center gap-1.5 ${isArabic ? 'flex-row-reverse' : ''}`}>
                                                            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: '#09D1C7' }}></div>
                                                            <span className="text-xs font-medium text-[var(--text-color)]">
                                                                {dept}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-[var(--sub-text-color)]">-</span>
                                            )}
                                        </td>
                                        <td className={`py-5 px-6 text-[var(--text-color)] text-sm ${isArabic ? 'text-right' : 'text-left'}`}>
                                            {user.teamNames && user.teamNames.length > 0 ? (
                                                <div className={`flex flex-wrap items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                                                    {user.teamNames.map((team, idx) => (
                                                        <div key={idx} className={`flex items-center gap-1.5 ${isArabic ? 'flex-row-reverse' : ''}`}>
                                                            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: '#09D1C7' }}></div>
                                                            <span className="text-xs font-medium text-[var(--text-color)]">
                                                                {team}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-[var(--sub-text-color)]">-</span>
                                            )}
                                        </td>
                                        <td className="py-5 px-6">
                                            <div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse justify-end' : 'justify-start'}`}>
                                                <button
                                                    onClick={() => handleRemoveRole(user.id)}
                                                    disabled={isRemoving}
                                                    className="flex items-center gap-2 px-4 py-2 bg-[var(--error-color)]/10 text-[var(--error-color)] border-2 border-[var(--error-color)]/20 hover:bg-[var(--error-color)]/20 hover:border-[var(--error-color)]/40 rounded-xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 font-medium text-sm"
                                                    aria-label={t('roles.assignUsersPage.removeRole') || 'Remove Role'}
                                                >
                                                    <UserMinus className="w-4 h-4" />
                                                    <span className="whitespace-nowrap">{t('roles.assignUsersPage.remove') || 'Remove'}</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                
                                {/* Users Without Role Section */}
                                {currentPageData.showWithoutRoleHeader && (
                                    <tr className="sticky top-0 z-20">
                                        <td colSpan={5} className="py-4 px-6 bg-gradient-to-r from-[var(--sub-text-color)]/10 to-[var(--sub-text-color)]/5 border-b-2 border-[var(--border-color)] border-t-2 border-[var(--border-color)]">
                                            <div className={`flex items-center justify-between ${isArabic ? 'flex-row-reverse' : ''}`}>
                                                <div className={`flex items-center gap-3 ${isArabic ? 'flex-row-reverse' : ''}`}>
                                                    <div className="w-2 h-2 rounded-full bg-[var(--sub-text-color)]"></div>
                                                    <h3 className="text-sm font-bold text-[var(--text-color)] uppercase">
                                                        {t('roles.assignUsersPage.usersWithoutRole') || 'Users Without Role'}
                                                    </h3>
                                                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-[var(--sub-text-color)]/20 text-[var(--sub-text-color)]">
                                                        {groupedUsers.usersWithoutRole.length}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                                
                                {currentPageData.usersWithoutRole.map((user, index) => (
                                    <tr 
                                        key={user.id}
                                        className="border-b border-[var(--border-color)] transition-all hover:bg-[var(--hover-color)] group"
                                        style={{ 
                                            background: 'var(--container-color)'
                                        }}
                                    >
                                        <td className={`py-5 px-6 ${isArabic ? 'text-right' : 'text-left'}`}>
                                            <div className="flex items-center gap-3">
                                    
                                                <span className="font-semibold text-[var(--text-color)] text-sm">
                                                    {user.firstName} {user.lastName}
                                                </span>
                                            </div>
                                        </td>
                                        <td className={`py-5 px-6 text-[var(--sub-text-color)] text-sm ${isArabic ? 'text-right' : 'text-left'}`}>
                                            {user.email}
                                        </td>
                                        <td className={`py-5 px-6 text-[var(--text-color)] text-sm ${isArabic ? 'text-right' : 'text-left'}`}>
                                            {user.departmentNames && user.departmentNames.length > 0 ? (
                                                <div className={`flex flex-wrap items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                                                    {user.departmentNames.map((dept, idx) => (
                                                        <div key={idx} className={`flex items-center gap-1.5 ${isArabic ? 'flex-row-reverse' : ''}`}>
                                                            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: '#09D1C7' }}></div>
                                                            <span className="text-xs font-medium text-[var(--text-color)]">
                                                                {dept}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-[var(--sub-text-color)]">-</span>
                                            )}
                                        </td>
                                        <td className={`py-5 px-6 text-[var(--text-color)] text-sm ${isArabic ? 'text-right' : 'text-left'}`}>
                                            {user.teamNames && user.teamNames.length > 0 ? (
                                                <div className={`flex flex-wrap items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                                                    {user.teamNames.map((team, idx) => (
                                                        <div key={idx} className={`flex items-center gap-1.5 ${isArabic ? 'flex-row-reverse' : ''}`}>
                                                            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: '#09D1C7' }}></div>
                                                            <span className="text-xs font-medium text-[var(--text-color)]">
                                                                {team}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-[var(--sub-text-color)]">-</span>
                                            )}
                                        </td>
                                        <td className="py-5 px-6">
                                            <div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse justify-end' : 'justify-start'}`}>
                                                <button
                                                    onClick={() => handleAddRole(user.id)}
                                                    disabled={isAssigning}
                                                    className="flex items-center gap-2 px-4 py-2 bg-[var(--accent-color)]/10 text-[var(--accent-color)] border-2 border-[var(--accent-color)]/20 hover:bg-[var(--accent-color)]/20 hover:border-[var(--accent-color)]/40 rounded-xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 font-medium text-sm"
                                                    aria-label={t('roles.assignUsersPage.addRole') || 'Add Role'}
                                                >
                                                    <UserPlus className="w-4 h-4" />
                                                    <span className="whitespace-nowrap">{t('roles.assignUsersPage.add') || 'Add'}</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AssignRoleUsersTable;

