



import React, { useState } from 'react';
import { SparklesIcon, XIcon, CheckIcon } from './icons';
import type { PersonalizationSettings } from '../services/geminiService';

interface PersonalizationModalProps {
    onComplete: (settings: PersonalizationSettings) => void;
    initialSettings?: PersonalizationSettings | null;
    onClose?: () => void;
    isUpdateMode?: boolean;
}

const OptionButton: React.FC<{
    label: string;
    isSelected: boolean;
    onClick: () => void;
}> = ({ label, isSelected, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className={`relative w-full text-left px-3.5 py-2.5 rounded-xl border-2 transition-all duration-200 text-sm sm:text-base font-semibold ${
            isSelected 
            ? 'bg-primary border-primary text-white shadow-sm' 
            : 'bg-white/50 border-white/20 text-slate-700 hover:bg-white/80'
        }`}
    >
        {label}
        {isSelected && <CheckIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white" />}
    </button>
);

export const PersonalizationModal: React.FC<PersonalizationModalProps> = ({
    onComplete,
    initialSettings,
    onClose,
    isUpdateMode = false,
}) => {
    const [settings, setSettings] = useState<PersonalizationSettings>(initialSettings || {
        language: 'English',
        level: 'Intermediate',
        tone: 'Friendly',
        goal: 'Deep Understanding',
    });

    const handleSelect = (key: keyof PersonalizationSettings, value: string) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onComplete(settings);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="relative bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-md p-6 sm:p-8">
                {onClose && (
                    <button 
                        onClick={onClose} 
                        className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors p-1"
                        aria-label="Close"
                    >
                        <XIcon className="h-6 w-6" />
                    </button>
                )}
                <div className="text-center mb-6">
                    <div className="mx-auto h-14 w-14 flex items-center justify-center rounded-2xl bg-gradient-to-br from-blue-200 to-indigo-200 mb-4">
                        <SparklesIcon className="h-8 w-8 text-primary-dark" />
                    </div>
                    <h1 className="font-display text-2xl font-bold text-slate-800 tracking-tight">{isUpdateMode ? 'Update Preferences' : 'Personalize Your Session'}</h1>
                    <p className="text-slate-500 mt-1">{isUpdateMode ? 'Fine-tune your settings for this session.' : 'Tell us about your learning style.'}</p>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-md font-bold text-slate-700 mb-2">Teaching Language</label>
                        <select
                            value={settings.language}
                            onChange={(e) => handleSelect('language', e.target.value)}
                            className="w-full px-3 py-3 bg-white/50 border-2 border-white/30 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-slate-900"
                        >
                            <option>English</option>
                            <option>Spanish</option>
                            <option>French</option>
                            <option>German</option>
                            <option>Japanese</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-md font-bold text-slate-700 mb-2">Your Current Level</label>
                        <div className="grid grid-cols-3 gap-2">
                           {(['Beginner', 'Intermediate', 'Advanced'] as const).map(level => (
                                <OptionButton key={level} label={level} isSelected={settings.level === level} onClick={() => handleSelect('level', level)} />
                           ))}
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-md font-bold text-slate-700 mb-2">Preferred Teaching Style</label>
                        <div className="grid grid-cols-2 gap-2">
                             {(['Strict', 'Friendly', 'Fast & Focused', 'Encouraging'] as const).map(tone => (
                                <OptionButton key={tone} label={tone} isSelected={settings.tone === tone} onClick={() => handleSelect('tone', tone)} />
                           ))}
                        </div>
                    </div>

                     <div>
                        <label className="block text-md font-bold text-slate-700 mb-2">Main Goal for this Session</label>
                        <div className="grid grid-cols-2 gap-2">
                             {(['Exam Prep', 'Deep Understanding', 'Study Notes', 'Quick Revision'] as const).map(goal => (
                                <OptionButton key={goal} label={goal} isSelected={settings.goal === goal} onClick={() => handleSelect('goal', goal)} />
                           ))}
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="appearance-none w-full mt-4 flex justify-center rounded-xl border-2 border-primary-dark bg-primary py-3 px-4 font-semibold text-white shadow-sm transition-colors hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark"
                    >
                        {isUpdateMode ? 'Save Changes' : 'Build My Study Plan'}
                    </button>
                </form>
            </div>
        </div>
    );
};