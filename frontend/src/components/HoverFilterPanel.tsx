
import React from 'react';
import { motion } from 'framer-motion';

interface HoverFilterPanelProps {
  categories: string[];
  activeFilter: string;
  onFilterChange: (category: string) => void;
}

const HoverFilterPanel: React.FC<HoverFilterPanelProps> = ({ categories, activeFilter, onFilterChange }) => {
  // Approximate height of the fixed navigation bar in pixels.
  const NAV_HEIGHT = 80; 

  return (
    <motion.div
      // Position the entire animated container to start below the nav bar and fill the remaining height.
      className="fixed right-0 z-40"
      style={{
        top: `${NAV_HEIGHT}px`,
        height: `calc(100vh - ${NAV_HEIGHT}px)`,
      }}
      initial={{ x: "calc(100% - 24px)" }} // Initially reveal only the handle (24px wide)
      whileHover={{ x: 0 }} // On hover, slide the panel fully into view
      transition={{ type: 'spring', stiffness: 200, damping: 25 }}
    >
      <div
        // The panel itself takes the full height of its parent container.
        className="bg-[#F9F9F9]/80 backdrop-blur-md shadow-2xl rounded-l-lg flex h-full"
      >
        {/* The tab/handle */}
        <div className="w-6 flex-shrink-0 flex items-center justify-center cursor-pointer rounded-l-lg py-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#222222]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h18M7 12h10M11 20h2" />
            </svg>
        </div>
        
        {/* The content, with vertical scrolling enabled for long lists */}
        <div className="p-6 w-[280px] border-l border-gray-200/50 overflow-y-auto">
            <h3 className="text-xl font-medium tracking-wide text-[#222222] mb-6">按风格筛选</h3>
            <ul className="space-y-2">
                {categories.map(category => (
                    <li key={category}>
                        <button
                            onClick={() => onFilterChange(category)}
                            className={`w-full text-left px-4 py-3 text-base font-medium rounded-md transition-all duration-300 ease-in-out relative ${
                                activeFilter === category
                                    ? 'bg-[#222222] text-white shadow-md'
                                    : 'text-gray-600 hover:bg-white/80 hover:text-[#222222]'
                            }`}
                        >
                            {category}
                        </button>
                    </li>
                ))}
            </ul>
        </div>
      </div>
    </motion.div>
  );
};

export default HoverFilterPanel;
