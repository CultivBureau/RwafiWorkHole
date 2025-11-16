import React, { useState, useMemo, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { X, Plus, Edit, Trash2, RotateCcw, Filter, Calendar } from "lucide-react";
import toast from "react-hot-toast";
import {
  useGetAllLeaveTypesQuery,
  useCreateLeaveTypeMutation,
  useUpdateLeaveTypeMutation,
  useDeleteLeaveTypeMutation,
  useRestoreLeaveTypeMutation,
} from "../../../services/apis/LeaveTypeApi";

const LeaveTypesModal = ({ isOpen, onClose }) => {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === "ar";
  const [statusFilter, setStatusFilter] = useState("all"); // "active", "inactive", or "all"
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingLeaveType, setEditingLeaveType] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const pageSize = 50;
  const formRef = useRef(null);

  // Convert statusFilter to number for API
  // API spec: status values are 0, 1, 2
  // 0 = active, 1 = inactive, 2 = all
  const statusNumber = 
    statusFilter === "active" ? 0 : 
    statusFilter === "inactive" ? 1 : // API supports status=1 for inactive
    statusFilter === "all" ? 2 : 2;

  // Reset page number when status filter changes
  useEffect(() => {
    setPageNumber(1);
  }, [statusFilter]);

  // Fetch active leave types (for "all" filter to determine status)
  const { data: activeLeaveTypesData } = useGetAllLeaveTypesQuery({
    pageNumber: 1,
    pageSize: 1000, // Large page size to get all active
    status: 0,
  }, {
    skip: statusFilter !== "all", // Only fetch when showing "all"
  });

  // Fetch inactive leave types (for "all" filter to determine status)
  const { data: inactiveLeaveTypesData } = useGetAllLeaveTypesQuery({
    pageNumber: 1,
    pageSize: 1000, // Large page size to get all inactive
    status: 1,
  }, {
    skip: statusFilter !== "all", // Only fetch when showing "all"
  });

  const { data: leaveTypesData, isLoading, refetch } = useGetAllLeaveTypesQuery({
    pageNumber,
    pageSize,
    status: statusNumber,
  }, {
    refetchOnMountOrArgChange: true,
  });

  const [createLeaveType, { isLoading: isCreating }] = useCreateLeaveTypeMutation();
  const [updateLeaveType, { isLoading: isUpdating }] = useUpdateLeaveTypeMutation();
  const [deleteLeaveType, { isLoading: isDeleting }] = useDeleteLeaveTypeMutation();
  const [restoreLeaveType, { isLoading: isRestoring }] = useRestoreLeaveTypeMutation();

  const allLeaveTypes = leaveTypesData?.value || [];
  const activeLeaveTypes = activeLeaveTypesData?.value || [];
  const inactiveLeaveTypes = inactiveLeaveTypesData?.value || [];

  // Create a set of inactive IDs for quick lookup when showing "all"
  const inactiveIds = useMemo(() => {
    return new Set(inactiveLeaveTypes.map(lt => lt.id));
  }, [inactiveLeaveTypes]);

  // API handles status filtering correctly:
  // - status=0 returns active leave types
  // - status=1 returns inactive leave types  
  // - status=2 returns all leave types
  // So we can use the API response directly without additional filtering
  const filteredLeaveTypes = useMemo(() => {
    return allLeaveTypes;
  }, [allLeaveTypes]);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    isPaid: true,
    isCarryOverAllowed: false,
    maxDaysPerYear: "",
    isBalanceChecked: true,
  });

  // Reset form when opening/closing
  useEffect(() => {
    if (!isOpen) {
      setShowAddForm(false);
      setEditingLeaveType(null);
      setFormData({
        name: "",
        isPaid: true,
        isCarryOverAllowed: false,
        maxDaysPerYear: "",
        isBalanceChecked: true,
      });
    }
  }, [isOpen]);

  // Load leave type data when editing
  useEffect(() => {
    if (editingLeaveType) {
      setFormData({
        name: editingLeaveType.name || "",
        isPaid: editingLeaveType.isPaid ?? true,
        isCarryOverAllowed: editingLeaveType.isCarryOverAllowed ?? false,
        maxDaysPerYear: editingLeaveType.maxDaysPerYear?.toString() || "",
        isBalanceChecked: editingLeaveType.isBalanceChecked ?? true,
      });
    }
  }, [editingLeaveType]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleToggle = (field) => {
    setFormData((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.name.trim()) {
      toast.error(t("leaveTypes.validation.nameRequired", "Leave type name is required"));
      return;
    }

    const payload = {
      name: formData.name.trim(),
      isPaid: formData.isPaid,
      isCarryOverAllowed: formData.isCarryOverAllowed,
      maxDaysPerYear: formData.maxDaysPerYear ? parseInt(formData.maxDaysPerYear) : null,
      isBalanceChecked: formData.isBalanceChecked,
    };

    try {
      if (editingLeaveType) {
        // Update existing
        await updateLeaveType({
          id: editingLeaveType.id,
          ...payload,
        }).unwrap();
        toast.success(t("leaveTypes.updateSuccess", "Leave type updated successfully"));
      } else {
        // Create new
        await createLeaveType(payload).unwrap();
        toast.success(t("leaveTypes.createSuccess", "Leave type created successfully"));
      }
      setShowAddForm(false);
      setEditingLeaveType(null);
      setFormData({
        name: "",
        isPaid: true,
        isCarryOverAllowed: false,
        maxDaysPerYear: "",
        isBalanceChecked: true,
      });
      refetch();
    } catch (error) {
      const errorMessage =
        error?.data?.errorMessage ||
        error?.data?.message ||
        error?.message ||
        t("leaveTypes.error", "Failed to save leave type");
      toast.error(errorMessage);
    }
  };

  const handleDelete = async (leaveType) => {
    if (!window.confirm(t("leaveTypes.deleteConfirm", "Are you sure you want to delete this leave type?"))) {
      return;
    }

    try {
      await deleteLeaveType(leaveType.id).unwrap();
      toast.success(t("leaveTypes.deleteSuccess", "Leave type deleted successfully"));
      // Refetch to get updated data - API will now return it with status=1 (inactive)
      await refetch();
    } catch (error) {
      const errorMessage =
        error?.data?.errorMessage ||
        error?.data?.message ||
        error?.message ||
        t("leaveTypes.deleteError", "Failed to delete leave type");
      toast.error(errorMessage);
    }
  };

  const handleRestore = async (leaveType) => {
    try {
      await restoreLeaveType(leaveType.id).unwrap();
      toast.success(t("leaveTypes.restoreSuccess", "Leave type restored successfully"));
      // Refetch to get updated data - API will now return it with status=0 (active)
      await refetch();
      
      // If currently viewing inactive filter, switch to active to see the restored item
      if (statusFilter === "inactive") {
        setStatusFilter("active");
      }
    } catch (error) {
      const errorMessage =
        error?.data?.errorMessage ||
        error?.data?.message ||
        error?.message ||
        t("leaveTypes.restoreError", "Failed to restore leave type");
      toast.error(errorMessage);
    }
  };

  const handleEdit = (leaveType) => {
    setEditingLeaveType(leaveType);
    setShowAddForm(true);
    // Scroll to form after a short delay to ensure it's rendered
    setTimeout(() => {
      if (formRef.current) {
        formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingLeaveType(null);
    setFormData({
      name: "",
      isPaid: true,
      isCarryOverAllowed: false,
      maxDaysPerYear: "",
      isBalanceChecked: true,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative w-full max-w-6xl max-h-[90vh] bg-[var(--bg-color)] rounded-2xl shadow-2xl border border-[var(--border-color)] flex flex-col ${isArabic ? "rtl" : "ltr"}`}
        dir={isArabic ? "rtl" : "ltr"}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg gradient-bg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-[var(--text-color)]">
              {t("leaveTypes.title", "Manage Leave Types")}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[var(--hover-color)] transition-colors"
            style={{ color: "var(--sub-text-color)" }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {/* Filters and Add Button */}
          <div className={`flex flex-col sm:flex-row gap-4 items-center justify-between mb-6 ${isArabic ? "sm:flex-row-reverse" : ""}`}>
            {/* Status Filter */}
            <div className={`flex items-center gap-2 ${isArabic ? "flex-row-reverse" : ""}`}>
              <Filter className="text-[var(--sub-text-color)]" size={16} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all"
                style={{
                  borderColor: "var(--border-color)",
                  backgroundColor: "var(--bg-color)",
                  color: "var(--text-color)",
                  focusRingColor: "var(--accent-color)",
                }}
              >
                <option value="all">{t("leaveTypes.filter.all", "All")}</option>
                <option value="active">{t("leaveTypes.filter.active", "Active")}</option>
                <option value="inactive">{t("leaveTypes.filter.inactive", "Inactive")}</option>
              </select>
            </div>

            {/* Add Button - Always on the right */}
            {!showAddForm && (
              <button
                onClick={() => {
                  setShowAddForm(true);
                  // Scroll to form after a short delay to ensure it's rendered
                  setTimeout(() => {
                    if (formRef.current) {
                      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }, 100);
                }}
                className="btn-primary flex items-center gap-2 ml-auto"
              >
                <Plus size={16} />
                <span>{t("leaveTypes.addNew", "Add New Leave Type")}</span>
              </button>
            )}
          </div>

          {/* Add/Edit Form */}
          {showAddForm && (
            <div ref={formRef} className="mb-6 p-6 bg-[var(--container-color)] rounded-xl border border-[var(--border-color)]">
              <h3 className="text-lg font-semibold text-[var(--text-color)] mb-4">
                {editingLeaveType
                  ? t("leaveTypes.editTitle", "Edit Leave Type")
                  : t("leaveTypes.addTitle", "Add New Leave Type")}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: "var(--sub-text-color)" }}>
                    {t("leaveTypes.form.name", "Name")} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder={t("leaveTypes.form.namePlaceholder", "Enter leave type name")}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all"
                    style={{
                      borderColor: "var(--border-color)",
                      backgroundColor: "var(--bg-color)",
                      color: "var(--text-color)",
                      focusRingColor: "var(--accent-color)",
                    }}
                  />
                </div>

                {/* Max Days Per Year */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: "var(--sub-text-color)" }}>
                    {t("leaveTypes.form.maxDaysPerYear", "Max Days Per Year")}
                  </label>
                  <input
                    type="number"
                    value={formData.maxDaysPerYear}
                    onChange={(e) => handleInputChange("maxDaysPerYear", e.target.value)}
                    placeholder={t("leaveTypes.form.maxDaysPlaceholder", "Enter max days (optional)")}
                    min="0"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50 transition-all"
                    style={{
                      borderColor: "var(--border-color)",
                      backgroundColor: "var(--bg-color)",
                      color: "var(--text-color)",
                      focusRingColor: "var(--accent-color)",
                    }}
                  />
                </div>

                {/* Is Paid */}
                <div className="flex items-center justify-between p-4 bg-[var(--bg-color)] rounded-lg border border-[var(--border-color)]">
                  <label className="text-sm font-medium" style={{ color: "var(--text-color)" }}>
                    {t("leaveTypes.form.isPaid", "Is Paid")}
                  </label>
                  <button
                    type="button"
                    onClick={() => handleToggle("isPaid")}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      formData.isPaid ? "bg-[var(--accent-color)]" : "bg-[var(--container-color)]"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        formData.isPaid ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {/* Is Carry Over Allowed */}
                <div className="flex items-center justify-between p-4 bg-[var(--bg-color)] rounded-lg border border-[var(--border-color)]">
                  <label className="text-sm font-medium" style={{ color: "var(--text-color)" }}>
                    {t("leaveTypes.form.isCarryOverAllowed", "Carry Over Allowed")}
                  </label>
                  <button
                    type="button"
                    onClick={() => handleToggle("isCarryOverAllowed")}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      formData.isCarryOverAllowed ? "bg-[var(--accent-color)]" : "bg-[var(--container-color)]"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        formData.isCarryOverAllowed ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {/* Is Balance Checked */}
                <div className="flex items-center justify-between p-4 bg-[var(--bg-color)] rounded-lg border border-[var(--border-color)]">
                  <label className="text-sm font-medium" style={{ color: "var(--text-color)" }}>
                    {t("leaveTypes.form.isBalanceChecked", "Balance Checked")}
                  </label>
                  <button
                    type="button"
                    onClick={() => handleToggle("isBalanceChecked")}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      formData.isBalanceChecked ? "bg-[var(--accent-color)]" : "bg-[var(--container-color)]"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        formData.isBalanceChecked ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Form Actions */}
              <div className={`flex items-center gap-3 mt-6 ${isArabic ? "flex-row-reverse" : ""}`}>
                <button
                  onClick={handleSubmit}
                  disabled={isCreating || isUpdating}
                  className="btn-primary flex items-center gap-2"
                >
                  {editingLeaveType
                    ? isUpdating
                      ? t("leaveTypes.updating", "Updating...")
                      : t("leaveTypes.update", "Update")
                    : isCreating
                    ? t("leaveTypes.creating", "Creating...")
                    : t("leaveTypes.create", "Create")}
                </button>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 border rounded-lg hover:bg-[var(--hover-color)] transition-colors"
                  style={{
                    borderColor: "var(--border-color)",
                    color: "var(--text-color)",
                  }}
                >
                  {t("leaveTypes.cancel", "Cancel")}
                </button>
              </div>
            </div>
          )}

          {/* Leave Types Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 border-4 border-[var(--accent-color)] border-t-transparent rounded-full animate-spin"></div>
                <div className="text-[var(--sub-text-color)]">{t("leaveTypes.loading", "Loading leave types...")}</div>
              </div>
            </div>
          ) : filteredLeaveTypes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredLeaveTypes.map((leaveType) => {
                // Determine if leave type is active based on current filter
                // If we're viewing inactive filter (status=1), all items are inactive
                // If we're viewing active filter (status=0), all items are active
                // If we're viewing all filter (status=2), check against inactive IDs set
                let isActive;
                if (statusFilter === "inactive") {
                  isActive = false; // All items in inactive filter are inactive
                } else if (statusFilter === "active") {
                  isActive = true; // All items in active filter are active
                } else {
                  // For "all" filter, check if the leave type is in the inactive list
                  isActive = !inactiveIds.has(leaveType.id);
                }

                return (
                  <div
                    key={leaveType.id}
                    className="bg-[var(--bg-color)] rounded-xl p-4 border border-[var(--border-color)] hover:shadow-lg hover:border-[var(--accent-color)]/30 transition-all duration-300"
                  >
                    {/* Card Header */}
                    <div className={`flex items-start justify-between mb-3 ${isArabic ? "flex-row-reverse" : ""}`}>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-[var(--text-color)] mb-1">
                          {leaveType.name}
                        </h3>
                        <span
                          className="inline-block px-2 py-1 rounded-full text-xs font-semibold"
                          style={{
                            backgroundColor: isActive ? "var(--success-color)" : "var(--error-color)",
                            color: "white",
                            opacity: 0.9,
                          }}
                        >
                          {isActive ? t("leaveTypes.status.active", "Active") : t("leaveTypes.status.inactive", "Inactive")}
                        </span>
                      </div>
                      <div className={`flex items-center gap-2 ${isArabic ? "flex-row-reverse" : ""}`}>
                        <button
                          onClick={() => handleEdit(leaveType)}
                          className="p-2 rounded-lg hover:bg-[var(--hover-color)] transition-colors"
                          style={{ color: "var(--accent-color)" }}
                          title={t("leaveTypes.edit", "Edit")}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {isActive ? (
                          <button
                            onClick={() => handleDelete(leaveType)}
                            disabled={isDeleting}
                            className="p-2 rounded-lg hover:bg-[var(--hover-color)] transition-colors disabled:opacity-50"
                            style={{ color: "var(--error-color)" }}
                            title={t("leaveTypes.delete", "Delete")}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleRestore(leaveType)}
                            disabled={isRestoring}
                            className="p-2 rounded-lg hover:bg-[var(--hover-color)] transition-colors disabled:opacity-50"
                            style={{ color: "var(--info-color)" }}
                            title={t("leaveTypes.restore", "Restore")}
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Card Details */}
                    <div className="space-y-2">
                      <div className={`flex items-center justify-between text-sm ${isArabic ? "flex-row-reverse" : ""}`}>
                        <span style={{ color: "var(--sub-text-color)" }}>
                          {t("leaveTypes.isPaid", "Paid")}:
                        </span>
                        <span style={{ color: "var(--text-color)", fontWeight: "500" }}>
                          {leaveType.isPaid ? t("leaveTypes.yes", "Yes") : t("leaveTypes.no", "No")}
                        </span>
                      </div>
                      <div className={`flex items-center justify-between text-sm ${isArabic ? "flex-row-reverse" : ""}`}>
                        <span style={{ color: "var(--sub-text-color)" }}>
                          {t("leaveTypes.carryOver", "Carry Over")}:
                        </span>
                        <span style={{ color: "var(--text-color)", fontWeight: "500" }}>
                          {leaveType.isCarryOverAllowed ? t("leaveTypes.yes", "Yes") : t("leaveTypes.no", "No")}
                        </span>
                      </div>
                      {leaveType.maxDaysPerYear && (
                        <div className={`flex items-center justify-between text-sm ${isArabic ? "flex-row-reverse" : ""}`}>
                          <span style={{ color: "var(--sub-text-color)" }}>
                            {t("leaveTypes.maxDays", "Max Days/Year")}:
                          </span>
                          <span style={{ color: "var(--text-color)", fontWeight: "500" }}>
                            {leaveType.maxDaysPerYear}
                          </span>
                        </div>
                      )}
                      <div className={`flex items-center justify-between text-sm ${isArabic ? "flex-row-reverse" : ""}`}>
                        <span style={{ color: "var(--sub-text-color)" }}>
                          {t("leaveTypes.balanceChecked", "Balance Checked")}:
                        </span>
                        <span style={{ color: "var(--text-color)", fontWeight: "500" }}>
                          {leaveType.isBalanceChecked ? t("leaveTypes.yes", "Yes") : t("leaveTypes.no", "No")}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Calendar className="w-16 h-16 text-[var(--sub-text-color)] mb-4 opacity-50" />
              <h3 className="text-lg font-medium text-[var(--text-color)] mb-2">
                {t("leaveTypes.empty.title", "No leave types found")}
              </h3>
              <p className="text-[var(--sub-text-color)]">
                {t("leaveTypes.empty.message", "No leave types available at the moment.")}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeaveTypesModal;

