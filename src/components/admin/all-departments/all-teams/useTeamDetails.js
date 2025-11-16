import { useGetTeamUsersQuery } from "../../../../services/apis/TeamApi";
import { useGetUserByIdQuery } from "../../../../services/apis/UserApi";
import { useMemo } from "react";

/**
 * Custom hook to enrich team data with leader and members
 * Fetches team members and potentially team leader details
 */
export function useTeamDetails(team) {
  const teamId = team?.id;
  const teamLeadId = team?.teamLeadId || team?.teamLead?.id;
  
  // Fetch team users/members - API returns [{ userId, teamId }]
  const { data: teamUsersData, isLoading: isLoadingMembers } = useGetTeamUsersQuery(teamId, {
    skip: !teamId
  });

  // Parse team users - extract userIds from response
  const teamUsers = teamUsersData?.value || teamUsersData?.data || teamUsersData?.items || teamUsersData || [];
  const teamMembersArray = Array.isArray(teamUsers) ? teamUsers : [];
  
  // Extract userIds from the response (API returns { userId, teamId })
  const memberUserIds = teamMembersArray
    .map(item => item?.userId || item?.id)
    .filter(Boolean);

  // Fetch user details for each member (for now, we'll display userIds until we have user details)
  // Note: Fetching multiple users individually is not optimal, but works for now
  // TODO: If your API has a bulk user fetch endpoint, use that instead
  
  // Check if teamLeadId is a valid (non-empty) GUID
  const isValidGuid = (guid) => {
    if (!guid) return false;
    const emptyGuidPattern = /^0{8}-0{4}-0{4}-0{4}-0{12}$/i;
    return !emptyGuidPattern.test(String(guid));
  };

  const hasValidTeamLeader = isValidGuid(teamLeadId);

  // Count: team leader (if valid and not in members) + team members
  const teamLeaderInMembers = hasValidTeamLeader && memberUserIds.some(userId => {
    return String(userId) === String(teamLeadId);
  });
  
  const memberCount = teamLeaderInMembers 
    ? memberUserIds.length 
    : (hasValidTeamLeader ? 1 : 0) + memberUserIds.length;

  // Build enriched team object - only include real data from API
  const enrichedTeam = {
    ...team,
    // Team lead from API response (only if it exists)
    lead: team.teamLead?.name || 
          (team.teamLead?.firstName || team.teamLead?.lastName 
            ? `${team.teamLead?.firstName || ''} ${team.teamLead?.lastName || ''}`.trim() 
            : null) ||
          team.lead || 
          null,
    leadAvatar: team.teamLead?.avatar || team.leadAvatar || null,
    leadRole: team.teamLead?.jobTitle || team.teamLead?.role || team.leadRole || null,
    // Store raw userIds for fetching user details
    memberUserIds, 
    memberCount,
    teamLeadId,
    isLoadingMembers
  };

  return enrichedTeam;
}

