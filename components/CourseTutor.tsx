


import React, { useState, useCallback, useRef, useEffect } from 'react';
import { OnboardingFlow } from './OnboardingFlow';
import { ChatMessage } from './ChatMessage';
import { LearningTools } from './LearningTools';
import { ExplainPopup } from './ExplainPopup';
import { StudyPlan } from './StudyPlan';
// Fix: Import `analyzeDocumentStructure` which is used when adding new documents to an existing session.
import { generateStudyAid, PersonalizationSettings, DiagramData, DiagramNode, EducationalMode, QuizData, CourseOutlineWithProgress, ActivePath, FlashcardData, CourseOutline, StudyTopic, generateDailyBriefing, analyzeDocumentStructure } from '../services/geminiService';
import { PersonalizationModal } from './PersonalizationModal';
import { ConfidenceRater } from './ConfidenceRater';
import { SendIcon, AcademicCapIcon, DocumentTextIcon, MenuIcon, CogIcon, CheckIcon, SpinnerIcon, LogoIcon, CheckCircleIcon, ChatBubbleIcon, LightBulbIcon } from './icons';
import { useAuth } from '../lib/AuthContext';
import * as SupabaseService from '../lib/supabaseService';
import { supabase } from '../lib/supabaseClient';
import { StudyPlanDisplay } from './StudyPlanDisplay';
import { MermaidRenderer } from './MermaidRenderer';
import { QuizDisplay } from './QuizDisplay';
import { FlashcardDisplay } from './FlashcardDisplay';
import { AddDocumentsModal } from './AddDocumentsModal';
import { FocusModeTimer } from './FocusModeTimer';
import { DailyBriefingModal } from './DailyBriefingModal';
import { SessionSettingsModal } from './SessionSettingsModal';

type TutorTab = EducationalMode | 'Context' | 'Explain';
interface Message { role: 'user' | 'model'; content: string | DiagramData | QuizData; mode?: EducationalMode; }
interface TabContent { simplify?: string; example?: string; summary?: string; diagram?: DiagramData; quiz?: QuizData; flashcards?: FlashcardData; }
interface SelectedTerm { text: string; context: string; position: { top: number; left: number }; }
type TutorState = 'onboarding' | 'generating_plan' | 'studying' | 'completed' | 'loading_session';
interface FileInfo { dataUrl: string; name: string; type: string; }

interface CourseTutorProps {
  sessionId: string | null;
  onSessionCreated: (sessionId: string) => void;
  onNewSessionRequest: () => void;
  onMenuClick: () => void;
  onSessionUpdated: () => void;
}

const CourseTutor: React.FC<CourseTutorProps> = ({ sessionId: activeSessionId, onSessionCreated, onNewSessionRequest, onMenuClick, onSessionUpdated }) => {
    const { user } = useAuth();
    const [tutorState, setTutorState] = useState<TutorState>(activeSessionId ? 'loading_session' : 'onboarding');
    const [personalization, setPersonalization] = useState<PersonalizationSettings | null>(null);
    const [courseOutline, setCourseOutline] = useState<CourseOutlineWithProgress | null>(null);
    const [activePath, setActivePath] = useState<ActivePath | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeMode, setActiveMode] = useState<TutorTab>('Context');
    const [selectedTerm, setSelectedTerm] = useState<SelectedTerm | null>(null);
    const [showConfidenceModal, setShowConfidenceModal] = useState(false);
    const [isEditingPrefs, setIsEditingPrefs] = useState(false);
    const [tabContent, setTabContent] = useState<Record<string, TabContent>>({});
    const [isAddingDocs, setIsAddingDocs] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [mobileView, setMobileView] = useState<'plan' | 'learn'>('plan');
    const [showBriefingModal, setShowBriefingModal] = useState(false);
    const [briefingContent, setBriefingContent] = useState({ message: '', weakTopic: null });
    const [adjustmentSuggestion, setAdjustmentSuggestion] = useState<EducationalMode | null>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const contentAreaRef = useRef<HTMLDivElement>(null);
    const lowConfidenceTracker = useRef<Record<string, number>>({});
    
    // Session Loading and Daily Briefing Effect
    useEffect(() => {
        const loadSession = async (id: string) => {
            if (!user) return;
            try {
                const { session, outline, outputs } = await SupabaseService.getFullSessionData(id);
                setPersonalization(session.personalization);
                setCourseOutline(outline);
                
                const restoredTabs: Record<string, TabContent> = {};
                outputs.forEach(output => {
                    const pathKey = JSON.stringify({ topic: output.topic_idx, subtopic: output.subtopic_idx, part: output.part_idx });
                    if (!restoredTabs[pathKey]) restoredTabs[pathKey] = {};
                    restoredTabs[pathKey][output.mode.toLowerCase() as keyof TabContent] = output.content;
                });
                setTabContent(restoredTabs);

                setActivePath({ topic: 0, subtopic: 0, part: 0 });
                setTutorState('studying');

                // --- Daily Briefing Logic ---
                const weakTopics = await SupabaseService.getWeakTopicsForSession(id);
                if (weakTopics.length > 0) {
                    const briefingMsg = await generateDailyBriefing(user.user_metadata?.full_name?.split(' ')[0] || 'friend', weakTopics);
                    setBriefingContent({ message: briefingMsg, weakTopic: weakTopics[0] as any });
                    setShowBriefingModal(true);
                }

            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load session.");
                setTutorState('onboarding'); 
            }
        };

        if (activeSessionId) {
            setTutorState('loading_session');
            loadSession(activeSessionId);
        } else {
            setTutorState('onboarding');
            setCourseOutline(null);
            setMessages([]);
            setActivePath(null);
            setTabContent({});
        }
    }, [activeSessionId, user]);


    useEffect(() => {
        if (activeMode === 'Explain' && contentAreaRef.current) {
            contentAreaRef.current.scrollTop = contentAreaRef.current.scrollHeight;
        } else if (contentAreaRef.current) {
            contentAreaRef.current.scrollTop = 0;
        }
    }, [messages, activeMode, tabContent, activePath]);

    useEffect(() => {
        const handleClickOutside = () => setSelectedTerm(null);
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getCurrentPartText = useCallback(() => {
        if (!activePath || !courseOutline) return "";
        const part = courseOutline.topics[activePath.topic]?.subtopics[activePath.subtopic]?.parts[activePath.part];
        return part ? `Title: ${part.title}\nSummary: ${part.summary}` : "";
    }, [activePath, courseOutline]);

    const handleOnboardingComplete = (sessionId: string) => {
        onSessionCreated(sessionId);
    };

    const handlePersonalizationUpdate = async (settings: PersonalizationSettings) => {
        setPersonalization(settings);
        setIsEditingPrefs(false);
        if(activeSessionId) {
            await supabase.from('study_sessions').update({ personalization: settings }).eq('id', activeSessionId);
        }
    };

    const sendMessage = useCallback(async () => {
        if (!userInput.trim() || !personalization || !courseOutline || !activeSessionId) return;
        
        const newMessages: Message[] = [...messages, { role: 'user', content: userInput }];
        setMessages(newMessages);
        setUserInput('');
        setIsLoading(true);
        setError(null);

        try {
            const result = await generateStudyAid('Explain', userInput, getCurrentPartText(), personalization, courseOutline.course_title);
            setMessages([...newMessages, { role: 'model', content: result, mode: 'Explain' }]);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(errorMessage);
            setMessages(prev => [...prev.slice(0, -1), { role: 'model', content: `Sorry, I ran into an error: ${errorMessage}` }]);
        } finally {
            setIsLoading(false);
        }
    }, [userInput, messages, personalization, courseOutline, getCurrentPartText, activeSessionId]);
    
    const handleCompleteStep = useCallback(() => setShowConfidenceModal(true), []);

    const findNextPart = useCallback((currentPath: ActivePath, outline: CourseOutlineWithProgress): ActivePath | null => {
        const { topic, subtopic, part } = currentPath;
        if (part + 1 < (outline.topics[topic]?.subtopics[subtopic]?.parts.length || 0)) return { topic, subtopic, part: part + 1 };
        if (subtopic + 1 < (outline.topics[topic]?.subtopics.length || 0)) return { topic, subtopic: subtopic + 1, part: 0 };
        if (topic + 1 < outline.topics.length) return { topic: topic + 1, subtopic: 0, part: 0 };
        return null; 
    }, []);

    const handleConfidenceSubmit = async (rating: number) => {
        setShowConfidenceModal(false);
        if (!activePath || !courseOutline || !activeSessionId || !user) return;
        
        // --- Dynamic Adjustment Logic ---
        const pathKey = `${activePath.topic}-${activePath.subtopic}-${activePath.part}`;
        if (rating < 3) {
            const currentCount = lowConfidenceTracker.current[pathKey] || 0;
            lowConfidenceTracker.current[pathKey] = currentCount + 1;
            if (lowConfidenceTracker.current[pathKey] >= 2) {
                const suggestions: EducationalMode[] = ['Simplify', 'Example', 'Diagram'];
                const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
                setAdjustmentSuggestion(randomSuggestion);
            }
        } else {
             lowConfidenceTracker.current[pathKey] = 0; // Reset on good rating
        }

        await SupabaseService.updatePartStatus(activeSessionId, activePath, rating);
        
        const newOutline = JSON.parse(JSON.stringify(courseOutline));
        newOutline.topics[activePath.topic].subtopics[activePath.subtopic].parts[activePath.part] = {
            ...newOutline.topics[activePath.topic].subtopics[activePath.subtopic].parts[activePath.part],
            completed: true,
            confidence: rating,
        };
        setCourseOutline(newOutline);
        
        const nextPath = findNextPart(activePath, newOutline);
        
        if (nextPath) {
            setActivePath(nextPath);
            setActiveMode('Context');
        } else {
            setTutorState('completed');
            // --- Gamification Logic ---
            await SupabaseService.awardBadge(user.id, 'first_session_complete');
            // In a real app, you'd fetch the profile, increment, then update.
            // For simplicity here, we'll just ask the server to increment.
        }
    };

    const handleTextSelect = (text: string, context: string, position: { top: number; left: number }) => setSelectedTerm({ text, context, position });

    const handleExplainTerm = async () => {
        if (!selectedTerm || !personalization || !courseOutline) return;
        setActiveMode('Explain');
        setMobileView('learn');
        setMessages(prev => [...prev, { role: 'user', content: `Explain: "${selectedTerm.text}"` }]);
        setIsLoading(true);
        const { text, context } = selectedTerm;
        setSelectedTerm(null);
        try {
            const result = await generateStudyAid('Explain', text, context, personalization, courseOutline.course_title);
            setMessages(prev => [...prev, { role: 'model', content: result, mode: 'Explain' }]);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleNodeExplanation = useCallback((node: DiagramNode) => {
        if (!node?.summary) return;
        setActiveMode('Explain');
        setMobileView('learn');
        const explanationText = `> **From Diagram ("${node.label}"):**\n> ${node.summary}`;
        setMessages(prev => [...prev, { role: 'model', content: explanationText, mode: 'Explain' }]);
    }, []);

    const handlePathSelect = (path: ActivePath) => {
        if (JSON.stringify(path) !== JSON.stringify(activePath)) {
             setActivePath(path);
             setActiveMode('Context');
             setMobileView('learn');
             setError(null);
             setAdjustmentSuggestion(null);
        }
    };
    
    const handleModeChange = useCallback(async (mode: TutorTab) => {
        setActiveMode(mode);
        setError(null);
        if (mode === 'Explain' || mode === 'Context') return;
        
        if (!activePath || !personalization || !courseOutline || !activeSessionId) return;
        
        const pathKey = JSON.stringify(activePath);
        const modeKey = mode.toLowerCase() as keyof TabContent;
        if (tabContent[pathKey]?.[modeKey]) return; 

        setIsLoading(true); 
        try {
            const part = courseOutline.topics[activePath.topic].subtopics[activePath.subtopic].parts[activePath.part];
            const contextText = `Title: ${part.title}\nSummary: ${part.summary}`;
            const result = await generateStudyAid(mode, contextText, contextText, personalization, courseOutline.course_title);
            
            await SupabaseService.upsertStudyAid(activeSessionId, activePath, mode, result);

            setTabContent(prev => ({ ...prev, [pathKey]: { ...(prev[pathKey] || {}), [modeKey]: result } }));
        } catch (err) {
            setError(err instanceof Error ? err.message : `Hmm, that didn’t load right. Let’s try again!`);
        } finally {
            setIsLoading(false);
        }
    }, [activePath, personalization, courseOutline, tabContent, activeSessionId]);

    const handleNewDocumentsUpload = async (files: FileInfo[]) => {
        if (!activeSessionId || !courseOutline) {
            setError("Cannot add documents: no active session or outline.");
            setIsAddingDocs(false);
            return;
        }

        setError(null);

        try {
            const newOutlineData = await analyzeDocumentStructure(files);
            if (!newOutlineData.topics?.length) {
                setIsAddingDocs(false);
                return;
            }

            const newTopicsWithProgress: StudyTopic[] = newOutlineData.topics.map(t => ({
                ...t,
                subtopics: (t.subtopics || []).map(st => ({
                    ...st,
                    parts: (st.parts || []).map(p => ({ ...p, completed: false, confidence: null }))
                }))
            }));
            
            const topicIndexOffset = courseOutline.topics.length;
            
            const mergedOutlineForState: CourseOutlineWithProgress = {
                ...courseOutline,
                topics: [...courseOutline.topics, ...newTopicsWithProgress],
            };
            
            const cleanMergedOutline: CourseOutline = {
                course_title: courseOutline.course_title,
                topics: mergedOutlineForState.topics.map(topic => ({
                    title: topic.title,
                    summary: topic.summary,
                    subtopics: topic.subtopics.map(subtopic => ({
                        title: subtopic.title,
                        summary: subtopic.summary,
                        parts: subtopic.parts.map(part => ({ title: part.title, summary: part.summary }))
                    }))
                }))
            };
            
            await Promise.all([
                supabase.from('study_sessions').update({ full_outline_json: cleanMergedOutline }).eq('id', activeSessionId),
                SupabaseService.appendCourseOutlineParts(activeSessionId, newTopicsWithProgress, topicIndexOffset)
            ]);

            setCourseOutline(mergedOutlineForState);
            
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred while adding documents.');
        } finally {
            setIsAddingDocs(false);
        }
    };
    
    const handleTitleUpdate = async (newTitle: string) => {
        if (!activeSessionId || !courseOutline || !newTitle.trim() || newTitle.trim() === courseOutline.course_title) return;
        
        const oldTitle = courseOutline.course_title;
        setCourseOutline(prev => (prev ? { ...prev, course_title: newTitle } : null));

        try {
            await SupabaseService.updateSessionTitle(activeSessionId, newTitle);
            onSessionUpdated();
        } catch (error) {
            console.error("Failed to update title:", error);
            setCourseOutline(prev => (prev ? { ...prev, course_title: oldTitle } : null));
            setError("Could not update session title.");
        }
    };

    const handleSubjectUpdate = async (newSubject: string) => {
        if (!activeSessionId || !courseOutline) return;
        const oldSubject = courseOutline.subject;
        setCourseOutline(prev => prev ? { ...prev, subject: newSubject } : null);
        try {
            await SupabaseService.updateSessionSubject(activeSessionId, newSubject);
            onSessionUpdated();
        } catch (error) {
            console.error("Failed to update subject:", error);
            setCourseOutline(prev => prev ? { ...prev, subject: oldSubject } : null);
            setError("Could not update session subject.");
        }
    };

    const handleArchiveSession = async () => {
        if (!activeSessionId) return;
        setIsSettingsOpen(false);
        try {
            await SupabaseService.archiveSession(activeSessionId, true);
            onSessionUpdated();
            onNewSessionRequest(); // Navigate away
        } catch (error) {
            setError("Failed to archive session.");
        }
    };

    const handleDeleteSession = async () => {
        if (!activeSessionId) return;
        setIsSettingsOpen(false);
        try {
            await SupabaseService.deleteSession(activeSessionId);
            onSessionUpdated();
            onNewSessionRequest(); // Navigate away
        } catch (error) {
            setError("Failed to delete session.");
        }
    };

    const renderContent = () => {
        const pathKey = activePath ? JSON.stringify(activePath) : '';
        const currentPart = activePath && courseOutline ? courseOutline.topics[activePath.topic]?.subtopics[activePath.subtopic]?.parts[activePath.part] : null;
        const currentTabContentForPath = tabContent[pathKey] || {};

        if (isLoading && activeMode !== 'Explain') {
            return (
                <div className="flex items-center justify-center h-full text-center text-slate-500">
                    <div className="flex flex-col items-center gap-4">
                        <SpinnerIcon className="h-10 w-10 text-blue-500 animate-spin" />
                        <p className="font-semibold">Just a moment, preparing your study aid...</p>
                    </div>
                </div>
            );
        }

        if (error && activeMode !== 'Explain') {
            return (
                <div className="flex items-center justify-center h-full text-center text-red-600 p-4 bg-red-50 rounded-2xl">
                    <p>{error}</p>
                </div>
            );
        }
        
        // --- Render Dynamic Adjustment Suggestion ---
        if (adjustmentSuggestion) {
            return (
                <div className="p-6 bg-white/40 backdrop-blur-md rounded-2xl border-2 border-amber-200 text-center shadow-lg animate-fade-in">
                    <LightBulbIcon className="h-10 w-10 text-amber-500 mx-auto mb-3" />
                    <h3 className="font-display text-xl font-bold text-slate-800">Feeling Stuck?</h3>
                    <p className="text-slate-700 my-2">It looks like this topic might be a bit tricky. How about we try looking at it a different way?</p>
                    <div className="mt-4 flex items-center justify-center gap-3">
                         <button onClick={() => { handleModeChange(adjustmentSuggestion); setAdjustmentSuggestion(null); }} className="px-5 py-2 bg-slate-800 text-white font-semibold rounded-xl hover:bg-slate-900 transition-colors shadow-sm">
                            Try a {adjustmentSuggestion}
                        </button>
                        <button onClick={() => setAdjustmentSuggestion(null)} className="px-5 py-2 bg-transparent text-slate-700 font-semibold rounded-xl hover:bg-white/30 transition-colors">
                            No, thanks
                        </button>
                    </div>
                </div>
            )
        }
        
        switch (activeMode) {
            case 'Context':
                if (!currentPart) return <p className="text-center text-slate-500">Select a part from the study plan to begin.</p>;
                return (
                    <div className="prose prose-slate max-w-none p-4 sm:p-6 bg-sky-100/40 backdrop-blur-md rounded-2xl border border-transparent">
                        <h3 className="font-display text-2xl font-bold !mt-0 !mb-3 text-slate-900">{currentPart.title}</h3>
                        <p className="text-slate-700 leading-relaxed">{currentPart.summary}</p>
                    </div>
                );
            case 'Explain':
                return (
                    <div className="space-y-6">
                        {messages.length === 0 && (
                            <div className="text-center p-8 bg-sky-100/40 backdrop-blur-md rounded-2xl border border-transparent">
                               <h3 className="font-display text-xl font-bold">AI Chat Tutor</h3>
                               <p className="text-slate-500 mt-1">Ask anything about the current topic to deepen your understanding.</p>
                            </div>
                        )}
                        {messages.map((msg, index) => (
                            <ChatMessage key={index} message={msg} onTextSelect={handleTextSelect} onNodeClick={handleNodeExplanation} />
                        ))}
                        {isLoading && (
                            <div className="flex items-start gap-3.5 mr-10">
                                <div className="flex-shrink-0 h-9 w-9 bg-slate-200 rounded-full flex items-center justify-center border-2 border-white shadow-sm mt-1">
                                    <LogoIcon className="h-6 w-6" />
                                </div>
                                <div className="bg-sky-100/40 backdrop-blur-md text-slate-800 rounded-2xl rounded-bl-lg max-w-2xl p-4 border border-transparent">
                                    <SpinnerIcon className="h-6 w-6 text-blue-500 animate-spin" />
                                </div>
                            </div>
                        )}
                        {error && <p className="text-red-600 text-center">{error}</p>}
                    </div>
                );
            case 'Simplify':
            case 'Example':
            case 'Summary':
                const textContent = currentTabContentForPath[activeMode.toLowerCase() as keyof TabContent] as string;
                if (!textContent) return null;
                return <div className="p-4 sm:p-6 bg-sky-100/40 backdrop-blur-md rounded-2xl border border-transparent"><StudyPlanDisplay markdownContent={textContent} /></div>;
            case 'Diagram':
                const diagramData = currentTabContentForPath.diagram;
                if (!diagramData) return null;
                return <MermaidRenderer diagramData={diagramData} onNodeClick={handleNodeExplanation} />;
            case 'Flashcards':
                const flashcardData = currentTabContentForPath.flashcards;
                if (!flashcardData) return null;
                return <FlashcardDisplay flashcardData={flashcardData} />;
            case 'Quiz':
                const quizData = currentTabContentForPath.quiz;
                if (!quizData) return null;
                return <div className="p-4 sm:p-6 bg-sky-100/40 backdrop-blur-md rounded-2xl border border-transparent"><QuizDisplay quizData={quizData} /></div>;
            default:
                return <p className="text-center text-slate-500">Select a learning tool to get started.</p>;
        }
    };

    if (tutorState === 'onboarding') {
        return <OnboardingFlow onComplete={handleOnboardingComplete} onMenuClick={onMenuClick} />;
    }

    if (tutorState === 'loading_session' || !courseOutline) {
         return (
            <div className="h-screen flex flex-col items-center justify-center text-center p-6">
                <div className="relative h-16 w-16">
                    <SpinnerIcon className="h-16 w-16 text-slate-600 animate-spin" />
                    <AcademicCapIcon className="absolute h-8 w-8 text-slate-600/80 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"/>
                </div>
                <h2 className="font-display text-2xl font-bold text-slate-800 mt-6 tracking-tight">
                    Loading Your Session...
                </h2>
                <p className="text-slate-600 mt-2 max-w-sm">Just a moment while we get everything ready for you.</p>
            </div>
        );
    }
    
    const totalParts = courseOutline.topics.reduce((acc, t) => acc + t.subtopics.reduce((sAcc, st) => sAcc + st.parts.length, 0), 0);
    const completedParts = courseOutline.topics.reduce((acc, t) => acc + t.subtopics.reduce((sAcc, st) => sAcc + st.parts.filter(p => p.completed).length, 0), 0);
    const progress = totalParts > 0 ? (completedParts / totalParts) * 100 : 0;

    return (
        <div className="h-screen flex flex-col bg-transparent">
            {showBriefingModal && <DailyBriefingModal content={briefingContent} onClose={() => setShowBriefingModal(false)} onAction={() => { handleModeChange('Quiz'); setShowBriefingModal(false); }} />}
            {isAddingDocs && <AddDocumentsModal onClose={() => setIsAddingDocs(false)} onUpload={handleNewDocumentsUpload} />}
            {isEditingPrefs && <PersonalizationModal onComplete={handlePersonalizationUpdate} initialSettings={personalization} onClose={() => setIsEditingPrefs(false)} isUpdateMode={true} />}
            {isSettingsOpen && (
                <SessionSettingsModal 
                    sessionTitle={courseOutline.course_title}
                    sessionSubject={courseOutline.subject}
                    onClose={() => setIsSettingsOpen(false)}
                    onTitleChange={handleTitleUpdate}
                    onSubjectChange={handleSubjectUpdate}
                    onEditPreferences={() => { setIsSettingsOpen(false); setIsEditingPrefs(true); }}
                    onAddDocuments={() => { setIsSettingsOpen(false); setIsAddingDocs(true); }}
                    onArchiveSession={handleArchiveSession}
                    onDeleteSession={handleDeleteSession}
                />
            )}
            {selectedTerm && <ExplainPopup position={selectedTerm.position} onExplain={handleExplainTerm} />}
            <header className="flex items-center justify-between px-3 py-2 sm:p-3.5 border-b border-white/20 bg-white/30 backdrop-blur-xl flex-shrink-0 sticky top-0 z-10">
                 <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                    <button onClick={onMenuClick} className="lg:hidden text-slate-500"><MenuIcon className="h-6 w-6"/></button>
                    <div className="min-w-0">
                        <h2 
                            className="font-display text-base sm:text-lg font-bold text-slate-800 truncate"
                        >
                            {courseOutline.course_title}
                        </h2>
                        <div className="hidden sm:flex items-center gap-2 mt-1.5">
                            <div className="w-48 bg-black/10 rounded-full h-2 overflow-hidden"><div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${progress}%` }}></div></div>
                            <span className="text-xs font-bold text-slate-600">{Math.round(progress)}% done!</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <FocusModeTimer />
                    <button onClick={() => setIsSettingsOpen(true)} className="p-2 text-slate-500 hover:bg-white/30 rounded-full" aria-label="Edit Preferences"><CogIcon className="h-5 w-5" /></button>
                </div>
            </header>

            {/* Mobile View Switcher */}
            <div className="lg:hidden flex border-b border-white/20 bg-white/30 backdrop-blur-xl shadow-sm">
                <button
                    onClick={() => setMobileView('plan')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors border-b-2 ${
                        mobileView === 'plan'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-slate-500 hover:bg-white/20'
                    }`}
                >
                    <DocumentTextIcon className="h-5 w-5" />
                    Study Plan
                </button>
                <button
                    onClick={() => setMobileView('learn')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors border-b-2 ${
                        mobileView === 'learn'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-slate-500 hover:bg-white/20'
                    }`}
                >
                    <ChatBubbleIcon className="h-5 w-5" />
                    Learn
                </button>
            </div>
            
            <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
                <aside className={`
                    ${mobileView === 'plan' ? 'flex flex-col' : 'hidden'} lg:flex
                     w-full lg:w-96 xl:w-[420px] bg-white/30 backdrop-blur-xl border-b lg:border-b-0 lg:border-r border-white/20 p-4 overflow-y-auto`}>
                    <StudyPlan 
                        outline={courseOutline} 
                        activePath={activePath} 
                        onPathSelect={handlePathSelect} 
                        onAddMaterialsClick={() => setIsAddingDocs(true)}
                    />
                </aside>

                <main className={`
                    ${mobileView === 'learn' ? 'flex' : 'hidden'} lg:flex
                     flex-1 flex-col bg-transparent overflow-hidden`}>
                    {showConfidenceModal && <ConfidenceRater onSubmit={handleConfidenceSubmit} />}
                    <div className="p-3 border-b border-white/20 bg-white/30 backdrop-blur-xl flex-shrink-0">
                        <LearningTools activeMode={activeMode} onModeChange={handleModeChange} />
                    </div>
                    <div ref={contentAreaRef} className="flex-1 p-4 sm:p-6 overflow-y-auto">
                       {tutorState === 'studying' && renderContent()}
                       {tutorState === 'completed' && (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                                <CheckCircleIcon className="h-20 w-20 text-accent" />
                                <h2 className="font-display text-3xl font-bold text-slate-800 mt-6 tracking-tight">Congratulations!</h2>
                                <p className="text-slate-600 mt-2 max-w-md">You've completed this study session. Ready for the next chapter?</p>
                                <button onClick={onNewSessionRequest} className="mt-8 inline-flex items-center justify-center gap-2 px-6 py-3 font-semibold text-white bg-slate-800 rounded-xl shadow-lg hover:bg-slate-900 transition-colors">
                                    Start a New Session
                                </button>
                            </div>
                        )}
                    </div>
                    
                    <div className="p-3 border-t border-white/20 bg-white/30 backdrop-blur-xl flex-shrink-0">
                        {tutorState === 'studying' && activePath !== null && (
                            <div className="flex items-center gap-3">
                                {activeMode === 'Explain' ? (
                                    <div className="relative flex-1">
                                        <input type="text" value={userInput} onChange={(e) => setUserInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && !isLoading && sendMessage()} placeholder="Ask a follow-up question..." className="w-full pl-4 pr-12 py-2.5 sm:py-3 bg-white/50 border border-white/20 backdrop-blur-sm rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors text-slate-900 placeholder-slate-500" disabled={isLoading} />
                                        <button onClick={sendMessage} disabled={isLoading || !userInput.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 bg-slate-800 text-white rounded-lg flex items-center justify-center transition-opacity disabled:opacity-50 hover:bg-slate-900" aria-label="Send message"><SendIcon className="h-5 w-5" /></button>
                                    </div>
                                ) : ( <div className="flex-1 h-[46px] sm:h-[50px]" /> )}
                                <button onClick={handleCompleteStep} className="px-4 sm:px-5 py-2.5 sm:py-3 bg-slate-800 text-white font-semibold rounded-xl flex items-center gap-2 hover:bg-slate-900 transition-colors shadow-sm">
                                    <span className="hidden sm:inline">Mark as Complete</span>
                                    <CheckIcon className="h-5 w-5" />
                                </button>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default CourseTutor;