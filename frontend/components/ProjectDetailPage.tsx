import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, Variants } from 'framer-motion';
import { AnalysisResult } from '../types';

interface ProjectDetailPageProps {
  analysis: AnalysisResult;
  onClose: () => void;
}

const pageVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.6, ease: 'easeInOut' } },
  exit: { opacity: 0, transition: { duration: 0.6, ease: 'easeInOut' } },
};

const contentContainerVariants: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.4,
    },
  },
};

const contentItemVariants: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
};

const ProjectDetailPage: React.FC<ProjectDetailPageProps> = ({ analysis, onClose }) => {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="fixed inset-0 bg-[#F9F9F9] z-50 overflow-y-auto"
    >
      <div className="container mx-auto px-4 sm:px-6 py-24 sm:py-32">
        <motion.button
            onClick={onClose}
            className="absolute top-6 left-6 z-50 text-sm font-medium tracking-wider uppercase flex items-center"
            whileHover={{ color: '#B8860B' }}
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            返回历史
        </motion.button>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            <motion.div 
                className="relative h-[45vh] md:col-span-2 md:h-[80vh] overflow-hidden group" 
                layoutId={`card-container-${analysis.id}`}
            >
                 <motion.div 
                    className="w-full h-full" 
                    layoutId={`card-image-${analysis.id}`}
                 >
                    <video 
                        src={analysis.videoUrl}
                        className="w-full h-full object-cover"
                        controls
                        autoPlay
                        loop
                        muted
                    />
                </motion.div>
            </motion.div>

            <motion.div 
              className="md:col-span-1 flex flex-col pt-8 md:pt-0"
              variants={contentContainerVariants}
              initial="initial"
              animate="animate"
            >
                <motion.div variants={contentItemVariants}>
                    <p className="text-sm text-gray-500 mb-2">{analysis.timestamp}</p>
                    <h1 className="text-3xl sm:text-4xl font-light tracking-wide mb-4">
                        {analysis.title}
                    </h1>
                </motion.div>
                <motion.div variants={contentItemVariants} className="text-base leading-relaxed text-gray-700 mb-8">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code({inline, className, children, ...props}) {
                          const lang = /language-([\w-]+)/.exec(className || '');
                          if (inline) {
                            return <code className="px-1 py-0.5 rounded bg-gray-100 text-gray-800" {...props}>{children}</code>;
                          }
                          return (
                            <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-auto text-sm">
                              <code className={className || (lang ? `language-${lang[1]}` : undefined)} {...props}>
                                {children}
                              </code>
                            </pre>
                          );
                        },
                        a({children, ...props}) {
                          return <a className="text-[#B8860B] underline underline-offset-2" target="_blank" rel="noreferrer" {...props}>{children}</a>;
                        },
                        h1({children}) { return <h1 className="text-2xl font-semibold mb-3">{children}</h1>; },
                        h2({children}) { return <h2 className="text-xl font-semibold mb-2">{children}</h2>; },
                        h3({children}) { return <h3 className="text-lg font-semibold mb-2">{children}</h3>; },
                        p({children}) { return <p className="mb-3 leading-7">{children}</p>; },
                        ul({children}) { return <ul className="list-disc pl-5 space-y-1 mb-3">{children}</ul>; },
                        ol({children}) { return <ol className="list-decimal pl-5 space-y-1 mb-3">{children}</ol>; },
                        blockquote({children}) { return <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-600 mb-3">{children}</blockquote>; },
                        table({children}) { return <div className="overflow-x-auto mb-3"><table className="min-w-full border border-gray-200">{children}</table></div>; },
                        th({children}) { return <th className="border border-gray-200 px-2 py-1 bg-gray-50 text-left">{children}</th>; },
                        td({children}) { return <td className="border border-gray-200 px-2 py-1">{children}</td>; },
                      }}
                    >
                      {analysis.summary}
                    </ReactMarkdown>
                </motion.div>
                
                <motion.div variants={contentItemVariants} className="mt-auto pt-8 border-t border-gray-200">
                    <h3 className="text-sm font-semibold tracking-widest uppercase text-gray-500 mb-4">标签</h3>
                    <div className="flex flex-wrap gap-2">
                        {analysis.tags.map(tag => (
                            <span key={tag} className="px-3 py-1 bg-gray-200/80 text-gray-700 text-xs font-medium rounded-full">
                                {tag}
                            </span>
                        ))}
                    </div>
                </motion.div>
            </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProjectDetailPage;
