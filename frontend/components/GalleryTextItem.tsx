import React from 'react';
import { motion, Variants } from 'framer-motion';
import { GalleryTextBlock } from '../types';

interface GalleryTextItemProps {
  item: GalleryTextBlock;
  colSpan: string;
  rowSpan: string;
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

const GalleryTextItem: React.FC<GalleryTextItemProps> = ({ item, colSpan, rowSpan }) => {
  const { title, paragraph } = item;

  return (
    <motion.div
      className={`relative w-full h-full flex flex-col justify-center items-start p-6 sm:p-8 bg-white/50 ${colSpan} ${rowSpan}`}
      variants={itemScrollVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      layout
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
    >
      <h3 className="text-xl sm:text-2xl font-medium text-[#222222] mb-3">
        {title}
      </h3>
      <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
        {paragraph}
      </p>
    </motion.div>
  );
};

export default GalleryTextItem;