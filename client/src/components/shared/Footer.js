import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-blue-900 text-blue-100 py-4">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-6 md:mb-0">
            <p className="text-lg font-bold">© 2025 כל הזכויות שמורות</p>
          </div>
          <div className="flex space-x-6 space-x-reverse">
            <a href="/terms" className="hover:text-white transition" aria-label="תנאי שימוש">
              תנאי שימוש
            </a>
            <a href="/privacy" className="hover:text-white transition" aria-label="מדיניות פרטיות">
              מדיניות פרטיות
            </a>
            <a href="/contact" className="hover:text-white transition" aria-label="צור קשר">
              צור קשר
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
