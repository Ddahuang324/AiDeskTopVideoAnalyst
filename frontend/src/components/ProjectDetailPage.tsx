import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, Variants } from 'framer-motion';
import { AnalysisResult } from '../../types';

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
                
                {/* 生产力评分 */}
                {analysis.productivityScore !== undefined && (
                    <motion.div variants={contentItemVariants} className="mb-6">
                        <h3 className="text-sm font-semibold tracking-widest uppercase text-gray-500 mb-2">生产力评分</h3>
                        <div className="flex items-center">
                            <div className="w-full bg-gray-200 rounded-full h-2 mr-3">
                                <div 
                                    className="bg-[#B8860B] h-2 rounded-full" 
                                    style={{ width: `${analysis.productivityScore}%` }}
                                ></div>
                            </div>
                            <span className="text-sm font-medium text-gray-700">{analysis.productivityScore}/100</span>
                        </div>
                    </motion.div>
                )}

                {/* 关键发现 */}
                {analysis.keyFindings && analysis.keyFindings.length > 0 && (
                    <motion.div variants={contentItemVariants} className="mb-6">
                        <h3 className="text-sm font-semibold tracking-widest uppercase text-gray-500 mb-4">关键发现</h3>
                        <div className="space-y-4">
                            {analysis.keyFindings.map((finding, index) => (
                                <div key={index} className="border-l-2 border-[#B8860B] pl-4">
                                    <p className="text-sm font-medium text-gray-800 mb-2">{finding.point}</p>
                                    {finding.evidence && finding.evidence.length > 0 && (
                                        <ul className="text-xs text-gray-600 space-y-1">
                                            {finding.evidence.map((evidence, idx) => (
                                                <li key={idx} className="flex items-start">
                                                    <span className="text-[#B8860B] mr-2">•</span>
                                                    {evidence}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* 主题分解 */}
                {analysis.thematicBreakdown && analysis.thematicBreakdown.length > 0 && (
                    <motion.div variants={contentItemVariants} className="mb-6">
                        <h3 className="text-sm font-semibold tracking-widest uppercase text-gray-500 mb-4">工作主题分析</h3>
                        <div className="space-y-4">
                            {analysis.thematicBreakdown.map((theme, index) => (
                                <div key={index} className="bg-gray-50 p-4 rounded-lg">
                                    <div className="flex justify-between items-center mb-2">
                                        <h4 className="text-sm font-medium text-gray-800">{theme.theme}</h4>
                                        <span className="text-xs text-gray-500">{theme.durationPercentage}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-1 mb-3">
                                        <div 
                                            className="bg-[#B8860B] h-1 rounded-full" 
                                            style={{ width: `${theme.durationPercentage}%` }}
                                        ></div>
                                    </div>
                                    {theme.keyActions && theme.keyActions.length > 0 && (
                                        <ul className="text-xs text-gray-600 space-y-1">
                                            {theme.keyActions.map((action, idx) => (
                                                <li key={idx} className="flex items-start">
                                                    <span className="text-[#B8860B] mr-2">•</span>
                                                    {action}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* 后续行动 */}
                {analysis.nextActions && analysis.nextActions.length > 0 && (
                    <motion.div variants={contentItemVariants} className="mb-6">
                        <h3 className="text-sm font-semibold tracking-widest uppercase text-gray-500 mb-4">后续行动</h3>
                        <ul className="space-y-2">
                            {analysis.nextActions.map((action, index) => (
                                <li key={index} className="flex items-start text-sm text-gray-700">
                                    <span className="text-[#B8860B] mr-2 mt-1">•</span>
                                    {action}
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                )}
                
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
