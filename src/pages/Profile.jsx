import React, { useEffect, useMemo } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useLang } from "../contexts/LangContext"
import { useProfile } from '../hooks/useProfile'
import NavigationMenu from "../components/profile/sections/NavigationMenu"
import ProfileTabs from "../components/profile/sections/profile-tabs"
import DataReview from "../components/profile/sections/data-review"
import Table from "../components/profile/sections/Table"
import AccountAccessSection from "../components/profile/sections/AccountAccessSection"
import DepartmentsTeamsSection from "../components/profile/sections/departments-teams"
import { useTranslation } from "react-i18next"
import { useLocation } from "react-router-dom"
import { useMeQuery } from "../services/apis/AuthApi"
import { useGetUserProfileClockInLogsQuery } from "../services/apis/ClockinLogApi"
import { useGetUserProfileByIdQuery } from "../services/apis/UserApi"
import { useGetUserLeaveLogsQuery } from "../services/apis/LeaveApi"
import { useGetUserTeamsAndDepartmentsQuery } from "../services/apis/TeamApi"
import { useLazyGetUserByIdQuery } from "../services/apis/UserApi"
import { utcToLocalDate, getDeviceLocale } from "../utils/timeUtils"
import Loading from "../components/Loading/Loading"

const isDepartmentActive = (entity) => {
  if (!entity) return false
  const rawStatus =
    entity.status ??
    entity.isActive ??
    entity.active

  if (typeof rawStatus === "boolean") {
    return rawStatus
  }

  if (typeof rawStatus === "number") {
    return rawStatus === 1
  }

  if (typeof rawStatus === "string") {
    const normalized = rawStatus.trim().toLowerCase()
    if (!normalized) return true
    return ["active", "true", "1", "enabled"].includes(normalized)
  }

  return true
}

const buildDepartmentsAndTeams = (departmentsInput, teamsInput) => {
  const departments = Array.isArray(departmentsInput)
    ? departmentsInput.filter(isDepartmentActive)
    : []
  const teams = Array.isArray(teamsInput) ? teamsInput : []
  const departmentMap = new Map()

  departments.forEach((dept, index) => {
    const rawId =
      dept?.id ||
      dept?.departmentId ||
      dept?.value ||
      dept?.code ||
      dept?.name ||
      `dept-${index}`
    const id = String(rawId)

    if (!departmentMap.has(id)) {
      departmentMap.set(id, {
        id,
        name: dept?.name || dept?.displayName || dept?.title || "N/A",
        description: dept?.description || "",
        status: dept?.status ?? null,
        teams: [],
      })
    }
  })

  teams.forEach((team, index) => {
    let deptId =
      team?.departmentId ||
      team?.department?.id ||
      team?.department?.departmentId ||
      team?.departments?.[0]?.id ||
      null

    if (!deptId && team?.department?.name) {
      deptId = `team-derived-${index}`
    }

    if (!deptId) {
      deptId = `unassigned-${index}`
    }

    const deptIdStr = String(deptId)
    const teamDepartment = team?.department

    if (teamDepartment && !isDepartmentActive(teamDepartment)) {
      return
    }

    if (!departmentMap.has(deptIdStr)) {
      if (!teamDepartment) {
        return
      }

      departmentMap.set(deptIdStr, {
        id: deptIdStr,
        name: teamDepartment?.name || "N/A",
        description: teamDepartment?.description || "",
        status: teamDepartment?.status ?? null,
        teams: [],
      })
    }

    const leadId =
      team?.teamLeadUser?.id ||
      team?.teamLeadId ||
      team?.teamLeadUserId ||
      team?.teamLead?.id ||
      team?.teamLeadID

    const teamEntry = {
      id: String(team?.id || `team-${index}`),
      name: team?.name || "N/A",
      description: team?.description || "",
      leadId: leadId ? String(leadId) : undefined,
    }

    departmentMap.get(deptIdStr)?.teams.push(teamEntry)
  })

  return Array.from(departmentMap.values())
    .map((dept) => ({
      ...dept,
      teams: dept.teams.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" })),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }))
}

const Profile = () => {
  const { isRtl } = useLang()
  const { t } = useTranslation()
  const location = useLocation()
  
  // Check if we're viewing an employee from admin panel
  const isAdminView = location.state?.isAdminView || false
  const employeeDataFromState = location.state?.employeeData || null
  
  // Get employee ID from state (if available)
  const employeeIdFromState = employeeDataFromState?.id || employeeDataFromState?.rawData?.id || null
  
  // Fetch employee profile data from API when viewing as admin
  const { data: employeeProfileResponse, isLoading: isLoadingEmployeeProfile } = useGetUserProfileByIdQuery(
    employeeIdFromState,
    { skip: !isAdminView || !employeeIdFromState }
  )
  const employeeDataFromApi = employeeProfileResponse?.value || null
  
  // Use API data if available, otherwise fall back to state data
  const employeeData = employeeDataFromApi || employeeDataFromState
  
  // Fetch user data from /me endpoint (for own profile)
  const { data: meResponse, isLoading: isLoadingUser } = useMeQuery()
  const userDataFromApi = meResponse?.value || null
  
  const {
    fieldLabels,
    activeTab,
    setActiveTab,
    activeSection,
    setActiveSection,
    renderContent
  } = useProfile(isRtl)

  
  // Determine which userId to use for attendance logs
  const userIdForAttendance = useMemo(() => {
    if (employeeData?.id) return employeeData.id
    if (userDataFromApi?.id) return userDataFromApi.id
    return null
  }, [employeeData?.id, userDataFromApi?.id])
  
  // Fetch attendance logs when attendance section is active
  const { data: attendanceResponse, isLoading: isLoadingAttendance } = useGetUserProfileClockInLogsQuery(
    { userId: userIdForAttendance, pageNumber: 1, pageSize: 20 },
    { skip: !userIdForAttendance || activeSection !== 'attendance' }
  )

  // Fetch leave logs when leave section is active
  const { data: leaveLogsResponse, isLoading: isLoadingLeaves } = useGetUserLeaveLogsQuery(
    { userId: userIdForAttendance, pageNumber: 1, pageSize: 20 },
    { skip: !userIdForAttendance || activeSection !== 'leave' }
  )

const { data: userTeamsAndDepartmentsResponse, isFetching: isFetchingUserTeamsAndDepartments } = useGetUserTeamsAndDepartmentsQuery(
  userIdForAttendance,
  { skip: !userIdForAttendance }
)

  // Get user's shift from /me endpoint (for own profile) or employee profile API
  // Note: Shift is included in the GetUserProfile endpoint response, no separate API call needed
  const userShift = useMemo(() => {
    if (isAdminView && employeeData) {
      // For employee profile (admin view), shift comes from GetUserProfile/{id}/profile endpoint
      return employeeData.shift?.name || null
    }
    // For own profile, get shift from /me endpoint
    return userDataFromApi?.shift?.name || null
  }, [userDataFromApi?.shift?.name, employeeData, isAdminView])

  // Helper function to format arrays with bullet points (respects RTL/LTR)
  const formatArrayWithBullets = useMemo(() => {
    return (array, extractName) => {
      if (!array || !Array.isArray(array) || array.length === 0) return 'N/A'
      const names = array.map(item => extractName(item)).filter(Boolean)
      if (names.length === 0) return 'N/A'
      // Use bullet point (•) as separator
      const separator = ' • '
      return names.join(separator)
    }
  }, [])

  // Map API data to display structure
  const displayData = useMemo(() => {
    if (employeeData) {
      // Check if this is API data (has firstName directly) or state data (has name)
      const isApiData = employeeData.firstName !== undefined
      
      if (isApiData) {
        // Admin viewing employee - use API data structure
        // Extract all roles
        const roleNames = formatArrayWithBullets(
          employeeData.roles,
          (role) => typeof role === 'string' ? role : role?.name || ''
        )
        const roleDisplay = roleNames !== 'N/A' ? roleNames : (employeeData.jobTitle || 'N/A')

        // Extract all department names (active only)
        const activeDepartments = Array.isArray(employeeData.departments)
          ? employeeData.departments.filter(isDepartmentActive)
          : []
        const departmentNames = formatArrayWithBullets(
          activeDepartments,
          (dept) => dept?.name || ''
        )

        // Extract all team names
        const teamNames = formatArrayWithBullets(
          employeeData.teams,
          (team) => team?.name || ''
        )

        // Extract team leader name (from first team if available)
        const teamLeadName = employeeData.teams?.[0]?.teamLeadName || null

        return {
          firstName: employeeData.firstName || 'N/A',
          lastName: employeeData.lastName || 'N/A',
          email: employeeData.email || 'N/A',
          avatar: `https://ui-avatars.com/api/?name=${employeeData.firstName}+${employeeData.lastName}&background=15919B&color=fff&size=80`,
          professionalInfo: {
            jobTitle: employeeData.jobTitle || 'N/A',
            role: roleDisplay,
            team: teamNames,
            department: departmentNames,
            shift: userShift || 'N/A',
            hireDate: employeeData.hireDate ? new Date(employeeData.hireDate).toLocaleDateString() : 'N/A'
          },
          personalInfo: {
            firstName: employeeData.firstName || 'N/A',
            lastName: employeeData.lastName || 'N/A',
            email: employeeData.email || 'N/A',
            userName: employeeData.userName || 'N/A'
          },
          accountAccess: {
            userName: employeeData.userName || 'N/A',
            emailAddress: employeeData.email || 'N/A',
            permissions: employeeData.permissions || [],
            leaveBalances: employeeData.leaveBalances || []
          },
          teamLeader: teamLeadName,
          teamLeaderAvatar: null,
        isAdmin: employeeData.isAdmin || false,
          departmentsAndTeams: buildDepartmentsAndTeams(activeDepartments, employeeData.teams)
        }
      } else {
        // Fallback to state data structure (for backward compatibility)
        const normalizedDepartments = Array.isArray(employeeData.departments) && employeeData.departments.length > 0
          ? employeeData.departments
          : employeeData.department
            ? employeeData.department.split("•").map((name, index) => ({
                id: `fallback-dept-${index}`,
                name: name.trim(),
              }))
            : []
        const filteredNormalizedDepartments = normalizedDepartments.filter(isDepartmentActive)

        const normalizedTeams = Array.isArray(employeeData.teams) && employeeData.teams.length > 0
          ? employeeData.teams
          : employeeData.team
            ? employeeData.team.split("•").map((name, index) => ({
                id: `fallback-team-${index}`,
                name: name.trim(),
                departmentId: normalizedDepartments[0]?.id,
                teamLeadName: employeeData.teamLeader || "",
                teamLeadId: employeeData.teamLeaderId || employeeData.teamLeadId,
              }))
            : []

        const fallbackJobTitle = employeeData.jobTitle || employeeData.position || employeeData.designation || 'N/A'
        const fallbackRole = employeeData.role || fallbackJobTitle || 'N/A'
        const fallbackDepartmentLabel = filteredNormalizedDepartments.length
          ? formatArrayWithBullets(filteredNormalizedDepartments, (dept) => dept?.name || '')
          : employeeData.department || 'N/A'
        const fallbackTeamLabel = normalizedTeams.length
          ? formatArrayWithBullets(normalizedTeams, (team) => team?.name || '')
          : employeeData.team || 'N/A'
        const fallbackHireDate = employeeData.joinDate || employeeData.hireDate || 'N/A'

        return {
          firstName: employeeData.name?.split(' ')[0] || 'N/A',
          lastName: employeeData.name?.split(' ').slice(1).join(' ') || 'N/A',
          email: employeeData.email || 'N/A',
          avatar: employeeData.avatar || `https://ui-avatars.com/api/?name=${employeeData.name || 'Employee'}&background=15919B&color=fff&size=80`,
          professionalInfo: {
            jobTitle: fallbackJobTitle,
            role: fallbackRole,
            team: fallbackTeamLabel || 'N/A',
            department: fallbackDepartmentLabel || 'N/A',
            shift: userShift || employeeData.shift || 'N/A',
            hireDate: fallbackHireDate,
            employeeId: employeeData.employeeId || 'N/A'
          },
          personalInfo: {
            firstName: employeeData.name?.split(' ')[0] || 'N/A',
            lastName: employeeData.name?.split(' ').slice(1).join(' ') || 'N/A',
            email: employeeData.email || 'N/A',
            mobileNumber: employeeData.mobileNumber || 'N/A',
            dateOfBirth: employeeData.dateOfBirth || 'N/A',
            gender: employeeData.gender || 'N/A',
            nationality: employeeData.nationality || 'N/A',
            address: employeeData.address || 'N/A',
            status: employeeData.status || 'N/A'
          },
          accountAccess: {
            username: employeeData.username || 'N/A',
            accessLevel: employeeData.accessLevel || 'Standard User',
            permissions: employeeData.permissions || 'Basic Access',
            lastLogin: employeeData.lastLogin || 'Never'
          },
          teamLeader: employeeData.teamLeader || null,
          teamLeaderAvatar: employeeData.teamLeaderAvatar || null,
          isAdmin: employeeData.isAdmin || false,
          departmentsAndTeams: buildDepartmentsAndTeams(filteredNormalizedDepartments, normalizedTeams)
        }
      }
    }
    
    // User viewing own profile - use /me endpoint data
    if (!userDataFromApi) {
      return {
        firstName: 'Loading...',
        lastName: '',
        email: '',
        avatar: 'https://ui-avatars.com/api/?name=User&background=15919B&color=fff&size=80',
        professionalInfo: {},
        personalInfo: {},
        accountAccess: {},
        teamLeader: null,
        teamLeaderAvatar: null,
        isAdmin: false,
        departmentsAndTeams: []
      }
    }


    // Extract all roles (handle both object and string format)
    const roleNames = formatArrayWithBullets(
      userDataFromApi.roles,
      (role) => typeof role === 'string' ? role : role?.name || ''
    )
    // Fallback to jobTitle if no roles
    const roleDisplay = roleNames !== 'N/A' ? roleNames : (userDataFromApi.jobTitle || 'N/A')

    // Extract all department names (active only)
    const activeDepartments = Array.isArray(userDataFromApi.departments)
      ? userDataFromApi.departments.filter(isDepartmentActive)
      : []
    const departmentNames = formatArrayWithBullets(
      activeDepartments,
      (dept) => dept?.name || ''
    )

    // Extract all team names
    const teamNames = formatArrayWithBullets(
      userDataFromApi.teams,
      (team) => team?.name || ''
    )

    // Extract team leader name (from first team if available)
    const teamLeadName = userDataFromApi.teams?.[0]?.teamLeadName || null

    return {
      firstName: userDataFromApi.firstName || 'N/A',
      lastName: userDataFromApi.lastName || 'N/A',
      email: userDataFromApi.email || 'N/A',
      avatar: `https://ui-avatars.com/api/?name=${userDataFromApi.firstName}+${userDataFromApi.lastName}&background=15919B&color=fff&size=80`,
      professionalInfo: {
        jobTitle: userDataFromApi.jobTitle || 'N/A',
        role: roleDisplay,
        team: teamNames,
        department: departmentNames,
        shift: userShift || 'N/A',
        hireDate: userDataFromApi.hireDate ? new Date(userDataFromApi.hireDate).toLocaleDateString() : 'N/A'
      },
      personalInfo: {
        firstName: userDataFromApi.firstName || 'N/A',
        lastName: userDataFromApi.lastName || 'N/A',
        email: userDataFromApi.email || 'N/A',
        userName: userDataFromApi.userName || 'N/A'
      },
      accountAccess: {
        userName: userDataFromApi.userName || 'N/A',
        emailAddress: userDataFromApi.email || 'N/A',
        permissions: userDataFromApi.permissions || [],
        leaveBalances: userDataFromApi.leaveBalances || []
      },
      teamLeader: teamLeadName,
      teamLeaderAvatar: null,
      isAdmin: userDataFromApi.isAdmin || false,
      departmentsAndTeams: buildDepartmentsAndTeams(activeDepartments, userDataFromApi.teams)
    }
  }, [employeeData, userDataFromApi, userShift, formatArrayWithBullets])

const departmentsAndTeamsFromApi = useMemo(() => {
    const collection =
      userTeamsAndDepartmentsResponse?.value ||
      userTeamsAndDepartmentsResponse?.data ||
      userTeamsAndDepartmentsResponse?.items

    if (!Array.isArray(collection) || collection.length === 0) {
      return []
    }

    const departments = []
    const teams = []

    collection.forEach((item) => {
      if (item?.departmentDetails) {
        departments.push(item.departmentDetails)
      }

      if (item?.teamDetails) {
        teams.push({
          ...item.teamDetails,
          departmentId:
            item.teamDetails.departmentId ||
            item.departmentId ||
            item.departmentDetails?.id,
          department: item.teamDetails.department || item.departmentDetails,
        })
      }
    })

    return buildDepartmentsAndTeams(departments, teams)
  }, [userTeamsAndDepartmentsResponse])

  const hasApiDepartmentsTeams = departmentsAndTeamsFromApi.length > 0

  const departmentsDataForLeadIds = hasApiDepartmentsTeams
    ? departmentsAndTeamsFromApi
    : displayData.departmentsAndTeams

  const missingTeamLeadIds = useMemo(() => {
    if (!Array.isArray(departmentsDataForLeadIds)) return []
    const idSet = new Set()
    departmentsDataForLeadIds.forEach((dept) => {
      dept?.teams?.forEach((team) => {
        if (team?.leadId) {
          idSet.add(team.leadId)
        }
      })
    })
    return Array.from(idSet)
  }, [departmentsDataForLeadIds])

  const [fetchUserById] = useLazyGetUserByIdQuery()
  const [teamLeadNameMap, setTeamLeadNameMap] = React.useState({})
  const [isLoadingTeamLeads, setIsLoadingTeamLeads] = React.useState(false)

  useEffect(() => {
    if (!missingTeamLeadIds.length) {
      setTeamLeadNameMap({})
      setIsLoadingTeamLeads(false)
      return
    }

    let isMounted = true
    setIsLoadingTeamLeads(true)

    const fetchLeads = async () => {
      const entries = await Promise.all(
        missingTeamLeadIds.map(async (id) => {
          try {
            const response = await fetchUserById(id).unwrap()
            const value = response?.value || response
            if (!value) return null
            const name = `${value.firstName || ""} ${value.lastName || ""}`.trim() || value.userName || value.email || "—"
            return [String(id), name]
          } catch {
            return null
          }
        })
      )
      if (isMounted) {
        const map = {}
        entries.filter(Boolean).forEach(([id, name]) => {
          map[id] = name
        })
        setTeamLeadNameMap(map)
        setIsLoadingTeamLeads(false)
      }
    }

    fetchLeads()

    return () => {
      isMounted = false
    }
  }, [missingTeamLeadIds, fetchUserById])

  const professionalInfoWithApiData = useMemo(() => {
    if (!hasApiDepartmentsTeams) return displayData.professionalInfo

    const departmentNames = departmentsAndTeamsFromApi
      .map((dept) => dept.name)
      .filter(Boolean)

    const teamNames = departmentsAndTeamsFromApi
      .flatMap((dept) => dept.teams || [])
      .map((team) => team.name)
      .filter(Boolean)

    return {
      ...displayData.professionalInfo,
      department:
        departmentNames.length > 0
          ? departmentNames.join(" • ")
          : displayData.professionalInfo.department,
      team:
        teamNames.length > 0
          ? teamNames.join(" • ")
          : displayData.professionalInfo.team,
    }
  }, [displayData.professionalInfo, departmentsAndTeamsFromApi, hasApiDepartmentsTeams])

  const finalDepartmentsAndTeams = hasApiDepartmentsTeams
    ? departmentsAndTeamsFromApi
    : displayData.departmentsAndTeams

  const enrichedDepartmentsAndTeams = useMemo(() => {
    if (!Array.isArray(finalDepartmentsAndTeams)) return []
    if (!teamLeadNameMap || Object.keys(teamLeadNameMap).length === 0) {
      return finalDepartmentsAndTeams
    }

    return finalDepartmentsAndTeams.map((dept) => ({
      ...dept,
      teams: Array.isArray(dept.teams)
        ? dept.teams.map((team) => {
            const resolvedName =
              team?.leadName ||
              (team?.leadId ? teamLeadNameMap[team.leadId] : undefined)
            return {
              ...team,
              leadResolvedName: resolvedName,
            }
          })
        : dept.teams,
    }))
  }, [finalDepartmentsAndTeams, teamLeadNameMap])

  const isLoadingDepartmentsAndTeams =
    (isFetchingUserTeamsAndDepartments && !hasApiDepartmentsTeams) ||
    (missingTeamLeadIds.length > 0 && isLoadingTeamLeads)

  const professionalInfoForDisplay = useMemo(() => {
    const source = professionalInfoWithApiData || {}
    // Exclude team and department; those live in the dedicated tab now
    // Keep insertion order by rebuilding the object
    const {
      jobTitle,
      role,
      team, // eslint-disable-line no-unused-vars
      department, // eslint-disable-line no-unused-vars
      shift,
      hireDate,
      employeeId,
      employeeType,
      workingDays,
      userName,
      emailAddress,
      designation,
      joiningDate,
      officeLocation,
      ...rest
    } = source

    const reordered = {
      ...(jobTitle !== undefined ? { jobTitle } : {}),
      ...(role !== undefined ? { role } : {}),
      ...(shift !== undefined ? { shift } : {}),
      ...(hireDate !== undefined ? { hireDate } : {}),
      ...(employeeId !== undefined ? { employeeId } : {}),
      ...(employeeType !== undefined ? { employeeType } : {}),
      ...(workingDays !== undefined ? { workingDays } : {}),
      ...(userName !== undefined ? { userName } : {}),
      ...(emailAddress !== undefined ? { emailAddress } : {}),
      ...(designation !== undefined ? { designation } : {}),
      ...(joiningDate !== undefined ? { joiningDate } : {}),
      ...(officeLocation !== undefined ? { officeLocation } : {}),
      ...rest,
    }

    return reordered
  }, [professionalInfoWithApiData])

  const profileInitials = useMemo(() => {
    const firstInitial = (displayData.firstName || "").trim().charAt(0)
    const lastInitial = (displayData.lastName || "").trim().charAt(0)
    const combined = `${firstInitial}${lastInitial}`.toUpperCase()
    return combined || "NA"
  }, [displayData.firstName, displayData.lastName])

  // Transform attendance API response to match table structure
  const attendanceData = useMemo(() => {
    if (!attendanceResponse?.value || !Array.isArray(attendanceResponse.value)) {
      return []
    }

    // Helper function to format break duration from "HH:MM:SS" format
    const formatBreakDuration = (breakDuration) => {
      if (!breakDuration || breakDuration === '00:00:00') {
        return 'N/A'
      }
      
      // Parse the duration string (format: "HH:MM:SS" or "HH:mm:ss")
      const parts = breakDuration.split(':')
      if (parts.length !== 3) {
        return breakDuration // Return as-is if format is unexpected
      }
      
      const hours = parseInt(parts[0], 10) || 0
      const minutes = parseInt(parts[1], 10) || 0
      const seconds = parseInt(parts[2], 10) || 0
      
      // Format: "Xh Ym" or "Ym Zs" or "Zs" depending on values
      const partsArray = []
      if (hours > 0) {
        partsArray.push(`${hours}h`)
      }
      if (minutes > 0) {
        partsArray.push(`${minutes}m`)
      }
      if (seconds > 0 && hours === 0) {
        // Only show seconds if there are no hours
        partsArray.push(`${seconds}s`)
      }
      
      return partsArray.length > 0 ? partsArray.join(' ') : 'N/A'
    }

    return attendanceResponse.value.map((log) => {
      const clockInTime = log.clockinTime ? new Date(log.clockinTime) : null
      const clockOutTime = log.clockoutTime ? new Date(log.clockoutTime) : null
      
      // Format date
      const date = clockInTime ? clockInTime.toLocaleDateString() : 'N/A'
      
      // Format check-in time
      const checkIn = clockInTime 
        ? clockInTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
        : 'N/A'
      
      // Format check-out time
      const checkOut = clockOutTime 
        ? clockOutTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
        : 'N/A'
      
      // Calculate working hours
      let workingHours = 'N/A'
      if (clockInTime && clockOutTime) {
        const diffMs = clockOutTime - clockInTime
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
        const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
        workingHours = `${diffHours}h ${diffMinutes}m`
      } else if (clockInTime && !clockOutTime) {
        workingHours = 'In Progress'
      }
      
      // Format break duration from API response
      const breakDuration = formatBreakDuration(log.breakDuration)
      
      // Determine status
      const status = log.isLate ? 'Late' : 'On Time'
      
      // Format office location
      const office = log.office ? 'Work from Office' : 'Work from Home'
      
      return {
        id: log.id,
        date,
        checkIn,
        checkOut,
        break: breakDuration,
        workingHours,
        office,
        status
      }
    })
  }, [attendanceResponse])

  // Transform leave logs API response to match table structure
  const leaveLogsData = useMemo(() => {
    const locale = getDeviceLocale()
    const raw = leaveLogsResponse?.value?.items || leaveLogsResponse?.value || []
    
    if (!Array.isArray(raw) || raw.length === 0) {
      return []
    }

    // Status mapping: 1 = pending approval, 2 = team lead approval, 3 = rejected, 4 = confirmed
    const getStatusText = (status) => {
      switch (status) {
        case 1:
          return isRtl ? 'قيد الموافقة' : 'Pending Approval'
        case 2:
          return isRtl ? 'موافقة قائد الفريق' : 'Team Lead Approval'
        case 3:
          return isRtl ? 'مرفوض' : 'Rejected'
        case 4:
          return isRtl ? 'مؤكد' : 'Confirmed'
        default:
          return 'N/A'
      }
    }

    return raw.map((log) => {
      // Format fromDate and toDate using timeUtils
      const fromDate = log.fromDate 
        ? utcToLocalDate(log.fromDate, locale, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })
        : 'N/A'
      
      const toDate = log.toDate 
        ? utcToLocalDate(log.toDate, locale, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })
        : 'N/A'
      
      // Create duration string (fromDate to toDate)
      const duration = fromDate !== 'N/A' && toDate !== 'N/A' 
        ? `${fromDate} - ${toDate}`
        : fromDate !== 'N/A' 
          ? fromDate 
          : 'N/A'
      
      // Use fromDate as the main date for the table
      const date = fromDate
      
      // Get status text
      const status = getStatusText(log.status)
      
      // Extract reviewer name from API response
      // Handle cases where reviewerName might be null, empty string, or just whitespace
      const reviewerName = log.reviewerName 
        ? log.reviewerName.trim() || 'N/A'
        : 'N/A'
      
      return {
        id: log.id,
        date,
        duration,
        days: log.totalDays || 0,
        reportingManager: reviewerName,
        status
      }
    })
  }, [leaveLogsResponse, isRtl])

  const content = renderContent()

  // Show loading state when fetching employee profile or own profile
  if ((isAdminView && isLoadingEmployeeProfile) || (!isAdminView && isLoadingUser)) {
    return <Loading />
  }

  // Handle back navigation
  const handleBack = () => {
    // If we're in a non-profile section, go back to profile
    if (activeSection !== 'profile') {
      setActiveSection('profile')
    } else {
      // If we're viewing from admin panel, go back to employees list
      if (isAdminView) {
        window.history.back()
      } else {
        // If we're in profile section, go back to dashboard or previous page
        window.history.back()
      }
    }
  }

  const renderProfileContent = () => {
    if (content.type === "profile") {
      return (
        <>
          <div
            className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 rounded-2xl border px-4 sm:px-6 py-5 mb-5"
            style={{
              borderColor: 'var(--border-color)',
              backgroundColor: 'var(--bg-color)',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-lg sm:text-2xl font-semibold"
                style={{ 
                  background: 'linear-gradient(135deg, var(--accent-color), var(--accent-hover))',
                  color: '#fff',
                  boxShadow: '0 8px 20px rgba(21, 145, 155, 0.25)'
                }}
              >
                {profileInitials}
              </div>
              <div className="space-y-1">
                <p className="text-base sm:text-lg font-semibold" style={{ color: 'var(--text-color)' }}>
                  {`${displayData.firstName || ''} ${displayData.lastName || ''}`.trim() || t("profile.unknownUser", "Unknown User")}
                </p>
                <p className="text-sm" style={{ color: 'var(--sub-text-color)' }}>
                  {displayData.email || "N/A"}
                </p>
                <p className="text-sm font-medium" style={{ color: 'var(--accent-color)' }}>
                  {displayData.professionalInfo?.role || displayData.professionalInfo?.jobTitle || "N/A"}
                </p>
              </div>
            </div>
          </div>

          <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} isAdmin={displayData.isAdmin} />
          <div className="mt-4 sm:mt-6 lg:mt-8">
            {activeTab === "personal" && (
              <DataReview 
                data={displayData.personalInfo} 
                fieldLabels={fieldLabels.personal} 
              />
            )}
            {activeTab === "professional" && (
              <DataReview 
                data={professionalInfoForDisplay} 
                fieldLabels={fieldLabels.professional} 
              />
            )}
            {activeTab === "departments" && (
              <DepartmentsTeamsSection 
                data={enrichedDepartmentsAndTeams}
                isLoading={isLoadingDepartmentsAndTeams}
              />
            )}
            {activeTab === "account" && displayData.isAdmin && (
              <AccountAccessSection accountAccess={displayData.accountAccess} />
            )}
          </div>
        </>
      )
    }

    if (content.type === "table") {
      // Use API data if attendance or leave section is active, otherwise use static data
      let tableData = content.data
      let isLoading = false
      
      if (activeSection === "attendance") {
        tableData = attendanceData
        isLoading = isLoadingAttendance
      } else if (activeSection === "leave") {
        tableData = leaveLogsData
        isLoading = isLoadingLeaves
      }
      
      if (isLoading) {
        return (
          <div 
            className="flex flex-col items-center justify-center py-12 sm:py-16 rounded-xl border"
            style={{ 
              backgroundColor: 'var(--bg-color)',
              borderColor: 'var(--border-color)'
            }}
          >
            <div className="text-3xl sm:text-4xl mb-4 animate-spin">⏳</div>
            <p 
              className="text-base sm:text-lg font-medium text-center px-4"
              style={{ color: 'var(--sub-text-color)' }}
            >
              {t("common.loading") || "Loading..."}
            </p>
          </div>
        )
      }
      
      return (
        <Table 
          data={tableData} 
          columns={content.config.columns}
          title={content.config.title}
          statusConfig={content.config.statusConfig}
        />
      )
    }
  }

  return (
    <div 
      className="min-h-screen  p-4 sm:p-6 lg:p-8 transition-all duration-300"
      style={{ backgroundColor: 'var(--bg-all)' }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <div className={`mb-4 sm:mb-6 ${isRtl ? 'flex justify-end' : 'flex justify-start'}`}>
          <button
            onClick={handleBack}
            className={`
              flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl border 
              transition-all duration-200 hover:scale-105 hover:shadow-md
              ${isRtl ? 'flex-row-reverse' : 'flex-row'}
            `}
            style={{ 
              backgroundColor: 'var(--bg-color)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-color)',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            {isRtl ? (
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: 'var(--accent-color)' }} />
            ) : (
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: 'var(--accent-color)' }} />
            )}
            <span className="font-medium text-xs sm:text-sm">
              {t("leaves.form.back")}
            </span>
          </button>
        </div>

        {/* Horizontal Navigation Menu for 1024px-1140px range */}
        <div className="mt-4 sm:mt-6 lg:mt-8 xl:hidden">
          <NavigationMenu 
            activeSection={activeSection} 
            onSectionChange={setActiveSection} 
          />
        </div>

        {/* Enhanced Main Content Area - Custom responsive behavior for 1024px-1140px */}
        <div className="mt-4 sm:mt-6 lg:mt-8 xl:mt-0 flex flex-col xl:flex-row gap-4 sm:gap-6">
          {/* Enhanced Navigation Sidebar - Only visible on xl screens and above */}
          <div className="w-full xl:w-[18%] mt-5 hidden xl:block">
            <NavigationMenu 
              activeSection={activeSection} 
              onSectionChange={setActiveSection} 
            />
          </div>

          {/* Enhanced Content Area - Full width in 1024px-1140px range */}
          <div 
            className="flex-1 p-4 sm:p-6 lg:p-8 mt-5 rounded-xl sm:rounded-2xl border transition-all duration-300"
            style={{ 
              backgroundColor: 'var(--bg-color)',
              borderColor: 'var(--border-color)',
              boxShadow: 'var(--shadow-color)'
            }}
          >
            {renderProfileContent()}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile