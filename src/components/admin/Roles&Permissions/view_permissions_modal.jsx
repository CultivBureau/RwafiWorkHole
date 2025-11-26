"use client"

import { useTranslation } from "react-i18next"
import { X, Shield, CheckCircle2 } from "lucide-react"
import { useGetRolePermissionsQuery } from "../../../services/apis/RoleApi"

const ViewPermissionsModal = ({ isOpen, onClose, roleId, roleName }) => {
  const { t, i18n } = useTranslation()
  const isArabic = i18n.language === "ar"

  // Fetch permissions for the role
  const { data: permissionsResponse, isLoading, error } = useGetRolePermissionsQuery(roleId, {
    skip: !isOpen || !roleId
  })

  const permissions = permissionsResponse?.value || []

  // Group permissions by category (first part of permissionName before the dot)
  const groupedPermissions = permissions.reduce((acc, permission) => {
    const category = permission.permissionName?.split('.')[0] || 'Other'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(permission)
    return acc
  }, {})

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-[var(--bg-color)] rounded-lg border border-[var(--border-color)] w-full max-w-4xl max-h-[90vh] flex flex-col shadow-xl"
        onClick={(e) => e.stopPropagation()}
        style={{ direction: isArabic ? 'rtl' : 'ltr' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border-color)]">
          <div className={`flex items-center gap-3 ${isArabic ? 'flex-row-reverse' : ''}`}>
            <div className="p-2 rounded-lg" style={{ background: 'linear-gradient(135deg, #09D1C7 0%, #15919B 100%)' }}>
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--text-color)]">
                {t('roles.viewPermissions') || 'View Permissions'}
              </h2>
              <p className="text-sm text-[var(--sub-text-color)] mt-1">
                {roleName || t('roles.role')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--hover-color)] rounded-lg transition-colors"
            aria-label={t('common.close') || 'Close'}
          >
            <X className="w-5 h-5 text-[var(--text-color)]" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <span className="text-[var(--sub-text-color)]">{t('common.loading') || 'Loading...'}</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12">
              <span className="text-[var(--error-color)] mb-2">
                {t('roles.errors.loadPermissionsFailed') || 'Failed to load permissions'}
              </span>
              <span className="text-sm text-[var(--sub-text-color)]">
                {error?.data?.errorMessage || error?.message || 'An error occurred'}
              </span>
            </div>
          ) : permissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Shield className="w-16 h-16 text-[var(--sub-text-color)] opacity-50 mb-4" />
              <p className="text-[var(--sub-text-color)] text-center">
                {t('roles.noPermissions') || 'No permissions assigned to this role'}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedPermissions).map(([category, perms]) => (
                <div key={category} className="space-y-4">
                  {/* Category Header */}
                  <div className="flex items-center gap-3 pb-2 border-b border-[var(--border-color)]">
                    <div className="w-1 h-6 rounded-full" style={{ background: 'linear-gradient(135deg, #09D1C7 0%, #15919B 100%)' }} />
                    <h3 className="text-lg font-semibold text-[var(--text-color)] capitalize">
                      {category}
                    </h3>
                    <span className="text-xs text-[var(--sub-text-color)] bg-[var(--container-color)] px-2 py-1 rounded-full">
                      {perms.length}
                    </span>
                  </div>

                  {/* Permissions Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {perms.map((permission) => (
                      <div
                        key={permission.permissionId}
                        className="flex items-start gap-3 p-4 rounded-lg border border-[var(--border-color)] hover:bg-[var(--hover-color)] transition-colors group"
                      >
                        <div className="mt-0.5 flex-shrink-0">
                          <CheckCircle2 
                            className="w-5 h-5" 
                            style={{ color: 'var(--success-color)' }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[var(--text-color)] mb-1 group-hover:text-[var(--accent-color)] transition-colors">
                            {permission.description || permission.permissionName}
                          </p>
                          {permission.permissionName && permission.permissionName !== permission.description && (
                            <p className="text-xs text-[var(--sub-text-color)] font-mono truncate" title={permission.permissionName}>
                              {permission.permissionName}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t border-[var(--border-color)]">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg font-medium text-white transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #09D1C7 0%, #15919B 100%)' }}
          >
            {t('common.close') || 'Close'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ViewPermissionsModal

