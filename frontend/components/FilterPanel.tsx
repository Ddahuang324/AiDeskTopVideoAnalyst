
import React from 'react';
import { motion, Variants } from 'framer-motion';

interface FilterPanelProps {
  categories: string[];
  activeFilter: string;
  onFilterChange: (category: string) => void;
  onClose: () => void;
}

const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const panelVariants: Variants = {
  hidden: { x: '100%' },
  visible: { x: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } },
  exit: { x: '100%', transition: { type: 'spring', stiffness: 300, damping: 30 } },
};

const FilterPanel: React.FC<FilterPanelProps> = ({ categories, activeFilter, onFilterChange, onClose }) => {
  return (
    <>
      <motion.div
        className="fixed inset-0 bg-black/30 z-40"
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
        onClick={onClose}
      />
      <motion.div
        className="fixed top-0 right-0 bottom-0 w-full max-w-xs bg-[#F9F9F9] shadow-lg z-50 p-6 flex flex-col"
        variants={panelVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-medium tracking-wide">按风格筛选</h3>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
        
        <ul className="space-y-2">
            {categories.map(category => (
                <li key={category}>
                    <button
                        onClick={() => onFilterChange(category)}
                        className={`w-full text-left px-4 py-3 text-base font-medium rounded-md transition-colors duration-200 ease-in-out relative ${
                            activeFilter === category
                                ? 'bg-[#222222] text-white'
                                : 'text-gray-600 hover:bg-white'
                        }`}
                    >
                        {category}
                    </button>
                </li>
            ))}
        </ul>
      </motion.div>
    </>
  );
};

export default FilterPanel;
