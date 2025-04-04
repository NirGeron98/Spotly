import React, { useState } from "react";
import {
  FaSearch,
  FaRegWindowClose,
  FaHistory,
  FaBars,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const Sidebar = ({ current, setCurrent, role }) => {
  const [isHovered, setIsHovered] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const options = [
    {
      key: "search",
      label: "חיפוש חנייה",
      icon: <FaSearch className="text-lg" />,
      path: "/search-parking",
      visible: true,
    },
    {
      key: "release",
      label: "פינוי החנייה שלי",
      icon: <FaRegWindowClose className="text-lg" />,
      path: "/release", 
      visible: role === "private_prop_owner",
    },
    {
      key: "history",
      label: "היסטוריית שימוש",
      icon: <FaHistory className="text-lg" />,
      path: "/usage-history",
      visible: true,
    },
  ];

  return (
    <>
      {/* כפתור לתפריט במובייל */}
      <button
        className="md:hidden fixed top-4 right-4 z-50 bg-indigo-800 text-white p-2 rounded"
        onClick={() => setIsOpen(!isOpen)}
      >
        <FaBars className="text-xl" />
      </button>

      <aside
        className={`fixed z-40 top-[68px] bottom-[64px] right-0 w-60 bg-gradient-to-b from-indigo-900 to-blue-800 shadow-xl flex flex-col transform transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        } md:translate-x-0`}
      >
        {/* כותרת */}
        <div className="relative py-4 text-center border-b border-blue-700/30">
          <h2 className="font-bold text-white text-lg">ניווט מהיר</h2>
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-12 h-0.5 bg-blue-400 rounded-full"></div>
        </div>

        {/* כפתורי ניווט */}
        <nav className="flex flex-col px-3 py-4 overflow-y-auto flex-grow">
          {options.map(
            (opt) =>
              opt.visible && (
                <button
                  key={opt.key}
                  onClick={() => {
                    setCurrent(opt.key);
                    navigate(opt.path);
                    setIsOpen(false); // סגור את התפריט במובייל
                  }}
                  onMouseEnter={() => setIsHovered(opt.key)}
                  onMouseLeave={() => setIsHovered(null)}
                  className={`text-right px-3 py-3 mb-2 rounded-md flex items-center gap-3 transition-all duration-300 ease-in-out ${
                    current === opt.key
                      ? "bg-white text-indigo-900 shadow-md"
                      : "text-blue-100 hover:bg-blue-700/50 hover:text-white"
                  }`}
                >
                  <div
                    className={`p-2 rounded-full ${
                      current === opt.key
                        ? "bg-indigo-100 text-indigo-900"
                        : isHovered === opt.key
                        ? "bg-blue-600 text-white"
                        : "bg-blue-800/70 text-blue-200"
                    }`}
                  >
                    {opt.icon}
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      current === opt.key ? "text-indigo-900" : ""
                    }`}
                  >
                    {opt.label}
                  </span>
                </button>
              )
          )}
        </nav>

        <div className="px-3 py-4 text-center text-blue-200 text-xs bg-indigo-900/30">
          <div className="w-10 h-0.5 mx-auto mb-2 bg-blue-400/30 rounded-full"></div>
          Spotly
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
