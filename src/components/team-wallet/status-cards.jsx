import React from "react";
import { useTranslation } from "react-i18next";
import Card from "../Time_Tracking_Components/Stats/Card";

const StatusCards = () => {
    const { t, i18n } = useTranslation();
    const isArabic = i18n.language === "ar";
    const direction = isArabic ? "rtl" : "ltr";

    const walletCardsData = [
        {
            header: t("walletCards.myDeductions.header"),
            title: t("walletCards.myDeductions.title"),
            subTitle: t("walletCards.myDeductions.subTitle"),
            rightIcon: (
                <img
                    src="/assets/Team_wallet/my_deductions.svg"
                    alt={t("walletCards.myDeductions.header")}
                    className="w-8 h-8"
                />
            ),
        },
        {
            header: t("walletCards.teamDeductions.header"),
            title: t("walletCards.teamDeductions.title"),
            subTitle: t("walletCards.teamDeductions.subTitle"),
            rightIcon: (
                <img
                    src="/assets/Team_wallet/team_deductions.svg"
                    alt={t("walletCards.teamDeductions.header")}
                    className="w-8 h-8"
                />
            ),
        },
        {
            header: t("walletCards.incentivesEarned.header"),
            title: t("walletCards.incentivesEarned.title"),
            subTitle: t("walletCards.incentivesEarned.subTitle"),
            rightIcon: (
                <img
                    src="/assets/Team_wallet/earned.svg"
                    alt={t("walletCards.incentivesEarned.header")}
                    className="w-8 h-8"
                />
            ),
        },
        {
            header: t("walletCards.hoursLogged.header"),
            title: t("walletCards.hoursLogged.title"),
            subTitle: t("walletCards.hoursLogged.subTitle"),
            rightIcon: (
                <img
                    src="/assets/Team_wallet/logged.svg"
                    alt={t("walletCards.hoursLogged.header")}
                    className="w-8 h-8"
                />
            ),
        },
    ];

    return (
        <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
            dir={direction}
        >
            {walletCardsData.map((card, idx) => (
                <Card
                    key={idx}
                    header={card.header}
                    title={card.title}
                    subTitle={card.subTitle}
                    rightIcon={card.rightIcon}
                    className="h-full"
                />
            ))}
        </div>
    );
};

export default StatusCards;