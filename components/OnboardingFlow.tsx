

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../lib/AuthContext';
import * as SupabaseService from '../lib/supabaseService';
import { analyzeDocumentStructure, PersonalizationSettings, CourseOutlineWithProgress, CourseOutline } from '../services/geminiService';
import { MenuIcon, LogoIcon, CheckCircleIcon, ArrowRightIcon, CheckIcon } from './icons';
import { InteractiveUpload } from './InteractiveUpload';

interface FileInfo { dataUrl: string; name: string; type: string; }

type OnboardingStep = 'welcome' | 'analyzing' | 'details' | 'style' | 'schedule' | 'generating' | 'ready';

interface OnboardingFlowProps {
    onComplete: (sessionId: string) => void;
    onMenuClick: () => void;
}

const progressSteps = ['Upload', 'Details', 'Style', 'Schedule'];

const getStepIndex = (step: OnboardingStep): number => {
    switch (step) {
        case 'welcome':
        case 'analyzing':
            return 0;
        case 'details':
            return 1;
        case 'style':
            return 2;
        case 'schedule':
            return 3;
        case 'generating':
        case 'ready':
            return 4; // Completed state
        default:
            return 0;
    }
};

const ProgressBar: React.FC<{ currentStep: OnboardingStep }> = ({ currentStep }) => {
    const activeIndex = getStepIndex(currentStep);
    return (
        <div className="w-full max-w-2xl mx-auto mb-8">
            <div className="flex items-center justify-between">
                {progressSteps.map((label, index) => {
                    const isCompleted = activeIndex > index;
                    const isActive = activeIndex === index;
                    return (
                        <React.Fragment key={label}>
                            <div className="flex flex-col items-center text-center">
                                <div className={`h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                                    isCompleted ? 'bg-accent border-accent text-white' :
                                    isActive ? 'bg-white border-blue-500 text-blue-500' :
                                    'bg-white border-slate-300 text-slate-400'
                                }`}>
                                    {isCompleted ? <CheckCircleIcon className="h-6 w-6" /> : <span className="font-bold">{index + 1}</span>}
                                </div>
                                <p className={`mt-2 text-xs sm:text-sm font-semibold transition-colors ${
                                    isActive || isCompleted ? 'text-slate-700' : 'text-slate-400'
                                }`}>{label}</p>
                            </div>
                            {index < progressSteps.length - 1 && (
                                <div className={`flex-1 h-1 mx-2 rounded-full transition-colors ${
                                    isCompleted ? 'bg-accent' : 'bg-slate-200'
                                }`} />
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
};

const PersonalizationOption: React.FC<{
    label: string;
    onClick: () => void;
    isSelected: boolean;
}> = ({ label, onClick, isSelected }) => (
    <button
        type="button"
        onClick={onClick}
        className={`relative p-4 w-full text-left rounded-2xl border-2 transition-all duration-200 font-semibold ${
            isSelected 
            ? 'bg-primary border-primary text-white shadow-md' 
            : 'bg-white/50 border-white/20 text-slate-700 hover:border-white/50 hover:bg-white/70'
        }`}
    >
        {label}
        {isSelected && <CheckIcon className="absolute right-4 top-1/2 -translate-y-1/2 h-6 w-6 text-white" />}
    </button>
);

const predefinedSubjects = ["Science", "Math", "History", "Psychology", "Business", "Economics", "Art", "Other"];

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete, onMenuClick }) => {
    const { user } = useAuth();
    const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>('welcome');
    const [session, setSession] = useState<any | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [filesInfo, setFilesInfo] = useState<FileInfo[]>([]);
    
    const [title, setTitle] = useState('');
    const [subject, setSubject] = useState('');
    const [customSubject, setCustomSubject] = useState('');

    const [personalization, setPersonalization] = useState<PersonalizationSettings>({
        language: 'English', level: 'Intermediate', tone: 'Friendly', goal: 'Deep Understanding'
    });
    const [duration, setDuration] = useState<'Just Today' | 'A few days' | '1 Week' | 'Flexible'>('Flexible');

    useEffect(() => {
        const initSession = async () => {
            if (!user) return;
            try {
                const onboardingSession = await SupabaseService.findOrCreateOnboardingSession(user.id);
                setSession(onboardingSession);
            } catch (err) {
                setError('Could not initialize your session. Please try refreshing the page.');
            }
        };
        initSession();
    }, [user]);
    
    const handleFileUpload = useCallback(async (uploadedFiles: FileInfo[]) => {
        if (!session) {
            setError('Session not ready. Please wait a moment and try again.');
            return;
        }
        setOnboardingStep('analyzing');
        setError(null);
        setFilesInfo(uploadedFiles);

        try {
            const plan = await analyzeDocumentStructure(uploadedFiles);
            if (plan.error) {
                setError(plan.error);
                setOnboardingStep('welcome');
                return;
            }
            const courseOutlineWithProgress: CourseOutlineWithProgress = {
                ...plan,
                topics: (plan.topics || []).map(topic => ({
                    ...topic,
                    subtopics: (topic.subtopics || []).map(subtopic => ({
                        ...subtopic,
                        parts: (subtopic.parts || []).map(part => ({
                            ...part,
                            completed: false,
                            confidence: null
                        }))
                    }))
                }))
            };
            const updatedSession = await SupabaseService.updateOnboardingSession(session.id, { 
                title: plan.course_title,
                full_outline_json: plan // Store the clean version
            });
            setSession(updatedSession);
            setTitle(plan.course_title);
            setOnboardingStep('details');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred during analysis.');
            setOnboardingStep('welcome');
        }
    }, [session]);
    
    const handleNextStep = async () => {
        if (!session) return;
        
        try {
            switch (onboardingStep) {
                case 'details':
                    const finalSubject = subject === 'Other' ? customSubject : subject;
                    await SupabaseService.updateOnboardingSession(session.id, { title, subject: finalSubject });
                    setOnboardingStep('style');
                    break;
                case 'style':
                    await SupabaseService.updateOnboardingSession(session.id, { personalization });
                    setOnboardingStep('schedule');
                    break;
                case 'schedule':
                    setOnboardingStep('generating');
                    const finalSettings = { ...personalization, duration };
                    const finalSession = await SupabaseService.updateOnboardingSession(session.id, { personalization: finalSettings });
                    const outlineData = finalSession.full_outline_json as CourseOutline;
                     const outlineWithProgress: CourseOutlineWithProgress = {
                        ...outlineData,
                        course_title: finalSession.title,
                        topics: (outlineData.topics || []).map(t => ({
                            ...t, subtopics: (t.subtopics || []).map(st => ({
                                ...st, parts: (st.parts || []).map(p => ({...p, completed: false, confidence: null}))
                            }))
                        }))
                    };
                    await SupabaseService.saveCourseOutlineParts(session.id, outlineWithProgress);
                    setOnboardingStep('ready');
                    break;
                default:
                    break;
            }
        } catch(err) {
            setError(err instanceof Error ? err.message : 'Failed to save settings.');
        }
    };
    
    const isDetailsStepValid = title.trim() !== '' && (subject !== 'Other' || (subject === 'Other' && customSubject.trim() !== ''));

    const renderContent = () => {
        switch(onboardingStep) {
            case 'welcome':
            case 'analyzing':
                return (
                    <div className="text-center">
                        <h1 className="font-display text-3xl sm:text-4xl font-bold text-slate-800 tracking-tight">Let's Start a New Session</h1>
                        <p className="mt-3 text-slate-600 max-w-xl mx-auto">Upload your course materials (PDF, TXT, MD, images) and let our AI create a personalized study plan just for you.</p>
                        <div className="mt-8">
                            <InteractiveUpload onFilesUpload={handleFileUpload} processingState={onboardingStep === 'analyzing' ? 'analyzing' : null} />
                        </div>
                         {error && <p className="mt-4 text-red-600 bg-red-100 p-3 rounded-lg">{error}</p>}
                    </div>
                );
            case 'details':
                 return (
                    <div className="animate-fade-in">
                        <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-800 text-center mb-2">Confirm Your Topic Details</h2>
                        <p className="text-center text-slate-500 mb-8">Make sure everything looks right before we continue.</p>
                        <div className="space-y-6 max-w-lg mx-auto">
                             <div>
                                <label htmlFor="title" className="block text-sm font-bold text-slate-700 mb-2">Topic Title</label>
                                <input id="title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-4 py-3 bg-white/50 border-2 border-white/30 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-slate-900"/>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Subject</label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {predefinedSubjects.map(s => (
                                        <PersonalizationOption key={s} label={s} isSelected={subject === s} onClick={() => setSubject(s)} />
                                    ))}
                                </div>
                                {subject === 'Other' && (
                                    <input
                                        type="text"
                                        placeholder="Enter your subject"
                                        value={customSubject}
                                        onChange={e => setCustomSubject(e.target.value)}
                                        className="mt-3 w-full px-4 py-3 bg-white/50 border-2 border-white/30 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-slate-900 animate-fade-in"
                                    />
                                )}
                            </div>
                            <button onClick={handleNextStep} disabled={!isDetailsStepValid} className="w-full flex items-center justify-center gap-2 mt-4 px-6 py-4 bg-primary text-white font-semibold rounded-xl shadow-lg hover:bg-primary-dark transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed">
                                Next: Set Style <ArrowRightIcon className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                );
            case 'style':
                 return (
                    <div className="animate-fade-in">
                        <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-800 text-center mb-2">How do you want to learn?</h2>
                        <p className="text-center text-slate-500 mb-8">Choose a style that works best for you.</p>
                        <div className="space-y-6 max-w-lg mx-auto">
                             <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Your Current Level</label>
                                <div className="grid grid-cols-3 gap-2">
                                {(['Beginner', 'Intermediate', 'Advanced'] as const).map(level => (
                                    <PersonalizationOption key={level} label={level} isSelected={personalization.level === level} onClick={() => setPersonalization(p => ({...p, level}))} />
                                ))}
                                </div>
                            </div>
                             <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Preferred Teaching Style</label>
                                <div className="grid grid-cols-2 gap-2">
                                {(['Strict', 'Friendly', 'Fast & Focused', 'Encouraging'] as const).map(tone => (
                                    <PersonalizationOption key={tone} label={tone} isSelected={personalization.tone === tone} onClick={() => setPersonalization(p => ({...p, tone}))} />
                                ))}
                                </div>
                            </div>
                            <button onClick={handleNextStep} className="w-full flex items-center justify-center gap-2 mt-4 px-6 py-4 bg-primary text-white font-semibold rounded-xl shadow-lg hover:bg-primary-dark transition-colors">
                                Next: Set Goal <ArrowRightIcon className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                );
            case 'schedule':
                 return (
                     <div className="animate-fade-in">
                        <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-800 text-center mb-2">What's your goal?</h2>
                        <p className="text-center text-slate-500 mb-8">This helps us create the right kind of study materials for you.</p>
                        <div className="space-y-3 max-w-lg mx-auto">
                            {(['Exam Prep', 'Deep Understanding', 'Study Notes', 'Quick Revision'] as const).map(goal => (
                               <PersonalizationOption key={goal} label={goal} isSelected={personalization.goal === goal} onClick={() => setPersonalization(p => ({...p, goal}))} />
                            ))}
                            <button onClick={handleNextStep} className="w-full flex items-center justify-center gap-2 mt-4 px-6 py-4 bg-primary text-white font-semibold rounded-xl shadow-lg hover:bg-primary-dark transition-colors">
                                Create My Study Plan! <ArrowRightIcon className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                );
            case 'generating':
            case 'ready':
                return (
                    <div className="text-center">
                        <InteractiveUpload processingState={onboardingStep} />
                        <div className="mt-8">
                         {onboardingStep === 'ready' && (
                           <button onClick={() => onComplete(session.id)} className="px-8 py-4 bg-accent text-white font-bold rounded-xl shadow-lg hover:bg-green-600 transition-transform hover:scale-105 animate-fade-in">
                                Let's Start Studying!
                           </button>
                         )}
                        </div>
                    </div>
                );
            default:
                return null;
        }
    }

    return (
        <div className="h-screen w-full flex flex-col items-center p-4 sm:p-6 lg:p-8">
            <header className="w-full max-w-6xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <LogoIcon className="h-8 w-8" />
                    <span className="text-2xl font-display font-bold text-slate-800">StudyGen</span>
                </div>
                <button onClick={onMenuClick} className="lg:hidden text-slate-500"><MenuIcon className="h-6 w-6"/></button>
            </header>
            <main className="flex-1 w-full flex flex-col items-center justify-center">
                 {onboardingStep !== 'welcome' && onboardingStep !== 'analyzing' && <ProgressBar currentStep={onboardingStep} />}
                 <div className="w-full max-w-4xl p-4">
                    {renderContent()}
                 </div>
            </main>
        </div>
    );
};