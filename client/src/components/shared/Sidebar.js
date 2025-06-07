import React, { useEffect, useState } from "react";
import { FaSearch, FaRegWindowClose, FaHistory, FaBars } from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";

const Sidebar = ({ current, setCurrent, role }) => {
  const [isHovered, setIsHovered] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const storedMode = localStorage.getItem("mode");
  const currentMode = location.state?.mode || storedMode || "regular";

  useEffect(() => {
    if (location.state?.mode) {
      localStorage.setItem("mode", location.state.mode);
    }
  }, [location.state?.mode]);

  const isBuildingMode = currentMode === "building";

  const options = [
    {
      key: "search",
      label: "חיפוש חנייה חדשה",
      icon: <FaSearch className="text-lg" />,
      path: "/search-parking",
      visible: true,
    },
    {
      key: "activeReservations",
      label: "הזמנות פעילות שביצעתי",
      icon: <FaHistory className="text-lg" />,
      path: "/active-reservations",
      visible: true,
    },
    {
      key: "history",
      label: "היסטוריית שימוש",
      icon: <FaHistory className="text-lg" />,
      path: "/usage-history",
      visible: true,
    },
  ];

  const releaseOption = {
    key: "releaseParking",
    label: "ניהול החנייה שלי",
    icon: <FaRegWindowClose className="text-lg" />,
    path: "/release",
    visible:
      role === "user" ||
      role === "private_prop_owner" ||
      ((role === "building_resident" || role === "building_manager") &&
        currentMode === "building"),
  };

  return (
    <>
      {/* Mobile Sidebar Toggle Button */}
      <button
        className="lg:hidden fixed top-4 right-4 z-50 bg-indigo-800 text-white p-2 rounded"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="פתח תפריט צד"
      >
        <FaBars className="text-xl" />
      </button>

      {/* Modal Overlay for mobile sidebar */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 block lg:hidden"
          onClick={() => setIsOpen(false)}
          aria-label="סגור תפריט צד"
        ></div>
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`fixed top-14 sm:top-16 bottom-0 z-[60] bg-gradient-to-b from-indigo-900 to-blue-800 shadow-xl flex flex-col
        w-[70vw] min-w-[180px] max-w-[250px]
        transform transition-transform duration-300
        overflow-y-auto
        rtl:right-0 ltr:left-0
        lg:static lg:right-0 lg:translate-x-0 lg:flex lg:h-auto lg:w-[20vw] lg:min-w-[180px] lg:max-w-[250px] ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={isOpen ? { touchAction: 'none' } : {}}
        onClick={e => e.stopPropagation()}
        tabIndex={-1}
        aria-modal={isOpen ? "true" : undefined}
        role="dialog"
      >
        <div className="relative py-4 text-center border-b border-blue-700/30">
          <h2 className="font-bold text-white text-lg">ניווט מהיר</h2>
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-12 h-0.5 bg-blue-400 rounded-full"></div>
        </div>

        <nav className="flex flex-col px-3 py-4 overflow-y-auto flex-grow">
          {options.map(
            (opt) =>
              opt.visible && (
                <button
                  key={opt.key}
                  onClick={() => {
                    setCurrent(opt.key);
                    navigate(opt.path);
                    setIsOpen(false);
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
                  <span className="text-sm font-medium">{opt.label}</span>
                </button>
              )
          )}
        </nav>

        {releaseOption.visible && (
          <div className="px-3 py-2 border-t border-blue-700/30 bg-blue-900/30">
            <button
              onClick={() => {
                setCurrent(releaseOption.key);
                if (isBuildingMode) {
                  navigate("/release", {
                    state: { mode: "building" },
                    replace: true,
                  });
                } else {
                  navigate(releaseOption.path);
                }
                setIsOpen(false);
              }}
              onMouseEnter={() => setIsHovered(releaseOption.key)}
              onMouseLeave={() => setIsHovered(null)}
              className={`w-full text-right px-3 py-3 rounded-md flex items-center gap-3 transition-all duration-300 ease-in-out ${
                current === releaseOption.key
                  ? "bg-white text-indigo-900 shadow-md"
                  : "text-blue-100 hover:bg-blue-700/50 hover:text-white"
              }`}
            >
              <div
                className={`p-2 rounded-full ${
                  current === releaseOption.key
                    ? "bg-indigo-100 text-indigo-900"
                    : isHovered === releaseOption.key
                    ? "bg-blue-600 text-white"
                    : "bg-blue-800/70 text-blue-200"
                }`}
              >
                {releaseOption.icon}
              </div>
              <span className="text-sm font-medium">{releaseOption.label}</span>
            </button>
          </div>
        )}

        <div className="px-3 py-4 text-center text-blue-200 text-xs bg-indigo-900/30">
          <div className="w-10 h-0.5 mx-auto mb-2 bg-blue-400/30 rounded-full"></div>
          Spotly
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
