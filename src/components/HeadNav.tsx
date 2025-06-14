
import * as React from "react";
import { Link, useLocation } from "react-router-dom";
import logo from "@/assets/logo.png";

const navs = [
  { to: "/dashboard", label: "דשבורד" },
  { to: "/products", label: "מוצרים" },
  { to: "/orders", label: "הזמנות" },
  { to: "/suppliers", label: "ספקים" },
  { to: "/barcode-database", label: "מאגר ברקודים" },
];

const HeadNav = () => {
  const location = useLocation();
  return (
    <nav className="w-full flex items-center gap-8 py-4 select-none mb-4 border-b bg-card/90 backdrop-blur sticky top-0 z-40">
      <div className="flex-1 flex gap-6 justify-end md:justify-center">
        {navs.map(nav => (
          <Link 
            key={nav.to}
            to={nav.to}
            className={`font-bold text-base px-2 py-1 rounded hover:bg-muted transition 
            ${location.pathname === nav.to ? "text-primary underline" : "text-muted-foreground"}
            `}
          >
            {nav.label}
          </Link>
        ))}
      </div>
      <div className="flex-0 ml-2">
        <img src={logo} alt="Quantix Logo" className="h-12 w-auto object-contain" />
      </div>
    </nav>
  );
};

export default HeadNav;
