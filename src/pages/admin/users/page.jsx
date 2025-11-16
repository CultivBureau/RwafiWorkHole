import React, { useState, useEffect, useCallback } from "react";
import NavBarAdmin from "../../../components/admin/NavBarAdmin";
import SideBarAdmin from "../../../components/admin/SideBarAdmin";
import { useTranslation } from "react-i18next";
import { PermissionGuard } from "../../../components/common/PermissionGuard";
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Eye,
  MoreVertical,
  UserPlus,
  Shield,
  User,
  Mail,
  Phone,
  MapPin,
  Clock,
  Calendar,
  CheckCircle,
  XCircle,
  AlertTriangle,
  X,
  Save,
  Lock,
  Globe,
  DollarSign,
  CalendarDays,
  Settings,
  AlertCircle,
  Check,
} from "lucide-react";
import {
  useGetAllUsersQuery,
  useCreateUserMutation,
  useDeleteUserMutation,
  useUpdateUserMutation,
} from "../../../services/apis/UsersApi";
import { useLang } from "../../../contexts/LangContext";

const daysOfWeek = [
  { value: "sunday", label: "Sunday", labelAr: "الأحد" },
  { value: "monday", label: "Monday", labelAr: "الاثنين" },
  { value: "tuesday", label: "Tuesday", labelAr: "الثلاثاء" },
  { value: "wednesday", label: "Wednesday", labelAr: "الأربعاء" },
  { value: "thursday", label: "Thursday", labelAr: "الخميس" },
  { value: "friday", label: "Friday", labelAr: "الجمعة" },
  { value: "saturday", label: "Saturday", labelAr: "السبت" },
];

const UsersAdmin = () => {
  const { lang, isRtl } = useLang();
  const { i18n } = useTranslation();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "employee",
    shiftHours: 8,
    shiftStartLocal: "09:00",
    locale: "en",
    isActive: true,
    salary: 0,
    phone: "",
    status: "active",
    availableLeaves: 21,
    holidays: [],
  });

  const { data: usersData = [], isLoading, refetch } = useGetAllUsersQuery();
  const [createUser, { isLoading: creating }] = useCreateUserMutation();
  const [deleteUser, { isLoading: deleting }] = useDeleteUserMutation();
  const [updateUser, { isLoading: updating }] = useUpdateUserMutation();

  // Create stable toggle functions using useCallback
  const toggleMobileSidebar = useCallback(() => {
    setIsMobileSidebarOpen(prev => !prev);
  }, []);

  const closeMobileSidebar = useCallback(() => {
    setIsMobileSidebarOpen(false);
  }, []);

  // Filter users
  const filteredUsers = usersData.filter((user) => {
    const matchesSearch =
      user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = filterRole === "all" || user.role === filterRole;
    const matchesStatus = filterStatus === "all" || user.status === filterStatus;

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Stats calculations
  const totalUsers = usersData.length;
  const adminUsers = usersData.filter((user) => user.role === "admin").length;
  const employeeUsers = usersData.filter((user) => user.role === "employee").length;
  const activeUsers = usersData.filter((user) => user.status === "active").length;

  const statsCards = [
    {
      title: isRtl ? "إجمالي المستخدمين" : "Total Users",
      value: totalUsers,
      icon: Users,
      color: "#3B82F6",
      bgColor: "#EFF6FF",
      filterValue: "all",
      isActive: filterRole === "all" && filterStatus === "all"
    },
    {
      title: isRtl ? "المديرون" : "Admins",
      value: adminUsers,
      icon: Shield,
      color: "#8B5CF6",
      bgColor: "#F3E8FF",
      filterValue: "admin",
      isActive: filterRole === "admin"
    },
    {
      title: isRtl ? "الموظفون" : "Employees",
      value: employeeUsers,
      icon: User,
      color: "#10B981",
      bgColor: "#ECFDF5",
      filterValue: "employee",
      isActive: filterRole === "employee"
    },
    {
      title: isRtl ? "المستخدمون النشطون" : "Active Users",
      value: activeUsers,
      icon: CheckCircle,
      color: "#F59E0B",
      bgColor: "#FFFBEB",
      filterValue: "active",
      isActive: filterStatus === "active"
    },
  ];

  // Handle card click to filter by role or status
  const handleCardClick = (card) => {
    if (card.filterValue === "admin" || card.filterValue === "employee") {
      // Toggle role filter
      setFilterRole(filterRole === card.filterValue ? "all" : card.filterValue);
    } else if (card.filterValue === "active") {
      // Toggle status filter
      setFilterStatus(filterStatus === card.filterValue ? "all" : card.filterValue);
    } else if (card.filterValue === "all") {
      // Reset all filters
      setFilterRole("all");
      setFilterStatus("all");
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = isRtl ? "الاسم الأول مطلوب" : "First name is required";
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = isRtl ? "اسم العائلة مطلوب" : "Last name is required";
    }
    
    if (!formData.email.trim()) {
      newErrors.email = isRtl ? "البريد الإلكتروني مطلوب" : "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = isRtl ? "البريد الإلكتروني غير صحيح" : "Email is invalid";
    }
    
    if (!showEditModal && !formData.password) {
      newErrors.password = isRtl ? "كلمة المرور مطلوبة" : "Password is required";
    } else if (formData.password && formData.password.length < 6) {
      newErrors.password = isRtl ? "كلمة المرور يجب أن تكون 6 أحرف على الأقل" : "Password must be at least 6 characters";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  // Holidays handler
  const handleHolidayChange = (dayValue, checked) => {
    setFormData((prev) => ({
      ...prev,
      holidays: checked
        ? [...prev.holidays, dayValue]
        : prev.holidays.filter((d) => d !== dayValue),
    }));
  };

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      role: "employee",
      shiftHours: 8,
      shiftStartLocal: "09:00",
      locale: "en",
      isActive: true,
      salary: 0,
      phone: "",
      status: "active",
      availableLeaves: 21,
      holidays: [],
    });
    setErrors({});
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    try {
      await createUser(formData).unwrap();
      setShowCreateModal(false);
      resetForm();
      refetch();
    } catch (error) {
      setErrors({ submit: isRtl ? "فشل في إنشاء المستخدم" : "Failed to create user" });
    }
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setFormData({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      password: "",
      role: user.role || "employee",
      shiftHours: user.shiftHours || 8,
      shiftStartLocal: user.shiftStartLocal || "09:00",
      locale: user.locale || "en",
      isActive: user.isActive !== undefined ? user.isActive : true,
      salary: user.salary || 0,
      phone: user.phone || "",
      status: user.status || "active",
      availableLeaves: user.availableLeaves || 21,
      holidays: user.holidays || [],
    });
    setShowEditModal(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    try {
      const updateData = { ...formData };
      if (!updateData.password) {
        delete updateData.password;
      }
      await updateUser({ id: selectedUser._id, ...updateData }).unwrap();
      setShowEditModal(false);
      resetForm();
      setSelectedUser(null);
      refetch();
    } catch (error) {
      setErrors({ submit: isRtl ? "فشل في تحديث المستخدم" : "Failed to update user" });
    }
  };

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteUser(userToDelete._id).unwrap();
      setShowDeleteModal(false);
      setUserToDelete(null);
      refetch();
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  const handleStatusToggle = async (userId, currentStatus) => {
    try {
      const newStatus = currentStatus === "active" ? "suspended" : "active";
      await updateUser({ 
        id: userId, 
        status: newStatus 
      }).unwrap();
      refetch();
    } catch (error) {
      console.error("Error updating user status:", error);
    }
  };

  const getRoleColor = (role) => {
    return role === "admin" ? "#8B5CF6" : "#10B981";
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return { bg: "bg-green-100", text: "text-green-800", color: "#10B981" };
      case "suspended":
        return { bg: "bg-red-100", text: "text-red-800", color: "#EF4444" };
      default:
        return { bg: "bg-gray-100", text: "text-gray-800", color: "#6B7280" };
    }
  };

  // Helper to render holidays as string
  const renderHolidays = (holidaysArr) => {
    if (!holidaysArr || holidaysArr.length === 0) return isRtl ? "لا يوجد" : "None";
    return holidaysArr
      .map((day) => {
        const found = daysOfWeek.find((d) => d.value === day);
        return found ? (isRtl ? found.labelAr : found.label) : day;
      })
      .join(", ");
  };

  return (
    <PermissionGuard 
      backendPermissions={["User.View"]}
      loadingFallback={
        <div className="flex items-center justify-center min-h-screen" style={{ background: "var(--bg-all)" }}>
          <span className="text-[var(--sub-text-color)]">{t('common.loading') || 'Loading...'}</span>
        </div>
      }
    >
      <div className="w-full h-screen flex flex-col" style={{ background: "var(--bg-all)" }}>
        {/* Navigation Bar */}
        <NavBarAdmin
          onMobileSidebarToggle={toggleMobileSidebar}
          isMobileSidebarOpen={isMobileSidebarOpen}
        />

      {/* Content Area */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <SideBarAdmin
          lang={lang}
          isMobileOpen={isMobileSidebarOpen}
          onMobileClose={closeMobileSidebar}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-6" style={{ background: "var(--bg-all)" }}>
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold gradient-text">
                  {isRtl ? "إدارة المستخدمين" : "User Management"}
                </h1>
                <p className="text-lg mt-2" style={{ color: "var(--sub-text-color)" }}>
                  {isRtl ? "إضافة وإدارة حسابات المستخدمين" : "Add and manage user accounts"}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium gradient-bg"
                >
                  <UserPlus size={16} />
                  {isRtl ? "إضافة مستخدم" : "Add User"}
                </button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {statsCards.map((card, index) => (
                <div
                  key={index}
                  className={`p-6 rounded-2xl border transition-all duration-300 hover:shadow-lg cursor-pointer ${
                    card.isActive ? 'ring-2 ring-opacity-50' : ''
                  }`}
                  style={{
                    backgroundColor: "var(--bg-color)",
                    borderColor: card.isActive ? "var(--accent-color)" : "var(--border-color)",
                    ringColor: card.isActive ? card.color : 'transparent',
                    transform: card.isActive ? 'scale(1.02)' : 'scale(1)',
                  }}
                  onClick={() => handleCardClick(card)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm mb-2" style={{ color: "var(--sub-text-color)" }}>
                        {card.title}
                      </p>
                      <p className="text-3xl font-bold" style={{ color: "var(--text-color)" }}>
                        {card.value}
                      </p>
                    </div>
                    <div
                      className="p-3 rounded-xl"
                      style={{ backgroundColor: card.bgColor }}
                    >
                      <card.icon size={24} style={{ color: card.color }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div
              className="p-6 rounded-2xl border"
              style={{
                backgroundColor: "var(--bg-color)",
                borderColor: "var(--border-color)",
              }}
            >
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search */}
                <div className="flex-1">
                  <div className="relative">
                    <Search
                      size={20}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2"
                      style={{ color: "var(--sub-text-color)" }}
                    />
                    <input
                      type="text"
                      placeholder={isRtl ? "البحث عن مستخدم..." : "Search users..."}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border outline-none transition-all duration-200"
                      style={{
                        backgroundColor: "var(--bg-color)",
                        borderColor: "var(--border-color)",
                        color: "var(--text-color)",
                      }}
                    />
                  </div>
                </div>

                {/* Role Filter */}
                <div className="lg:w-48">
                  <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border outline-none transition-all duration-200"
                    style={{
                      backgroundColor: "var(--bg-color)",
                      borderColor: "var(--border-color)",
                      color: "var(--text-color)",
                    }}
                  >
                    <option value="all">{isRtl ? "جميع الأدوار" : "All Roles"}</option>
                    <option value="admin">{isRtl ? "مدير" : "Admin"}</option>
                    <option value="employee">{isRtl ? "موظف" : "Employee"}</option>
                  </select>
                </div>

                {/* Status Filter */}
                <div className="lg:w-48">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border outline-none transition-all duration-200"
                    style={{
                      backgroundColor: "var(--bg-color)",
                      borderColor: "var(--border-color)",
                      color: "var(--text-color)",
                    }}
                  >
                    <option value="all">{isRtl ? "جميع الحالات" : "All Status"}</option>
                    <option value="active">{isRtl ? "نشط" : "Active"}</option>
                    <option value="suspended">{isRtl ? "معلق" : "Suspended"}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Users Table */}
            <div
              className="rounded-2xl border overflow-hidden"
              style={{
                backgroundColor: "var(--bg-color)",
                borderColor: "var(--border-color)",
              }}
            >
              <div className="p-6 border-b" style={{ borderColor: "var(--border-color)" }}>
                <h2 className="text-xl font-bold" style={{ color: "var(--text-color)" }}>
                  {isRtl ? "قائمة المستخدمين" : "Users List"}
                </h2>
                <p className="text-sm mt-1" style={{ color: "var(--sub-text-color)" }}>
                  {isRtl ? `${filteredUsers.length} مستخدم` : `${filteredUsers.length} users`}
                </p>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <div
                    className="animate-spin rounded-full h-8 w-8 border-b-2"
                    style={{ borderColor: "var(--accent-color)" }}
                  ></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead style={{ backgroundColor: "var(--hover-color)" }}>
                      <tr>
                        <th className="text-left p-4 font-semibold" style={{ color: "var(--text-color)" }}>
                          {isRtl ? "المستخدم" : "User"}
                        </th>
                        <th className="text-left p-4 font-semibold" style={{ color: "var(--text-color)" }}>
                          {isRtl ? "معلومات الاتصال" : "Contact"}
                        </th>
                        <th className="text-left p-4 font-semibold" style={{ color: "var(--text-color)" }}>
                          {isRtl ? "الدور" : "Role"}
                        </th>
                        <th className="text-left p-4 font-semibold" style={{ color: "var(--text-color)" }}>
                          {isRtl ? "الحالة" : "Status"}
                        </th>
                        <th className="text-left p-4 font-semibold" style={{ color: "var(--text-color)" }}>
                          {isRtl ? "الإجازة الأسبوعية" : "Holidays"}
                        </th>
                        <th className="text-center p-4 font-semibold" style={{ color: "var(--text-color)" }}>
                          {isRtl ? "الإجراءات" : "Actions"}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => {
                        const statusStyle = getStatusColor(user.status);
                        return (
                          <tr
                            key={user._id}
                            className="border-t hover:bg-gray-50 transition-colors"
                            style={{ borderColor: "var(--border-color)" }}
                          >
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                                  {user.firstName?.[0]}{user.lastName?.[0]}
                                </div>
                                <div>
                                  <h3 className="font-semibold" style={{ color: "var(--text-color)" }}>
                                    {user.firstName} {user.lastName}
                                  </h3>
                                  <p className="text-sm" style={{ color: "var(--sub-text-color)" }}>
                                    ID: {user._id?.slice(-6)}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <Mail size={14} style={{ color: "var(--sub-text-color)" }} />
                                  <span className="text-sm" style={{ color: "var(--text-color)" }}>
                                    {user.email}
                                  </span>
                                </div>
                                {user.phone && (
                                  <div className="flex items-center gap-2">
                                    <Phone size={14} style={{ color: "var(--sub-text-color)" }} />
                                    <span className="text-sm" style={{ color: "var(--sub-text-color)" }}>
                                      {user.phone}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                {user.role === "admin" ? <Shield size={16} /> : <User size={16} />}
                                <span
                                  className="px-3 py-1 rounded-full text-xs font-medium"
                                  style={{
                                    backgroundColor: user.role === "admin" ? "#F3E8FF" : "#ECFDF5",
                                    color: getRoleColor(user.role),
                                  }}
                                >
                                  {user.role === "admin" ? (isRtl ? "مدير" : "Admin") : (isRtl ? "موظف" : "Employee")}
                                </span>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={user.status === "active"}
                                    onChange={() => handleStatusToggle(user._id, user.status)}
                                    className="sr-only peer"
                                    disabled={updating}
                                  />
                                  <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                                </label>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status).bg} ${getStatusColor(user.status).text}`}>
                                  {user.status === "active" ? (isRtl ? "نشط" : "Active") : (isRtl ? "معلق" : "Suspended")}
                                </span>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <span className="text-sm" style={{ color: "var(--text-color)" }}>
                                  {renderHolidays(user.holidays)}
                                </span>
                              </div>
                            </td>
                            <td className="p-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => handleEditUser(user)}
                                  className="p-2 rounded-lg hover:bg-blue-100 text-blue-600 transition-colors"
                                  title={isRtl ? "تعديل" : "Edit"}
                                >
                                  <Edit size={16} />
                                </button>
                                <button
                                  onClick={() => handleDeleteClick(user)}
                                  className="p-2 rounded-lg hover:bg-red-100 text-red-600 transition-colors"
                                  title={isRtl ? "حذف" : "Delete"}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredUsers.length === 0 && (
                        <tr>
                          <td colSpan="6" className="text-center py-12">
                            <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--text-color)" }}>
                              {isRtl ? "لا يوجد مستخدمون" : "No Users Found"}
                            </h3>
                            <p style={{ color: "var(--sub-text-color)" }}>
                              {isRtl
                                ? "لا توجد مستخدمين تطابق المعايير المحددة"
                                : "No users match the selected criteria"}
                            </p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Enhanced Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-lg bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-3xl max-h-[85vh] overflow-y-auto transform transition-all duration-300 scale-100">
            <form
              onSubmit={handleCreateUser}
              className="bg-white rounded-2xl shadow-2xl overflow-hidden"
              style={{ direction: isRtl ? "rtl" : "ltr" }}
            >
              {/* Header */}
              <div className="relative px-6 pt-6 pb-4 bg-gradient-to-br from-blue-50 to-purple-50 border-b border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="absolute top-3 right-3 p-2 rounded-full hover:bg-white/80 transition-colors duration-200"
                  disabled={creating}
                >
                  <X size={18} className="text-gray-500" />
                </button>
                
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 shadow-lg">
                    <UserPlus size={24} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {isRtl ? "إضافة مستخدم جديد" : "Add New User"}
                    </h2>
                    <p className="text-xs text-gray-600 mt-1">
                      {isRtl ? "إنشاء حساب مستخدم جديد في النظام" : "Create a new user account in the system"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="px-6 py-4">
                {errors.submit && (
                  <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2">
                    <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
                    <span className="text-sm text-red-700">{errors.submit}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-4">
                    {/* Basic Information */}
                    <div>
                      <h4 className="text-base font-semibold mb-3 flex items-center gap-2 text-gray-900">
                        <User size={16} className="text-blue-600" />
                        {isRtl ? "المعلومات الأساسية" : "Basic Information"}
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">
                            {isRtl ? "الاسم الأول" : "First Name"}
                            <span className="text-red-500 ml-1">*</span>
                          </label>
                          <input
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            className={`w-full px-3 py-2.5 rounded-lg border-2 transition-all duration-200 focus:outline-none text-sm ${
                              errors.firstName 
                                ? "border-red-300 focus:border-red-500 bg-red-50" 
                                : "border-gray-200 focus:border-blue-500 focus:bg-blue-50"
                            }`}
                            placeholder={isRtl ? "أدخل الاسم الأول" : "Enter first name"}
                            disabled={creating}
                          />
                          {errors.firstName && (
                            <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                              <AlertCircle size={12} />
                              {errors.firstName}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">
                            {isRtl ? "اسم العائلة" : "Last Name"}
                            <span className="text-red-500 ml-1">*</span>
                          </label>
                          <input
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleInputChange}
                            className={`w-full px-3 py-2.5 rounded-lg border-2 transition-all duration-200 focus:outline-none text-sm ${
                              errors.lastName 
                                ? "border-red-300 focus:border-red-500 bg-red-50" 
                                : "border-gray-200 focus:border-blue-500 focus:bg-blue-50"
                            }`}
                            placeholder={isRtl ? "أدخل اسم العائلة" : "Enter last name"}
                            disabled={creating}
                          />
                          {errors.lastName && (
                            <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                              <AlertCircle size={12} />
                              {errors.lastName}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">
                            {isRtl ? "البريد الإلكتروني" : "Email Address"}
                            <span className="text-red-500 ml-1">*</span>
                          </label>
                          <div className="relative">
                            <Mail size={16} className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                              type="email"
                              name="email"
                              value={formData.email}
                              onChange={handleInputChange}
                              className={`w-full pl-8 pr-3 py-2.5 rounded-lg border-2 transition-all duration-200 focus:outline-none text-sm ${
                                errors.email 
                                  ? "border-red-300 focus:border-red-500 bg-red-50" 
                                  : "border-gray-200 focus:border-blue-500 focus:bg-blue-50"
                              }`}
                              placeholder="user@example.com"
                              disabled={creating}
                            />
                          </div>
                          {errors.email && (
                            <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                              <AlertCircle size={12} />
                              {errors.email}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">
                            {isRtl ? "كلمة المرور" : "Password"}
                            <span className="text-red-500 ml-1">*</span>
                          </label>
                          <div className="relative">
                            <Lock size={16} className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                              type="password"
                              name="password"
                              value={formData.password}
                              onChange={handleInputChange}
                              className={`w-full pl-8 pr-3 py-2.5 rounded-lg border-2 transition-all duration-200 focus:outline-none text-sm ${
                                errors.password 
                                  ? "border-red-300 focus:border-red-500 bg-red-50" 
                                  : "border-gray-200 focus:border-blue-500 focus:bg-blue-50"
                              }`}
                              placeholder={isRtl ? "أدخل كلمة مرور قوية" : "Enter a strong password"}
                              disabled={creating}
                            />
                          </div>
                          {errors.password && (
                            <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                              <AlertCircle size={12} />
                              {errors.password}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">
                            {isRtl ? "رقم الهاتف" : "Phone Number"}
                          </label>
                          <div className="relative">
                            <Phone size={16} className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                              type="tel"
                              name="phone"
                              value={formData.phone}
                              onChange={handleInputChange}
                              className="w-full pl-8 pr-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:bg-blue-50 transition-all duration-200 focus:outline-none text-sm"
                              placeholder="+1234567890"
                              disabled={creating}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    {/* Work Information */}
                    <div>
                      <h4 className="text-base font-semibold mb-3 flex items-center gap-2 text-gray-900">
                        <Clock size={16} className="text-green-600" />
                        {isRtl ? "معلومات العمل" : "Work Information"}
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">
                            {isRtl ? "الدور الوظيفي" : "Role"}
                            <span className="text-red-500 ml-1">*</span>
                          </label>
                          <div className="relative">
                            <Shield size={16} className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <select
                              name="role"
                              value={formData.role}
                              onChange={handleInputChange}
                              className="w-full pl-8 pr-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:bg-blue-50 transition-all duration-200 focus:outline-none text-sm"
                              disabled={creating}
                            >
                              <option value="employee">{isRtl ? "موظف" : "Employee"}</option>
                              <option value="admin">{isRtl ? "مدير" : "Admin"}</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                              {isRtl ? "ساعات العمل" : "Work Hours"}
                            </label>
                            <input
                              type="number"
                              name="shiftHours"
                              value={formData.shiftHours}
                              onChange={handleInputChange}
                              min={1}
                              max={12}
                              className="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:bg-blue-50 transition-all duration-200 focus:outline-none text-sm"
                              disabled={creating}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                              {isRtl ? "وقت البداية" : "Start Time"}
                            </label>
                            <input
                              type="time"
                              name="shiftStartLocal"
                              value={formData.shiftStartLocal}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:bg-blue-50 transition-all duration-200 focus:outline-none text-sm"
                              disabled={creating}
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">
                            {isRtl ? "الراتب" : "Salary"}
                          </label>
                          <div className="relative">
                            <DollarSign size={16} className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                              type="number"
                              name="salary"
                              value={formData.salary}
                              onChange={handleInputChange}
                              min={0}
                              className="w-full pl-8 pr-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:bg-blue-50 transition-all duration-200 focus:outline-none text-sm"
                              placeholder="0"
                              disabled={creating}
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">
                            {isRtl ? "الإجازات المتاحة" : "Available Leaves"}
                          </label>
                          <div className="relative">
                            <CalendarDays size={16} className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                              type="number"
                              name="availableLeaves"
                              value={formData.availableLeaves}
                              onChange={handleInputChange}
                              min={0}
                              className="w-full pl-8 pr-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:bg-blue-50 transition-all duration-200 focus:outline-none text-sm"
                              disabled={creating}
                            />
                          </div>
                        </div>

                        {/* Holidays Checkbox */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">
                            {isRtl ? "أيام الإجازة" : "Holidays"}
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {daysOfWeek.map((day) => (
                              <label key={day.value} className="flex items-center gap-1 text-sm">
                                <input
                                  type="checkbox"
                                  checked={formData.holidays.includes(day.value)}
                                  onChange={e => handleHolidayChange(day.value, e.target.checked)}
                                  disabled={creating}
                                />
                                {isRtl ? day.labelAr : day.label}
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    {/* Settings */}
                    <div>
                      <h4 className="text-base font-semibold mb-3 flex items-center gap-2 text-gray-900">
                        <Settings size={16} className="text-purple-600" />
                        {isRtl ? "الإعدادات" : "Settings"}
                      </h4>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                              {isRtl ? "اللغة" : "Language"}
                            </label>
                            <div className="relative">
                              <Globe size={16} className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
                              <select
                                name="locale"
                                value={formData.locale}
                                onChange={handleInputChange}
                                className="w-full pl-8 pr-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:bg-blue-50 transition-all duration-200 focus:outline-none text-sm"
                                disabled={creating}
                              >
                                <option value="en">English</option>
                                <option value="ar">العربية</option>
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                              {isRtl ? "حالة الحساب" : "Status"}
                            </label>
                            <select
                              name="status"
                              value={formData.status}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:bg-blue-50 transition-all duration-200 focus:outline-none text-sm"
                              disabled={creating}
                            >
                              <option value="active">{isRtl ? "نشط" : "Active"}</option>
                              <option value="suspended">{isRtl ? "معلق" : "Suspended"}</option>
                            </select>
                          </div>
                        </div>


                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                    className="flex-1 py-2.5 px-4 rounded-lg border-2 border-gray-200 text-gray-700 font-semibold hover:bg-gray-100 hover:border-gray-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300 text-sm"
                    disabled={creating}
                  >
                    {isRtl ? "إلغاء" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    className={`flex-1 py-2.5 px-4 rounded-lg font-semibold text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm ${
                      creating
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 hover:shadow-lg hover:-translate-y-0.5 transform active:scale-95"
                    }`}
                    disabled={creating}
                  >
                    {creating ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        {isRtl ? "جاري الإنشاء..." : "Creating..."}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <UserPlus size={16} />
                        {isRtl ? "إنشاء المستخدم" : "Create User"}
                      </div>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Enhanced Edit User Modal - Similar reduced structure */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-lg bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-3xl max-h-[85vh] overflow-y-auto transform transition-all duration-300 scale-100">
            <form
              onSubmit={handleUpdateUser}
              className="bg-white rounded-2xl shadow-2xl overflow-hidden"
              style={{ direction: isRtl ? "rtl" : "ltr" }}
            >
              {/* Header */}
              <div className="relative px-6 pt-6 pb-4 bg-gradient-to-br from-green-50 to-blue-50 border-b border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    resetForm();
                    setSelectedUser(null);
                  }}
                  className="absolute top-3 right-3 p-2 rounded-full hover:bg-white/80 transition-colors duration-200"
                  disabled={updating}
                >
                  <X size={18} className="text-gray-500" />
                </button>
                
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-blue-500 shadow-lg">
                    <Edit size={24} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {isRtl ? "تعديل المستخدم" : "Edit User"}
                    </h2>
                    <p className="text-xs text-gray-600 mt-1">
                      {isRtl ? `تعديل معلومات ${selectedUser?.firstName} ${selectedUser?.lastName}` : `Edit ${selectedUser?.firstName} ${selectedUser?.lastName} information`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Content - Same structure as Create Modal but smaller */}
              <div className="px-6 py-4">
                {errors.submit && (
                  <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2">
                    <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
                    <span className="text-sm text-red-700">{errors.submit}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column - Same reduced structure as Create Modal */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-base font-semibold mb-3 flex items-center gap-2 text-gray-900">
                        <User size={16} className="text-blue-600" />
                        {isRtl ? "المعلومات الأساسية" : "Basic Information"}
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">
                            {isRtl ? "الاسم الأول" : "First Name"}
                            <span className="text-red-500 ml-1">*</span>
                          </label>
                          <input
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            className={`w-full px-3 py-2.5 rounded-lg border-2 transition-all duration-200 focus:outline-none text-sm ${
                              errors.firstName 
                                ? "border-red-300 focus:border-red-500 bg-red-50" 
                                : "border-gray-200 focus:border-blue-500 focus:bg-blue-50"
                            }`}
                            disabled={updating}
                          />
                          {errors.firstName && (
                            <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                              <AlertCircle size={12} />
                              {errors.firstName}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">
                            {isRtl ? "اسم العائلة" : "Last Name"}
                            <span className="text-red-500 ml-1">*</span>
                          </label>
                          <input
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleInputChange}
                            className={`w-full px-3 py-2.5 rounded-lg border-2 transition-all duration-200 focus:outline-none text-sm ${
                              errors.lastName 
                                ? "border-red-300 focus:border-red-500 bg-red-50" 
                                : "border-gray-200 focus:border-blue-500 focus:bg-blue-50"
                            }`}
                            disabled={updating}
                          />
                          {errors.lastName && (
                            <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                              <AlertCircle size={12} />
                              {errors.lastName}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">
                            {isRtl ? "البريد الإلكتروني" : "Email Address"}
                            <span className="text-red-500 ml-1">*</span>
                          </label>
                          <div className="relative">
                            <Mail size={16} className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                              type="email"
                              name="email"
                              value={formData.email}
                              onChange={handleInputChange}
                              className={`w-full pl-8 pr-3 py-2.5 rounded-lg border-2 transition-all duration-200 focus:outline-none text-sm ${
                                errors.email 
                                  ? "border-red-300 focus:border-red-500 bg-red-50" 
                                  : "border-gray-200 focus:border-blue-500 focus:bg-blue-50"
                              }`}
                              disabled={updating}
                            />
                          </div>
                          {errors.email && (
                            <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                              <AlertCircle size={12} />
                              {errors.email}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">
                            {isRtl ? "كلمة المرور الجديدة" : "New Password"}
                            <span className="text-xs text-gray-500 ml-1">({isRtl ? "اختياري" : "Optional"})</span>
                          </label>
                          <div className="relative">
                            <Lock size={16} className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                              type="password"
                              name="password"
                              value={formData.password}
                              onChange={handleInputChange}
                              className={`w-full pl-8 pr-3 py-2.5 rounded-lg border-2 transition-all duration-200 focus:outline-none text-sm ${
                                errors.password 
                                  ? "border-red-300 focus:border-red-500 bg-red-50" 
                                  : "border-gray-200 focus:border-blue-500 focus:bg-blue-50"
                              }`}
                              placeholder={isRtl ? "اتركها فارغة للاحتفاظ بالحالية" : "Leave empty to keep current"}
                              disabled={updating}
                            />
                          </div>
                          {errors.password && (
                            <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                              <AlertCircle size={12} />
                              {errors.password}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">
                            {isRtl ? "رقم الهاتف" : "Phone Number"}
                          </label>
                          <div className="relative">
                            <Phone size={16} className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                              type="tel"
                              name="phone"
                              value={formData.phone}
                              onChange={handleInputChange}
                              className="w-full pl-8 pr-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:bg-blue-50 transition-all duration-200 focus:outline-none text-sm"
                              disabled={updating}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Same as Create Modal */}
                  <div className="space-y-4">
                    {/* Work Information */}
                    <div>
                      <h4 className="text-base font-semibold mb-3 flex items-center gap-2 text-gray-900">
                        <Clock size={16} className="text-green-600" />
                        {isRtl ? "معلومات العمل" : "Work Information"}
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">
                            {isRtl ? "الدور الوظيفي" : "Role"}
                            <span className="text-red-500 ml-1">*</span>
                          </label>
                          <div className="relative">
                            <Shield size={16} className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <select
                              name="role"
                              value={formData.role}
                              onChange={handleInputChange}
                              className="w-full pl-8 pr-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:bg-blue-50 transition-all duration-200 focus:outline-none text-sm"
                              disabled={updating}
                            >
                              <option value="employee">{isRtl ? "موظف" : "Employee"}</option>
                              <option value="admin">{isRtl ? "مدير" : "Admin"}</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                              {isRtl ? "ساعات العمل" : "Work Hours"}
                            </label>
                            <input
                              type="number"
                              name="shiftHours"
                              value={formData.shiftHours}
                              onChange={handleInputChange}
                              min={1}
                              max={12}
                              className="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:bg-blue-50 transition-all duration-200 focus:outline-none text-sm"
                              disabled={updating}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                              {isRtl ? "وقت البداية" : "Start Time"}
                            </label>
                            <input
                              type="time"
                              name="shiftStartLocal"
                              value={formData.shiftStartLocal}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:bg-blue-50 transition-all duration-200 focus:outline-none text-sm"
                              disabled={updating}
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">
                            {isRtl ? "الراتب" : "Salary"}
                          </label>
                          <div className="relative">
                            <DollarSign size={16} className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                              type="number"
                              name="salary"
                              value={formData.salary}
                              onChange={handleInputChange}
                              min={0}
                              className="w-full pl-8 pr-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:bg-blue-50 transition-all duration-200 focus:outline-none text-sm"
                              disabled={updating}
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">
                            {isRtl ? "الإجازات المتاحة" : "Available Leaves"}
                          </label>
                          <div className="relative">
                            <CalendarDays size={16} className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                              type="number"
                              name="availableLeaves"
                              value={formData.availableLeaves}
                              onChange={handleInputChange}
                              min={0}
                              className="w-full pl-8 pr-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:bg-blue-50 transition-all duration-200 focus:outline-none text-sm"
                              disabled={updating}
                            />
                          </div>
                        </div>

                        {/* Holidays Checkbox */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">
                            {isRtl ? "أيام الإجازة" : "Holidays"}
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {daysOfWeek.map((day) => (
                              <label key={day.value} className="flex items-center gap-1 text-sm">
                                <input
                                  type="checkbox"
                                  checked={formData.holidays.includes(day.value)}
                                  onChange={e => handleHolidayChange(day.value, e.target.checked)}
                                  disabled={updating}
                                />
                                {isRtl ? day.labelAr : day.label}
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Settings */}
                    <div>
                      <h4 className="text-base font-semibold mb-3 flex items-center gap-2 text-gray-900">
                        <Settings size={16} className="text-purple-600" />
                        {isRtl ? "الإعدادات" : "Settings"}
                      </h4>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                              {isRtl ? "اللغة" : "Language"}
                            </label>
                            <div className="relative">
                              <Globe size={16} className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
                              <select
                                name="locale"
                                value={formData.locale}
                                onChange={handleInputChange}
                                className="w-full pl-8 pr-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:bg-blue-50 transition-all duration-200 focus:outline-none text-sm"
                                disabled={updating}
                              >
                                <option value="en">English</option>
                                <option value="ar">العربية</option>
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                              {isRtl ? "حالة الحساب" : "Status"}
                            </label>
                            <select
                              name="status"
                              value={formData.status}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:bg-blue-50 transition-all duration-200 focus:outline-none text-sm"
                              disabled={updating}
                            >
                              <option value="active">{isRtl ? "نشط" : "Active"}</option>
                              <option value="suspended">{isRtl ? "معلق" : "Suspended"}</option>
                            </select>
                          </div>
                        </div>


                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      resetForm();
                      setSelectedUser(null);
                    }}
                    className="flex-1 py-2.5 px-4 rounded-lg border-2 border-gray-200 text-gray-700 font-semibold hover:bg-gray-100 hover:border-gray-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300 text-sm"
                    disabled={updating}
                  >
                    {isRtl ? "إلغاء" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    className={`flex-1 py-2.5 px-4 rounded-lg font-semibold text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-300 text-sm ${
                      updating
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 hover:shadow-lg hover:-translate-y-0.5 transform active:scale-95"
                    }`}
                    disabled={updating}
                  >
                    {updating ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        {isRtl ? "جاري التحديث..." : "Updating..."}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <Save size={16} />
                        {isRtl ? "حفظ التغييرات" : "Save Changes"}
                      </div>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {showDeleteModal && userToDelete && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-lg bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div 
            className="w-full max-w-md transform transition-all duration-300 scale-100"
            style={{ direction: isRtl ? "rtl" : "ltr" }}
          >
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="px-8 pt-8 pb-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                  <Trash2 size={32} className="text-red-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {isRtl ? "تأكيد الحذف" : "Confirm Deletion"}
                </h3>
                <p className="text-sm text-gray-600">
                  {isRtl ? "هذا الإجراء لا يمكن التراجع عنه" : "This action cannot be undone"}
                </p>
              </div>

              {/* Content */}
              <div className="px-8 pb-6">
                <div className="p-4 rounded-lg bg-red-50 border border-red-200 mb-6">
                  <div className="text-center">
                    <p className="text-gray-800 mb-2">
                      {isRtl ? "هل أنت متأكد من أنك تريد حذف هذا المستخدم؟" : "Are you sure you want to delete this user?"}
                    </p>
                    <div className="flex items-center justify-center gap-3 mt-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                        {userToDelete.firstName?.[0]}{userToDelete.lastName?.[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {userToDelete.firstName} {userToDelete.lastName}
                        </p>
                        <p className="text-sm text-gray-600">
                          {userToDelete.email}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={16} className="text-amber-500 flex-shrink-0" />
                    <span>
                      {isRtl ? "ستفقد جميع بيانات المستخدم نهائياً" : "All user data will be permanently lost"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={16} className="text-amber-500 flex-shrink-0" />
                    <span>
                      {isRtl ? "لن يتمكن المستخدم من الدخول للنظام" : "User will no longer be able to access the system"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-8 py-6 bg-gray-50 border-t border-gray-100">
                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setUserToDelete(null);
                    }}
                    className="flex-1 py-3 px-4 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold hover:bg-gray-100 hover:border-gray-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
                    disabled={deleting}
                  >
                    {isRtl ? "إلغاء" : "Cancel"}
                  </button>
                  <button
                    onClick={handleDeleteConfirm}
                    className={`flex-1 py-3 px-4 rounded-xl font-semibold text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-300 ${
                      deleting
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-red-500 hover:bg-red-600 hover:shadow-lg hover:-translate-y-0.5 transform active:scale-95"
                    }`}
                    disabled={deleting}
                  >
                    {deleting ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        {isRtl ? "جاري الحذف..." : "Deleting..."}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <Trash2 size={18} />
                        {isRtl ? "حذف المستخدم" : "Delete User"}
                      </div>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </PermissionGuard>
  );
};

export default UsersAdmin;
