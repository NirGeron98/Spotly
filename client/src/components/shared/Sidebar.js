import React from "react";
import { FaSearch, FaRegWindowClose, FaHistory } from "react-icons/fa"; 

const Sidebar = ({ current, setCurrent, role }) => {
  const options = [
    { key: "search", label: "חיפוש חנייה", icon: <FaSearch className="text-xl" />, visible: true },
    { key: "release", label: "פינוי החנייה שלי", icon: <FaRegWindowClose className="text-xl" />, visible: role === "private_prop_owner" },
    { key: "history", label: "היסטוריית שימוש", icon: <FaHistory className="text-xl" />, visible: true },
  ];

  const getTitle = () => "תפריט אפשרויות";

  return (
    <aside className="w-72 h-80 bg-blue-700 shadow-xl border-l fixed right-0 top-17 z-40 max-h-screen overflow-y-auto">
      {/* כותרת */}
      <div className="text-center py-4 font-bold text-white text-lg border-b border-blue-700">
        {getTitle()}
      </div>

      {/* תפריט אפשרויות */}
      <nav className="flex flex-col space-y-4 px-6 pt-6">
        {options.map(
          (opt) =>
            opt.visible && (
              <button
                key={opt.key}
                onClick={() => setCurrent(opt.key)}
                className={`text-left px-6 py-3 rounded-lg flex items-center gap-4 transition text-sm font-medium ${
                  current === opt.key
                    ? "bg-blue-700 text-white font-bold"
                    : "text-blue-300 hover:bg-blue-600 hover:text-white"
                }`}
              >
                {opt.icon}
                {opt.label}
              </button>
            )
        )}
      </nav>
    </aside>
  );
};

export default Sidebar;
