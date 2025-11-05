import React from 'react';
import { motion, Variants } from 'framer-motion';
import { AnalysisResult } from '../types';

interface GalleryItemProps {
  item: AnalysisResult;
  onClick: () => void;
  colSpan: string;
  rowSpan: string;
}

const overlayVariants: Variants = {
  rest: { opacity: 0 },
  hover: { opacity: 1, transition: { duration: 0.4, ease: 'easeIn' } },
};

const captionVariants: Variants = {
  rest: { y: 15, opacity: 0 },
  hover: { y: 0, opacity: 1, transition: { duration: 0.4, ease: 'easeOut', staggerChildren: 0.1 } },
};

const imageVariants: Variants = {
    rest: { scale: 1 },
    hover: { scale: 1.05, transition: { duration: 0.4, ease: 'easeOut' } },
}

const itemScrollVariants: Variants = {
  hidden: { opacity: 0, y: 50, filter: 'blur(8px)', scale: 0.9 },
  visible: { 
    opacity: 1, 
    y: 0, 
    filter: 'blur(0px)',
    scale: 1,
    transition: { duration: 0.8, ease: 'easeOut' }
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    transition: { duration: 0.4, ease: 'easeIn' }
  }
};


const GalleryItem: React.FC<GalleryItemProps> = ({ item, onClick, colSpan, rowSpan }) => {
  const { thumbnailUrl, title, timestamp } = item;

  return (
    <motion.div
      className={`relative overflow-hidden cursor-pointer w-full h-full ${colSpan} ${rowSpan}`}
      variants={itemScrollVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      layout
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      onClick={onClick}
      layoutId={`card-container-${item.id}`}
    >
      <motion.div
        className="w-full h-full"
        initial="rest"
        whileHover="hover"
      >
        <motion.img
          src={thumbnailUrl}
          alt={title}
          className="absolute inset-0 w-full h-full object-cover"
          variants={imageVariants}
          layoutId={`card-image-${item.id}`}
        />
        <motion.div
          className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 text-center"
          variants={overlayVariants}
        >
          <motion.div
            className="flex flex-col items-center"
            variants={captionVariants}
          >
            <motion.h3
                variants={captionVariants}
                className="text-white text-lg md:text-xl font-medium tracking-wider"
            >
                {title}
            </motion.h3>
            <motion.p 
                variants={captionVariants}
                className="text-white/70 text-xs md:text-sm font-light mt-1"
            >
                {timestamp}
            </motion.p>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default GalleryItem;
