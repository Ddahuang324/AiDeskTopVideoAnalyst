
import React from 'react';
// FIX: Import Variants type from framer-motion to provide explicit typing for variant objects.
import { motion, Variants } from 'framer-motion';
import { CONTACT_CONTENT } from '../constants';

// FIX: Add Variants type annotation to ensure correct type inference for transition properties like 'ease'.
const pageVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 1, ease: 'easeInOut', staggerChildren: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.7, ease: 'easeInOut' } },
};

// FIX: Add Variants type annotation to ensure correct type inference for transition properties like 'ease'.
const textBlockVariants: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.8, ease: 'easeOut' }
  },
};

const AnimatedText: React.FC<{children: React.ReactNode}> = ({ children }) => (
    <motion.div
        variants={textBlockVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.5 }}
    >
        {children}
    </motion.div>
);

const AboutPage: React.FC = () => {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="container mx-auto px-4 sm:px-6 py-32 max-w-3xl"
    >
      <div className="space-y-12">
        <AnimatedText>
            <h2 className="text-3xl sm:text-4xl font-light tracking-wide text-center">
                {CONTACT_CONTENT.title}
            </h2>
        </AnimatedText>

        <div className="space-y-8">
            {CONTACT_CONTENT.paragraphs.map((p, index) => (
                <AnimatedText key={index}>
                    <p className="text-base sm:text-lg leading-relaxed text-gray-700 text-center">
                        {p}
                    </p>
                </AnimatedText>
            ))}
        </div>
      </div>
    </motion.div>
  );
};

export default AboutPage;
