

import React from 'react';
import { LogoIcon, XIcon, QuestionMarkCircleIcon } from './icons';

interface DailyBriefingModalProps {
    content: {
        message: string;
        weakTopic: { title: string } | null;
    };
    onClose: () => void;
    onAction: () => void; // For starting the quiz
}

export const DailyBriefingModal: React.FC<DailyBriefingModalProps> = ({ content, onClose, onAction }) => {
    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="relative bg-white/50 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl w-full max-w-md p-8 text-center">
                 <button 
                    onClick={onClose} 
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors p-1"
                    aria-label="Close"
                >
                    <XIcon className="h-6 w-6" />
                </button>

                <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-2xl bg-gradient-to-br from-blue-200 to-indigo-200 mb-5">
                    <LogoIcon className="h-10 w-10 text-primary-dark" />
                </div>

                <h1 className="font-display text-2xl font-bold text-slate-800 tracking-tight">Daily Briefing</h1>
                <p className="text-slate-600 mt-3 leading-relaxed">
                    {content.message}
                </p>

                <div className="mt-8 flex flex-col sm:flex-row gap-3">
                    <button
                        onClick={onClose}
                        className="w-full px-5 py-3 bg-white/40 text-slate-700 font-semibold rounded-xl hover:bg-white/60 transition-colors"
                    >
                        Dismiss
                    </button>
                    {content.weakTopic && (
                         <button
                            onClick={onAction}
                            className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors shadow-lg"
                        >
                            <QuestionMarkCircleIcon className="h-5 w-5" />
                            Start Warm-up
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};