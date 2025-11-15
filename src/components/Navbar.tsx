import * as React from "react";
import { Link, useLocation } from "react-router-dom";
import logo from "../assets/logo.png";
import {
  LayoutDashboard,
  Boxes,
  ShoppingCart,
  Truck,
  QrCode
} from "lucide-react";
// i18n imports
import { useTranslation } from "react-i18next";
import i18n from '../i18n';

const navs = [
  { to: "/dashboard", label: "דשבורד", icon: <LayoutDashboard size={20} /> },
  { to: "/products", label: "מוצרים", icon: <Boxes size={20} /> },
  { to: "/orders", label: "הזמנות", icon: <ShoppingCart size={20} /> },
  { to: "/suppliers", label: "ספקים", icon: <Truck size={20} /> },
  { to: "/barcode-database", label: "מאגר ברקודים", icon: <QrCode size={20} /> },
];

const RTL_LANGS = ["he", "ar", "fa", "ur"];

const Navbar = () => {
  const location = useLocation();
  const { i18n } = useTranslation();
  const dir = RTL_LANGS.includes(i18n.language) ? "rtl" : "ltr";

  return (
    <nav
      className="w-full flex flex-row items-center justify-center p-4 select-none mb-4 bg-card/90 backdrop-blur sticky top-0 z-40"
      style={{ zIndex: 1000 }}
      dir={dir}
    >
      <div className="flex gap-6">
        {navs.map(nav => (
          <Link 
            key={nav.to}
            to={nav.to}
            className={`font-bold text-base px-2 py-1 rounded hover:bg-muted transition 
            ${location.pathname === nav.to ? "text-primary" : "text-muted-foreground"}
            flex items-center gap-1
            `}
          >
            {nav.icon}
            {nav.label}
          </Link>
        ))}
      </div>
      <div className="flex-1" />
      <img src={logo} width={150} height={150} />
    </nav>
  );
};

export default Navbar;
