
import React from 'react';
// FIX: Import Variants type from framer-motion to provide explicit typing for variant objects.
import { motion, Variants } from 'framer-motion';

interface VRViewerProps {
  url: string;
  onClose: () => void;
}

// FIX: Add Variants type annotation to ensure correct type inference for transition properties.
const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

// FIX: Add Variants type annotation to ensure correct type inference for transition properties like 'ease'.
const modalVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
    y: "-50%",
    x: "-50%",
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: "-50%",
    x: "-50%",
    transition: { duration: 0.4, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    transition: { duration: 0.3, ease: 'easeIn' },
  },
};

const VRViewer: React.FC<VRViewerProps> = ({ url, onClose }) => {
  return (
    <>
      <motion.div
        className="fixed inset-0 bg-black bg-opacity-75 z-[60]"
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
        onClick={onClose}
      />
      <motion.div
        className="fixed top-1/2 left-1/2 w-[90vw] max-w-lg bg-[#F9F9F9] rounded-lg shadow-2xl z-[70] p-8 text-center"
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <h3 className="text-2xl font-light text-[#222222] mb-3">VR体验已就绪</h3>
        <p className="text-gray-600 mb-8">您将被重定向到外部网站以查看交互式VR导览。这将在新标签页中打开。</p>
        
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => setTimeout(onClose, 200)} // Close modal shortly after click
          className="inline-block px-8 py-3 bg-[#222222] text-white font-medium tracking-widest uppercase text-sm transition-all duration-300 ease-in-out transform hover:bg-[#B8860B] hover:scale-105"
        >
          启动VR
        </a>

        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-700 z-10 hover:bg-gray-300 transition-colors"
          aria-label="关闭VR查看器"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </motion.div>
    </>
  );
};

export default VRViewer;
