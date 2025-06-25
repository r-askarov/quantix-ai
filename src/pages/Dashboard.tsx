// שמור לעתיד, לשימוש/העתקה לדשבורד מורחב
import Index from "./Index";
import * as React from "react";
import { useTranslation } from "react-i18next";

const RTL_LANGS = ["he", "ar", "fa", "ur"];

const Dashboard = () => {
  const { i18n } = useTranslation();
  const dir = RTL_LANGS.includes(i18n.language) ? "rtl" : "ltr";

  return (
    <main className="min-h-screen bg-background px-8 py-8" dir={dir}>
      <Index />
    </main>
  );
};

export default Dashboard;
