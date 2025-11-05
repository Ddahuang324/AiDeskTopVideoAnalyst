import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { GALLERY_LAYOUTS } from '../../constants';
import { LayoutConfig, AnalysisResult } from '../../types';
import GalleryItem from './GalleryItem';

interface GalleryPageProps {
  analyses: AnalysisResult[];
  onAnalysisClick: (analysis: AnalysisResult) => void;
}

const pageVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 1, ease: [0.6, 0.01, 0.05, 0.9] } },
  exit: { opacity: 0, transition: { duration: 0.7, ease: 'easeInOut' } },
};

// Use one of the layouts statically for consistency
const staticLayout = GALLERY_LAYOUTS[0];

const GalleryPage: React.FC<GalleryPageProps> = ({ analyses, onAnalysisClick }) => {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="relative container mx-auto px-4 sm:px-6 py-24 sm:py-32"
    >
      <motion.div layout className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-[300px] md:auto-rows-[250px]">
        <AnimatePresence>
            {analyses.map((item, index) => {
                const itemLayout = staticLayout[index % staticLayout.length];
                
                return (
                    <GalleryItem 
                        key={item.id} 
                        item={item}
                        onClick={() => onAnalysisClick(item)}
                        colSpan={itemLayout.colSpan}
                        rowSpan={itemLayout.rowSpan}
                    />
                );
            })}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default GalleryPage;
