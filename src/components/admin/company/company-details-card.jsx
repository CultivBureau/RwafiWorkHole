import { useState, useEffect } from "react";
import { useGetCompanyByIdQuery, useUpdateCompanyDetailsMutation } from "../../../services/apis/CompanyApi";
import { getCompanyId } from "../../../utils/page";
import { useTranslation } from "react-i18next";
import { Edit, Save, X, Upload, File, Calendar, Clock } from "lucide-react";
import toast from "react-hot-toast";
import { useHasPermission } from "../../../hooks/useHasPermission";

const CompanyDetailsCard = () => {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === "ar";
  const companyId = getCompanyId();
  const [isEditing, setIsEditing] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [showAddAttachmentModal, setShowAddAttachmentModal] = useState(false);
  
  // Permission checks
  const canUpdateCompany = useHasPermission('Company.Update');

  const { data: companyData, isLoading, error, refetch } = useGetCompanyByIdQuery(companyId, {
    skip: !companyId,
    refetchOnMountOrArgChange: true,
  });

  const [updateCompanyDetails, { isLoading: isUpdating }] = useUpdateCompanyDetailsMutation();

  const company = companyData?.value;

  // Initialize state when company data loads
  useEffect(() => {
    if (company && !isEditing) {
      setCompanyName(company.name || "");
      // Initialize attachments from companyAttachment
      if (company.companyAttachment?.attachments && company.companyAttachment.attachments.length > 0) {
        setAttachments(
          company.companyAttachment.attachments.map((att) => ({
            id: att.id,
            internalId: att.internalId || null, // UUID string from backend
            file: null, // No file initially, only when user uploads new one
            fileName: att.fileName || "", // File name string
            expiryDate: formatExpiryDate(att.expiryDate || ""), // Convert to YYYY-MM-DD format
            filePath: att.filePath, // Keep original file path for display
            fileContent: att.fileContent, // Keep original file content for display
          }))
        );
      } else {
        setAttachments([]);
      }
    }
  }, [company?.id, isEditing]);

  const handleEdit = () => {
    setIsEditing(true);
    setCompanyName(company.name || "");
    if (company.companyAttachment?.attachments) {
      setAttachments(
        company.companyAttachment.attachments.map((att) => ({
          id: att.id,
          internalId: att.internalId || null, // UUID string from backend
          file: null,
          fileName: att.fileName || "", // File name string
          expiryDate: formatExpiryDate(att.expiryDate || ""), // Convert to YYYY-MM-DD format
          filePath: att.filePath,
          fileContent: att.fileContent,
        }))
      );
    } else {
      setAttachments([]);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setCompanyName(company.name || "");
    if (company.companyAttachment?.attachments) {
      setAttachments(
        company.companyAttachment.attachments.map((att) => ({
          id: att.id,
          internalId: att.internalId || null, // UUID string from backend
          file: null,
          fileName: att.fileName || "", // File name string
          expiryDate: formatExpiryDate(att.expiryDate || ""), // Convert to YYYY-MM-DD format
          filePath: att.filePath,
          fileContent: att.fileContent,
        }))
      );
    } else {
      setAttachments([]);
    }
  };

  const handleSave = async () => {
    try {
      await updateCompanyDetails({
        companyId,
        name: companyName,
        attachments: attachments.map((att) => ({
          id: att.id,
          internalId: att.internalId || null, // UUID string - preserve from API or null for new attachments
          file: att.file, // File object if new upload, null if keeping existing
          fileName: att.fileName || (att.file instanceof File ? att.file.name : ""), // File name
          expiryDate: formatExpiryDate(att.expiryDate), // Format date to YYYY-MM-DD
        })),
      }).unwrap();
      
      setIsEditing(false);
      toast.success(t("company.updateSuccess", "Company details updated successfully"));
      refetch();
    } catch (error) {
      console.error("Failed to update company:", error);
      toast.error(t("company.updateError", "Failed to update company details"));
    }
  };

  const handleAttachmentFileChange = (index, file) => {
    const newAttachments = [...attachments];
    newAttachments[index] = {
      ...newAttachments[index],
      file: file,
      fileName: file ? file.name : newAttachments[index].fileName || "", // Set fileName when file is selected
    };
    setAttachments(newAttachments);
  };

  const handleAttachmentFileNameChange = (index, fileName) => {
    const newAttachments = [...attachments];
    newAttachments[index] = {
      ...newAttachments[index],
      fileName: fileName,
    };
    setAttachments(newAttachments);
  };

  const handleAttachmentExpiryChange = (index, expiryDate) => {
    const newAttachments = [...attachments];
    newAttachments[index] = {
      ...newAttachments[index],
      expiryDate: expiryDate,
    };
    setAttachments(newAttachments);
  };

  const handleAttachmentIdChange = (index, id) => {
    const newAttachments = [...attachments];
    newAttachments[index] = {
      ...newAttachments[index],
      id: id ? parseInt(id) : null,
    };
    setAttachments(newAttachments);
  };

  const removeAttachment = (index) => {
    const newAttachments = attachments.filter((_, i) => i !== index);
    setAttachments(newAttachments);
  };

  const handleAddAttachment = () => {
    setShowAddAttachmentModal(true);
  };

  const getPlanTypeName = (planType) => {
    const plans = {
      0: t("company.planTypes.free"),
      1: t("company.planTypes.basic"),
      2: t("company.planTypes.professional"),
      3: t("company.planTypes.enterprise"),
    };
    return plans[planType] || t("company.planTypes.unknown");
  };

  const getPlanTypeColor = (planType) => {
    const colors = {
      1: "bg-blue-100 text-blue-800",
      2: "bg-purple-100 text-purple-800",
      3: "bg-gradient-to-r from-[#15919B] to-[#09D1C7] text-white",
    };
    return colors[planType] || "bg-gray-100 text-gray-800";
  };

  const formatDate = (dateString) => {
    if (!dateString || dateString === "0001-01-01T00:00:00") return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "N/A";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatExpiryDate = (dateString) => {
    if (!dateString) return "";
    // Handle MM/DD/YYYY format
    if (dateString.includes("/")) {
      const [month, day, year] = dateString.split("/");
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }
    return dateString;
  };

  const calculateDaysRemaining = (endDate) => {
    if (!endDate) return null;
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (isLoading) {
    return (
      <div className="w-full p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-10 rounded-xl w-1/3" style={{ background: "var(--container-color)" }}></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 rounded-xl" style={{ background: "var(--container-color)" }}></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="w-full p-6">
        <div className="rounded-xl p-6 border-2" style={{ 
          background: "var(--bg-color)", 
          borderColor: "var(--error-color)",
          color: "var(--error-color)"
        }}>
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-semibold">{t("company.error.loadFailed")}</span>
          </div>
        </div>
      </div>
    );
  }

  const daysRemaining = calculateDaysRemaining(company.endPlanDate);
  const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const getFileUrl = (filePath) => {
    if (!filePath) return null;
    if (filePath.startsWith("http")) return filePath;
    return `${baseUrl}${filePath}`;
  };

  return (
    <div className="w-full space-y-6">
      {/* Hero Header Section */}
      <section
        className="rounded-3xl border overflow-hidden"
        style={{
          background: "var(--bg-color)",
          borderColor: "var(--border-color)",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        }}
      >
        {/* Gradient Top Bar */}
        <div 
          className="h-2 w-full"
          style={{
            background: "linear-gradient(90deg, #15919B 0%, #09D1C7 100%)",
          }}
        />
        
        <div className="px-6 py-6 sm:px-8 sm:py-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Left Content */}
            <div className="flex-1 space-y-3">
              {isEditing ? (
                <div className="space-y-1.5">
                  <label
                    className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5"
                    style={{ color: "var(--sub-text-color)" }}
                  >
                    <div className="w-0.5 h-2.5 rounded-full" style={{ background: "var(--accent-color)" }} />
                    {t("company.companyName", "Company Name")}
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="form-input text-xl sm:text-2xl font-bold w-full border-2 rounded-lg px-3 py-2 transition-all duration-200 focus:ring-2"
                    placeholder={t("company.enterName", "Enter company name")}
                    style={{
                      background: "var(--container-color)",
                      color: "var(--text-color)",
                      borderColor: "var(--accent-color)",
                    }}
                  />
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <h2
                    className="text-2xl sm:text-3xl font-black text-start tracking-tight"
                    style={{ 
                      color: "var(--text-color)",
                      lineHeight: "1.1"
                    }}
                  >
                    {company.name}
                  </h2>
                  
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 font-bold text-xs shadow-sm ${
                      company.status
                        ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white"
                        : "bg-gradient-to-r from-rose-500 to-rose-600 text-white"
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-white shadow-sm animate-pulse" />
                    {company.status ? t("company.active", "Active") : t("company.inactive", "Inactive")}
                  </span>



               
                </div>
              )}
            </div>

            {/* Right Action Buttons - Only show if user has update permission */}
            {canUpdateCompany && (
              <div className="flex flex-row gap-2 sm:flex-row lg:min-w-[200px] lg:justify-end">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleSave}
                      disabled={isUpdating}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-bold text-xs shadow-md transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                      style={{
                        background: "linear-gradient(135deg, #15919B 0%, #09D1C7 100%)",
                        color: "white",
                      }}
                    >
                      <Save className="w-4 h-4" />
                      {isUpdating ? t("company.saving", "Saving...") : t("company.save", "Save")}
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={isUpdating}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-bold text-xs border transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        background: "var(--container-color)",
                        borderColor: "var(--border-color)",
                        color: "var(--text-color)",
                      }}
                    >
                      <X className="w-4 h-4" />
                      {t("company.cancel", "Cancel")}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleEdit}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-bold text-xs shadow-md transition-all duration-200 hover:scale-105"
                    style={{
                      background: "linear-gradient(135deg, #15919B 0%, #09D1C7 100%)",
                      color: "white",
                    }}
                  >
                    <Edit className="w-4 h-4" />
                    {t("company.edit", "Edit")}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="px-6 pb-6 sm:px-8 sm:pb-8 border-t" style={{ borderColor: "var(--border-color)" }}>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 pt-6">
            <SummaryCard
              label={t("company.planStart", "Plan Start")}
              icon={<Calendar className="w-3.5 h-3.5" />}
              value={formatDate(company.startPlanDate)}
            />
            <SummaryCard
              label={t("company.planEnd", "Plan End")}
              icon={<Calendar className="w-3.5 h-3.5" />}
              value={formatDate(company.endPlanDate)}
              hint={
                daysRemaining !== null
                  ? daysRemaining > 0
                    ? t("company.daysRemainingShort", {
                        defaultValue: "{{count}} days left",
                        count: daysRemaining,
                      })
                    : t("company.expired", "Expired")
                  : undefined
              }
              hintTone={daysRemaining !== null && daysRemaining <= 0 ? "error" : "default"}
            />
            <SummaryCard
              label={t("company.planTier", "Current Plan")}
              icon={<Upload className="w-3.5 h-3.5 rotate-90" />}
              value={getPlanTypeName(company.planType)}
            />
            <SummaryCard
              label={t("company.companyId", "Company ID")}
              icon={<File className="w-3.5 h-3.5" />}
              value={company.id}
              isMono
            />
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Attachments Section */}
        <section
          className="rounded-2xl border p-5 lg:col-span-3 overflow-hidden w-full"
          style={{
            background: "var(--bg-color)",
            borderColor: "var(--border-color)",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
          }}
        >
          <div className="flex flex-col gap-2 pb-4 sm:flex-row sm:items-center sm:justify-between border-b" style={{ borderColor: "var(--border-color)" }}>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg" style={{ background: "linear-gradient(135deg, #15919B 0%, #09D1C7 100%)" }}>
                  <File className="w-3.5 h-3.5 text-white" />
                </div>
                <h3 className="text-lg font-bold" style={{ color: "var(--text-color)" }}>
                  {t("company.attachments", "Attachments")}
                </h3>
              </div>
              <p className="text-xs font-medium pl-9 text-start" style={{ color: "var(--sub-text-color)" }}>
                {attachments.length > 0
                  ? t("company.attachmentsSubtitle", "Manage documents")
                  : t("company.attachmentsEmpty", "No documents yet")}
              </p>
            </div>

            {/* Add Attachment Button - Only show if user has update permission */}
            {canUpdateCompany && (
              <button
                onClick={handleAddAttachment}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-bold text-xs shadow-md transition-all duration-200 hover:scale-105"
                style={{
                  background: "linear-gradient(135deg, #15919B 0%, #09D1C7 100%)",
                  color: "white",
                }}
              >
                <Upload className="w-4 h-4" />
                {t("company.addAttachment", "Add Attachment")}
              </button>
            )}
          </div>

          {attachments.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-8 mt-4"
              style={{ borderColor: "var(--border-color)" }}
            >
              <div className="p-2 rounded-lg" style={{ background: "var(--container-color)" }}>
                <File className="w-8 h-8" style={{ color: "var(--sub-text-color)" }} />
              </div>
              <div className="text-center space-y-0.5">
                <p className="text-xs font-semibold" style={{ color: "var(--text-color)" }}>
                  {t("company.noAttachments", "No attachments")}
                </p>
                <p className="text-[10px]" style={{ color: "var(--sub-text-color)" }}>
                  Upload documents to get started
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3 mt-4">
              {attachments.map((attachment, index) => (
                <article
                  key={index}
                  className="rounded-lg border p-4 transition-all duration-200 hover:shadow-sm"
                  style={{
                    background: "var(--container-color)",
                    borderColor: "var(--border-color)",
                  }}
                >
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex-1 space-y-5">
                      <div className="flex flex-col gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: "var(--sub-text-color)" }}>
                          <div className="w-1 h-3 rounded-full" style={{ background: "var(--accent-color)" }} />
                          {t("company.file", "File")}
                        </span>

                        {isEditing ? (
                          <div className="flex flex-wrap items-center gap-3">
             
                            <label className="cursor-pointer">
                              <input
                                type="file"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleAttachmentFileChange(index, file);
                                }}
                              />
                              <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 hover:scale-105 shadow-md" style={{
                                background: "linear-gradient(135deg, var(--container-color) 0%, var(--bg-color) 100%)",
                                border: "2px solid var(--accent-color)",
                                color: "var(--accent-color)",
                              }}>
                                <Upload className="w-4 h-4" />
                                {attachment.file || attachment.filePath
                                  ? t("company.changeFile", "Change File")
                                  : t("company.uploadFile", "Upload File")}
                              </span>
                            </label>
                          </div>
                        ) : attachment.filePath ? (
                          <a
                            href={getFileUrl(attachment.filePath)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-3 text-base font-bold transition-all duration-200 hover:scale-105 w-fit"
                            style={{ color: "var(--accent-color)" }}
                          >
                            <div className="p-2 rounded-lg" style={{ background: "var(--bg-color)" }}>
                              <File className="w-5 h-5" />
                            </div>
                            {attachment.fileName || attachment.filePath.split("/").pop()}
                          </a>
                        ) : (
                          <span className="text-sm font-medium" style={{ color: "var(--sub-text-color)" }}>
                            {t("company.noFile", "No file")}
                          </span>
                        )}
                      </div>

                      {isEditing && (
                        <div className="grid gap-4">
                          <div>
                            <label className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 mb-2" style={{ color: "var(--sub-text-color)" }}>
                              <div className="w-1 h-3 rounded-full" style={{ background: "var(--accent-color)" }} />
                              {t("company.fileNameLabel", "File Name")}
                            </label>
                            <input
                              type="text"
                              value={attachment.fileName || ""}
                              onChange={(e) => handleAttachmentFileNameChange(index, e.target.value)}
                              className="form-input w-full border-2 rounded-xl px-4 py-3 transition-all duration-200 focus:ring-4"
                              placeholder={t("company.fileNamePlaceholder", "Enter file name")}
                              style={{ background: "var(--bg-color)", color: "var(--text-color)", borderColor: "var(--border-color)" }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex w-full flex-col gap-5 sm:flex-row sm:items-start lg:flex-col lg:w-72">
                      {isEditing && (
                        <div className="w-full">
                          <label className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 mb-2" style={{ color: "var(--sub-text-color)" }}>
                            <div className="w-1 h-3 rounded-full" style={{ background: "var(--accent-color)" }} />
                            {t("company.attachmentId", "Attachment ID")}
                          </label>
                          <input
                            type="number"
                            value={attachment.id || ""}
                            onChange={(e) => handleAttachmentIdChange(index, e.target.value)}
                            className="form-input w-full border-2 rounded-xl px-4 py-3 transition-all duration-200 focus:ring-4"
                            placeholder={t("company.enterId", "Enter ID")}
                            style={{ background: "var(--bg-color)", color: "var(--text-color)", borderColor: "var(--border-color)" }}
                          />
                        </div>
                      )}

                      <div className="w-full">
                        <label className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 mb-2" style={{ color: "var(--sub-text-color)" }}>
                          <div className="w-1 h-3 rounded-full" style={{ background: "var(--accent-color)" }} />
                          {t("company.expiryDate", "Expiry Date")}
                        </label>
                        {isEditing ? (
                          <input
                            type="date"
                            value={formatExpiryDate(attachment.expiryDate)}
                            onChange={(e) => handleAttachmentExpiryChange(index, e.target.value)}
                            className="form-input w-full border-2 rounded-xl px-4 py-3 transition-all duration-200 focus:ring-4"
                            style={{ background: "var(--bg-color)", color: "var(--text-color)", borderColor: "var(--border-color)" }}
                          />
                        ) : (
                          <div className="flex items-center gap-2 px-4 py-3 rounded-xl border-2" style={{ borderColor: "var(--border-color)", background: "var(--bg-color)" }}>
                            <Calendar className="w-4 h-4" style={{ color: "var(--accent-color)" }} />
                            <p className="text-sm font-bold" style={{ color: "var(--text-color)" }}>
                              {attachment.expiryDate || t("company.noExpiry", "N/A")}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Add Attachment Modal */}
        {showAddAttachmentModal && (
          <AddAttachmentModal
            companyId={companyId}
            existingAttachments={attachments}
            onClose={() => setShowAddAttachmentModal(false)}
            onSuccess={() => {
              setShowAddAttachmentModal(false);
              refetch();
            }}
            t={t}
          />
        )}
      </div>
    </div>
  );
};

// Add Attachment Modal Component
const AddAttachmentModal = ({ companyId, existingAttachments = [], onClose, onSuccess, t }) => {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [id, setId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updateCompanyDetails] = useUpdateCompanyDetailsMutation();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      // Auto-fill file name if empty
      if (!fileName) {
        setFileName(selectedFile.name);
      }
    }
  };

  const formatExpiryDate = (dateString) => {
    if (!dateString) return "";
    if (dateString.includes("/")) {
      const [month, day, year] = dateString.split("/");
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }
    return dateString;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      toast.error(t("company.fileRequired", "Please select a file"));
      return;
    }

    if (!fileName || fileName.trim() === "") {
      toast.error(t("company.fileNameRequired", "Please enter a file name"));
      return;
    }

    setIsSubmitting(true);
    try {
      // Helper function to format expiry date for API
      const formatExpiryDateForAPI = (dateString) => {
        if (!dateString) return null;
        if (dateString.includes("/")) {
          const [month, day, year] = dateString.split("/");
          return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
        }
        return dateString;
      };

      // Prepare existing attachments (keep them as-is, no file re-upload)
      const existingAttachmentsData = existingAttachments
        .filter(att => att.filePath) // Only include attachments that have been saved (have filePath)
        .map(att => ({
          id: att.id || 0,
          internalId: att.internalId || null,
          file: null, // Don't re-upload existing files
          fileName: att.fileName || "",
          expiryDate: formatExpiryDateForAPI(att.expiryDate) || null,
        }));

      // Add the new attachment
      const newAttachment = {
        id: id ? parseInt(id) : 0, // Use provided ID or 0 for new attachment
        internalId: null,
        file: file,
        fileName: fileName.trim() || file.name || "", // Use provided file name or fallback to file name
        expiryDate: formatExpiryDateForAPI(expiryDate) || null,
      };

      // Combine existing and new attachments
      const allAttachments = [...existingAttachmentsData, newAttachment];

      await updateCompanyDetails({
        companyId,
        name: null, // Don't update company name
        attachments: allAttachments,
      }).unwrap();

      toast.success(t("company.attachmentAdded", "Attachment added successfully"));
      onSuccess();
    } catch (error) {
      console.error("Failed to add attachment:", error);
      const errorMessage = error?.data?.errorMessage || error?.data?.message || error?.message;
      toast.error(errorMessage || t("company.attachmentAddError", "Failed to add attachment"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0, 0, 0, 0.5)" }}>
      <div 
        className="w-full max-w-md rounded-2xl border overflow-hidden"
        style={{
          background: "var(--bg-color)",
          borderColor: "var(--border-color)",
        }}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b" style={{ borderColor: "var(--border-color)" }}>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold" style={{ color: "var(--text-color)" }}>
              {t("company.addAttachment", "Add Attachment")}
            </h3>
            <button
              onClick={onClose}
              className="p-1 rounded-lg transition-colors hover:bg-opacity-10"
              style={{ color: "var(--text-color)" }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {/* File Upload */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 mb-2" style={{ color: "var(--sub-text-color)" }}>
              <div className="w-1 h-3 rounded-full" style={{ background: "var(--accent-color)" }} />
              {t("company.file", "File")} *
            </label>
            <label className="cursor-pointer">
              <input
                type="file"
                className="hidden"
                onChange={handleFileChange}
                required
              />
              <div className="flex items-center gap-3 p-4 rounded-xl border-2 border-dashed transition-all duration-200 hover:border-solid" style={{
                borderColor: file ? "var(--accent-color)" : "var(--border-color)",
                background: "var(--container-color)",
              }}>
                <Upload className="w-5 h-5" style={{ color: "var(--accent-color)" }} />
                <span className="text-sm font-medium" style={{ color: "var(--text-color)" }}>
                  {file ? file.name : t("company.selectFile", "Select a file")}
                </span>
              </div>
            </label>
          </div>

          {/* File Name */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 mb-2" style={{ color: "var(--sub-text-color)" }}>
              <div className="w-1 h-3 rounded-full" style={{ background: "var(--accent-color)" }} />
              {t("company.fileNameLabel", "File Name")} *
            </label>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="form-input w-full border-2 rounded-xl px-4 py-3 transition-all duration-200 focus:ring-4"
              placeholder={t("company.fileNamePlaceholder", "Enter file name")}
              required
              style={{ background: "var(--bg-color)", color: "var(--text-color)", borderColor: "var(--border-color)" }}
            />
          </div>

          {/* ID */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 mb-2" style={{ color: "var(--sub-text-color)" }}>
              <div className="w-1 h-3 rounded-full" style={{ background: "var(--accent-color)" }} />
              {t("company.attachmentId", "Attachment ID")}
            </label>
            <input
              type="number"
              value={id}
              onChange={(e) => setId(e.target.value)}
              className="form-input w-full border-2 rounded-xl px-4 py-3 transition-all duration-200 focus:ring-4"
              placeholder={t("company.enterId", "Enter ID ")}
              style={{ background: "var(--bg-color)", color: "var(--text-color)", borderColor: "var(--border-color)" }}
            />
          </div>

          {/* Expiry Date */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 mb-2" style={{ color: "var(--sub-text-color)" }}>
              <div className="w-1 h-3 rounded-full" style={{ background: "var(--accent-color)" }} />
              {t("company.expiryDate", "Expiry Date")}
            </label>
            <input
              type="date"
              value={formatExpiryDate(expiryDate)}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="form-input w-full border-2 rounded-xl px-4 py-3 transition-all duration-200 focus:ring-4"
              style={{ background: "var(--bg-color)", color: "var(--text-color)", borderColor: "var(--border-color)" }}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 rounded-lg font-bold text-sm border transition-all duration-200 disabled:opacity-50"
              style={{
                background: "var(--container-color)",
                borderColor: "var(--border-color)",
                color: "var(--text-color)",
              }}
            >
              {t("company.cancel", "Cancel")}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 rounded-lg font-bold text-sm shadow-md transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: "linear-gradient(135deg, #15919B 0%, #09D1C7 100%)",
                color: "white",
              }}
            >
              {isSubmitting ? t("company.submitting", "Submitting...") : t("company.submit", "Submit")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const SummaryCard = ({ label, value, icon, hint, hintTone = "default", isMono = false }) => {
  return (
    <div
      className="rounded-lg border p-3 transition-all duration-200 hover:shadow-md hover:scale-[1.01]"
      style={{
        background: "var(--container-color)",
        borderColor: "var(--border-color)",
      }}
    >
      <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider mb-2" style={{ color: "var(--sub-text-color)" }}>
        <div className="p-1 rounded" style={{ background: "var(--bg-color)" }}>
          {icon}
        </div>
        {label}
      </div>
      <p
        className={`text-base font-bold ${isMono ? "font-mono text-xs" : ""}`}
        style={{ color: "var(--text-color)" }}
      >
        {value}
      </p>
      {hint && (
        <p
          className="mt-1.5 text-[9px] font-bold px-2 py-0.5 rounded inline-block"
          style={{
            background:
              hintTone === "error"
                ? "rgba(239, 68, 68, 0.1)"
                : hintTone === "warning"
                ? "rgba(245, 158, 11, 0.1)"
                : "var(--bg-color)",
            color:
              hintTone === "error"
                ? "#ef4444"
                : hintTone === "warning"
                ? "#f59e0b"
                : "var(--sub-text-color)",
          }}
        >
          {hint}
        </p>
      )}
    </div>
  );
};

const MetaItem = ({ label, value, isMono = false, accent = "default" }) => {
  const toneMap = {
    default: {
      badge: "border",
      bg: "var(--bg-color)",
      color: "var(--text-color)",
      borderColor: "var(--border-color)",
    },
    success: {
      badge: "shadow-sm",
      bg: "linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)",
      color: "#10b981",
      borderColor: "#10b981",
    },
    warning: {
      badge: "shadow-sm",
      bg: "linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.1) 100%)",
      color: "#f59e0b",
      borderColor: "#f59e0b",
    },
  };

  const tone = toneMap[accent] || toneMap.default;

  return (
    <div className="flex flex-col gap-1.5 p-2.5 rounded-lg border transition-all duration-200 hover:shadow-sm" style={{ borderColor: "var(--border-color)", background: "var(--container-color)" }}>
      <span className="text-[9px] font-bold uppercase tracking-wider flex items-center gap-1" style={{ color: "var(--sub-text-color)" }}>
        <div className="w-0.5 h-2 rounded-full" style={{ background: "var(--accent-color)" }} />
        {label}
      </span>
      <span
        className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-bold ${tone.badge}`}
        style={{ 
          background: tone.bg,
          color: tone.color,
          borderColor: tone.borderColor,
        }}
      >
        {value}
      </span>
    </div>
  );
};

export default CompanyDetailsCard;
