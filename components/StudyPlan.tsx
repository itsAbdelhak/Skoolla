


import React from 'react';
// Fix: Corrected the import path for types. They are exported from geminiService, not CourseTutor.
import type { CourseOutlineWithProgress, ActivePath, StudyPart } from '../services/geminiService';
import { DocumentTextIcon, ChevronDownIcon, CheckIcon, PlusIcon } from './icons';


const PartItem: React.FC<{
    part: StudyPart;
    isCurrent: boolean;
    onClick: () => void;
}> = ({ part, isCurrent, onClick }) => {
    const isCompleted = part.completed;
    return (
        <li
            onClick={onClick}
            className="relative pl-6 sm:pl-10 cursor-pointer group"
        >
            {/* Timeline connectors - made thicker */}
            <div className="absolute left-[3px] top-0 h-full w-1 bg-white/30" />
            <div className={`absolute left-[3px] top-0 w-1 bg-gradient-to-b from-accent to-green-400 transition-[height] duration-500 ease-in-out ${isCompleted ? 'h-full' : 'h-0'}`} />
            {isCurrent && !isCompleted && <div className="absolute left-[3px] top-0 h-4 w-1 bg-accent" />}
            
            {/* Status Icon with animation */}
            <div className="absolute left-0 top-4 -translate-y-1/2 h-6 w-6">
                {/* Default state dot */}
                <div className={`absolute inset-0 rounded-full bg-white/40 border-2 border-white group-hover:bg-blue-100/50 transition-all duration-200 ${isCurrent || isCompleted ? 'opacity-0 scale-75' : 'opacity-100 scale-100'}`} />
                {/* Current state dot */}
                <div className={`absolute inset-0 rounded-full bg-blue-500 ring-4 ring-blue-500/30 transition-all duration-200 ${isCurrent && !isCompleted ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`} />
                {/* Completed state checkmark */}
                <div className={`absolute inset-0 rounded-full bg-accent flex items-center justify-center text-white transition-all duration-300 ease-out ${isCompleted ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}>
                    <CheckIcon className="w-4 h-4" />
                </div>
            </div>

            <div className={`p-3.5 rounded-2xl border-2 transition-all duration-200 ${
                isCurrent
                ? 'bg-white/40 border-blue-500/50 shadow-md'
                : 'bg-transparent border-transparent group-hover:border-white/30 group-hover:bg-white/10'
            }`}>
                <div>
                    <h4 className={`relative font-bold transition-colors ${
                        isCurrent ? 'text-blue-700' : isCompleted ? 'text-slate-500' : 'text-slate-700'
                    }`}>
                        {part.title}
                        <span className={`w-full absolute top-1/2 left-0 block h-0.5 bg-slate-400 origin-left transition-transform duration-300 ease-in-out ${isCompleted ? 'scale-x-100' : 'scale-x-0'}`}></span>
                    </h4>
                    <p className={`text-sm transition-colors leading-relaxed mt-1 ${
                        isCurrent ? 'text-blue-600/80' : isCompleted ? 'text-slate-400' : 'text-slate-500'
                    }`}>{part.summary}</p>
                </div>
            </div>
        </li>
    );
}

const Accordion: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean; isSub?: boolean; }> = ({ title, children, defaultOpen = true, isSub = false }) => (
    <details className="group" open={defaultOpen}>
        <summary className="list-none cursor-pointer flex items-center justify-between p-2 rounded-lg hover:bg-white/20">
            <h3 className={isSub ? 'font-semibold text-slate-700' : 'font-display text-lg font-bold text-slate-800'}>{title}</h3>
            <ChevronDownIcon className="h-5 w-5 text-slate-400 transition-transform transform group-open:rotate-180" />
        </summary>
        <div className={isSub ? "pl-4 mt-2 space-y-3" : "pl-2 mt-2 space-y-3"}>
            {children}
        </div>
    </details>
);

interface StudyPlanProps {
    outline: CourseOutlineWithProgress | null;
    activePath: ActivePath | null;
    onPathSelect: (path: ActivePath) => void;
    onAddMaterialsClick: () => void;
}

export const StudyPlan: React.FC<StudyPlanProps> = ({ outline, activePath, onPathSelect, onAddMaterialsClick }) => {
    if (!outline) {
        return (
            <div className="p-4 text-center">
                <h2 className="font-display text-xl font-bold text-slate-800">Your Study Plan</h2>
                <p className="text-slate-500 mt-2">Generating your personalized path to success...</p>
            </div>
        );
    }
    
    return (
        <div>
            <div className="mb-6">
                 <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Course</h3>
                        <h2 className="font-display text-2xl font-bold text-slate-800 flex items-start gap-3 mt-1">
                            <DocumentTextIcon className="h-7 w-7 text-blue-500 flex-shrink-0 mt-0.5" />
                            <span>{outline.course_title}</span>
                        </h2>
                    </div>
                     <button
                        onClick={onAddMaterialsClick}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-blue-600 bg-blue-500/10 rounded-full hover:bg-blue-500/20 transition-colors"
                        title="Add more documents to this session"
                    >
                        <PlusIcon className="h-4 w-4" />
                        Add
                    </button>
                </div>
            </div>
            
            <div className="space-y-4">
                {outline.topics.map((topic, topicIdx) => (
                     <Accordion key={topicIdx} title={topic.title}>
                         {topic.subtopics.map((subtopic, subtopicIdx) => (
                            <Accordion key={subtopicIdx} title={subtopic.title} isSub>
                                <ul className="mt-2 space-y-2.5 relative border-l-[3px] border-white/30">
                                    {subtopic.parts.map((part, partIdx) => {
                                        const currentPath = { topic: topicIdx, subtopic: subtopicIdx, part: partIdx };
                                        const isCurrent = JSON.stringify(currentPath) === JSON.stringify(activePath);
                                        return (
                                            <PartItem 
                                                key={partIdx} 
                                                part={part}
                                                isCurrent={isCurrent}
                                                onClick={() => onPathSelect(currentPath)}
                                            />
                                        );
                                    })}
                                </ul>
                            </Accordion>
                         ))}
                    </Accordion>
                ))}
            </div>
        </div>
    );
};