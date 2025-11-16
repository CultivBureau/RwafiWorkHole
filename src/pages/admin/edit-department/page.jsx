import React from "react";
import { useTranslation } from "react-i18next";
import NavBarAdmin from "../../../components/admin/NavBarAdmin";
import SideBarAdmin from "../../../components/admin/SideBarAdmin";
import EditDepartmentForm from "../../../components/admin/all-departments/edit-department/edit-form";
import { PermissionGuard } from "../../../components/common/PermissionGuard";

export default function EditDepartment() {
    const { t, i18n } = useTranslation();
    const isArabic = i18n.language === "ar";

    return (
        <PermissionGuard 
            backendPermissions={["Department.Update"]}
            loadingFallback={
                <div className="flex items-center justify-center min-h-screen" style={{ background: "var(--bg-all)" }}>
                    <span className="text-[var(--sub-text-color)]">{t('common.loading') || 'Loading...'}</span>
                </div>
            }
        >
            <div className="w-full h-screen flex flex-col" style={{ background: "var(--bg-all)" }}>
            {/* Navigation Bar */}
            <NavBarAdmin />

            {/* Content Area */}
            <div className="flex flex-1 min-h-0">
                {/* Sidebar */}
                <SideBarAdmin />

                {/* Main Content */}
                <main className="flex-1 overflow-auto p-4" style={{ background: "var(--bg-all)" }}>
                    <div
                        className="h-max rounded-2xl border border-gray-200"
                        style={{ background: "var(--bg-color)" }}
                    >
                        {/* Edit Department content */}
                        <div className="w-full h-max p-6">
                            <EditDepartmentForm />
                        </div>
                    </div>
                </main>
            </div>
        </div>
        </PermissionGuard>
    );
}
