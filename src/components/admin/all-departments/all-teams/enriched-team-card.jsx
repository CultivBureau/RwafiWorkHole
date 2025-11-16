import React from "react";
import TeamCard from "./team-card";
import { useTeamDetails } from "./useTeamDetails";

/**
 * Wrapper component that enriches team data with members and leader details
 * then renders TeamCard
 */
export default function EnrichedTeamCard({ 
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
    const enrichedTeam = useTeamDetails(team);
    
    return (
        <TeamCard 
            team={enrichedTeam} 
            onEdit={onEdit} 
            onDelete={onDelete}
            canUpdate={canUpdate}
            canDelete={canDelete}
            canRestore={canRestore}
            canViewMembers={canViewMembers}
            canAddMember={canAddMember}
            canUpdateMember={canUpdateMember}
            canRemoveMember={canRemoveMember}
        />
    );
}

