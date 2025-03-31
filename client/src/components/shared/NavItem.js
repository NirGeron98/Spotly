import React from 'react';

const NavItem = ({ icon, text, active = false, href = '/' }) => {
  return (
    <a 
      href={href}
      aria-label={text}
      className={`flex items-center space-x-2 space-x-reverse py-2 px-3 rounded-lg transition duration-200 
      ${active 
        ? 'bg-blue-100 text-blue-700 font-bold' 
        : 'text-gray-600 hover:bg-gray-100 hover:text-blue-600'}`}
    >
      <span>{text}</span>
      <span className={active ? 'text-blue-600' : 'text-gray-500'}>{icon}</span>
    </a>
  );
};

export default NavItem;
