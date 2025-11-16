import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Search, User, Calendar, Check, Filter, Building2, Users as UsersIcon, Trash2, Plus, UserMinus } from 'lucide-react';
import { 
    useAssignUsersToShiftMutation, 
    useGetShiftByIdQuery,
    useGetAllShiftAssignmentsQuery,
    useDeleteShiftAssignmentMutation
} from '../../../services/apis/ShiftApi';
import { useGetAllUsersQuery } from '../../../services/apis/UserApi';
import { useGetAllDepartmentsQuery, useGetDepartmentSupervisorQuery } from '../../../services/apis/DepartmentApi';
import { useGetTeamsByDepartmentQuery } from '../../../services/apis/TeamApi';
import ConfirmDialog from './confirm-dialog';
import toast from 'react-hot-toast';

const AssignUsersPopup = ({ isOpen, onClose, shiftId, onSave }) => {
    const { t, i18n } = useTranslation();
    const isArabic = i18n.language === "ar";
    
    const [assignUsers, { isLoading: isAssigning }] = useAssignUsersToShiftMutation();
    const [deleteAssignment, { isLoading: isDeleting }] = useDeleteShiftAssignmentMutation();
    
    // Fetch shift data to get shift name
    const { data: shiftData } = useGetShiftByIdQuery(shiftId, {
        skip: !shiftId || !isOpen
    });
    const shift = shiftData?.value || shiftData;
    
    // State declarations - must be before hooks that use them
    const [searchTerm, setSearchTerm] = useState('');
    const [addSearchTerm, setAddSearchTerm] = useState('');
    const [selectedUserIds, setSelectedUserIds] = useState([]);
    const [addDepartmentId, setAddDepartmentId] = useState('');
    const [addTeamId, setAddTeamId] = useState('');
    const [effectiveFrom, setEffectiveFrom] = useState('');
    const [effectiveTo, setEffectiveTo] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [assignmentToDelete, setAssignmentToDelete] = useState(null);
    
    // Fetch all assignments - filter by shiftId on client side
    const { data: allAssignmentsData, isLoading: isLoadingAssigned } = useGetAllShiftAssignmentsQuery(undefined, {
        skip: !shiftId || !isOpen
    });
    
    // Parse and filter assigned users by shiftId
    const assignments = useMemo(() => {
        const allAssignments = allAssignmentsData?.value || allAssignmentsData || [];
        if (!Array.isArray(allAssignments)) return [];
        
        // Filter by shiftId
        const shiftAssignments = allAssignments.filter(item => item.shiftId === shiftId);
        
        // Map to our format
        return shiftAssignments.map(item => ({
            assignmentId: item.id, // This is the assignment ID for DELETE
            userId: item.userId || item.user?.id,
            user: item.user || item,
            effectiveFrom: item.effectiveFrom,
            effectiveTo: item.effectiveTo,
            shiftId: item.shiftId,
        })).filter(item => item.assignmentId && item.userId);
    }, [allAssignmentsData, shiftId]);
    
    const assignedUserIds = useMemo(() => {
        return assignments.map(a => a.userId).filter(Boolean);
    }, [assignments]);
    
    // Fetch all users
    const { data: usersData, isLoading: isLoadingUsers } = useGetAllUsersQuery({
        pageNumber: 1,
        pageSize: 1000,
    });
    const users = usersData?.value || usersData || [];
    
    // Fetch departments
    const { data: departmentsData } = useGetAllDepartmentsQuery({
        pageNumber: 1,
        pageSize: 1000,
    });
    const departments = departmentsData?.value || departmentsData || [];
    
    // Fetch teams for add department filter
    const { data: addTeamsData } = useGetTeamsByDepartmentQuery(addDepartmentId, {
        skip: !addDepartmentId
    });
    const addTeams = addTeamsData?.value || addTeamsData || [];
    
    // Fetch department supervisor when add department is selected
    const { data: addSupervisorData } = useGetDepartmentSupervisorQuery(addDepartmentId, {
        skip: !addDepartmentId
    });
    const addSupervisor = addSupervisorData?.value || addSupervisorData || null;
    
    // Extract team leader IDs from teams for the selected department
    const addTeamLeaderIds = useMemo(() => {
        if (!addTeams || addTeams.length === 0) return [];
        return addTeams
            .map(team => {
                const teamLeadId = team.teamLeadId || 
                                 team.teamLeader?.id || 
                                 team.teamLead?.id || 
                                 team.teamLead?.userId || 
                                 null;
                return teamLeadId;
            })
            .filter(Boolean);
    }, [addTeams]);
    
    // Get supervisor ID for add department
    const addSupervisorId = addSupervisor?.id || addSupervisor?.userId || null;
    
    // Filter available users (excluding already assigned)
    const availableUsers = useMemo(() => {
        return users.filter(user => !assignedUserIds.includes(user.id));
    }, [users, assignedUserIds]);
    
    // Filter users for adding - based on search term, department, and team
    const filteredAvailableUsers = useMemo(() => {
        let filtered = availableUsers;
        
        // Filter by department - include members, team leaders, and supervisor
        if (addDepartmentId) {
            filtered = filtered.filter(user => {
                const userId = user.id;
                
                // 1. Check if user has direct departmentId property
                if (user.departmentId === addDepartmentId) return true;
                
                // 2. Check if user has departments array
                if (user.departments && Array.isArray(user.departments)) {
                    const isInDepartment = user.departments.some(dept => 
                        (typeof dept === 'object' ? dept.id : dept) === addDepartmentId
                    );
                    if (isInDepartment) return true;
                }
                
                // 3. Check if user is a team leader of any team in this department
                if (addTeamLeaderIds.includes(userId)) return true;
                
                // 4. Check if user is the department supervisor
                if (addSupervisorId && userId === addSupervisorId) return true;
                
                return false;
            });
        }
        
        // Filter by team - include members and team leader
        if (addTeamId) {
            const selectedTeam = addTeams.find(team => team.id === addTeamId);
            const selectedTeamLeadId = selectedTeam?.teamLeadId || 
                                      selectedTeam?.teamLeader?.id || 
                                      selectedTeam?.teamLead?.id || 
                                      selectedTeam?.teamLead?.userId || 
                                      null;
            
            filtered = filtered.filter(user => {
                const userId = user.id;
                
                // 1. Check if user has direct teamId property
                if (user.teamId === addTeamId) return true;
                
                // 2. Check if user has teams array
                if (user.teams && Array.isArray(user.teams)) {
                    const isInTeam = user.teams.some(team => 
                        (typeof team === 'object' ? team.id : team) === addTeamId
                    );
                    if (isInTeam) return true;
                }
                
                // 3. Check if user is the team leader of the selected team
                if (selectedTeamLeadId && userId === selectedTeamLeadId) return true;
                
                return false;
            });
        }
        
        // Filter by search term
        if (addSearchTerm) {
            const term = addSearchTerm.toLowerCase();
            filtered = filtered.filter(user => 
                user.firstName?.toLowerCase().includes(term) ||
                user.lastName?.toLowerCase().includes(term) ||
                user.email?.toLowerCase().includes(term) ||
                `${user.firstName} ${user.lastName}`.toLowerCase().includes(term)
            );
        }
        
        return filtered;
    }, [availableUsers, addSearchTerm, addDepartmentId, addTeamId, addTeams, addTeamLeaderIds, addSupervisorId]);
    
    // Filter assigned users by search
    const filteredAssignedUsers = useMemo(() => {
        if (!searchTerm) return assignments;
        const term = searchTerm.toLowerCase();
        return assignments.filter(assignment => {
            const user = assignment.user;
            return user?.firstName?.toLowerCase().includes(term) ||
                   user?.lastName?.toLowerCase().includes(term) ||
                   user?.email?.toLowerCase().includes(term) ||
                   `${user?.firstName} ${user?.lastName}`.toLowerCase().includes(term);
        });
    }, [assignments, searchTerm]);
    
    // Toggle user selection for adding
    const toggleUserSelection = (userId) => {
        setSelectedUserIds(prev => 
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };
    
    // Select all visible available users
    const selectAllAvailable = () => {
        const visibleUserIds = filteredAvailableUsers.map(user => user.id);
        setSelectedUserIds(prev => {
            const allSelected = visibleUserIds.every(id => prev.includes(id));
            if (allSelected) {
                return prev.filter(id => !visibleUserIds.includes(id));
            } else {
                return [...new Set([...prev, ...visibleUserIds])];
            }
        });
    };
    
    // Handle remove user from shift - show confirmation dialog
    const handleRemoveUser = (assignmentId) => {
        setAssignmentToDelete(assignmentId);
        setShowDeleteConfirm(true);
    };
    
    // Confirm delete action
    const handleConfirmDelete = async () => {
        if (!assignmentToDelete) return;
        
        try {
            await deleteAssignment({ assignmentId: assignmentToDelete, shiftId }).unwrap();
            toast.success(t('shifts.assignUsers.removeSuccess', 'User removed from shift successfully'));
            // Cache invalidation will automatically refetch the query
            if (onSave) onSave();
        } catch (error) {
            const errorMessage = error?.data?.errorMessage || error?.data?.message || error?.message || 
                t('shifts.assignUsers.removeError', 'Failed to remove user from shift');
            toast.error(errorMessage);
        } finally {
            setAssignmentToDelete(null);
        }
    };
    
    // Handle add users to shift
    const handleAddUsers = async () => {
        if (selectedUserIds.length === 0) {
            toast.error(t('shifts.assignUsers.noUsersSelected', 'Please select at least one user'));
            return;
        }
        
        if (!effectiveFrom) {
            toast.error(t('shifts.assignUsers.effectiveFromRequired', 'Effective from date is required'));
            return;
        }
        
        if (!effectiveTo) {
            toast.error(t('shifts.assignUsers.effectiveToRequired', 'Effective to date is required'));
            return;
        }
        
        const fromDate = new Date(effectiveFrom);
        const toDate = new Date(effectiveTo);
        
        if (toDate < fromDate) {
            toast.error(t('shifts.assignUsers.invalidDateRange', 'Effective to date must be after effective from date'));
            return;
        }
        
        const formatDateToISO = (dateString) => {
            const date = new Date(dateString);
            return date.toISOString();
        };
        
        const payload = {
            shiftId: shiftId,
            userIds: selectedUserIds,
            effectiveFrom: formatDateToISO(effectiveFrom),
            effectiveTo: formatDateToISO(effectiveTo),
        };
        
        try {
            await assignUsers(payload).unwrap();
            toast.success(t('shifts.assignUsers.addSuccess', 'Users added to shift successfully!'));
            setSelectedUserIds([]);
            refetchAssignments();
            if (onSave) onSave();
        } catch (error) {
            const errorMessage = error?.data?.errorMessage || error?.data?.message || error?.message || 
                t('shifts.assignUsers.addError', 'Failed to add users to shift');
            toast.error(errorMessage);
        }
    };
    
    // Handle department change for add section
    const handleAddDepartmentChange = (departmentId) => {
        setAddDepartmentId(departmentId);
        setAddTeamId(''); // Reset team when department changes
    };
    
    // Reset form when popup closes
    const handleClose = () => {
        setSearchTerm('');
        setAddSearchTerm('');
        setSelectedUserIds([]);
        setAddDepartmentId('');
        setAddTeamId('');
        setEffectiveFrom('');
        setEffectiveTo('');
        onClose();
    };
    
    // Set default dates when popup opens
    useEffect(() => {
        if (isOpen) {
            const today = new Date();
            const nextMonth = new Date(today);
            nextMonth.setMonth(nextMonth.getMonth() + 1);
            
            const formatDateForInput = (date) => {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            };
            
            if (!effectiveFrom) {
                setEffectiveFrom(formatDateForInput(today));
            }
            if (!effectiveTo) {
                setEffectiveTo(formatDateForInput(nextMonth));
            }
        }
    }, [isOpen]);
    
    if (!isOpen) return null;
    
    const allAvailableSelected = filteredAvailableUsers.length > 0 && filteredAvailableUsers.every(user => selectedUserIds.includes(user.id));
    
    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/20 backdrop-blur-lg z-40 transition-opacity"
                onClick={handleClose}
            />
            
            {/* Popup */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div
                    className="rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
                    style={{
                        backgroundColor: 'var(--bg-color)',
                        border: '1px solid var(--border-color)'
                    }}
                    dir={isArabic ? 'rtl' : 'ltr'}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="p-6 border-b flex-shrink-0" style={{ borderColor: 'var(--border-color)' }}>
                        <div className={`flex items-center justify-between ${isArabic ? 'flex-row-reverse' : ''}`}>
                            <div>
                                <h2 className="text-xl font-semibold" style={{ color: 'var(--text-color)' }}>
                                    {t('shifts.assignUsers.manageTitle', 'Manage Shift Assignments')}
                                </h2>
                                {shift && (
                                    <p className="text-sm mt-1" style={{ color: 'var(--sub-text-color)' }}>
                                        {t('shifts.assignUsers.shiftName', 'Shift')}: <span className="font-medium">{shift.name}</span>
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={handleClose}
                                className="p-1 rounded-lg hover:bg-[var(--hover-color)] transition-colors"
                                style={{ color: 'var(--sub-text-color)' }}
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {/* Section 1: Currently Assigned Users */}
                        <div className="space-y-4">
                            <div className={`flex items-center justify-between ${isArabic ? 'flex-row-reverse' : ''}`}>
                                <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--text-color)' }}>
                                    <UsersIcon className="w-5 h-5" />
                                    {t('shifts.assignUsers.assignedUsers', 'Assigned Users')} 
                                    <span className="text-sm font-normal" style={{ color: 'var(--sub-text-color)' }}>
                                        ({assignments.length})
                                    </span>
                                </h3>
                            </div>
                            
                            {/* Search for assigned users */}
                            {assignments.length > 0 && (
                                <div className="relative">
                                    <Search
                                        className={`absolute top-1/2 transform -translate-y-1/2 w-4 h-4 ${isArabic ? 'right-3' : 'left-3'}`}
                                        style={{ color: 'var(--sub-text-color)' }}
                                    />
                                    <input
                                        type="text"
                                        placeholder={t("shifts.assignUsers.searchAssigned", "Search assigned users...")}
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full border rounded-xl py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all duration-200"
                                        style={{
                                            borderColor: 'var(--border-color)',
                                            backgroundColor: 'var(--container-color)',
                                            color: 'var(--text-color)',
                                            paddingLeft: isArabic ? '16px' : '40px',
                                            paddingRight: isArabic ? '40px' : '16px',
                                            focusRingColor: 'var(--accent-color)',
                                            textAlign: isArabic ? 'right' : 'left'
                                        }}
                                    />
                                </div>
                            )}
                            
                            {/* Assigned Users List */}
                            <div className="border rounded-xl overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
                                {isLoadingAssigned ? (
                                    <div className="p-12 text-center">
                                        <div className="text-[var(--sub-text-color)]">{t('shifts.assignUsers.loadingUsers', 'Loading users...')}</div>
                                    </div>
                                ) : filteredAssignedUsers.length === 0 ? (
                                    <div className="p-12 text-center">
                                        <UserMinus className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--sub-text-color)' }} />
                                        <div className="text-[var(--sub-text-color)]">
                                            {searchTerm
                                                ? t('shifts.assignUsers.noAssignedFound', 'No assigned users found matching your search')
                                                : t('shifts.assignUsers.noAssignedUsers', 'No users assigned to this shift')}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="max-h-64 overflow-y-auto">
                                        {filteredAssignedUsers.map((assignment) => {
                                            const user = assignment.user;
                                            return (
                                                <div
                                                    key={assignment.assignmentId}
                                                    className="p-4 border-b flex items-center justify-between hover:bg-[var(--hover-color)] transition-colors"
                                                    style={{ borderColor: 'var(--border-color)' }}
                                                >
                                                    <div className={`flex items-center gap-3 flex-1 min-w-0 ${isArabic ? 'flex-row-reverse' : ''}`}>
                                                        <div className="w-10 h-10 rounded-full bg-[var(--accent-color)]/10 flex items-center justify-center flex-shrink-0">
                                                            <User className="w-5 h-5" style={{ color: 'var(--accent-color)' }} />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className={`font-medium ${isArabic ? 'text-right' : 'text-left'}`} style={{ color: 'var(--text-color)' }}>
                                                                {user?.firstName} {user?.lastName}
                                                            </div>
                                                            <div className={`text-sm ${isArabic ? 'text-right' : 'text-left'}`} style={{ color: 'var(--sub-text-color)' }}>
                                                                {user?.email}
                                                            </div>
                                                            {assignment.effectiveFrom && assignment.effectiveTo && (
                                                                <div className={`text-xs mt-1 ${isArabic ? 'text-right' : 'text-left'}`} style={{ color: 'var(--sub-text-color)' }}>
                                                                    {new Date(assignment.effectiveFrom).toLocaleDateString()} - {new Date(assignment.effectiveTo).toLocaleDateString()}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleRemoveUser(assignment.assignmentId)}
                                                        disabled={isDeleting}
                                                        className={`p-2 rounded-lg hover:bg-[var(--error-color)]/10 transition-colors disabled:opacity-50 ${isArabic ? 'mr-2' : 'ml-2'}`}
                                                        style={{ color: 'var(--error-color)' }}
                                                        title={t('shifts.assignUsers.remove', 'Remove')}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        {/* Divider */}
                        <div className="border-t" style={{ borderColor: 'var(--border-color)' }} />
                        
                        {/* Section 2: Add Users */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--text-color)' }}>
                                <Plus className="w-5 h-5" />
                                {t('shifts.assignUsers.addUsers', 'Add Users to Shift')}
                            </h3>
                            
                            {/* Date Range for New Assignments */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg border" style={{ 
                                borderColor: 'var(--border-color)',
                                backgroundColor: 'var(--container-color)'
                            }}>
                                <div>
                                    <label
                                        className={`block text-sm font-medium mb-2 ${isArabic ? 'text-right' : 'text-left'}`}
                                        style={{ color: 'var(--sub-text-color)' }}
                                    >
                                        <div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                                            <Calendar className="w-4 h-4" />
                                            {t('shifts.assignUsers.effectiveFrom', 'Effective From')} <span className="text-red-500">*</span>
                                        </div>
                                    </label>
                                    <input
                                        type="date"
                                        value={effectiveFrom}
                                        onChange={(e) => setEffectiveFrom(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-lg border outline-none transition-all text-sm"
                                        style={{
                                            backgroundColor: 'var(--bg-color)',
                                            borderColor: 'var(--border-color)',
                                            color: 'var(--text-color)'
                                        }}
                                    />
                                </div>
                                <div>
                                    <label
                                        className={`block text-sm font-medium mb-2 ${isArabic ? 'text-right' : 'text-left'}`}
                                        style={{ color: 'var(--sub-text-color)' }}
                                    >
                                        <div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                                            <Calendar className="w-4 h-4" />
                                            {t('shifts.assignUsers.effectiveTo', 'Effective To')} <span className="text-red-500">*</span>
                                        </div>
                                    </label>
                                    <input
                                        type="date"
                                        value={effectiveTo}
                                        onChange={(e) => setEffectiveTo(e.target.value)}
                                        min={effectiveFrom}
                                        className="w-full px-4 py-2.5 rounded-lg border outline-none transition-all text-sm"
                                        style={{
                                            backgroundColor: 'var(--bg-color)',
                                            borderColor: 'var(--border-color)',
                                            color: 'var(--text-color)'
                                        }}
                                    />
                                </div>
                            </div>
                            
                            {/* Filters: Department and Team */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label
                                        className={`block text-sm font-medium mb-2 ${isArabic ? 'text-right' : 'text-left'}`}
                                        style={{ color: 'var(--sub-text-color)' }}
                                    >
                                        <div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                                            <Building2 className="w-4 h-4" />
                                            {t('shifts.assignUsers.filterDepartment', 'Department')}
                                        </div>
                                    </label>
                                    <select
                                        value={addDepartmentId}
                                        onChange={(e) => handleAddDepartmentChange(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-lg border outline-none transition-all text-sm"
                                        style={{
                                            backgroundColor: 'var(--container-color)',
                                            borderColor: 'var(--border-color)',
                                            color: 'var(--text-color)'
                                        }}
                                    >
                                        <option value="">{t('shifts.assignUsers.allDepartments', 'All Departments')}</option>
                                        {departments.map(dept => (
                                            <option key={dept.id} value={dept.id}>{dept.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label
                                        className={`block text-sm font-medium mb-2 ${isArabic ? 'text-right' : 'text-left'}`}
                                        style={{ color: 'var(--sub-text-color)' }}
                                    >
                                        <div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                                            <UsersIcon className="w-4 h-4" />
                                            {t('shifts.assignUsers.filterTeam', 'Team')}
                                        </div>
                                    </label>
                                    <select
                                        value={addTeamId}
                                        onChange={(e) => setAddTeamId(e.target.value)}
                                        disabled={!addDepartmentId}
                                        className="w-full px-4 py-2.5 rounded-lg border outline-none transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                        style={{
                                            backgroundColor: 'var(--container-color)',
                                            borderColor: 'var(--border-color)',
                                            color: 'var(--text-color)'
                                        }}
                                    >
                                        <option value="">{t('shifts.assignUsers.allTeams', 'All Teams')}</option>
                                        {addTeams.map(team => (
                                            <option key={team.id} value={team.id}>{team.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            
                            {/* Search Bar */}
                            <div className="relative">
                                <Search
                                    className={`absolute top-1/2 transform -translate-y-1/2 w-4 h-4 ${isArabic ? 'right-3' : 'left-3'}`}
                                    style={{ color: 'var(--sub-text-color)' }}
                                />
                                <input
                                    type="text"
                                    placeholder={t("shifts.assignUsers.searchPlaceholder", "Search users by name or email...")}
                                    value={addSearchTerm}
                                    onChange={(e) => setAddSearchTerm(e.target.value)}
                                    className="w-full border rounded-xl py-3 text-sm focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all duration-200"
                                    style={{
                                        borderColor: 'var(--border-color)',
                                        backgroundColor: 'var(--container-color)',
                                        color: 'var(--text-color)',
                                        paddingLeft: isArabic ? '16px' : '40px',
                                        paddingRight: isArabic ? '40px' : '16px',
                                        focusRingColor: 'var(--accent-color)',
                                        textAlign: isArabic ? 'right' : 'left'
                                    }}
                                />
                            </div>
                            
                            {/* Select All Button */}
                            {filteredAvailableUsers.length > 0 && (
                                <div className={`flex items-center justify-between ${isArabic ? 'flex-row-reverse' : ''}`}>
                                    <div className="text-sm" style={{ color: 'var(--sub-text-color)' }}>
                                        {t('shifts.assignUsers.selectedCount', '{{count}} user(s) selected', { count: selectedUserIds.length })}
                                    </div>
                                    <button
                                        onClick={selectAllAvailable}
                                        className="px-4 py-2 rounded-lg border text-sm font-medium transition-all hover:bg-[var(--hover-color)]"
                                        style={{
                                            borderColor: 'var(--border-color)',
                                            color: 'var(--text-color)'
                                        }}
                                    >
                                        {allAvailableSelected 
                                            ? t('shifts.assignUsers.deselectAll', 'Deselect All')
                                            : t('shifts.assignUsers.selectAll', 'Select All')
                                        }
                                    </button>
                                </div>
                            )}
                            
                            {/* Available Users List */}
                            <div className="border rounded-xl overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
                                {isLoadingUsers ? (
                                    <div className="p-12 text-center">
                                        <div className="text-[var(--sub-text-color)]">{t('shifts.assignUsers.loadingUsers', 'Loading users...')}</div>
                                    </div>
                                ) : filteredAvailableUsers.length === 0 ? (
                                    <div className="p-12 text-center">
                                        <User className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--sub-text-color)' }} />
                                        <div className="text-[var(--sub-text-color)]">
                                            {addSearchTerm || addDepartmentId || addTeamId
                                                ? t('shifts.assignUsers.noUsersFound', 'No users found matching your filters')
                                                : t('shifts.assignUsers.allUsersAssigned', 'All users are already assigned to this shift')}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="max-h-64 overflow-y-auto">
                                        {filteredAvailableUsers.map((user) => {
                                            const isSelected = selectedUserIds.includes(user.id);
                                            return (
                                                <div
                                                    key={user.id}
                                                    onClick={() => toggleUserSelection(user.id)}
                                                    className={`p-4 border-b cursor-pointer transition-colors ${
                                                        isSelected 
                                                            ? 'bg-[var(--accent-color)]/10' 
                                                            : 'hover:bg-[var(--hover-color)]'
                                                    }`}
                                                    style={{ borderColor: 'var(--border-color)' }}
                                                >
                                                    <div className={`flex items-center gap-3 ${isArabic ? 'flex-row-reverse' : ''}`}>
                                                        {/* Checkbox */}
                                                        <div
                                                            className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                                                isSelected 
                                                                    ? 'bg-[var(--accent-color)] border-[var(--accent-color)]' 
                                                                    : 'border-[var(--border-color)]'
                                                            }`}
                                                        >
                                                            {isSelected && (
                                                                <Check className="w-3 h-3 text-white" />
                                                            )}
                                                        </div>
                                                        
                                                        {/* User Info */}
                                                        <div className="flex-1 min-w-0">
                                                            <div className={`font-medium ${isArabic ? 'text-right' : 'text-left'}`} style={{ color: 'var(--text-color)' }}>
                                                                {user.firstName} {user.lastName}
                                                            </div>
                                                            <div className={`text-sm ${isArabic ? 'text-right' : 'text-left'}`} style={{ color: 'var(--sub-text-color)' }}>
                                                                {user.email}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                            
                            {/* Add Button */}
                            {selectedUserIds.length > 0 && (
                                <button
                                    onClick={handleAddUsers}
                                    disabled={isAssigning || !effectiveFrom || !effectiveTo}
                                    className="w-full px-6 py-3 rounded-lg font-medium text-sm text-white transition-all duration-200 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    style={{
                                        backgroundColor: 'var(--accent-color)'
                                    }}
                                >
                                    <Plus className="w-4 h-4" />
                                    {isAssigning 
                                        ? t('shifts.assignUsers.adding', 'Adding...')
                                        : t('shifts.assignUsers.addSelected', 'Add Selected Users ({{count}})', { count: selectedUserIds.length })
                                    }
                                </button>
                            )}
                        </div>
                    </div>
                    
                    {/* Footer */}
                    <div className="p-6 border-t flex-shrink-0" style={{ borderColor: 'var(--border-color)' }}>
                        <div className={`flex items-center gap-3 ${isArabic ? 'flex-row-reverse' : 'justify-end'}`}>
                            <button
                                onClick={handleClose}
                                className="px-6 py-2 rounded-lg border font-medium text-sm transition-all duration-200 hover:bg-[var(--hover-color)]"
                                style={{
                                    borderColor: 'var(--border-color)',
                                    color: 'var(--text-color)'
                                }}
                            >
                                {t('shifts.assignUsers.close', 'Close')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={showDeleteConfirm}
                onClose={() => {
                    setShowDeleteConfirm(false);
                    setAssignmentToDelete(null);
                }}
                onConfirm={handleConfirmDelete}
                title={t('shifts.assignUsers.removeTitle', 'Remove User from Shift')}
                message={t('shifts.assignUsers.removeConfirm', 'Are you sure you want to remove this user from the shift?')}
                confirmText={t('shifts.assignUsers.remove', 'Remove')}
                cancelText={t('shifts.assignUsers.cancel', 'Cancel')}
                type="danger"
            />
        </>
    );
};

export default AssignUsersPopup;
