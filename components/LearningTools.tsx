import React, { useState, useRef, useEffect } from 'react';
import {
  ChatBubbleIcon,
  QuestionMarkCircleIcon,
  ListBulletIcon,
  SparklesIcon,
  LightBulbIcon,
  DiagramIcon,
  DocumentTextIcon,
  FlashcardIcon,
  ChevronDownIcon,
} from './icons';
import { EducationalMode } from '../services/geminiService';

type TutorTab = EducationalMode | 'Context' | 'Explain';

interface LearningToolsProps {
  activeMode: TutorTab;
  onModeChange: (mode: TutorTab) => void;
}

const tools: { mode: TutorTab; label: string; icon: React.ReactNode }[] = [
    { mode: 'Context', label: 'Context', icon: <DocumentTextIcon className="h-5 w-5" /> },
    { mode: 'Explain', label: 'Chat', icon: <ChatBubbleIcon className="h-5 w-5" /> },
    { mode: 'Simplify', label: 'Simplify', icon: <SparklesIcon className="h-5 w-5" /> },
    { mode: 'Example', label: 'Example', icon: <LightBulbIcon className="h-5 w-5" /> },
    { mode: 'Summary', label: 'Summarize', icon: <ListBulletIcon className="h-5 w-5" /> },
    { mode: 'Diagram', label: 'Diagram', icon: <DiagramIcon className="h-5 w-5" /> },
    { mode: 'Flashcards', label: 'Flashcards', icon: <FlashcardIcon className="h-5 w-5" /> },
    { mode: 'Quiz', label: 'Quiz', icon: <QuestionMarkCircleIcon className="h-5 w-5" /> },
];

export const LearningTools: React.FC<LearningToolsProps> = ({ activeMode, onModeChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeTool = tools.find(t => t.mode === activeMode) || tools[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const handleSelect = (mode: TutorTab) => {
    onModeChange(mode);
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Dropdown */}
      <div ref={dropdownRef} className="md:hidden relative w-full max-w-xs mx-auto">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between gap-2 px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 bg-slate-800 text-white shadow-sm"
          aria-haspopup="true"
          aria-expanded={isOpen}
        >
          <div className="flex items-center gap-2">
            {activeTool.icon}
            {activeTool.label}
          </div>
          <ChevronDownIcon className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        
        {isOpen && (
          <div className="absolute top-full mt-2 w-full bg-white/80 backdrop-blur-md rounded-xl shadow-lg border border-white/20 z-20 overflow-hidden animate-fade-in">
            <ul className="divide-y divide-white/10">
              {tools.map(({ mode, label, icon }) => (
                <li key={mode}>
                  <button
                    onClick={() => handleSelect(mode)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-semibold transition-colors ${
                      activeMode === mode ? 'bg-white/40 text-slate-900' : 'text-slate-700 hover:bg-white/20'
                    }`}
                  >
                    {icon}
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Desktop Buttons */}
      <div className="hidden md:flex items-center justify-center flex-wrap gap-2">
        {tools.map(({ mode, label, icon }) => (
          <button
            key={mode}
            onClick={() => onModeChange(mode)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full transition-all duration-200 ${
              activeMode === mode
                ? 'bg-slate-800 text-white shadow-sm'
                : 'bg-white/50 text-slate-700 hover:bg-white/80'
            }`}
            aria-pressed={activeMode === mode}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>
    </>
  );
};