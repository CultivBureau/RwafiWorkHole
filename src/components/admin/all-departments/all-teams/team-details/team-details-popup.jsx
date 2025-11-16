import React, { useMemo, useState, useEffect } from 'react';
import { X, Users, User, Search, Calendar } from 'lucide-react';
import { useGetTeamUsersQuery } from '../../../../../services/apis/TeamApi';
import { useGetTeamClockinLogsQuery } from '../../../../../services/apis/ClockinLogApi';
import { useTranslation } from 'react-i18next';
import { utcToLocalDate, utcToLocalTime } from '../../../../../utils/timeUtils';

const TeamDetailsPopup = ({ isOpen, onClose, team }) => {
    const { t, i18n } = useTranslation();
    const isRtl = i18n.dir() === 'rtl';
    const [memberSearchTerm, setMemberSearchTerm] = useState('');
    const [attendanceSearchTerm, setAttendanceSearchTerm] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    // Fetch team members - always call hooks at the top level
    const { data: teamUsersData } = useGetTeamUsersQuery(team?.id, {
        skip: !team?.id || !isOpen
    });

    const {
        data: teamAttendanceData,
        isLoading: attendanceLoading,
        isError: attendanceError,
        error: attendanceErrorDetails,
        refetch: refetchAttendance,
    } = useGetTeamClockinLogsQuery(team?.id, {
        skip: !team?.id || !isOpen,
    });

    // Parse team members - extract user objects from API response
    // API returns [{ userId, user: {...}, teamId }] or [{ userId, teamId }]
    const teamMembers = useMemo(() => {
        if (!teamUsersData) return [];
        const rawMembers = teamUsersData?.value || teamUsersData?.data || teamUsersData?.items || teamUsersData || [];
        const membersArray = Array.isArray(rawMembers) ? rawMembers : [];

        // Extract user objects from the response
        return membersArray.map(item => {
            // If user object exists in response, use it; otherwise create minimal object from userId
            const user = item?.user || item?.User || null;
            const userId = item?.userId || item?.id || item?.user?.id || null;

            return {
                userId,
                user: user || { id: userId },
                // User information - handle both nested user object and direct properties
                name: user?.name ||
                    (user?.firstName || user?.lastName
                        ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                        : user?.userName || user?.email || userId?.substring(0, 8) || 'Unknown'),
                firstName: user?.firstName,
                lastName: user?.lastName,
                email: user?.email || user?.userName,
                jobTitle: user?.jobTitle || user?.role,
                avatar: user?.avatar || user?.profilePicture,
            };
        });
    }, [teamUsersData]);

    // Extract team leader information from team object
    const teamLeader = useMemo(() => {
        const leader = team?.teamLeader || team?.teamLead || null;
        if (!leader) return null;

        return {
            id: leader.id || leader.userId || team?.teamLeadId,
            name: leader.name ||
                (leader.firstName || leader.lastName
                    ? `${leader.firstName || ''} ${leader.lastName || ''}`.trim()
                    : leader.userName || leader.email || 'Unknown'),
            firstName: leader.firstName,
            lastName: leader.lastName,
            email: leader.email || leader.userName,
            jobTitle: leader.jobTitle || leader.role || 'Team Lead',
            avatar: leader.avatar || leader.profilePicture,
        };
    }, [team]);

    const attendanceSearchLower = attendanceSearchTerm.trim().toLowerCase();
    const locale = i18n.language === 'ar' ? 'ar-EG' : 'en-US';

    const parseLocalDateKey = (isoString) => {
        if (!isoString) return null;
        let value = isoString;
        if (typeof value === 'string' && !value.endsWith('Z') && !value.includes('+') && !value.includes('-', 10)) {
            value = value + 'Z';
        }
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return null;
        const year = date.getFullYear();
        const month = `${date.getMonth() + 1}`.padStart(2, '0');
        const day = `${date.getDate()}`.padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const teamAttendanceLogs = useMemo(() => {
        if (!teamAttendanceData) return [];

        const rawLogs =
            teamAttendanceData?.value ||
            teamAttendanceData?.data ||
            teamAttendanceData?.items ||
            teamAttendanceData ||
            [];

        if (!Array.isArray(rawLogs)) return [];

        return rawLogs.map((log, index) => {
            const user = log?.user || log?.User || {};
            const userId = log?.userId || user?.id || `log-${index}`;
            const firstName = user?.firstName || '';
            const lastName = user?.lastName || '';
            const fullName = (firstName || lastName)
                ? `${firstName || ''} ${lastName || ''}`.trim()
                : user?.userName || user?.email || t('teamDetails.unknownMember', 'Unknown Member');

            const clockInDate = log?.clockinTime ? utcToLocalDate(log.clockinTime, locale) : '—';
            const clockInTime = log?.clockinTime ? utcToLocalTime(log.clockinTime, locale) : '—';
            const clockOutTime = log?.clockoutTime ? utcToLocalTime(log.clockoutTime, locale) : '—';
            const localDateKey = parseLocalDateKey(log?.clockinTime) || parseLocalDateKey(log?.clockoutTime);

            return {
                id: log?.id || `${userId}-${index}`,
                userId,
                name: fullName,
                email: user?.email || user?.userName || '',
                dateDisplay: clockInDate,
                dateKey: localDateKey,
                clockInTime,
                clockOutTime,
            };
        });
    }, [teamAttendanceData, locale, t]);

    const filteredAttendanceLogs = useMemo(() => {
        return teamAttendanceLogs.filter((log) => {
            const matchesSearch =
                !attendanceSearchLower ||
                log.name?.toLowerCase().includes(attendanceSearchLower) ||
                log.email?.toLowerCase().includes(attendanceSearchLower);

            const matchesDate = selectedDate
                ? log.dateKey === selectedDate
                : true;

            return matchesSearch && matchesDate;
        });
    }, [teamAttendanceLogs, attendanceSearchLower, selectedDate]);

    // Filter members based on search term
    const filteredMembers = useMemo(() => {
        if (!memberSearchTerm.trim()) return teamMembers;
        const searchLower = memberSearchTerm.toLowerCase();
        return teamMembers.filter(member =>
            member.name?.toLowerCase().includes(searchLower) ||
            member.email?.toLowerCase().includes(searchLower) ||
            member.userId?.toLowerCase().includes(searchLower)
        );
    }, [teamMembers, memberSearchTerm]);

    // Handle escape key - moved before the early return
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && onClose && typeof onClose === 'function') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            return () => {
                document.removeEventListener('keydown', handleKeyDown);
            };
        }
    }, [isOpen, onClose]);

    // Early return after all hooks
    if (!isOpen || !team) return null;

    const teamData = team;

    // Handle close with safety check
    const handleClose = () => {
        if (onClose && typeof onClose === 'function') {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/20 backdrop-blur-lg"
                onClick={handleClose}
            />

            {/* Popup Content */}
            <div
                className="relative bg-[var(--bg-all)] rounded-xl shadow-2xl border border-[var(--border-color)] p-6 m-4 animate-popup-scale"
                style={{ maxWidth: "1400px", width: "100%", maxHeight: "90vh" }}
                onClick={(e) => e.stopPropagation()}
                dir={isRtl ? "rtl" : "ltr"}
            >
                {/* Header */}
                <div className={`flex items-center justify-between mb-6 ${isRtl ? 'flex-row-reverse' : ''}`}>
                    <div className={`flex items-center gap-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                        <div className="w-12 h-12 gradient-bg rounded-lg flex items-center justify-center">
                            <Users className="text-white" size={24} />
                        </div>
                        <div className={isRtl ? 'text-right' : 'text-left'}>
                            <h2 className="text-2xl font-bold text-[var(--text-color)]">
                                {teamData.name}
                            </h2>
                            <p className="text-[var(--sub-text-color)]">
                                {teamData.description}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 rounded-lg hover:bg-[var(--hover-color)] transition-colors"
                        title="Close"
                        type="button"
                    >
                        <X className="w-6 h-6" style={{ color: "var(--sub-text-color)" }} />
                    </button>
                </div>

                {/* Two Column Layout */}
                <div className="max-h-[70vh] overflow-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left Column - Team Information */}
                        <div className="space-y-4">
                            {/* Team Leader Section */}
                            <div className="bg-[var(--bg-color)] rounded-xl p-5 border border-[var(--border-color)]">
                                <h3 className={`text-lg font-semibold text-[var(--text-color)] mb-4 ${isRtl ? 'text-right' : 'text-left'}`}>
                                    {t('teamDetails.teamLeader', 'Team Leader')}
                                </h3>
                                {teamLeader ? (
                                    <div className={`flex items-center gap-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                        {teamLeader.avatar ? (
                                            <img
                                                src={teamLeader.avatar}
                                                alt={teamLeader.name}
                                                className="w-16 h-16 rounded-full object-cover border-2 border-[var(--accent-color)]"
                                            />
                                        ) : (
                                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
                                                {teamLeader.name ? teamLeader.name.substring(0, 2).toUpperCase() :
                                                    (teamLeader.firstName ? teamLeader.firstName.substring(0, 1).toUpperCase() : 'TL')}
                                            </div>
                                        )}
                                        <div className={isRtl ? 'text-right' : 'text-left'}>
                                            <p className="font-semibold text-[var(--text-color)] text-lg">
                                                {teamLeader.name}
                                            </p>
                                            {teamLeader.email && (
                                                <p className="text-[var(--sub-text-color)] text-sm">
                                                    {teamLeader.email}
                                                </p>
                                            )}
                                            {teamLeader.jobTitle && (
                                                <div className={`flex items-center gap-2 mt-1 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                                    <User size={14} className="text-[var(--accent-color)]" />
                                                    <span className="text-xs text-[var(--sub-text-color)]">
                                                        {teamLeader.jobTitle}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-4 text-[var(--sub-text-color)]">
                                        <User size={32} className="mx-auto mb-2 opacity-50" />
                                        <p>{t('teamDetails.noLeader', 'No Leader Assigned')}</p>
                                    </div>
                                )}
                            </div>

                            {/* Team Members Section */}
                            <div className="bg-[var(--bg-color)] rounded-xl p-5 border border-[var(--border-color)]">
                                <div className={`flex items-center justify-between mb-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                    <h3 className="text-lg font-semibold text-[var(--text-color)]">
                                        {t('teamDetails.teamMembers', 'Team Members')} ({memberSearchTerm ? `${filteredMembers.length} / ${teamMembers.length}` : teamMembers.length})
                                    </h3>
                                </div>

                                {/* Member Search */}
                                <div className="relative mb-4">
                                    <Search className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 text-[var(--sub-text-color)]`} size={16} />
                                    <input
                                        type="text"
                                        placeholder={t('teamDetails.searchMembers', 'Search members...')}
                                        value={memberSearchTerm}
                                        onChange={(e) => setMemberSearchTerm(e.target.value)}
                                        className={`w-full ${isRtl ? 'pr-10 pl-3 text-right' : 'pl-10 pr-3 text-left'} py-2 bg-[var(--container-color)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] text-[var(--text-color)]`}
                                    />
                                </div>

                                {/* Members List */}
                                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                                    {filteredMembers.length === 0 ? (
                                        <div className="text-center py-8 text-[var(--sub-text-color)]">
                                            <Users size={48} className="mx-auto mb-2 opacity-50" />
                                            <p>
                                                {memberSearchTerm
                                                    ? t('teamDetails.noMembersFound', 'No members found matching your search')
                                                    : t('teamDetails.noMembers', 'No members in this team yet')}
                                            </p>
                                        </div>
                                    ) : (
                                        filteredMembers.map((member, index) => (
                                            <div
                                                key={member.userId || index}
                                                className={`flex items-center gap-3 p-3 bg-[var(--container-color)] rounded-lg border border-[var(--border-color)] hover:shadow-md transition-all ${isRtl ? 'flex-row-reverse' : ''}`}
                                            >
                                                {member.avatar ? (
                                                    <img
                                                        src={member.avatar}
                                                        alt={member.name}
                                                        className="w-12 h-12 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white font-semibold">
                                                        {member.name ? member.name.substring(0, 2).toUpperCase() :
                                                            (member.firstName ? member.firstName.substring(0, 1).toUpperCase() :
                                                                member.userId?.substring(0, 2).toUpperCase() || 'M')}
                                                    </div>
                                                )}
                                                <div className={`flex-1 ${isRtl ? 'text-right' : 'text-left'}`}>
                                                    <p className="font-medium text-[var(--text-color)]">
                                                        {member.name}
                                                    </p>
                                                    {member.email && (
                                                        <p className="text-sm text-[var(--sub-text-color)]">
                                                            {member.email}
                                                        </p>
                                                    )}
                                                    {member.jobTitle && (
                                                        <p className="text-xs text-[var(--sub-text-color)] mt-0.5">
                                                            {member.jobTitle}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="px-3 py-1 bg-[var(--accent-color)]/10 rounded-full">
                                                    <span className="text-xs font-medium text-[var(--accent-color)]">
                                                        {t('teamDetails.active', 'Active')}
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Attendance Table */}
                        <div className="bg-[var(--bg-color)] rounded-xl p-5 border border-[var(--border-color)]">
                            <h3 className={`text-lg font-semibold text-[var(--text-color)] mb-4 ${isRtl ? 'text-right' : 'text-left'}`}>
                                {t('teamDetails.attendance', 'Team Attendance')}
                            </h3>

                            {/* Filters */}
                            <div className={`flex items-center gap-3 mb-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                {/* Search */}
                                <div className="relative flex-1">
                                    <Search className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 text-[var(--sub-text-color)]`} size={16} />
                                    <input
                                        type="text"
                                        placeholder={t('teamDetails.searchAttendance', 'Search attendance...')}
                                        value={attendanceSearchTerm}
                                        onChange={(e) => setAttendanceSearchTerm(e.target.value)}
                                        className={`w-full ${isRtl ? 'pr-10 pl-3 text-right' : 'pl-10 pr-3 text-left'} py-2 bg-[var(--container-color)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] text-[var(--text-color)]`}
                                    />
                                </div>

                                {/* Date Filter */}
                                <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                                    <Calendar size={16} className="text-[var(--sub-text-color)]" />
                                    <input
                                        type="date"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        className="px-3 py-2 bg-[var(--container-color)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] text-[var(--text-color)]"
                                        style={{ colorScheme: 'var(--theme)' }}
                                    />
                                </div>
                            </div>

                            {/* Attendance Table */}
                            <div className="rounded-lg border border-[var(--border-color)] overflow-hidden">
                                <table className="w-full">
                                    <thead className="bg-[var(--container-color)]">
                                        <tr>
                                            <th className={`${isRtl ? 'text-right' : 'text-left'} py-3 px-4 text-sm font-semibold text-[var(--text-color)]`}>
                                                {t('teamDetails.employeeName', 'Employees Name')}
                                            </th>
                                            <th className={`${isRtl ? 'text-right' : 'text-left'} py-3 px-4 text-sm font-semibold text-[var(--text-color)]`}>
                                                {t('teamDetails.date', 'Date')}
                                            </th>
                                            <th className={`${isRtl ? 'text-right' : 'text-left'} py-3 px-4 text-sm font-semibold text-[var(--text-color)]`}>
                                                {t('teamDetails.checkIn', 'Check-in')}
                                            </th>
                                            <th className={`${isRtl ? 'text-right' : 'text-left'} py-3 px-4 text-sm font-semibold text-[var(--text-color)]`}>
                                                {t('teamDetails.checkOut', 'Check-out')}
                                            </th>
                                        </tr>
                                    </thead>
                                </table>

                                {/* Scrollable Body */}
                                <div className="max-h-[500px] overflow-y-auto">
                                    <table className="w-full">
                                        <tbody className="bg-[var(--bg-color)] divide-y divide-[var(--border-color)]">
                                            {attendanceLoading ? (
                                                <tr>
                                                    <td colSpan="4" className="py-8 px-4 text-center text-[var(--sub-text-color)] text-sm">
                                                        {t('teamDetails.loadingAttendance', 'Loading attendance records...')}
                                                    </td>
                                                </tr>
                                            ) : attendanceError ? (
                                                <tr>
                                                    <td colSpan="4" className="py-8 px-4 text-center text-[var(--error-color)] text-sm space-y-2">
                                                        <p>{t('teamDetails.attendanceError', 'Failed to load attendance records')}</p>
                                                        <button
                                                            onClick={() => refetchAttendance()}
                                                            className="px-3 py-1 text-xs border border-[var(--border-color)] rounded hover:bg-[var(--hover-color)] transition-colors"
                                                        >
                                                            {t('teamDetails.retry', 'Retry')}
                                                        </button>
                                                        {attendanceErrorDetails?.data?.message && (
                                                            <p className="text-[10px] text-[var(--sub-text-color)]">
                                                                {attendanceErrorDetails.data.message}
                                                            </p>
                                                        )}
                                                    </td>
                                                </tr>
                                            ) : filteredAttendanceLogs.length === 0 ? (
                                                <tr>
                                                    <td colSpan="4" className="py-12 px-4 text-center text-[var(--sub-text-color)]">
                                                        <Calendar size={48} className="mx-auto mb-3 opacity-50" />
                                                        <p className="font-medium mb-1">{t('teamDetails.noAttendance', 'No attendance records found')}</p>
                                                        <p className="text-xs">
                                                            {attendanceSearchTerm || selectedDate
                                                                ? t('teamDetails.adjustFilters', 'Try adjusting your search or date filters')
                                                                : t('teamDetails.attendanceNote', 'Attendance data will appear here once team members check in')}
                                                        </p>
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredAttendanceLogs.map((log) => (
                                                    <tr key={log.id} className="hover:bg-[var(--hover-color)]/50 transition-colors">
                                                        <td className={`${isRtl ? 'text-right' : 'text-left'} py-3 px-4 text-sm text-[var(--text-color)]`}>
                                                            <div className="flex flex-col">
                                                                <span className="font-medium">{log.name}</span>
                                                                {log.email && (
                                                                    <span className="text-xs text-[var(--sub-text-color)]">{log.email}</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className={`${isRtl ? 'text-right' : 'text-left'} py-3 px-4 text-sm text-[var(--text-color)]`}>
                                                            {log.dateDisplay}
                                                        </td>
                                                        <td className={`${isRtl ? 'text-right' : 'text-left'} py-3 px-4 text-sm text-[var(--text-color)]`}>
                                                            {log.clockInTime}
                                                        </td>
                                                        <td className={`${isRtl ? 'text-right' : 'text-left'} py-3 px-4 text-sm text-[var(--text-color)]`}>
                                                            {log.clockOutTime}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TeamDetailsPopup;
