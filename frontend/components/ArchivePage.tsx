
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { GALLERY_IMAGES } from '../constants';
import { GalleryImage } from '../types';

interface ArchivePageProps {
  onImageClick: (id: number) => void;
}

const pageVariants: Variants = {
  initial: { opacity: 0, y: 50 },
  animate: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      duration: 1, 
      ease: [0.6, 0.01, 0.05, 0.9],
      staggerChildren: 0.1,
    } 
  },
  exit: { opacity: 0, y: -50, transition: { duration: 0.7, ease: 'easeInOut' } },
};

const itemVariants: Variants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
    exit: { opacity: 0, x: -50, transition: { duration: 0.4, ease: 'easeIn' } },
};

const allProjects = GALLERY_IMAGES.filter(item => item.type === 'image') as GalleryImage[];
const categories = ['全部', ...Array.from(new Set(allProjects.map(p => p.category)))];

const ArchivePage: React.FC<ArchivePageProps> = ({ onImageClick }) => {
    const [activeFilter, setActiveFilter] = useState('全部');

    const filteredProjects = useMemo(() => {
        if (activeFilter === '全部') {
            return allProjects;
        }
        return allProjects.filter(p => p.category === activeFilter);
    }, [activeFilter]);

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="container mx-auto px-4 sm:px-6 py-24 sm:py-32 max-w-4xl"
    >
      <motion.h2 variants={itemVariants} className="text-3xl sm:text-4xl font-light tracking-wide text-center mb-12">
        设计总览
      </motion.h2>

      <motion.div variants={itemVariants} className="flex justify-center flex-wrap gap-2 sm:gap-4 mb-12">
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setActiveFilter(category)}
            className={`px-4 py-2 text-sm font-medium rounded-full transition-colors duration-300 ease-in-out relative ${
              activeFilter === category 
                ? 'bg-[#222222] text-white' 
                : 'bg-white/60 text-gray-600 hover:bg-white hover:text-[#222222]'
            }`}
          >
            {category}
            {activeFilter === category && (
                <motion.div 
                    className="absolute -bottom-1 left-0 right-0 h-[2px] bg-[#B8860B]"
                    layoutId="filter-underline"
                />
            )}
          </button>
        ))}
      </motion.div>

      <motion.div layout className="space-y-2">
        <AnimatePresence mode="popLayout">
            {filteredProjects.map(project => (
                <motion.div
                    key={project.id}
                    layout
                    variants={itemVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    onClick={() => onImageClick(project.id)}
                    className="flex justify-between items-center p-4 cursor-pointer border-b border-gray-200/80 hover:bg-white/80"
                >
                    <div className="flex-grow">
                        <h3 className="font-medium text-lg text-[#222222]">{project.caption}</h3>
                        <p className="text-sm text-gray-500">{project.category}</p>
                    </div>
                    <div className="flex-shrink-0 ml-4">
                        {project.vrUrl && (
                            <div className="flex items-center gap-2 text-sm text-teal-600 font-semibold" title="VR Experience Available">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.254 9.682a9.023 9.023 0 0117.492 0 9.024 9.024 0 01-17.492 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 1v2.428m0 17.144V23m8.682-14.254l-1.717 1.717M5.035 5.035L6.752 6.752m12.213 12.213l-1.717-1.717M5.035 18.965l1.717-1.717M1 12h2.428m17.144 0H23" />
                                </svg>
                                <span>360°</span>
                            </div>
                        )}
                    </div>
                </motion.div>
            ))}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default ArchivePage;
