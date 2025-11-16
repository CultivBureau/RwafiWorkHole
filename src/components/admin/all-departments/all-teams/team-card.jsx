import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Users, Edit, Trash2, MoreVertical } from "lucide-react";
import TeamDetailsPopup from "./team-details/team-details-popup";
import TeamMemberItem from "./team-member-item";

export default function TeamCard({ 
    team, 
    onEdit, 
    onDelete,
    canUpdate = true,
    canDelete = true,
    canRestore = true,
    canViewMembers = true,
    canAddMember = true,
    canUpdateMember = true,
    canRemoveMember = true
}) {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const isArabic = i18n.language === "ar";
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showDetailsPopup, setShowDetailsPopup] = useState(false);

    const handleViewDetails = () => {
        setShowDetailsPopup(true);
    };

    const handleEditTeam = (e) => {
        e.stopPropagation(); // Prevent card click
        setIsMenuOpen(false);
        if (onEdit) {
            onEdit(team);
        }
    };

    const handleDeleteTeam = (e) => {
        e.stopPropagation(); // Prevent card click
        setIsMenuOpen(false);
        if (onDelete) {
            onDelete(team.id);
        }
    };

    const handleMenuToggle = (e) => {
        e.stopPropagation(); // Prevent card click
        setIsMenuOpen(!isMenuOpen);
    };

    return (
        <div
            className="bg-[var(--bg-color)] rounded-xl p-6 border border-[var(--border-color)] hover:shadow-lg transition-all duration-300 cursor-pointer"
            dir={isArabic ? "rtl" : "ltr"}
            onClick={handleViewDetails}
        >
            {/* Team Header */}
            <div className={`flex items-start justify-between mb-4 ${isArabic ? 'flex-row-reverse' : ''}`}>
                <div className={`flex items-center gap-3 ${isArabic ? 'flex-row-reverse' : ''}`}>
                    <div className={`${isArabic ? 'text-right' : 'text-left'}`}>
                        <h3 className="text-lg font-semibold text-[var(--text-color)]">
                            {team.name}
                        </h3>
                        <p className="text-sm text-[var(--sub-text-color)]">
                            {team.isLoadingMembers ? (
                                <span className="text-xs">Loading...</span>
                            ) : (
                                <>
                                    {team.memberCount || team.members?.length || 0} {t("allTeams.teamCard.members")}
                                </>
                            )}
                        </p>
                    </div>
                </div>

                {/* Avatars and Three Dot Menu */}
                <div className={`flex items-center gap-2 ${isArabic ? 'flex-row-reverse' : ''}`}>
                    {/* Member Count Badge */}
                    {(team.memberCount > 0 || team.memberUserIds?.length > 0) && (
                        <div className="w-8 h-8 rounded-full bg-[var(--container-color)] border-2 border-[var(--bg-color)] flex items-center justify-center text-xs font-medium text-[var(--sub-text-color)]">
                            {team.memberCount || team.memberUserIds?.length || 0}
                        </div>
                    )}

                    {/* Three Dot Menu - Only show if user has any action permissions */}
                    {(canUpdate || canDelete || canRestore) && (
                        <div className="relative">
                            <button
                                onClick={handleMenuToggle}
                                className="p-2 hover:bg-[var(--hover-color)] rounded-lg transition-colors"
                            >
                                <MoreVertical className="text-[var(--sub-text-color)]" size={16} />
                            </button>

                            {isMenuOpen && (
                                <div className={`absolute top-full mt-1 w-32 bg-[var(--bg-color)] border border-[var(--border-color)] rounded-lg shadow-lg z-10 ${isArabic ? 'right-0' : 'left-0'}`}>
                                    {canUpdate && (
                                        <button
                                            onClick={handleEditTeam}
                                            className="w-full px-3 py-2 text-left hover:bg-[var(--hover-color)] transition-colors flex items-center gap-2 text-[var(--text-color)]"
                                        >
                                            <Edit size={14} />
                                            <span>Edit</span>
                                        </button>
                                    )}
                                    {canDelete && (
                                        <button
                                            onClick={handleDeleteTeam}
                                            className="w-full px-3 py-2 text-left hover:bg-[var(--hover-color)] transition-colors flex items-center gap-2 text-red-500"
                                        >
                                            <Trash2 size={14} />
                                            <span>Delete</span>
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Team Lead Header */}
            {(team.lead || team.teamLeader) && team.lead !== "Unknown" && (
                <>
                    <div className={`flex items-center justify-between mb-4 ${isArabic ? 'flex-row-reverse' : ''}`}>
                        <div className={`flex items-center gap-3 ${isArabic ? 'flex-row-reverse' : ''}`}>
                            {team.leadAvatar && (
                                <img
                                    src={team.leadAvatar}
                                    alt={team.lead || 'Team Leader'}
                                    className="w-8 h-8 rounded-full"
                                />
                            )}
                            <div className={`${isArabic ? 'text-right' : 'text-left'}`}>
                                <p className="text-sm font-medium text-[var(--text-color)]">
                                    {team.lead || (team.teamLeader 
                                        ? `${team.teamLeader.firstName || ''} ${team.teamLeader.lastName || ''}`.trim() || team.teamLeader.userName || team.teamLeader.email || 'Team Leader'
                                        : 'Team Leader')}
                                </p>
                                {(team.leadRole || team.teamLeader?.jobTitle) && (
                                    <p className="text-xs text-[var(--sub-text-color)]">
                                        {team.leadRole || team.teamLeader?.jobTitle}
                                    </p>
                                )}
                                {team.teamLeader?.email && !team.leadRole && !team.teamLeader?.jobTitle && (
                                    <p className="text-xs text-[var(--sub-text-color)]">
                                        {team.teamLeader.email}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                    {/* Divider under team leader */}
                    <div className="w-full h-px bg-[var(--border-color)] mb-4"></div>
                </>
            )}

            {/* Team Members List - Only show if user has permission to view members */}
            {canViewMembers ? (
                team.isLoadingMembers ? (
                    <div className="space-y-3">
                        <div className="text-xs text-[var(--sub-text-color)] p-3">Loading members...</div>
                    </div>
                ) : team.memberUserIds && team.memberUserIds.length > 0 ? (
                    <div className="space-y-3">
                        {team.memberUserIds.slice(0, 3).map((userId) => (
                            <TeamMemberItem 
                                key={userId} 
                                userId={userId} 
                                isArabic={isArabic}
                                canUpdateMember={canUpdateMember}
                                canRemoveMember={canRemoveMember}
                            />
                        ))}
                        {team.memberUserIds.length > 3 && (
                            <div className="text-xs text-[var(--sub-text-color)] text-center p-2">
                                +{team.memberUserIds.length - 3} more members
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="text-xs text-[var(--sub-text-color)] p-3 text-center">No members yet</div>
                    </div>
                )
            ) : (
                <div className="space-y-3">
                    <div className="text-xs text-[var(--sub-text-color)] p-3 text-center">
                        {t("allTeams.teamCard.noPermissionViewMembers", "You don't have permission to view team members")}
                    </div>
                </div>
            )}

            {/* Team Details Popup */}
            <TeamDetailsPopup
                isOpen={showDetailsPopup}
                onClose={() => setShowDetailsPopup(false)}
                team={team}
            />
        </div>
    );
}
