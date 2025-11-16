import { useState } from 'react'
import { userData } from '../data/userData'
import { getFieldLabels, getTableConfig } from '../config/profileConfig'

export const useProfile = (isRtl) => {
  const [activeTab, setActiveTab] = useState("personal")
  const [activeSection, setActiveSection] = useState("profile")
  const [editOpen, setEditOpen] = useState(false)

  const fieldLabels = getFieldLabels(isRtl)
  const tableConfig = getTableConfig(isRtl)

  const renderContent = () => {
    switch (activeSection) {
      case "profile":
        return { type: "profile", activeTab, setActiveTab }
      case "attendance":
        return { type: "table", config: tableConfig.attendance, data: userData.attendance }
      case "leave":
        return { type: "table", config: tableConfig.leave, data: userData.leaveRequests }
      default:
        return { type: "profile", activeTab, setActiveTab }
    }
  }

  return {
    userData,
    fieldLabels,
    activeTab,
    setActiveTab,
    activeSection,
    setActiveSection,
    editOpen,
    setEditOpen,
    renderContent
  }
}
