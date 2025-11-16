import React from "react";
import { useTranslation } from "react-i18next";
import Card from "../../Time_Tracking_Components/Stats/Card";

const CompanyStatusCards = () => {
    const { t } = useTranslation();

    const statusCards = [
        {
            header: "Company Name",
            title: "WorkHole",
            subTitle: "Registered Organization",
            rightIcon: <img src="/assets/company/name.svg" alt="Company Name" className="w-6 h-6" />,
        },
        {
            header: "Active Status",
            title: "Active",
            subTitle: "Current Plan",
            rightIcon: <img src="/assets/company/status.svg" alt="Active Status" className="w-6 h-6" />,
        },
        {
            header: "Plan Type",
            title: "Enterprise",
            subTitle: "Start - End Date",
            rightIcon: <img src="/assets/company/plan.svg" alt="Plan Type" className="w-6 h-6" />,
        },
        {
            header: "Departments Linked",
            title: "8 Departments",
            subTitle: "Total Departments under this company",
            rightIcon: <img src="/assets/company/departments.svg" alt="Departments Linked" className="w-6 h-6" />,
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
