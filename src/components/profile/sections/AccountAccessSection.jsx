import React from 'react'
import { useTranslation } from "react-i18next"

const AccountAccessSection = ({ accountAccess }) => {
  const { t } = useTranslation()
  
  // Handle permissions array from API
  const permissions = Array.isArray(accountAccess?.permissions) 
    ? accountAccess.permissions 
    : []
  
  // Group permissions by category (e.g., "User", "Break", "Company")
  const groupedPermissions = permissions.reduce((acc, permission) => {
    const category = permission.code?.split('.')[0] || 'Other'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(permission.description || permission.code || permission)
    return acc
  }, {})
  
  // Handle leave balances array from API
  const leaveBalances = Array.isArray(accountAccess?.leaveBalances)
    ? accountAccess.leaveBalances
    : []
  
  return (
    <div className="space-y-6 sm:space-y-8 lg:space-y-10 max-w-4xl mx-auto">

      
      {/* Permissions Section - Centered */}
      {permissions.length > 0 && (
        <div className="space-y-6 sm:space-y-8">
          <div className="text-center space-y-2">
            <h3 
              className="text-xl sm:text-2xl font-bold"
              style={{ color: 'var(--text-color)' }}
            >
              {t("roles.permissions") || "Permissions"}
            </h3>

          </div>
          
          <div className="space-y-6 sm:space-y-8 lg:space-y-10">
            {Object.entries(groupedPermissions).map(([category, perms]) => (
              <div key={category} className="space-y-4 sm:space-y-5">
                <h4 
                  className="text-lg sm:text-xl font-bold capitalize pb-2 border-b text-left"
                  style={{ 
                    color: 'var(--text-color)',
                    borderColor: 'var(--divider-color)'
                  }}
                >
                  {category}
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {perms.map((permission, index) => (
                    <div 
                      key={index} 
                      className="flex items-center gap-2 sm:gap-3 group cursor-pointer transition-all duration-200 hover:translate-x-1"
                    >
                      <div 
                        className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0 shadow-sm transition-all duration-200 group-hover:scale-110"
                        style={{ 
                          background: 'linear-gradient(135deg, #09D1C7 0%, #15919B 100%)',
                          boxShadow: '0 2px 8px rgba(9, 209, 199, 0.3)'
                        }}
                      />
                      <span 
                        className="text-xs sm:text-sm font-semibold text-left transition-colors duration-200 group-hover:opacity-80"
                        style={{ color: 'var(--text-color)' }}
                      >
                        {permission}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Leave Balances Section - Centered */}
      <div className="space-y-6 sm:space-y-8">
        <div className="text-center space-y-2">
          <h3 
            className="text-xl sm:text-2xl font-bold"
            style={{ color: 'var(--text-color)' }}
          >
            {t("leaves.balances") || "Leave Balances"}
          </h3>
          <p 
            className="text-xs sm:text-sm font-medium"
            style={{ color: 'var(--sub-text-color)' }}
          >
            {t("leaves.balancesDescription") || "Your available leave balances"}
          </p>
        </div>
        
        {leaveBalances.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {leaveBalances.map((balance, index) => (
              <div 
                key={balance.leaveTypeId || index}
                className="p-4 sm:p-6 rounded-xl border transition-all duration-200 hover:shadow-md text-center"
                style={{ 
                  backgroundColor: 'var(--bg-color)',
                  borderColor: 'var(--border-color)'
                }}
              >
                <div className="space-y-2">
                  <h4 
                    className="text-base sm:text-lg font-semibold"
                    style={{ color: 'var(--text-color)' }}
                  >
                    {balance.leaveTypeName || balance.leaveType?.name || 'Leave Type'}
                  </h4>
                  <p 
                    className="text-2xl sm:text-3xl font-bold"
                    style={{ color: 'var(--accent-color)' }}
                  >
                    {balance.balanceDays || 0} {t("leaves.days") || "Days"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 sm:py-12">
            <div 
              className="inline-block p-6 sm:p-8 rounded-xl border"
              style={{ 
                backgroundColor: 'var(--bg-color)',
                borderColor: 'var(--border-color)'
              }}
            >
              <p 
                className="text-sm sm:text-base font-medium"
                style={{ color: 'var(--sub-text-color)' }}
              >
                {t("leaves.noAvailableBalance") || "No available leave balance"}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AccountAccessSection
