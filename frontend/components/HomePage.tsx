import React, { useState } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { CustomPrompt } from '../types';

interface HomePageProps {
  onStart: () => void;
  onStop: () => void;
  recordingState: 'idle' | 'recording' | 'processing';
  prompts: CustomPrompt[];
  selectedPromptId: number | null;
  onSelectPrompt: (id: number) => void;
}

const pageVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.8, ease: 'easeInOut' } },
  exit: { opacity: 0, transition: { duration: 0.8, ease: 'easeInOut' } },
};

const contentVariants: Variants = {
  initial: { y: 20, opacity: 0 },
  animate: { 
    y: 0, 
    opacity: 1, 
    transition: { 
      duration: 0.8, 
      ease: 'easeOut',
      staggerChildren: 0.2,
      delayChildren: 0.5 
    } 
  },
};

const RecordingButton: React.FC<{
  onStart: () => void;
  onStop: () => void;
  state: 'idle' | 'recording' | 'processing';
}> = ({ onStart, onStop, state }) => {
  const isIdle = state === 'idle';
  const isRecording = state === 'recording';
  const isProcessing = state === 'processing';

  const handleClick = () => {
    if (isProcessing) {
      return;
    }
    if (isRecording) {
      onStop();
      return;
    }
    onStart();
  };

  return (
    <motion.button
      onClick={handleClick}
      disabled={isProcessing}
      className="px-8 py-3 border border-white text-white font-medium tracking-widest uppercase text-sm transition-colors duration-300 flex items-center justify-center min-w-[200px]"
      whileHover={
        !isProcessing
          ? {
              backgroundColor: 'rgba(184, 134, 11, 0.8)',
              borderColor: '#B8860B',
              y: -2,
              transition: { duration: 0.3, ease: 'easeOut' },
            }
          : {}
      }
      whileTap={!isProcessing ? { scale: 0.95 } : {}}
      animate={{
        backgroundColor: isRecording ? 'rgba(220, 38, 38, 0.7)' : 'rgba(0,0,0,0)',
      }}
    >
      {isRecording && !isProcessing && (
        <motion.div
          className="w-3 h-3 bg-white rounded-full mr-3"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      )}
      {isProcessing && (
        <svg
          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      )}
      {isProcessing ? 'AI分析中...' : isRecording ? '停止录制' : '开始录制'}
    </motion.button>
  );
};

const PromptSelector: React.FC<{
  prompts: CustomPrompt[];
  selectedPromptId: number | null;
  onSelectPrompt: (id: number) => void;
}> = ({ prompts, selectedPromptId, onSelectPrompt }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedPrompt = prompts.find(p => p.id === selectedPromptId);

  return (
    <div className="relative inline-block text-center">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="text-white/80 hover:text-white transition-colors duration-300 text-sm tracking-wider flex items-center"
      >
        <span>提示: {selectedPrompt?.title || '选择一个提示'}</span>
        <motion.svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-4 w-4 ml-2" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
          animate={{ rotate: isOpen ? 180 : 0 }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </motion.svg>
      </motion.button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 rounded-md shadow-lg bg-black/50 backdrop-blur-md ring-1 ring-white/10"
          >
            <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
              {prompts.map(prompt => (
                <button
                  key={prompt.id}
                  onClick={() => {
                    onSelectPrompt(prompt.id);
                    setIsOpen(false);
                  }}
                  className={`block w-full text-left px-4 py-2 text-sm transition-colors duration-200 ${
                    selectedPromptId === prompt.id
                      ? 'text-white bg-white/10'
                      : 'text-gray-300 hover:bg-white/5 hover:text-white'
                  }`}
                  role="menuitem"
                >
                  {prompt.title}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


const HomePage: React.FC<HomePageProps> = ({ onStart, onStop, recordingState, prompts, selectedPromptId, onSelectPrompt }) => {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="relative w-full h-screen flex items-center justify-center overflow-hidden"
    >
      <motion.div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1531297484001-80022131f5a1?q=80&w=2020&auto=format&fit=crop)' }}
        initial={{ scale: 1.1, filter: 'brightness(0.7)' }}
        animate={{ scale: 1, filter: 'brightness(0.5)', transition: { duration: 8, ease: 'easeInOut' } }}
      >
        <div className="absolute inset-0 bg-black opacity-30"></div>
      </motion.div>

      <motion.div 
        className="relative z-10 text-center text-white"
        variants={contentVariants}
      >
        <motion.h1 variants={contentVariants} className="text-4xl md:text-6xl font-light tracking-widest uppercase">
          捕捉瞬间，洞见未来
        </motion.h1>
        <motion.p variants={contentVariants} className="mt-4 text-md md:text-lg font-extralight tracking-wider">
          AI驱动的桌面洞察分析
        </motion.p>
        <motion.div variants={contentVariants} className="mt-8 mb-10">
          <PromptSelector 
            prompts={prompts}
            selectedPromptId={selectedPromptId}
            onSelectPrompt={onSelectPrompt}
          />
        </motion.div>
        <motion.div variants={contentVariants} className="flex justify-center">
          <RecordingButton onStart={onStart} onStop={onStop} state={recordingState} />
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default HomePage;