import * as React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPortal } from "react-dom";
import { Menu, X } from "lucide-react";
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
  { to: "/", label: "דשבורד", icon: <LayoutDashboard size={20} /> },
  { to: "/products", label: "מוצרים", icon: <Boxes size={20} /> },
  // { to: "/orders", label: "הזמנות", icon: <ShoppingCart size={20} /> },
  { to: "/suppliers", label: "ספקים", icon: <Truck size={20} /> },
  { to: "/barcode-database", label: "מאגר ברקודים", icon: <QrCode size={20} /> },
];

const RTL_LANGS = ["he", "ar", "fa", "ur"];

const Navbar = () => {
  const location = useLocation();
  const dir = RTL_LANGS.includes(i18n.language) ? "rtl" : "ltr";
  const [mobileOpen, setMobileOpen] = React.useState(false);

  React.useEffect(() => {
    // Close mobile menu on route change
    setMobileOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile menu is open
  React.useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileOpen]);

  // Mobile menu portal - renders at document.body level with high z-index
  const mobileMenu = mobileOpen
    ? createPortal(
        <div className="fixed inset-0 z-[99999]">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <nav className="relative bg-white w-64 h-full p-6 overflow-auto" dir="rtl">
            <div className="flex items-center justify-between mb-6">
              <Link to="/" className="flex items-center">
                <img src={logo} alt="RevAlto Logo" className="h-12 w-auto" />
              </Link>
              <button
                aria-label="Close menu"
                onClick={() => setMobileOpen(false)}
                className="p-2 rounded hover:bg-gray-100"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <ul className="flex flex-col gap-4">
              {navs.map((nav) => (
                <li key={nav.to}>
                  <Link
                    to={nav.to}
                    className={`flex items-center gap-3 py-2 px-3 rounded font-medium transition-colors ${
                      location.pathname === nav.to
                        ? 'bg-gray-100 text-gray-900'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setMobileOpen(false)}
                  >
                    {nav.icon}
                    <span>{nav.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>,
        document.body
      )
    : null;

  return (
    <>
      {/* Full-width header without max-width constraint */}
      <header className="sticky top-0 z-40 bg-white border-b w-full">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link to="/" className="flex items-center">
                <img src={logo} alt="RevAlto Logo" className="h-8 w-auto" />
              </Link>

              {/* desktop links - hidden on mobile */}
              <nav className="hidden md:flex items-center gap-2">
                {navs.map((nav) => (
                  <Link
                    key={nav.to}
                    to={nav.to}
                    className={`flex items-center gap-2 px-3 py-2 rounded text-sm font-medium transition-colors ${
                      location.pathname === nav.to
                        ? 'bg-gray-100 text-gray-900'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    {nav.icon}
                    <span>{nav.label}</span>
                  </Link>
                ))}
              </nav>
            </div>

            <div className="flex items-center gap-2">
              {/* mobile hamburger - visible only on small screens */}
              <button
                className="md:hidden p-2 rounded hover:bg-gray-100"
                aria-label="Open menu"
                onClick={() => setMobileOpen(true)}
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu portal */}
      {mobileMenu}
    </>
  );
};

export default Navbar;
