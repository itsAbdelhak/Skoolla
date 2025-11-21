

import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/AuthContext';
import * as SupabaseService from '../lib/supabaseService';
import { SpinnerIcon, RefreshIcon, CheckIcon, XIcon, AcademicCapIcon, ArrowRightIcon } from './icons';

type ReviewState = 'loading' | 'reviewing' | 'completed';

export const ReviewHub: React.FC<{ onMenuClick: () => void; }> = ({ onMenuClick }) => {
    const { user } = useAuth();
    const [reviewState, setReviewState] = useState<ReviewState>('loading');
    const [reviewParts, setReviewParts] = useState<SupabaseService.ReviewPart[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

    useEffect(() => {
        const fetchReviews = async () => {
            if (!user) return;
            setReviewState('loading');
            const parts = await SupabaseService.getPartsForReview(user.id);
            setReviewParts(parts);
            setReviewState(parts.length > 0 ? 'reviewing' : 'completed');
        };
        fetchReviews();
    }, [user]);

    const handleReview = async (success: boolean) => {
        if (currentIndex >= reviewParts.length) return;

        const currentPart = reviewParts[currentIndex];
        await SupabaseService.updatePartAfterReview(currentPart.id, currentPart.srs_stage, success);
        
        setIsFlipped(false);
        
        setTimeout(() => {
            if (currentIndex + 1 >= reviewParts.length) {
                setReviewState('completed');
            } else {
                setCurrentIndex(prev => prev + 1);
            }
        }, 300); // Wait for card to flip back
    };
    
    if (reviewState === 'loading') {
        return (
            <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <SpinnerIcon className="h-12 w-12 text-slate-600 animate-spin" />
                <h2 className="font-display text-2xl font-bold text-slate-800 mt-6">Loading Review Items...</h2>
            </div>
        );
    }

    if (reviewState === 'completed') {
        return (
             <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <AcademicCapIcon className="h-16 w-16 text-accent" />
                <h2 className="font-display text-3xl font-bold text-slate-800 mt-6">All Caught Up!</h2>
                <p className="text-slate-600 mt-2 max-w-md">You've reviewed all your due items for now. Great job reinforcing your knowledge!</p>
            </div>
        );
    }
    
    const currentPart = reviewParts[currentIndex];

    return (
        <div className="h-full w-full p-4 sm:p-6 lg:p-8 flex flex-col items-center">
            <header className="w-full max-w-3xl mb-8">
                 <div className="flex items-center gap-3 mb-2">
                    <RefreshIcon className="h-8 w-8 text-blue-500" />
                    <h1 className="font-display text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
                        Smart Review Hub
                    </h1>
                </div>
                <p className="text-lg text-slate-600 ml-11">Strengthen your memory with spaced repetition.</p>
            </header>
            
            <main className="flex-1 flex flex-col items-center justify-center w-full max-w-3xl">
                 <style>{`
                    .perspective-1000 { perspective: 1000px; }
                    .transform-style-preserve-3d { transform-style: preserve-3d; }
                    .rotate-y-180 { transform: rotateY(180deg); }
                    .backface-hidden { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
                `}</style>
                
                 {/* Card */}
                <div 
                    className="w-full h-80 perspective-1000 cursor-pointer mb-6"
                    onClick={() => setIsFlipped(!isFlipped)}
                    title="Click to reveal answer"
                >
                    <div 
                        className={`relative w-full h-full transform-style-preserve-3d transition-transform duration-500 ${isFlipped ? 'rotate-y-180' : ''}`}
                    >
                        {/* Front (Question) */}
                        <div className="absolute w-full h-full backface-hidden bg-white/50 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 flex flex-col items-center justify-center p-6 text-center">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{currentPart.session_title}</span>
                            <h2 className="font-display text-3xl font-bold text-slate-800 mt-2">{currentPart.title}</h2>
                        </div>
                        {/* Back (Answer) */}
                        <div className="absolute w-full h-full backface-hidden bg-slate-800 text-white rounded-2xl shadow-lg flex items-center justify-center p-6 text-center rotate-y-180">
                            <p className="text-lg font-semibold">{currentPart.summary}</p>
                        </div>
                    </div>
                </div>
                
                {/* Confidence Buttons */}
                <div className={`transition-opacity duration-300 w-full ${isFlipped ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                     <p className="text-center font-semibold text-slate-600 mb-4">Did you recall this correctly?</p>
                     <div className="flex items-center justify-center gap-4">
                        <button 
                            onClick={() => handleReview(false)}
                            className="flex items-center gap-2 px-8 py-4 font-bold text-white bg-rose-500 rounded-xl shadow-lg hover:bg-rose-600 transition-transform hover:scale-105"
                        >
                            <XIcon className="h-6 w-6" /> Needs Review
                        </button>
                         <button 
                            onClick={() => handleReview(true)}
                            className="flex items-center gap-2 px-8 py-4 font-bold text-white bg-accent rounded-xl shadow-lg hover:bg-green-600 transition-transform hover:scale-105"
                        >
                           <CheckIcon className="h-6 w-6" /> Got it!
                        </button>
                    </div>
                </div>

            </main>
            <footer className="w-full max-w-3xl mt-auto pt-6 text-center">
                <p className="text-sm font-bold text-slate-500">{currentIndex + 1} of {reviewParts.length} items to review</p>
                 <div className="w-full bg-black/10 rounded-full h-2 mt-2">
                    <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${((currentIndex + 1) / reviewParts.length) * 100}%` }}></div>
                </div>
            </footer>
        </div>
    );
};