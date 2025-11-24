import React, { useState, useMemo, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Check, Users, Search, User, Crown, XCircle, Loader2, Filter, X, ChevronDown } from "lucide-react";
import { useGetAllUsersQuery } from "../../../../services/apis/UserApi";
import { useGetAllDepartmentsQuery } from "../../../../services/apis/DepartmentApi";
import { useGetTeamsByDepartmentQuery } from "../../../../services/apis/TeamApi";
import { useGetAllRolesQuery, useGetRoleUsersQuery } from "../../../../services/apis/RoleApi";
import { useCreateTeamMutation, useAddUsersToTeamMutation } from "../../../../services/apis/TeamApi";
import toast from "react-hot-toast";

export default function NewTeamForm({ departmentId: initialDepartmentId }) {
    const { t, i18n } = useTranslation();
    const isArabic = i18n.language === "ar";
    const navigate = useNavigate();
    
    const [newTeam, setNewTeam] = useState({ 
        name: '', 
        description: '', 
        selectedEmployees: [],
        teamLeader: null
    });
    
    // Filter states
    const [selectedDepartment, setSelectedDepartment] = useState(initialDepartmentId || "all");
    const [selectedTeam, setSelectedTeam] = useState("all");
    const [selectedRole, setSelectedRole] = useState("all");
    const [nameSearch, setNameSearch] = useState("");
    
    // Pagination for dropdowns
    const [leaderPage, setLeaderPage] = useState(1);
    const [membersPage, setMembersPage] = useState(1);
    const itemsPerPage = 15;
    
    // Dropdown states
    const [isLeaderDropdownOpen, setIsLeaderDropdownOpen] = useState(false);
    const [isMembersDropdownOpen, setIsMembersDropdownOpen] = useState(false);
    const [isDepartmentFilterOpen, setIsDepartmentFilterOpen] = useState(false);
    const [isTeamFilterOpen, setIsTeamFilterOpen] = useState(false);
    const [isRoleFilterOpen, setIsRoleFilterOpen] = useState(false);
    
    const leaderDropdownRef = useRef(null);
    const membersDropdownRef = useRef(null);
    const departmentFilterRef = useRef(null);
    const teamFilterRef = useRef(null);
    const roleFilterRef = useRef(null);

    // Fetch data - Use correct endpoints based on filters
    // When role is selected, use GetRoleUsers endpoint (correct API)
    // When no role, use GetAllUsers endpoint
    const { data: roleUsersData, isLoading: isLoadingRoleUsers } = useGetRoleUsersQuery(
        { id: selectedRole, pageNumber: 1, pageSize: 500 },
        { skip: selectedRole === "all" || !selectedRole }
    );
    
    const { data: usersData, isLoading: isLoadingAllUsers } = useGetAllUsersQuery(
        { 
            departmentId: selectedDepartment !== "all" ? selectedDepartment : undefined,
            name: nameSearch || undefined,
            pageNumber: 1, 
            pageSize: 500 
        },
        { skip: selectedRole !== "all" } // Skip when role is selected (use role users instead)
    );
    
    const { data: departmentsData } = useGetAllDepartmentsQuery({ pageNumber: 1, pageSize: 100 });
    const { data: teamsData } = useGetTeamsByDepartmentQuery(selectedDepartment !== "all" ? selectedDepartment : null, {
        skip: selectedDepartment === "all"
    });
    // Only fetch active roles (status: 0 = active)
    const { data: rolesData } = useGetAllRolesQuery({ pageNumber: 1, pageSize: 100, status: 0 });
    
    // Combine users from both endpoints
    const allUsers = useMemo(() => {
        let items = [];
        
        if (selectedRole !== "all" && selectedRole) {
            // Use role users endpoint when role is selected
            items = roleUsersData?.value || roleUsersData?.data || roleUsersData?.items || roleUsersData || [];
            // Extract user objects from role users response (might be { userId, user } structure)
            items = items.map(item => {
                // Handle different response structures
                if (item?.user) {
                    return { ...item.user, userId: item.userId || item.user.id };
                }
                return item;
            });
        } else {
            // Use all users endpoint when no role filter
            items = usersData?.value || usersData?.data || usersData?.items || usersData || [];
        }
        
        return Array.isArray(items) ? items : [];
    }, [usersData, roleUsersData, selectedRole]);
    
    const isLoadingUsers = selectedRole !== "all" ? isLoadingRoleUsers : isLoadingAllUsers;
    
    const departments = useMemo(() => {
        const items = departmentsData?.value || departmentsData?.data || departmentsData?.items || departmentsData || [];
        return Array.isArray(items) ? items : [];
    }, [departmentsData]);
    
    const teams = useMemo(() => {
        const items = teamsData?.value || teamsData?.data || teamsData?.items || teamsData || [];
        return Array.isArray(items) ? items : [];
    }, [teamsData]);
    
    const roles = useMemo(() => {
        const items = rolesData?.value || rolesData?.data || rolesData?.items || rolesData || [];
        return Array.isArray(items) ? items : [];
    }, [rolesData]);

    // Filter users by department and name search (client-side)
    // Role filtering is now done via API endpoint (useGetRoleUsersQuery)
    const filteredUsers = useMemo(() => {
        let filtered = allUsers;
        
        // Filter by department if selected (when using GetAllUsers, API already filters, but double-check)
        // Filter by name search (client-side for better UX)
        if (nameSearch.trim()) {
            const search = nameSearch.toLowerCase();
            filtered = filtered.filter(user => {
                const name = getUserDisplayName(user).toLowerCase();
                const email = (user?.email || '').toLowerCase();
                const username = (user?.userName || user?.username || '').toLowerCase();
                return name.includes(search) || email.includes(search) || username.includes(search);
            });
        }
        
        return filtered;
    }, [allUsers, nameSearch]);

    // Filter users for team leader (exclude already selected team leader)
    const availableLeaderUsers = useMemo(() => {
        return filteredUsers.filter(user => {
            const userId = user?.id || user?.userId;
            const teamLeaderId = newTeam.teamLeader?.id || newTeam.teamLeader?.userId;
            return userId !== teamLeaderId;
        });
    }, [filteredUsers, newTeam.teamLeader]);

    // Filter users for members (exclude team leader and already selected members)
    const availableMemberUsers = useMemo(() => {
        const teamLeaderId = newTeam.teamLeader?.id || newTeam.teamLeader?.userId;
        const selectedMemberIds = new Set(
            newTeam.selectedEmployees.map(emp => emp?.id || emp?.userId).filter(Boolean)
        );
        
        return filteredUsers.filter(user => {
            const userId = user?.id || user?.userId;
            return userId !== teamLeaderId && !selectedMemberIds.has(userId);
        });
    }, [filteredUsers, newTeam.teamLeader, newTeam.selectedEmployees]);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (leaderDropdownRef.current && !leaderDropdownRef.current.contains(event.target)) {
                setIsLeaderDropdownOpen(false);
            }
            if (membersDropdownRef.current && !membersDropdownRef.current.contains(event.target)) {
                setIsMembersDropdownOpen(false);
            }
            if (departmentFilterRef.current && !departmentFilterRef.current.contains(event.target)) {
                setIsDepartmentFilterOpen(false);
            }
            if (teamFilterRef.current && !teamFilterRef.current.contains(event.target)) {
                setIsTeamFilterOpen(false);
            }
            if (roleFilterRef.current && !roleFilterRef.current.contains(event.target)) {
                setIsRoleFilterOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const [createTeam, { isLoading: isCreating }] = useCreateTeamMutation();
    const [addUsersToTeam, { isLoading: isAddingUsers }] = useAddUsersToTeamMutation();

    const toggleEmployee = (employee) => {
        const employeeId = employee?.id || employee?.userId;
        if (!employeeId) return;
        
        setNewTeam(prev => {
            const isAlreadySelected = prev.selectedEmployees.some(emp => {
                const empId = emp?.id || emp?.userId;
                return String(empId) === String(employeeId);
            });
            
            if (isAlreadySelected) {
                return {
                    ...prev,
                    selectedEmployees: prev.selectedEmployees.filter(emp => {
                        const empId = emp?.id || emp?.userId;
                        return String(empId) !== String(employeeId);
                    })
                };
            } else {
                return {
                    ...prev,
                    selectedEmployees: [...prev.selectedEmployees, employee]
                };
            }
        });
    };

    const selectTeamLeader = (leader) => {
        setNewTeam(prev => ({ ...prev, teamLeader: leader }));
        setIsLeaderDropdownOpen(false);
        setLeaderPage(1); // Reset pagination
    };
    
    // Reset pagination when filters change
    useEffect(() => {
        setLeaderPage(1);
    }, [selectedRole, nameSearch, selectedDepartment]);
    
    useEffect(() => {
        setMembersPage(1);
    }, [selectedRole, nameSearch, selectedDepartment]);

    const removeTeamLeader = () => {
        setNewTeam(prev => ({ ...prev, teamLeader: null }));
    };

    const removeEmployee = (employeeId) => {
        setNewTeam(prev => ({
            ...prev,
            selectedEmployees: prev.selectedEmployees.filter(emp => {
                const empId = emp?.id || emp?.userId;
                return String(empId) !== String(employeeId);
            })
        }));
    };

    const handleAddTeam = async () => {
        const teamLeadId = newTeam.teamLeader?.id || newTeam.teamLeader?.userId;
        const finalDepartmentId = selectedDepartment !== "all" ? selectedDepartment : initialDepartmentId;
        
        if (!newTeam.name.trim()) {
            toast.error(t("allTeams.addTeam.errors.nameRequired", "Please enter a team name"));
            return;
        }
        if (!finalDepartmentId) {
            toast.error(t("allTeams.addTeam.errors.departmentRequired", "Please select a department"));
            return;
        }
        if (!teamLeadId) {
            toast.error(t("allTeams.addTeam.errors.leaderRequired", "Please select a team leader"));
            return;
        }
        
        try {
            // Step 1: Create the team
            const payload = {
                name: newTeam.name.trim(),
                description: newTeam.description?.trim() || '',
                teamLeadId,
                departmentId: finalDepartmentId,
            };
            
            toast.loading(t("allTeams.addTeam.creating", "Creating team..."), { id: 'create-team' });
            const teamResult = await createTeam(payload).unwrap();
            const createdTeam = teamResult?.value || teamResult;
            const createdTeamId = createdTeam?.id;
            
            if (!createdTeamId) {
                throw new Error('Team was created but no team ID was returned');
            }

            toast.dismiss('create-team');
            toast.success(t("allTeams.addTeam.teamCreated", "Team created successfully!"));

            // Step 2: Add team members
            if (newTeam.selectedEmployees.length > 0) {
                const userIds = newTeam.selectedEmployees
                    .map(member => member?.id || member?.userId)
                    .filter(Boolean);
                
                if (userIds.length > 0) {
                    try {
                        toast.loading(t("allTeams.addTeam.addingMembers", "Adding members..."), { id: 'add-members' });
                        await addUsersToTeam({ 
                            teamId: createdTeamId, 
                            userIds,
                            departmentId: finalDepartmentId
                        }).unwrap();
                        toast.dismiss('add-members');
                        toast.success(t("allTeams.addTeam.membersAdded", "Members added successfully!"));
                    } catch (addUsersError) {
                        toast.dismiss('add-members');
                        const errorMsg = addUsersError?.data?.errorMessage || 
                                       addUsersError?.data?.message || 
                                       addUsersError?.message || 
                                       t("allTeams.addTeam.errors.addMembersFailed", "Failed to add members");
                        toast.error(errorMsg);
                    }
                }
            }

            // Navigate back to teams page
            setTimeout(() => {
                navigate(`/pages/admin/all-teams?departmentId=${finalDepartmentId}`);
            }, 1000);
        } catch (error) {
            toast.dismiss('create-team');
            const errorMessage = error?.data?.errorMessage || 
                               error?.data?.message || 
                               error?.message || 
                               t("allTeams.addTeam.errors.createFailed", "Failed to create team. Please try again.");
            toast.error(errorMessage);
        }
    };

    const getUserDisplayName = (user) => {
        return user?.name || 
               (user?.firstName || user?.lastName ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '') ||
               user?.email || 
               user?.userName || 
               'Unknown';
    };

    const getUserDisplayInfo = (user) => {
        return user?.email || user?.userName || user?.jobTitle || '';
    };

    return (
        <div className="space-y-6" dir={isArabic ? "rtl" : "ltr"}>
            {/* Enhanced Header with Gradient Background */}
            <div className="relative overflow-hidden">
                {/* Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent-color)]/5 via-[var(--accent-color)]/10 to-transparent rounded-2xl"></div>
                
                <div className={`relative flex items-center justify-between p-6 ${isArabic ? 'flex-row-reverse' : ''}`}>
                    <div className={`flex items-center gap-4 ${isArabic ? 'flex-row-reverse' : ''}`}>
                        <button
                            onClick={() => navigate(-1)}
                            className="group p-3 hover:bg-[var(--bg-color)] rounded-xl transition-all duration-200 border border-transparent hover:border-[var(--border-color)] hover:shadow-md"
                            aria-label={t("common.back", "Back")}
                        >
                            <ArrowLeft className={`w-5 h-5 text-[var(--text-color)] transition-transform group-hover:scale-110 ${isArabic ? 'rotate-180' : ''}`} />
                        </button>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="text-3xl font-bold bg-gradient-to-r from-[var(--text-color)] to-[var(--accent-color)] bg-clip-text text-transparent">
                                    {t("departments.newDepartmentForm.setupTeams.addNewTeam", "Add New Team")}
                                </h1>
                                <div className="px-3 py-1 rounded-full bg-[var(--accent-color)]/10 border border-[var(--accent-color)]/20">
                                    <span className="text-xs font-semibold text-[var(--accent-color)]">
                                        {t("allTeams.addTeam.new", "New")}
                                    </span>
                                </div>
                            </div>
                            <p className="text-sm text-[var(--sub-text-color)]">
                                {t("allTeams.addTeam.subtitle", "Create a new team and assign members")}
                            </p>
                        </div>
                    </div>
                    
                    {/* Progress Indicator */}
                    <div className={`hidden md:flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                            newTeam.teamLeader ? 'bg-[var(--approved-leave-box-bg)] border border-[var(--success-color)]/30' : 'bg-[var(--container-color)]/30 border border-[var(--border-color)]'
                        }`}>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                newTeam.teamLeader ? 'bg-[var(--success-color)] text-white' : 'bg-[var(--accent-color)]/10 text-[var(--accent-color)]'
                            }`}>
                                {newTeam.teamLeader ? '✓' : '1'}
                            </div>
                            <span className="text-xs font-medium text-[var(--text-color)]">{t("allTeams.addTeam.steps.leader", "Leader")}</span>
                        </div>
                        <div className="w-8 h-0.5 bg-[var(--border-color)]"></div>
                        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                            newTeam.selectedEmployees.length > 0 ? 'bg-[var(--approved-leave-box-bg)] border border-[var(--success-color)]/30' : 'bg-[var(--container-color)]/30 border border-[var(--border-color)]'
                        }`}>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                newTeam.selectedEmployees.length > 0 ? 'bg-[var(--success-color)] text-white' : 'bg-[var(--accent-color)]/10 text-[var(--accent-color)]'
                            }`}>
                                {newTeam.selectedEmployees.length > 0 ? '✓' : '2'}
                            </div>
                            <span className="text-xs font-medium text-[var(--text-color)]">{t("allTeams.addTeam.steps.members", "Members")}</span>
                        </div>
                        <div className="w-8 h-0.5 bg-[var(--border-color)]"></div>
                        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                            newTeam.name.trim() && selectedDepartment !== "all" ? 'bg-[var(--approved-leave-box-bg)] border border-[var(--success-color)]/30' : 'bg-[var(--container-color)]/30 border border-[var(--border-color)]'
                        }`}>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                newTeam.name.trim() && selectedDepartment !== "all" ? 'bg-[var(--success-color)] text-white' : 'bg-[var(--accent-color)]/10 text-[var(--accent-color)]'
                            }`}>
                                {newTeam.name.trim() && selectedDepartment !== "all" ? '✓' : '3'}
                            </div>
                            <span className="text-xs font-medium text-[var(--text-color)]">{t("allTeams.addTeam.steps.info", "Info")}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Form */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Section 1: Team Leader - Enhanced Design */}
                    <div className="group bg-gradient-to-br from-[var(--bg-color)] to-[var(--container-color)]/20 rounded-2xl p-6 border-2 border-[var(--border-color)] hover:border-[var(--accent-color)]/30 transition-all duration-300 shadow-sm hover:shadow-md">
                        <div className={`flex items-center justify-between mb-4 ${isArabic ? 'flex-row-reverse' : ''}`}>
                            <div className={`flex items-center gap-3 ${isArabic ? 'flex-row-reverse' : ''}`}>
                                <div className="relative">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent-color)] to-[var(--accent-color)]/70 flex items-center justify-center shadow-lg">
                                        <Crown className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[var(--accent-color)] border-2 border-[var(--bg-color)] flex items-center justify-center">
                                        <span className="text-[10px] font-bold text-white">1</span>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-[var(--text-color)] flex items-center gap-2">
                                        {t("allTeams.addTeam.sections.teamLeader", "Team Leader")} 
                                        <span className="text-red-500 text-sm">*</span>
                                    </h3>
                                    <p className="text-xs text-[var(--sub-text-color)]">
                                        {t("allTeams.addTeam.hints.leader", "Select who will lead this team")}
                                    </p>
                                </div>
                            </div>
                            {newTeam.teamLeader && (
                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--approved-leave-box-bg)] border border-[var(--success-color)]/30">
                                    <Check className="w-3 h-3 text-[var(--success-color)]" />
                                    <span className="text-xs font-semibold text-[var(--success-color)]">
                                        {t("allTeams.addTeam.selected", "Selected")}
                                    </span>
                                </div>
                            )}
                        </div>
                        
                        {newTeam.teamLeader ? (
                            <div className="relative group/card">
                                <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent-color)]/5 to-transparent rounded-xl"></div>
                                <div className={`relative flex items-center justify-between p-4 bg-[var(--bg-color)] rounded-xl border-2 border-[var(--accent-color)]/20 hover:border-[var(--accent-color)]/40 transition-all duration-200 ${isArabic ? 'flex-row-reverse' : ''}`}>
                                    <div className={`flex items-center gap-4 flex-1 min-w-0 ${isArabic ? 'flex-row-reverse' : ''}`}>
                                        <div className="relative">
                                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[var(--accent-color)]/20 to-[var(--accent-color)]/10 flex items-center justify-center flex-shrink-0 ring-2 ring-[var(--accent-color)]/20 shadow-md">
                                                {newTeam.teamLeader?.avatar ? (
                                                    <img src={newTeam.teamLeader.avatar} alt={getUserDisplayName(newTeam.teamLeader)} className="w-full h-full rounded-xl object-cover" />
                                                ) : (
                                                    <Crown className="w-7 h-7 text-[var(--accent-color)]" />
                                                )}
                                            </div>
                                            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-[var(--accent-color)] flex items-center justify-center shadow-lg">
                                                <Crown className="w-3.5 h-3.5 text-white" />
                                            </div>
                                        </div>
                                        <div className={`flex-1 min-w-0 ${isArabic ? 'text-right' : 'text-left'}`}>
                                            <p className="text-base font-bold text-[var(--text-color)] truncate mb-0.5">
                                                {getUserDisplayName(newTeam.teamLeader)}
                                            </p>
                                            {getUserDisplayInfo(newTeam.teamLeader) && (
                                                <p className="text-sm text-[var(--sub-text-color)] truncate flex items-center gap-1.5">
                                                    {getUserDisplayInfo(newTeam.teamLeader)}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-1.5 mt-1.5">
                                                <span className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-[var(--accent-color)]/10 text-[var(--accent-color)] border border-[var(--accent-color)]/20">
                                                    {t("allTeams.addTeam.teamLeaderRole", "Team Leader")}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={removeTeamLeader}
                                        className="p-2.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-200 flex-shrink-0 group/btn border border-transparent hover:border-red-200 dark:hover:border-red-800/30"
                                        disabled={isCreating || isAddingUsers}
                                        title={t("allTeams.addTeam.removeLeader", "Remove leader")}
                                    >
                                        <XCircle className="w-5 h-5 text-[var(--sub-text-color)] group-hover/btn:text-red-500 transition-colors" />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="relative" ref={leaderDropdownRef}>
                                <button
                                    type="button"
                                    onClick={() => setIsLeaderDropdownOpen(!isLeaderDropdownOpen)}
                                    className="group/btn w-full px-6 py-4 border-2 border-dashed border-[var(--border-color)] rounded-xl bg-[var(--bg-color)] text-[var(--sub-text-color)] hover:border-[var(--accent-color)] hover:bg-[var(--accent-color)]/5 transition-all flex items-center justify-between shadow-sm hover:shadow-md"
                                    disabled={isCreating || isAddingUsers || isLoadingUsers}
                                >
                                    <div className={`flex items-center gap-3 ${isArabic ? 'flex-row-reverse' : ''}`}>
                                        <div className="w-10 h-10 rounded-xl bg-[var(--accent-color)]/10 flex items-center justify-center group-hover/btn:bg-[var(--accent-color)]/20 transition-colors">
                                            <User className="w-5 h-5 text-[var(--accent-color)]" />
                                        </div>
                                        <div className={`${isArabic ? 'text-right' : 'text-left'}`}>
                                            <span className="text-sm font-semibold text-[var(--text-color)] block">
                                                {t("allTeams.addTeam.selectLeader", "Select Team Leader")}
                                            </span>
                                            <span className="text-xs text-[var(--sub-text-color)]">
                                                {t("allTeams.addTeam.clickToSelect", "Click to browse available users")}
                                            </span>
                                        </div>
                                    </div>
                                    <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${isLeaderDropdownOpen ? 'rotate-180 text-[var(--accent-color)]' : 'text-[var(--sub-text-color)]'}`} />
                                </button>
                                
                                {isLeaderDropdownOpen && (
                                    <div className="absolute top-full left-0 right-0 z-30 mt-2 bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl shadow-2xl overflow-hidden flex flex-col" style={{ maxHeight: '500px' }}>
                                        {/* Filters Bar */}
                                        <div className="p-4 border-b border-[var(--border-color)] bg-gradient-to-r from-[var(--container-color)]/40 to-[var(--container-color)]/20 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-color)]">
                                                        <Filter className="w-4 h-4 text-[var(--accent-color)]" />
                                                        <span>{t("allTeams.addTeam.filters", "Filters")}</span>
                                                    </div>
                                                    {availableLeaderUsers.length > 0 && (
                                                        <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-[var(--accent-color)]/10 text-[var(--accent-color)] border border-[var(--accent-color)]/20">
                                                            {availableLeaderUsers.length} {t("allTeams.addTeam.available", "available")}
                                                        </span>
                                                    )}
                                                </div>
                                                {(selectedRole !== "all" || nameSearch.trim()) && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedRole("all");
                                                            setNameSearch("");
                                                        }}
                                                        className="text-xs text-[var(--accent-color)] hover:underline flex items-center gap-1 transition-colors"
                                                    >
                                                        <X className="w-3 h-3" />
                                                        {t("allTeams.addTeam.clearFilters", "Clear")}
                                                    </button>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                {/* Role Filter */}
                                                <div className="relative" ref={roleFilterRef}>
                                                    <button
                                                        type="button"
                                                        onClick={() => setIsRoleFilterOpen(!isRoleFilterOpen)}
                                                        className="w-full px-3 py-2 text-xs border border-[var(--border-color)] rounded-lg bg-[var(--bg-color)] text-[var(--text-color)] hover:border-[var(--accent-color)]/50 transition-all flex items-center justify-between"
                                                    >
                                                        <span className="truncate">
                                                            {selectedRole === "all" 
                                                                ? t("allTeams.addTeam.allRoles", "All Roles")
                                                                : roles.find(r => r.id === selectedRole)?.name || "Unknown"}
                                                        </span>
                                                        <ChevronDown className={`w-3 h-3 transition-transform ${isRoleFilterOpen ? 'rotate-180' : ''}`} />
                                                    </button>
                                                    {isRoleFilterOpen && (
                                                        <div className="absolute top-full left-0 right-0 z-40 mt-1 bg-[var(--bg-color)] border border-[var(--border-color)] rounded-lg shadow-xl max-h-48 overflow-y-auto">
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setSelectedRole("all");
                                                                    setIsRoleFilterOpen(false);
                                                                }}
                                                                className={`w-full p-2 text-xs ${isArabic ? 'text-right' : 'text-left'} hover:bg-[var(--hover-color)] ${
                                                                    selectedRole === "all" ? 'bg-[var(--accent-color)]/10' : ''
                                                                }`}
                                                            >
                                                                {t("allTeams.addTeam.allRoles", "All Roles")}
                                                            </button>
                                                            {roles.map(role => (
                                                                <button
                                                                    key={role.id}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setSelectedRole(role.id);
                                                                        setIsRoleFilterOpen(false);
                                                                    }}
                                                                    className={`w-full p-2 text-xs ${isArabic ? 'text-right' : 'text-left'} hover:bg-[var(--hover-color)] ${
                                                                        selectedRole === role.id ? 'bg-[var(--accent-color)]/10' : ''
                                                                    }`}
                                                                >
                                                                    {role.name}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                {/* Name Search */}
                                                <div className="relative">
                                                    <Search className={`absolute ${isArabic ? 'right-2' : 'left-2'} top-1/2 -translate-y-1/2 w-3 h-3 text-[var(--sub-text-color)]`} />
                                                    <input
                                                        type="text"
                                                        value={nameSearch}
                                                        onChange={(e) => setNameSearch(e.target.value)}
                                                        placeholder={t("allTeams.addTeam.searchName", "Search by name...")}
                                                        className={`w-full ${isArabic ? 'pr-8 pl-2' : 'pl-8 pr-2'} py-2 text-xs border border-[var(--border-color)] rounded-lg bg-[var(--bg-color)] text-[var(--text-color)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-color)]`}
                                                        dir={isArabic ? 'rtl' : 'ltr'}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Users List with Pagination */}
                                        <div className="flex flex-col flex-1 min-h-0">
                                            {isLoadingUsers ? (
                                                <div className="p-6 flex items-center justify-center">
                                                    <Loader2 className="w-5 h-5 text-[var(--accent-color)] animate-spin" />
                                                </div>
                                            ) : (() => {
                                                // Name search is already applied in filteredUsers, so just use availableLeaderUsers
                                                // Pagination
                                                const totalPages = Math.ceil(availableLeaderUsers.length / itemsPerPage);
                                                const startIndex = (leaderPage - 1) * itemsPerPage;
                                                const endIndex = startIndex + itemsPerPage;
                                                const paginatedUsers = availableLeaderUsers.slice(startIndex, endIndex);
                                                
                                                return (
                                                    <>
                                                        {/* Users List */}
                                                        <div className="overflow-y-auto flex-1 min-h-0">
                                                            {paginatedUsers.length > 0 ? (
                                                                <div className="divide-y divide-[var(--border-color)]">
                                                                    {paginatedUsers.map(user => (
                                                                        <button
                                                                            key={user?.id || user?.userId}
                                                                            type="button"
                                                                            onClick={() => selectTeamLeader(user)}
                                                                            className={`w-full p-3 hover:bg-[var(--hover-color)] transition-colors ${isArabic ? 'text-right' : 'text-left'} group`}
                                                                        >
                                                                            <div className="flex items-center gap-3">
                                                                                <div className="relative">
                                                                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[var(--accent-color)]/20 to-[var(--accent-color)]/10 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform ring-2 ring-transparent group-hover:ring-[var(--accent-color)]/20">
                                                                                        {user?.avatar ? (
                                                                                            <img src={user.avatar} alt={getUserDisplayName(user)} className="w-full h-full rounded-lg object-cover" />
                                                                                        ) : (
                                                                                            <User className="w-5 h-5 text-[var(--accent-color)]" />
                                                                                        )}
                                                                                    </div>
                                                                                    {user?.roles && Array.isArray(user.roles) && user.roles.length > 0 && (
                                                                                        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[var(--accent-color)] border-2 border-[var(--bg-color)] flex items-center justify-center">
                                                                                            <Crown className="w-2.5 h-2.5 text-white" />
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                                <div className="flex-1 min-w-0">
                                                                                    <div className="flex items-center gap-2">
                                                                                        <p className="text-sm font-semibold text-[var(--text-color)] truncate">
                                                                                            {getUserDisplayName(user)}
                                                                                        </p>
                                                                                        {user?.roles && Array.isArray(user.roles) && user.roles.length > 0 && (
                                                                                            <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-[var(--accent-color)]/10 text-[var(--accent-color)] border border-[var(--accent-color)]/20">
                                                                                                {user.roles[0]}
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                    {getUserDisplayInfo(user) && (
                                                                                        <p className="text-xs text-[var(--sub-text-color)] truncate mt-0.5">
                                                                                            {getUserDisplayInfo(user)}
                                                                                        </p>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                            <div className="p-6 text-center text-sm text-[var(--sub-text-color)]">
                                                                {availableLeaderUsers.length === 0 && filteredUsers.length > 0
                                                                    ? t("allTeams.addTeam.noUsersMatch", "No users match your filters")
                                                                    : t("allTeams.addTeam.noUsers", "No users available")}
                                                            </div>
                                                            )}
                                                        </div>
                                                        
                                                        {/* Pagination Controls */}
                                                        {totalPages > 1 && (
                                                            <div className={`p-3 border-t border-[var(--border-color)] bg-[var(--container-color)]/30 flex items-center justify-between ${isArabic ? 'flex-row-reverse' : ''}`}>
                                                            <span className="text-xs text-[var(--sub-text-color)]">
                                                                {t("allTeams.addTeam.showing", "Showing")} {startIndex + 1}-{Math.min(endIndex, availableLeaderUsers.length)} {t("allTeams.addTeam.of", "of")} {availableLeaderUsers.length}
                                                            </span>
                                                                <div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setLeaderPage(prev => Math.max(1, prev - 1));
                                                                        }}
                                                                        disabled={leaderPage === 1}
                                                                        className="p-1.5 rounded-lg border border-[var(--border-color)] hover:bg-[var(--hover-color)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                                    >
                                                                        <ChevronDown className={`w-4 h-4 text-[var(--text-color)] ${isArabic ? 'rotate-90' : '-rotate-90'}`} />
                                                                    </button>
                                                                    <span className="text-xs text-[var(--text-color)] font-medium px-2">
                                                                        {leaderPage} / {totalPages}
                                                                    </span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setLeaderPage(prev => Math.min(totalPages, prev + 1));
                                                                        }}
                                                                        disabled={leaderPage === totalPages}
                                                                        className="p-1.5 rounded-lg border border-[var(--border-color)] hover:bg-[var(--hover-color)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                                    >
                                                                        <ChevronDown className={`w-4 h-4 text-[var(--text-color)] ${isArabic ? '-rotate-90' : 'rotate-90'}`} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Section 2: Team Members - Enhanced Design */}
                    <div className="group bg-gradient-to-br from-[var(--bg-color)] to-[var(--container-color)]/20 rounded-2xl p-6 border-2 border-[var(--border-color)] hover:border-[var(--accent-color)]/30 transition-all duration-300 shadow-sm hover:shadow-md">
                        <div className={`flex items-center justify-between mb-4 ${isArabic ? 'flex-row-reverse' : ''}`}>
                            <div className={`flex items-center gap-3 ${isArabic ? 'flex-row-reverse' : ''}`}>
                                <div className="relative">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent-color)] to-[var(--accent-hover)] flex items-center justify-center shadow-lg">
                                        <Users className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[var(--accent-color)] border-2 border-[var(--bg-color)] flex items-center justify-center">
                                        <span className="text-[10px] font-bold text-white">2</span>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-[var(--text-color)] flex items-center gap-2">
                                        {t("allTeams.addTeam.sections.members", "Team Members")}
                                        <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-[var(--accent-color)]/10 text-[var(--accent-color)] border border-[var(--accent-color)]/30">
                                            {newTeam.selectedEmployees.length}
                                        </span>
                                    </h3>
                                    <p className="text-xs text-[var(--sub-text-color)]">
                                        {t("allTeams.addTeam.hints.members", "Add team members (optional)")}
                                    </p>
                                </div>
                            </div>
                            {newTeam.selectedEmployees.length > 0 && (
                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--accent-color)]/10 border border-[var(--accent-color)]/30">
                                    <Users className="w-3 h-3 text-[var(--accent-color)]" />
                                    <span className="text-xs font-semibold text-[var(--accent-color)]">
                                        {newTeam.selectedEmployees.length} {t("allTeams.addTeam.added", "Added")}
                                    </span>
                                </div>
                            )}
                        </div>
                        
                        {/* Selected Members Chips - Enhanced */}
                        {newTeam.selectedEmployees.length > 0 && (
                            <div className="mb-4 p-4 bg-gradient-to-r from-[var(--accent-color)]/5 to-transparent rounded-xl border border-[var(--accent-color)]/20">
                                <div className={`flex items-center gap-2 mb-3 ${isArabic ? 'flex-row-reverse' : ''}`}>
                                    <Check className="w-4 h-4 text-[var(--accent-color)]" />
                                    <span className="text-xs font-semibold text-[var(--accent-color)]">
                                        {t("allTeams.addTeam.selectedMembers", "Selected Members")}
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {newTeam.selectedEmployees.map((employee) => {
                                        const empId = employee?.id || employee?.userId;
                                        return (
                                            <div
                                                key={empId}
                                                className="group/chip inline-flex items-center gap-2 px-3 py-2 bg-[var(--bg-color)] border-2 border-[var(--accent-color)]/30 rounded-xl hover:border-[var(--accent-color)]/50 transition-all duration-200 shadow-sm hover:shadow-md"
                                            >
                                                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[var(--accent-color)]/20 to-[var(--accent-color)]/10 flex items-center justify-center flex-shrink-0">
                                                    <User className="w-3.5 h-3.5 text-[var(--accent-color)]" />
                                                </div>
                                                <span className="text-sm font-semibold text-[var(--text-color)] max-w-[120px] truncate">
                                                    {getUserDisplayName(employee)}
                                                </span>
                                                <button
                                                    onClick={() => removeEmployee(empId)}
                                                    className="p-1 hover:bg-[var(--rejected-leave-box-bg)] rounded-lg transition-all duration-200 flex-shrink-0"
                                                    disabled={isCreating || isAddingUsers}
                                                    title={t("allTeams.addTeam.removeMember", "Remove member")}
                                                >
                                                    <X className="w-3.5 h-3.5 text-[var(--sub-text-color)] group-hover/chip:text-[var(--error-color)] transition-colors" />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Add Members Dropdown - Enhanced */}
                        <div className="relative" ref={membersDropdownRef}>
                            <button
                                type="button"
                                onClick={() => setIsMembersDropdownOpen(!isMembersDropdownOpen)}
                                className="group/btn w-full px-6 py-4 border-2 border-dashed border-[var(--border-color)] rounded-xl bg-[var(--bg-color)] text-[var(--sub-text-color)] hover:border-[var(--accent-color)] hover:bg-[var(--accent-color)]/5 transition-all flex items-center justify-between shadow-sm hover:shadow-md"
                                disabled={isCreating || isAddingUsers || isLoadingUsers}
                            >
                                <div className={`flex items-center gap-3 ${isArabic ? 'flex-row-reverse' : ''}`}>
                                    <div className="w-10 h-10 rounded-xl bg-[var(--accent-color)]/10 flex items-center justify-center group-hover/btn:bg-[var(--accent-color)]/20 transition-colors">
                                        <Plus className="w-5 h-5 text-[var(--accent-color)]" />
                                    </div>
                                    <div className={`${isArabic ? 'text-right' : 'text-left'}`}>
                                        <span className="text-sm font-semibold text-[var(--text-color)] block">
                                            {t("allTeams.addTeam.addMembers", "Add Team Members")}
                                        </span>
                                        <span className="text-xs text-[var(--sub-text-color)]">
                                            {t("allTeams.addTeam.clickToBrowse", "Click to browse and select members")}
                                        </span>
                                    </div>
                                </div>
                                <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${isMembersDropdownOpen ? 'rotate-180 text-[var(--accent-color)]' : 'text-[var(--sub-text-color)]'}`} />
                            </button>
                            
                            {isMembersDropdownOpen && (
                                <div className="absolute top-full left-0 right-0 z-30 mt-2 bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl shadow-2xl overflow-hidden flex flex-col" style={{ maxHeight: '500px' }}>
                                    {/* Filters Bar */}
                                    <div className="p-4 border-b border-[var(--border-color)] bg-gradient-to-r from-[var(--container-color)]/40 to-[var(--container-color)]/20 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-color)]">
                                                    <Filter className="w-4 h-4 text-[var(--accent-color)]" />
                                                    <span>{t("allTeams.addTeam.filters", "Filters")}</span>
                                                </div>
                                                {availableMemberUsers.length > 0 && (
                                                    <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-[var(--accent-color)]/10 text-[var(--accent-color)] border border-[var(--accent-color)]/20">
                                                        {availableMemberUsers.length} {t("allTeams.addTeam.available", "available")}
                                                    </span>
                                                )}
                                            </div>
                                            {(selectedRole !== "all" || selectedTeam !== "all" || nameSearch.trim()) && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedRole("all");
                                                        setSelectedTeam("all");
                                                        setNameSearch("");
                                                    }}
                                                    className="text-xs text-[var(--accent-color)] hover:underline flex items-center gap-1 transition-colors"
                                                >
                                                    <X className="w-3 h-3" />
                                                    {t("allTeams.addTeam.clearFilters", "Clear")}
                                                </button>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-3 gap-2">
                                            {/* Team Filter */}
                                            <div className="relative" ref={teamFilterRef}>
                                                <button
                                                    type="button"
                                                    onClick={() => setIsTeamFilterOpen(!isTeamFilterOpen)}
                                                    className="w-full px-3 py-2 text-xs border border-[var(--border-color)] rounded-lg bg-[var(--bg-color)] text-[var(--text-color)] hover:border-[var(--accent-color)]/50 transition-all flex items-center justify-between"
                                                >
                                                    <span className="truncate">
                                                        {selectedTeam === "all" 
                                                            ? t("allTeams.addTeam.allTeams", "All Teams")
                                                            : teams.find(t => t.id === selectedTeam)?.name || "Unknown"}
                                                    </span>
                                                    <ChevronDown className={`w-3 h-3 transition-transform ${isTeamFilterOpen ? 'rotate-180' : ''}`} />
                                                </button>
                                                {isTeamFilterOpen && (
                                                    <div className="absolute top-full left-0 right-0 z-40 mt-1 bg-[var(--bg-color)] border border-[var(--border-color)] rounded-lg shadow-xl max-h-48 overflow-y-auto">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedTeam("all");
                                                                setIsTeamFilterOpen(false);
                                                            }}
                                                            className={`w-full p-2 text-xs ${isArabic ? 'text-right' : 'text-left'} hover:bg-[var(--hover-color)] ${
                                                                selectedTeam === "all" ? 'bg-[var(--accent-color)]/10' : ''
                                                            }`}
                                                        >
                                                            {t("allTeams.addTeam.allTeams", "All Teams")}
                                                        </button>
                                                        {teams.map(team => (
                                                            <button
                                                                key={team.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    setSelectedTeam(team.id);
                                                                    setIsTeamFilterOpen(false);
                                                                }}
                                                                className={`w-full p-2 text-xs ${isArabic ? 'text-right' : 'text-left'} hover:bg-[var(--hover-color)] ${
                                                                    selectedTeam === team.id ? 'bg-[var(--accent-color)]/10' : ''
                                                                }`}
                                                            >
                                                                {team.name}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {/* Role Filter */}
                                            <div className="relative" ref={roleFilterRef}>
                                                <button
                                                    type="button"
                                                    onClick={() => setIsRoleFilterOpen(!isRoleFilterOpen)}
                                                    className="w-full px-3 py-2 text-xs border border-[var(--border-color)] rounded-lg bg-[var(--bg-color)] text-[var(--text-color)] hover:border-[var(--accent-color)]/50 transition-all flex items-center justify-between"
                                                >
                                                    <span className="truncate">
                                                        {selectedRole === "all" 
                                                            ? t("allTeams.addTeam.allRoles", "All Roles")
                                                            : roles.find(r => r.id === selectedRole)?.name || "Unknown"}
                                                    </span>
                                                    <ChevronDown className={`w-3 h-3 transition-transform ${isRoleFilterOpen ? 'rotate-180' : ''}`} />
                                                </button>
                                                {isRoleFilterOpen && (
                                                    <div className="absolute top-full left-0 right-0 z-40 mt-1 bg-[var(--bg-color)] border border-[var(--border-color)] rounded-lg shadow-xl max-h-48 overflow-y-auto">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedRole("all");
                                                                setIsRoleFilterOpen(false);
                                                            }}
                                                            className={`w-full p-2 text-xs ${isArabic ? 'text-right' : 'text-left'} hover:bg-[var(--hover-color)] ${
                                                                selectedRole === "all" ? 'bg-[var(--accent-color)]/10' : ''
                                                            }`}
                                                        >
                                                            {t("allTeams.addTeam.allRoles", "All Roles")}
                                                        </button>
                                                        {roles.map(role => (
                                                            <button
                                                                key={role.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    setSelectedRole(role.id);
                                                                    setIsRoleFilterOpen(false);
                                                                }}
                                                                className={`w-full p-2 text-xs ${isArabic ? 'text-right' : 'text-left'} hover:bg-[var(--hover-color)] ${
                                                                    selectedRole === role.id ? 'bg-[var(--accent-color)]/10' : ''
                                                                }`}
                                                            >
                                                                {role.name}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {/* Name Search */}
                                            <div className="relative">
                                                <Search className={`absolute ${isArabic ? 'right-2' : 'left-2'} top-1/2 -translate-y-1/2 w-3 h-3 text-[var(--sub-text-color)]`} />
                                                <input
                                                    type="text"
                                                    value={nameSearch}
                                                    onChange={(e) => setNameSearch(e.target.value)}
                                                    placeholder={t("allTeams.addTeam.searchName", "Search by name...")}
                                                    className={`w-full ${isArabic ? 'pr-8 pl-2' : 'pl-8 pr-2'} py-2 text-xs border border-[var(--border-color)] rounded-lg bg-[var(--bg-color)] text-[var(--text-color)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-color)]`}
                                                    dir={isArabic ? 'rtl' : 'ltr'}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Users List with Pagination */}
                                    <div className="flex flex-col flex-1 min-h-0">
                                        {isLoadingUsers ? (
                                            <div className="p-6 flex items-center justify-center">
                                                <Loader2 className="w-5 h-5 text-[var(--accent-color)] animate-spin" />
                                            </div>
                                        ) : (() => {
                                            // Name search is already applied in filteredUsers, so just use availableMemberUsers
                                            // Pagination
                                            const totalPages = Math.ceil(availableMemberUsers.length / itemsPerPage);
                                            const startIndex = (membersPage - 1) * itemsPerPage;
                                            const endIndex = startIndex + itemsPerPage;
                                            const paginatedUsers = availableMemberUsers.slice(startIndex, endIndex);
                                            
                                            return (
                                                <>
                                                    {/* Users List */}
                                                    <div className="overflow-y-auto flex-1 min-h-0">
                                                        {paginatedUsers.length > 0 ? (
                                                            <div className="divide-y divide-[var(--border-color)]">
                                                                {paginatedUsers.map(user => {
                                                                    const userId = user?.id || user?.userId;
                                                                    const isSelected = newTeam.selectedEmployees.some(emp => {
                                                                        const empId = emp?.id || emp?.userId;
                                                                        return String(empId) === String(userId);
                                                                    });
                                                                    
                                                                    return (
                                                                        <button
                                                                            key={userId}
                                                                            type="button"
                                                                            onClick={() => toggleEmployee(user)}
                                                                            className={`w-full p-3 transition-colors ${isArabic ? 'text-right' : 'text-left'} flex items-center justify-between group ${
                                                                                isSelected 
                                                                                    ? 'bg-[var(--accent-color)]/10 hover:bg-[var(--accent-color)]/15' 
                                                                                    : 'hover:bg-[var(--hover-color)]'
                                                                            }`}
                                                                        >
                                                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                                                <div className="relative">
                                                                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 ring-2 ${
                                                                                        isSelected
                                                                                            ? 'bg-[var(--accent-color)]/20 ring-[var(--accent-color)]/40'
                                                                                            : 'bg-gradient-to-br from-[var(--accent-color)]/20 to-[var(--accent-color)]/10 ring-transparent group-hover:ring-[var(--accent-color)]/20'
                                                                                    }`}>
                                                                                        {user?.avatar ? (
                                                                                            <img src={user.avatar} alt={getUserDisplayName(user)} className="w-full h-full rounded-lg object-cover" />
                                                                                        ) : (
                                                                                            <User className={`w-5 h-5 text-[var(--accent-color)]`} />
                                                                                        )}
                                                                                    </div>
                                                                                    {user?.roles && Array.isArray(user.roles) && user.roles.length > 0 && (
                                                                                        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[var(--accent-color)] border-2 border-[var(--bg-color)] flex items-center justify-center">
                                                                                            <Crown className="w-2.5 h-2.5 text-white" />
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                                <div className="flex-1 min-w-0">
                                                                                    <div className="flex items-center gap-2">
                                                                                        <p className="text-sm font-semibold text-[var(--text-color)] truncate">
                                                                                            {getUserDisplayName(user)}
                                                                                        </p>
                                                                                        {user?.roles && Array.isArray(user.roles) && user.roles.length > 0 && (
                                                                                            <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-[var(--accent-color)]/10 text-[var(--accent-color)] border border-[var(--accent-color)]/20">
                                                                                                {user.roles[0]}
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                    {getUserDisplayInfo(user) && (
                                                                                        <p className="text-xs text-[var(--sub-text-color)] truncate mt-0.5">
                                                                                            {getUserDisplayInfo(user)}
                                                                                        </p>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                                                                                isSelected 
                                                                                    ? 'border-[var(--accent-color)] bg-[var(--accent-color)]' 
                                                                                    : 'border-[var(--border-color)]'
                                                                            }`}>
                                                                                {isSelected && <Check className="text-white" size={12} />}
                                                                            </div>
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        ) : (
                                                            <div className="p-6 text-center text-sm text-[var(--sub-text-color)]">
                                                                {availableMemberUsers.length === 0 && filteredUsers.length > 0
                                                                    ? t("allTeams.addTeam.noUsersMatch", "No users match your filters")
                                                                    : t("allTeams.addTeam.noUsers", "No users available")}
                                                            </div>
                                                        )}
                                                    </div>
                                                    
                                                    {/* Pagination Controls */}
                                                    {totalPages > 1 && (
                                                        <div className={`p-3 border-t border-[var(--border-color)] bg-[var(--container-color)]/30 flex items-center justify-between ${isArabic ? 'flex-row-reverse' : ''}`}>
                                                            <span className="text-xs text-[var(--sub-text-color)]">
                                                                {t("allTeams.addTeam.showing", "Showing")} {startIndex + 1}-{Math.min(endIndex, availableLeaderUsers.length)} {t("allTeams.addTeam.of", "of")} {availableLeaderUsers.length}
                                                            </span>
                                                            <div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setMembersPage(prev => Math.max(1, prev - 1));
                                                                    }}
                                                                    disabled={membersPage === 1}
                                                                    className="p-1.5 rounded-lg border border-[var(--border-color)] hover:bg-[var(--hover-color)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                                >
                                                                    <ChevronDown className={`w-4 h-4 text-[var(--text-color)] ${isArabic ? 'rotate-90' : '-rotate-90'}`} />
                                                                </button>
                                                                <span className="text-xs text-[var(--text-color)] font-medium px-2">
                                                                    {membersPage} / {totalPages}
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setMembersPage(prev => Math.min(totalPages, prev + 1));
                                                                    }}
                                                                    disabled={membersPage === totalPages}
                                                                    className="p-1.5 rounded-lg border border-[var(--border-color)] hover:bg-[var(--hover-color)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                                >
                                                                    <ChevronDown className={`w-4 h-4 text-[var(--text-color)] ${isArabic ? '-rotate-90' : 'rotate-90'}`} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </>
                                            );
                                        })()}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Section 3: Team Basic Information - Enhanced Design */}
                    <div className="group bg-gradient-to-br from-[var(--bg-color)] to-[var(--container-color)]/20 rounded-2xl p-6 border-2 border-[var(--border-color)] hover:border-[var(--accent-color)]/30 transition-all duration-300 shadow-sm hover:shadow-md">
                        <div className={`flex items-center justify-between mb-5 ${isArabic ? 'flex-row-reverse' : ''}`}>
                            <div className={`flex items-center gap-3 ${isArabic ? 'flex-row-reverse' : ''}`}>
                                <div className="relative">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent-hover)] to-[var(--accent-color)] flex items-center justify-center shadow-lg">
                                        <Filter className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[var(--accent-hover)] border-2 border-[var(--bg-color)] flex items-center justify-center">
                                        <span className="text-[10px] font-bold text-white">3</span>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-[var(--text-color)]">
                                        {t("allTeams.addTeam.sections.basicInfo", "Basic Information")}
                                    </h3>
                                    <p className="text-xs text-[var(--sub-text-color)]">
                                        {t("allTeams.addTeam.hints.basicInfo", "Provide team details and department")}
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="space-y-5">
                            {/* Department Selection - Enhanced */}
                            <div>
                                <label className={`flex items-center gap-2 text-sm font-bold text-[var(--text-color)] mb-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                                    <span>{t("allTeams.addTeam.department", "Department")}</span>
                                    <span className="text-red-500">*</span>
                                    <span className={`${isArabic ? 'mr-auto' : 'ml-auto'} text-xs font-normal text-[var(--sub-text-color)] italic`}>
                                        {selectedDepartment !== "all" ? t("allTeams.addTeam.required", "Required") : t("allTeams.addTeam.pleaseSelect", "Please select")}
                                    </span>
                                </label>
                                <div className="relative" ref={departmentFilterRef}>
                                    <button
                                        type="button"
                                        onClick={() => setIsDepartmentFilterOpen(!isDepartmentFilterOpen)}
                                        className={`w-full px-4 py-3.5 border-2 rounded-xl transition-all flex items-center justify-between ${
                                            selectedDepartment !== "all"
                                                ? 'border-[var(--accent-color)]/30 bg-[var(--accent-color)]/5 text-[var(--text-color)]'
                                                : 'border-[var(--border-color)] bg-[var(--bg-color)] text-[var(--sub-text-color)] hover:border-[var(--accent-color)]/50'
                                        }`}
                                    >
                                        <span className="font-medium">
                                            {selectedDepartment === "all" 
                                                ? t("allTeams.addTeam.selectDepartment", "Select Department")
                                                : departments.find(d => d.id === selectedDepartment)?.name || "Unknown"}
                                        </span>
                                        <ChevronDown className={`w-4 h-4 transition-transform ${isDepartmentFilterOpen ? 'rotate-180' : ''}`} />
                                    </button>
                                    
                                    {isDepartmentFilterOpen && (
                                        <div className={`absolute top-full ${isArabic ? 'right-0 left-0' : 'left-0 right-0'} z-30 mt-2 bg-[var(--bg-color)] border-2 border-[var(--border-color)] rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto`}>
                                            {departments.map(dept => (
                                                <button
                                                    key={dept.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedDepartment(dept.id);
                                                        setIsDepartmentFilterOpen(false);
                                                    }}
                                                    className={`w-full p-3.5 ${isArabic ? 'text-right' : 'text-left'} hover:bg-[var(--hover-color)] transition-colors border-b border-[var(--border-color)] last:border-b-0 ${
                                                        selectedDepartment === dept.id ? 'bg-[var(--accent-color)]/10 font-semibold' : ''
                                                    }`}
                                                >
                                                    <div className={`flex items-center ${isArabic ? 'flex-row-reverse' : ''} justify-between`}>
                                                        <span>{dept.name}</span>
                                                        {selectedDepartment === dept.id && (
                                                            <Check className="w-4 h-4 text-[var(--accent-color)]" />
                                                        )}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Team Name - Enhanced */}
                            <div>
                                <label className={`flex items-center gap-2 text-sm font-bold text-[var(--text-color)] mb-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                                    <span>{t("departments.newDepartmentForm.setupTeams.teamName", "Team Name")}</span>
                                    <span className="text-red-500">*</span>
                                    <span className="ml-auto text-xs font-normal text-[var(--sub-text-color)] italic">
                                        {newTeam.name.trim() ? `${newTeam.name.length} ${t("allTeams.addTeam.characters", "characters")}` : t("allTeams.addTeam.required", "Required")}
                                    </span>
                                </label>
                                <div className="relative">
                                    <input
                                        className={`w-full px-4 py-3.5 border-2 rounded-xl bg-[var(--bg-color)] text-[var(--text-color)] focus:outline-none focus:ring-0 transition-all ${
                                            newTeam.name.trim() 
                                                ? 'border-[var(--accent-color)]/30 focus:border-[var(--accent-color)]' 
                                                : 'border-[var(--border-color)] focus:border-[var(--accent-color)]'
                                        }`}
                                        placeholder={t("allTeams.addTeam.placeholders.teamName", "Enter team name")}
                                        type="text"
                                        value={newTeam.name}
                                        onChange={(e) => setNewTeam(prev => ({ ...prev, name: e.target.value }))}
                                        dir={isArabic ? 'rtl' : 'ltr'}
                                    />
                                    {newTeam.name.trim() && (
                                        <div className={`absolute ${isArabic ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2`}>
                                            <Check className="w-5 h-5 text-[var(--success-color)]" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Team Description - Enhanced */}
                            <div>
                                <label className={`flex items-center gap-2 text-sm font-bold text-[var(--text-color)] mb-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                                    <span>{t("departments.newDepartmentForm.setupTeams.description", "Description")}</span>
                                    <span className="text-xs font-normal text-[var(--sub-text-color)]">
                                        ({t("allTeams.addTeam.optional", "Optional")})
                                    </span>
                                    {newTeam.description.trim() && (
                                        <span className={`${isArabic ? 'mr-auto' : 'ml-auto'} text-xs font-normal text-[var(--sub-text-color)] italic`}>
                                            {newTeam.description.length} {t("allTeams.addTeam.characters", "characters")}
                                        </span>
                                    )}
                                </label>
                                <textarea
                                    className="w-full px-4 py-3.5 border-2 border-[var(--border-color)] rounded-xl bg-[var(--bg-color)] text-[var(--text-color)] focus:outline-none focus:ring-0 focus:border-[var(--accent-color)] transition-all resize-none"
                                    placeholder={t("allTeams.addTeam.placeholders.description", "Enter team description (optional)")}
                                    rows="4"
                                    value={newTeam.description}
                                    onChange={(e) => setNewTeam(prev => ({ ...prev, description: e.target.value }))}
                                    dir={isArabic ? 'rtl' : 'ltr'}
                                />
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Right Column - Enhanced Summary Card */}
                <div className="lg:col-span-1">
                    <div className="bg-gradient-to-br from-[var(--bg-color)] to-[var(--container-color)]/30 rounded-2xl p-6 border-2 border-[var(--border-color)] sticky top-6 shadow-lg">
                        {/* Summary Header */}
                        <div className="mb-6">
                            <div className={`flex items-center gap-3 mb-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent-color)] to-[var(--accent-color)]/70 flex items-center justify-center shadow-md">
                                    <Check className="w-5 h-5 text-white" />
                                </div>
                                <h3 className="text-xl font-bold text-[var(--text-color)]">
                                    {t("allTeams.addTeam.summary", "Summary")}
                                </h3>
                            </div>
                            <p className={`text-xs text-[var(--sub-text-color)] ${isArabic ? 'pr-13 text-right' : 'pl-13 text-left'}`}>
                                {t("allTeams.addTeam.reviewDetails", "Review your team details before creating")}
                            </p>
                        </div>
                        
                        {/* Summary Content */}
                        <div className="space-y-4 mb-6">
                            {/* Department */}
                            <div className="p-4 bg-[var(--container-color)]/40 rounded-xl border border-[var(--border-color)]">
                                <div className={`flex items-center gap-2 mb-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                                    <Filter className="w-4 h-4 text-[var(--accent-color)]" />
                                    <p className="text-xs font-bold text-[var(--sub-text-color)] uppercase tracking-wide">
                                        {t("allTeams.addTeam.summaryDepartment", "Department")}
                                    </p>
                                </div>
                                {selectedDepartment !== "all" ? (
                                    <p className={`text-sm font-bold text-[var(--text-color)] flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                                        <Check className="w-4 h-4 text-[var(--success-color)]" />
                                        {departments.find(d => d.id === selectedDepartment)?.name || "—"}
                                    </p>
                                ) : (
                                    <p className={`text-sm text-[var(--sub-text-color)] italic flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                                        <X className="w-4 h-4 text-[var(--error-color)]" />
                                        {t("allTeams.addTeam.notSelected", "Not selected")}
                                    </p>
                                )}
                            </div>
                            
                            {/* Team Leader */}
                            <div className="p-4 bg-[var(--container-color)]/40 rounded-xl border border-[var(--border-color)]">
                                <div className={`flex items-center gap-2 mb-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                                    <Crown className="w-4 h-4 text-[var(--accent-color)]" />
                                    <p className="text-xs font-bold text-[var(--sub-text-color)] uppercase tracking-wide">
                                        {t("allTeams.addTeam.summaryTeamLeader", "Team Leader")}
                                    </p>
                                </div>
                                {newTeam.teamLeader ? (
                                    <div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--accent-color)]/20 to-[var(--accent-color)]/10 flex items-center justify-center flex-shrink-0">
                                            <Crown className="w-4 h-4 text-[var(--accent-color)]" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-bold text-[var(--text-color)] truncate ${isArabic ? 'text-right' : 'text-left'}`}>
                                                {getUserDisplayName(newTeam.teamLeader)}
                                            </p>
                                            {getUserDisplayInfo(newTeam.teamLeader) && (
                                                <p className={`text-xs text-[var(--sub-text-color)] truncate ${isArabic ? 'text-right' : 'text-left'}`}>
                                                    {getUserDisplayInfo(newTeam.teamLeader)}
                                                </p>
                                            )}
                                        </div>
                                        <Check className="w-4 h-4 text-[var(--success-color)] flex-shrink-0" />
                                    </div>
                                ) : (
                                    <p className={`text-sm text-[var(--sub-text-color)] italic flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                                        <X className="w-4 h-4 text-[var(--error-color)]" />
                                        {t("allTeams.addTeam.notSelected", "Not selected")}
                                    </p>
                                )}
                            </div>
                            
                            {/* Team Members */}
                            <div className="p-4 bg-[var(--container-color)]/40 rounded-xl border border-[var(--border-color)]">
                                <div className={`flex items-center gap-2 mb-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                                    <Users className="w-4 h-4 text-[var(--accent-color)]" />
                                    <p className="text-xs font-bold text-[var(--sub-text-color)] uppercase tracking-wide">
                                        {t("allTeams.addTeam.summaryMembers", "Members")}
                                    </p>
                                </div>
                                <div className={`flex items-center ${isArabic ? 'flex-row-reverse' : ''} justify-between`}>
                                    <p className="text-sm font-bold text-[var(--text-color)]">
                                        {newTeam.selectedEmployees.length} {t("allTeams.addTeam.membersCount", "member(s)")}
                                    </p>
                                    {newTeam.selectedEmployees.length > 0 && (
                                        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg bg-[var(--accent-color)]/10 ${isArabic ? 'flex-row-reverse' : ''}`}>
                                            <Check className="w-3 h-3 text-[var(--accent-color)]" />
                                            <span className="text-xs font-semibold text-[var(--accent-color)]">
                                                {newTeam.selectedEmployees.length}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Team Name */}
                            <div className="p-4 bg-[var(--container-color)]/40 rounded-xl border border-[var(--border-color)]">
                                <div className={`flex items-center gap-2 mb-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                                    <Filter className="w-4 h-4 text-[var(--accent-hover)]" />
                                    <p className="text-xs font-bold text-[var(--sub-text-color)] uppercase tracking-wide">
                                        {t("allTeams.addTeam.summaryTeamName", "Team Name")}
                                    </p>
                                </div>
                                {newTeam.name.trim() ? (
                                    <p className={`text-sm font-bold text-[var(--text-color)] flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                                        <Check className="w-4 h-4 text-[var(--success-color)]" />
                                        {newTeam.name}
                                    </p>
                                ) : (
                                    <p className={`text-sm text-[var(--sub-text-color)] italic flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                                        <X className="w-4 h-4 text-[var(--error-color)]" />
                                        {t("allTeams.addTeam.notProvided", "Not provided")}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Validation Status */}
                        {(!newTeam.name.trim() || !selectedDepartment || selectedDepartment === "all" || !newTeam.teamLeader) && (
                            <div className="mb-6 p-4 bg-[var(--pending-leave-box-bg)] border-2 border-[var(--warning-color)]/30 rounded-xl">
                                <div className={`flex items-start gap-3 ${isArabic ? 'flex-row-reverse' : ''}`}>
                                    <div className="w-5 h-5 rounded-full bg-[var(--warning-color)] flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span className="text-white text-xs font-bold">!</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-[var(--text-color)] mb-1">
                                            {t("allTeams.addTeam.requiredFields", "Required Fields Missing")}
                                        </p>
                                        <ul className={`text-xs text-[var(--sub-text-color)] space-y-1 ${isArabic ? 'text-right' : 'text-left'}`}>
                                            {!selectedDepartment || selectedDepartment === "all" ? (
                                                <li className={isArabic ? 'list-none' : ''}>{isArabic ? '• ' : '• '}{t("allTeams.addTeam.selectDepartmentRequired", "Select a department")}</li>
                                            ) : null}
                                            {!newTeam.teamLeader && (
                                                <li className={isArabic ? 'list-none' : ''}>{isArabic ? '• ' : '• '}{t("allTeams.addTeam.selectLeaderRequired", "Select a team leader")}</li>
                                            )}
                                            {!newTeam.name.trim() && (
                                                <li className={isArabic ? 'list-none' : ''}>{isArabic ? '• ' : '• '}{t("allTeams.addTeam.provideNameRequired", "Provide a team name")}</li>
                                            )}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {/* Action Buttons */}
                        <div className="pt-6 border-t-2 border-[var(--border-color)] flex flex-col gap-3">
                            <button 
                                type="button" 
                                className="group w-full px-6 py-4 rounded-xl font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:shadow-none relative overflow-hidden"
                                style={{
                                    background: (!newTeam.name.trim() || !selectedDepartment || selectedDepartment === "all" || !newTeam.teamLeader || isCreating || isAddingUsers)
                                        ? 'var(--border-color)'
                                        : 'linear-gradient(135deg, var(--accent-color) 0%, var(--accent-color) 100%)'
                                }}
                                onClick={handleAddTeam}
                                disabled={!newTeam.name.trim() || !selectedDepartment || selectedDepartment === "all" || !newTeam.teamLeader || isCreating || isAddingUsers}
                            >
                                {/* Button shine effect */}
                                {!isCreating && !isAddingUsers && newTeam.name.trim() && selectedDepartment && selectedDepartment !== "all" && newTeam.teamLeader && (
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 group-hover:translate-x-full transition-transform duration-1000"></div>
                                )}
                                
                                {(isCreating || isAddingUsers) ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>{isCreating ? t("allTeams.addTeam.creating", "Creating...") : t("allTeams.addTeam.addingMembers", "Adding Members...")}</span>
                                    </>
                                ) : (
                                    <>
                                        <Plus size={20} />
                                        <span>{t("allTeams.addTeam.createTeam", "Create Team")}</span>
                                    </>
                                )}
                            </button>
                            
                            <button 
                                type="button" 
                                className="w-full px-6 py-3.5 border-2 border-[var(--border-color)] rounded-xl font-semibold text-[var(--text-color)] hover:bg-[var(--hover-color)] hover:border-[var(--accent-color)]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={() => navigate(-1)}
                                disabled={isCreating || isAddingUsers}
                            >
                                {t("common.cancel", "Cancel")}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}


