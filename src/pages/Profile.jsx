import React, { useMemo } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useLang } from "../contexts/LangContext"
import { useProfile } from '../hooks/useProfile'
import HeaderSection from "../components/profile/sections/header-section"
import NavigationMenu from "../components/profile/sections/NavigationMenu"
import ProfileTabs from "../components/profile/sections/profile-tabs"
import DataReview from "../components/profile/sections/data-review"
import Table from "../components/profile/sections/Table"
import AccountAccessSection from "../components/profile/sections/AccountAccessSection"
import { useTranslation } from "react-i18next"
import { useLocation } from "react-router-dom"
import { useMeQuery } from "../services/apis/AuthApi"
import { useGetUserProfileClockInLogsQuery } from "../services/apis/ClockinLogApi"
import { useGetUserProfileByIdQuery } from "../services/apis/UserApi"
import { useGetUserLeaveLogsQuery } from "../services/apis/LeaveApi"
import { utcToLocalDate, getDeviceLocale } from "../utils/timeUtils"
import Loading from "../components/Loading/Loading"

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

  // Get user's shift from /me endpoint (for own profile) or employee profile API
  // Note: Shift is included in the GetUserProfile endpoint response, no separate API call needed
  const userShift = useMemo(() => {
    if (isAdminView && employeeData) {
      // For employee profile (admin view), shift comes from GetUserProfile/{id}/profile endpoint
      return employeeData.shift?.name || null
    }
    // For own profile, get shift from /me endpoint
    return userDataFromApi?.shift?.name || null
  }, [userDataFromApi?.shift?.name, employeeData?.shift?.name, isAdminView])

  // Helper function to format arrays with bullet points (respects RTL/LTR)
  const formatArrayWithBullets = useMemo(() => {
    return (array, extractName) => {
      if (!array || !Array.isArray(array) || array.length === 0) return 'N/A'
      const names = array.map(item => extractName(item)).filter(Boolean)
      if (names.length === 0) return 'N/A'
      // Use bullet point (•) as separator, with proper spacing for RTL/LTR
      const separator = isRtl ? ' • ' : ' • '
      return names.join(separator)
    }
  }, [isRtl])

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

        // Extract all department names
        const departmentNames = formatArrayWithBullets(
          employeeData.departments,
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
            role: roleDisplay,
            department: departmentNames,
            team: teamNames,
            shift: userShift || 'N/A',
            jobTitle: employeeData.jobTitle || 'N/A',
            hireDate: employeeData.hireDate ? new Date(employeeData.hireDate).toLocaleDateString() : 'N/A'
          },
          personalInfo: {
            firstName: employeeData.firstName || 'N/A',
            lastName: employeeData.lastName || 'N/A',
            email: employeeData.email || 'N/A',
            userName: employeeData.userName || 'N/A',
            hireDate: employeeData.hireDate ? new Date(employeeData.hireDate).toLocaleDateString() : 'N/A'
          },
          accountAccess: {
            userName: employeeData.userName || 'N/A',
            emailAddress: employeeData.email || 'N/A',
            permissions: employeeData.permissions || [],
            leaveBalances: employeeData.leaveBalances || []
          },
          teamLeader: teamLeadName,
          teamLeaderAvatar: null,
          isAdmin: employeeData.isAdmin || false
        }
      } else {
        // Fallback to state data structure (for backward compatibility)
        return {
          firstName: employeeData.name?.split(' ')[0] || 'N/A',
          lastName: employeeData.name?.split(' ').slice(1).join(' ') || 'N/A',
          email: employeeData.email || 'N/A',
          avatar: employeeData.avatar || `https://ui-avatars.com/api/?name=${employeeData.name || 'Employee'}&background=15919B&color=fff&size=80`,
          professionalInfo: {
            designation: employeeData.position || 'N/A',
            department: employeeData.department || 'N/A',
            employeeId: employeeData.employeeId || 'N/A',
            joinDate: employeeData.joinDate || 'N/A'
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
          isAdmin: employeeData.isAdmin || false
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
        isAdmin: false
      }
    }


    // Extract all roles (handle both object and string format)
    const roleNames = formatArrayWithBullets(
      userDataFromApi.roles,
      (role) => typeof role === 'string' ? role : role?.name || ''
    )
    // Fallback to jobTitle if no roles
    const roleDisplay = roleNames !== 'N/A' ? roleNames : (userDataFromApi.jobTitle || 'N/A')

    // Extract all department names
    const departmentNames = formatArrayWithBullets(
      userDataFromApi.departments,
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
        role: roleDisplay,
        department: departmentNames,
        team: teamNames,
        shift: userShift || 'N/A',
        jobTitle: userDataFromApi.jobTitle || 'N/A',
        hireDate: userDataFromApi.hireDate ? new Date(userDataFromApi.hireDate).toLocaleDateString() : 'N/A'
      },
      personalInfo: {
        firstName: userDataFromApi.firstName || 'N/A',
        lastName: userDataFromApi.lastName || 'N/A',
        email: userDataFromApi.email || 'N/A',
        userName: userDataFromApi.userName || 'N/A',
        hireDate: userDataFromApi.hireDate ? new Date(userDataFromApi.hireDate).toLocaleDateString() : 'N/A'
      },
      accountAccess: {
        userName: userDataFromApi.userName || 'N/A',
        emailAddress: userDataFromApi.email || 'N/A',
        permissions: userDataFromApi.permissions || [],
        leaveBalances: userDataFromApi.leaveBalances || []
      },
      teamLeader: teamLeadName,
      teamLeaderAvatar: null,
      isAdmin: userDataFromApi.isAdmin || false
    }
  }, [employeeData, userDataFromApi, userShift, isRtl, formatArrayWithBullets])

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
                data={displayData.professionalInfo} 
                fieldLabels={fieldLabels.professional} 
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

        {/* Enhanced Header Section */}
        <div 
          className="rounded-xl sm:rounded-2xl border transition-all duration-300"
          style={{ 
            backgroundColor: 'var(--bg-color)',
            borderColor: 'var(--border-color)',
            boxShadow: 'var(--shadow-color)'
          }}
        >
          <HeaderSection
            firstName={displayData.firstName}
            lastName={displayData.lastName}
            email={displayData.email}
            role={displayData.professionalInfo?.role || displayData.professionalInfo?.designation || displayData.professionalInfo?.jobTitle || 'N/A'}
            avatar={displayData.avatar}
            teamLeader={displayData.teamLeader}
            isAdminView={isAdminView}
          />
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