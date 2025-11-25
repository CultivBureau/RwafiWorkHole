import React from "react";
import { useTranslation } from "react-i18next";
import Card from "../../Time_Tracking_Components/Stats/Card";

const CompanyStatusCards = () => {
    const { t } = useTranslation();

    const statusCards = [
        {
            header: t("company.statusCards.companyName"),
            title: "WorkHole",
            subTitle: t("company.statusCards.registeredOrganization"),
            rightIcon: <img src="/assets/company/name.svg" alt={t("company.statusCards.companyName")} className="w-6 h-6" />,
        },
        {
            header: t("company.statusCards.activeStatus"),
            title: t("company.active"),
            subTitle: t("company.statusCards.currentPlan"),
            rightIcon: <img src="/assets/company/status.svg" alt={t("company.statusCards.activeStatus")} className="w-6 h-6" />,
        },
        {
            header: t("company.statusCards.planType"),
            title: "Enterprise",
            subTitle: t("company.statusCards.startEndDate"),
            rightIcon: <img src="/assets/company/plan.svg" alt={t("company.statusCards.planType")} className="w-6 h-6" />,
        },
        {
            header: t("company.statusCards.departmentsLinked"),
            title: "8 Departments",
            subTitle: t("company.statusCards.totalDepartments"),
            rightIcon: <img src="/assets/company/departments.svg" alt={t("company.statusCards.departmentsLinked")} className="w-6 h-6" />,
        },
    ];

    return (
        <section className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {statusCards.map((card, index) => (
                <Card
                    key={index}
                    header={card.header}
                    title={card.title}
                    subTitle={card.subTitle}
                    rightIcon={card.rightIcon}
                    className="min-h-[120px]"
                />
            ))}
        </section>
    );
};

export default CompanyStatusCards;
