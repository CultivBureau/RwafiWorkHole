import React, { useState } from 'react'
import { X, Calendar, AlertCircle } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useTeamLeadReviewMutation, useHrConfirmMutation, useHrOverrideMutation } from "../../../../services/apis/LeaveApi"

const LeavePopUp = ({
  leaveRequest,
  userRole = "teamLead", // "teamLead" or "hr"
  onClose,
  onActionComplete,
  // Legacy props for backward compatibility
  name,
  avatar,
  type,
  from,
  to,
  days,
  status,
  reason,
  // eslint-disable-next-line no-unused-vars
  approver, // Legacy prop, kept for backward compatibility
  comment,
}) => {
  const { t } = useTranslation()
  const [commentText, setCommentText] = useState("")
  const [justificationText, setJustificationText] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showOverrideModal, setShowOverrideModal] = useState(false)

  // API mutations
  const [teamLeadReview] = useTeamLeadReviewMutation()
  const [hrConfirm] = useHrConfirmMutation()
  const [hrOverride] = useHrOverrideMutation()

  const displayName = leaveRequest?.name || leaveRequest?.employeeName || name || "Unknown"
  const displayType = leaveRequest?.type || leaveRequest?.leaveType || type || "Unknown"
  const displayFrom = leaveRequest?.from || (leaveRequest?.startDate ? new Date(leaveRequest.startDate).toLocaleDateString() : from) || "N/A"
  const displayTo = leaveRequest?.to || (leaveRequest?.endDate ? new Date(leaveRequest.endDate).toLocaleDateString() : to) || "N/A"
  const displayDays = leaveRequest?.days || leaveRequest?.totalDays || days || 0
  const displayStatus = leaveRequest?.status || leaveRequest?.requestStatus || status || "Pending"
  const displayReason = leaveRequest?.reason || reason || ""
  const displayComment = leaveRequest?.comment || leaveRequest?.teamLeadComment || comment || ""
  const teamLeadName = leaveRequest?.teamLeadName || ""
  const attachmentUrl = leaveRequest?.attachmentUrl

  const getStatusColor = () => {
    const statusLower = displayStatus?.toLowerCase() || ""
    switch (statusLower) {
      case "approved":
      case "confirmed":
        return "bg-green-100 text-green-700"
      case "pending":
        return "bg-yellow-100 text-yellow-700"
      case "rejected":
        return "bg-red-100 text-red-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  // Handle Team Lead Review (Approve/Reject)
  const handleTeamLeadReview = async (isApproved) => {
    if (!leaveRequest?.id) return

    setIsSubmitting(true)
    try {
      await teamLeadReview({
        requestId: leaveRequest.id,
        isApproved,
        comment: commentText,
      }).unwrap()
      
      if (onActionComplete) {
        onActionComplete({
          leaveId: leaveRequest?.id,
          action: "teamLeadReview",
          isApproved,
          newStatus: isApproved ? "Approved" : "Rejected",
          comment: commentText,
          actionDate: new Date().toLocaleDateString(),
        })
      }
      onClose()
    } catch (error) {
      console.error("Failed to review leave request:", error)
      alert(t("adminLeaves.popup.error", "Failed to process request. Please try again."))
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle HR Confirm
  const handleHrConfirm = async (isConfirmed) => {
    if (!leaveRequest?.id) return

    setIsSubmitting(true)
    try {
      await hrConfirm({
        requestId: leaveRequest.id,
        isConfirmed,
        comment: commentText,
      }).unwrap()
      
      if (onActionComplete) {
        onActionComplete({
          leaveId: leaveRequest?.id,
          action: "hrConfirm",
          isConfirmed,
          newStatus: isConfirmed ? "Approved" : "Rejected",
          comment: commentText,
          actionDate: new Date().toLocaleDateString(),
        })
      }
      onClose()
    } catch (error) {
      console.error("Failed to confirm leave request:", error)
      alert(t("adminLeaves.popup.error", "Failed to process request. Please try again."))
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle HR Override
  const handleHrOverride = async () => {
    if (!leaveRequest?.id) return

    setIsSubmitting(true)
    try {
      await hrOverride({
        requestId: leaveRequest.id,
        forceApprove: true,
        justification: justificationText,
      }).unwrap()
      
      if (onActionComplete) {
        onActionComplete({
          leaveId: leaveRequest?.id,
          action: "hrOverride",
          forceApprove: true,
          newStatus: "Approved",
          comment: justificationText,
          actionDate: new Date().toLocaleDateString(),
        })
      }
      setShowOverrideModal(false)
      onClose()
    } catch (error) {
      console.error("Failed to override leave request:", error)
      alert(t("adminLeaves.popup.error", "Failed to process request. Please try again."))
    } finally {
      setIsSubmitting(false)
    }
  }

  // Normalize status for checking
  const normalizedStatus = displayStatus?.toLowerCase()?.trim() || ""
  
  // Team leads can approve/reject if:
  // 1. Status is "pending" (any case variation)
  // 2. Status doesn't indicate final rejection or HR confirmation
  // This allows team leads to review requests even if status shows variations like "TeamLeadApproved"
  const isFinalStatus = normalizedStatus.includes("rejected") || 
                       normalizedStatus.includes("hrconfirmed") || 
                       normalizedStatus.includes("confirmed") ||
                       normalizedStatus === "rejected"
  
  const isPendingStatus = normalizedStatus === "pending" || normalizedStatus.includes("pending")
  
  // Team leads can approve/reject if status is pending or not in final state
  const canApprove = userRole === "teamLead" && (isPendingStatus || !isFinalStatus)
  const canReject = userRole === "teamLead" && (isPendingStatus || !isFinalStatus)
  
  // HR can confirm if status is approved by team lead (not rejected, not already confirmed)
  const canConfirm = userRole === "hr" && 
                     (normalizedStatus === "approved" || 
                      normalizedStatus.includes("approved") || 
                      normalizedStatus === "teamleadapproved") &&
                     !normalizedStatus.includes("rejected") &&
                     !normalizedStatus.includes("hrconfirmed") &&
                     !normalizedStatus.includes("confirmed")
  
  // HR can override any status (pending, approved, or rejected) - allows overriding team lead rejections
  const canOverride = userRole === "hr" && 
                      !normalizedStatus.includes("hrconfirmed") &&
                      !normalizedStatus.includes("confirmed")

  // Format avatar display
  const getAvatarDisplay = () => {
    if (leaveRequest?.avatar) return leaveRequest.avatar
    if (avatar) return avatar
    return null
  }

  const getInitials = () => {
    return displayName.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-2">
      <div className="w-full max-w-2xl bg-[var(--bg-color)] rounded-2xl shadow-2xl border border-[var(--border-color)] overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <div className="flex items-center gap-4">
            {getAvatarDisplay() ? (
              <img
                src={getAvatarDisplay()}
                alt={displayName}
                className="w-16 h-16 rounded-full object-cover border border-[var(--border-color)]"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl border border-[var(--border-color)]">
                {getInitials()}
              </div>
            )}
            <div>
              <div className="flex items-center gap-3">
                <span className="text-xl font-bold text-[var(--text-color)]">{displayName}</span>
                <span className={`px-4 py-1 rounded-full text-sm font-medium ${getStatusColor()}`}>
                  {displayStatus}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-[var(--container-color)] hover:bg-[var(--hover-color)] transition"
          >
            <X className="w-6 h-6 text-[var(--text-color)]" />
          </button>
        </div>
        <div className="overflow-y-auto">
          {/* Leave type and dates */}
          <div className="flex flex-wrap items-center gap-6 px-6 py-2">
            <span className="text-[var(--text-color)] text-base">
              {t("adminLeaves.popup.leaveType")} <span className="font-bold text-[var(--text-color)]">{displayType}</span>
            </span>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-teal-500" />
              <span className="text-[var(--text-color)] font-medium">{t("adminLeaves.popup.from")}</span>
              <span className="text-[var(--text-color)]">{displayFrom}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-teal-500" />
              <span className="text-[var(--text-color)] font-medium">{t("adminLeaves.popup.to")}</span>
              <span className="text-[var(--text-color)]">{displayTo}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-teal-500" />
              <span className="text-[var(--text-color)] font-medium">{t("adminLeaves.popup.days")}</span>
              <span className="text-[var(--text-color)]">{displayDays}</span>
            </div>
          </div>
          {/* Reason */}
          <div className="px-6 pt-4">
            <div className="text-[var(--text-color)] font-semibold mb-2">{t("adminLeaves.popup.reason")}</div>
            <div className="bg-[var(--container-color)] rounded-xl p-4 text-[var(--text-color)] text-base border border-[var(--border-color)]">
              {displayReason || t("adminLeaves.popup.noReason", "No reason provided")}
            </div>
          </div>
          {/* Attachment */}
          {attachmentUrl && (
            <div className="px-6 pt-2">
              <a
                href={attachmentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--accent-color)] hover:underline text-sm"
              >
                {t("adminLeaves.popup.viewAttachment", "View Attachment")}
              </a>
            </div>
          )}
          {/* Team Lead Comment (for HR view) */}
          {userRole === "hr" && teamLeadName && (
            <div className="px-6 pt-4">
              <div className="text-[var(--text-color)] font-semibold mb-2">
                {t("adminLeaves.popup.teamLeadComment", "Team Lead Comment")}
              </div>
              <div className="bg-[var(--container-color)] rounded-xl p-4 text-[var(--text-color)] text-base border border-[var(--border-color)]">
                <div className="mb-2">
                  <span className="font-medium">{teamLeadName}</span>
                  <span className="text-sm text-[var(--sub-text-color)] ml-2">
                    ({t("adminLeaves.popup.roles.teamLead")})
                  </span>
                </div>
                <div>{displayComment || t("adminLeaves.popup.noComment", "No comment")}</div>
              </div>
            </div>
          )}
          {/* Action Buttons */}
          {userRole === "teamLead" && (canApprove || canReject) && (
            <>
              <div className="px-6 pt-4">
                <label className="block text-[var(--text-color)] font-semibold mb-2">
                  {t("adminLeaves.popup.addComment", "Add Comment (Optional)")}
                </label>
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={t("adminLeaves.popup.commentPlaceholder", "Enter your comment...")}
                  className="w-full px-4 py-2 bg-[var(--container-color)] border border-[var(--border-color)] rounded-lg text-[var(--text-color)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] resize-none"
                  rows="3"
                />
              </div>
              <div className="flex gap-4 px-6 py-4">
                <button
                  onClick={() => handleTeamLeadReview(true)}
                  disabled={isSubmitting}
                  className="flex-1 gradient-bg hover:bg-[var(--accent-hover)] text-white font-semibold py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {isSubmitting ? t("adminLeaves.popup.processing", "Processing...") : t("adminLeaves.popup.approve", "Approve")}
                </button>
                <button
                  onClick={() => handleTeamLeadReview(false)}
                  disabled={isSubmitting}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? t("adminLeaves.popup.processing", "Processing...") : t("adminLeaves.popup.reject", "Reject")}
                </button>
              </div>
            </>
          )}
          {userRole === "hr" && canConfirm && (
            <>
              <div className="px-6 pt-4">
                <label className="block text-[var(--text-color)] font-semibold mb-2">
                  {t("adminLeaves.popup.addComment", "Add Comment (Optional)")}
                </label>
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={t("adminLeaves.popup.commentPlaceholder", "Enter your comment...")}
                  className="w-full px-4 py-2 bg-[var(--container-color)] border border-[var(--border-color)] rounded-lg text-[var(--text-color)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] resize-none"
                  rows="3"
                />
              </div>
              <div className="flex gap-4 px-6 py-4">
                <button
                  onClick={() => handleHrConfirm(true)}
                  disabled={isSubmitting}
                  className="flex-1 gradient-bg hover:bg-[var(--accent-hover)] text-white font-semibold py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {isSubmitting ? t("adminLeaves.popup.processing", "Processing...") : t("adminLeaves.popup.confirm", "Confirm")}
                </button>
                <button
                  onClick={() => handleHrConfirm(false)}
                  disabled={isSubmitting}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? t("adminLeaves.popup.processing", "Processing...") : t("adminLeaves.popup.reject", "Reject")}
                </button>
                <button
                  onClick={() => setShowOverrideModal(true)}
                  disabled={isSubmitting}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <AlertCircle className="w-4 h-4" />
                  {t("adminLeaves.popup.override", "Override")}
                </button>
              </div>
            </>
          )}
          {/* HR Override button for rejected or pending requests */}
          {userRole === "hr" && canOverride && !canConfirm && (
            <div className="flex gap-4 px-6 py-4">
              <button
                onClick={() => setShowOverrideModal(true)}
                disabled={isSubmitting}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <AlertCircle className="w-4 h-4" />
                {t("adminLeaves.popup.override", "Override & Approve")}
              </button>
            </div>
          )}
          <div className="pb-6" />
        </div>
        {/* Override Modal */}
        {showOverrideModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
            <div className="bg-[var(--bg-color)] rounded-xl shadow-2xl border border-[var(--border-color)] p-6 max-w-md w-full">
              <h3 className="text-lg font-bold text-[var(--text-color)] mb-4">
                {t("adminLeaves.popup.overrideTitle", "Override Leave Request")}
              </h3>
              <p className="text-sm text-[var(--sub-text-color)] mb-4">
                {t("adminLeaves.popup.overrideMessage", "Please provide a justification for overriding this leave request.")}
              </p>
              <label className="block text-[var(--text-color)] font-semibold mb-2">
                {t("adminLeaves.popup.justification", "Justification")} *
              </label>
              <textarea
                value={justificationText}
                onChange={(e) => setJustificationText(e.target.value)}
                placeholder={t("adminLeaves.popup.justificationPlaceholder", "Enter justification...")}
                className="w-full px-4 py-2 bg-[var(--container-color)] border border-[var(--border-color)] rounded-lg text-[var(--text-color)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] resize-none mb-4"
                rows="4"
                required
              />
              <div className="flex gap-4">
                <button
                  onClick={() => setShowOverrideModal(false)}
                  className="flex-1 bg-[var(--container-color)] hover:bg-[var(--hover-color)] text-[var(--text-color)] font-semibold py-2 rounded-lg transition"
                >
                  {t("adminLeaves.popup.cancel", "Cancel")}
                </button>
                <button
                  onClick={handleHrOverride}
                  disabled={isSubmitting || !justificationText.trim()}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? t("adminLeaves.popup.processing", "Processing...") : t("adminLeaves.popup.overrideConfirm", "Override & Approve")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default LeavePopUp
