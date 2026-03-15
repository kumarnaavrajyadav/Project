import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { BsSunFill, BsMoonStarsFill } from 'react-icons/bs';

export default function ThemeToggle() {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`relative inline-flex items-center h-8 w-16 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-blue-500 shadow-inner ${
        isDarkMode ? 'bg-gray-700' : 'bg-blue-100'
      }`}
      aria-label="Toggle Theme"
    >
      <span
        className={`absolute inset-y-1 left-1 flex items-center justify-center w-6 h-6 rounded-full bg-white shadow transform transition-transform duration-300 ${
          isDarkMode ? 'translate-x-8' : 'translate-x-0'
        }`}
      >
        {isDarkMode ? (
          <BsMoonStarsFill className="text-gray-700 text-xs" />
        ) : (
          <BsSunFill className="text-yellow-500 text-xs" />
        )}
      </span>
    </button>
  );
}
