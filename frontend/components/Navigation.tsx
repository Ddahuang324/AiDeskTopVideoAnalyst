import React from 'react';
import { motion } from 'framer-motion';
import { Page } from '../types';

interface NavigationProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
}

const navItems = [
  { page: Page.Home, label: '首页' },
  { page: Page.History, label: '分析历史' },
  { page: Page.PromptManager, label: '提示词管理' },
  { page: Page.Settings, label: '设置' },
];

const Navigation: React.FC<NavigationProps> = ({ currentPage, setCurrentPage }) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 p-4 sm:p-6">
      <div className="container mx-auto flex justify-between items-center">
        <div 
          className="text-xl font-bold tracking-wider cursor-pointer"
          onClick={() => setCurrentPage(Page.Home)}
        >
          LA
        </div>
        <nav>
          <ul className="flex space-x-6 sm:space-x-8">
            {navItems.map((item) => (
              <li key={item.page} className="relative">
                <button
                  onClick={() => setCurrentPage(item.page)}
                  className={`text-sm sm:text-base font-medium transition-colors duration-300 ease-in-out ${
                    currentPage === item.page ? 'text-[#222222]' : 'text-gray-500 hover:text-[#222222]'
                  }`}
                >
                  {item.label}
                </button>
                {currentPage === item.page && (
                  <motion.div
                    className="absolute bottom-[-4px] left-0 right-0 h-[2px] bg-[#B8860B]"
                    layoutId="underline"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Navigation;