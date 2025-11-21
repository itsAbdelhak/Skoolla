import React, { useState, useEffect } from 'react';
import { FlashcardData } from '../services/geminiService';
import { ArrowRightIcon } from './icons';

export const FlashcardDisplay: React.FC<{ flashcardData: FlashcardData }> = ({ flashcardData }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const { flashcards } = flashcardData;

    // Reset flip state when card changes
    useEffect(() => {
        setIsFlipped(false);
    }, [currentIndex]);
    
    if (!flashcards || flashcards.length === 0) {
        return <p className="text-center text-slate-500">No flashcards were generated for this section.</p>;
    }
    
    const currentCard = flashcards[currentIndex];

    const handleNext = () => {
        setIsFlipped(false);
        // Add a small delay for the flip-out animation before changing the card content
        setTimeout(() => {
            setCurrentIndex((prev) => (prev + 1) % flashcards.length);
        }, 150);
    };
    
    const handlePrev = () => {
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
        }, 150);
    };

    return (
        <div className="flex flex-col items-center justify-center p-4 h-full">
             <style>{`
                .perspective-1000 { perspective: 1000px; }
                .transform-style-preserve-3d { transform-style: preserve-3d; }
                .rotate-y-180 { transform: rotateY(180deg); }
                .backface-hidden { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
            `}</style>
            
            {/* Card */}
            <div 
                className="w-full max-w-xl h-80 perspective-1000 cursor-pointer"
                onClick={() => setIsFlipped(!isFlipped)}
                title="Click to flip"
            >
                <div 
                    className={`relative w-full h-full transform-style-preserve-3d transition-transform duration-500 ${isFlipped ? 'rotate-y-180' : ''}`}
                >
                    {/* Front */}
                    <div className="absolute w-full h-full backface-hidden bg-sky-100/40 backdrop-blur-md rounded-2xl border border-transparent flex items-center justify-center p-6 text-center">
                        <h2 className="font-display text-3xl font-bold text-slate-800">{currentCard.term}</h2>
                    </div>
                    {/* Back */}
                    <div className="absolute w-full h-full backface-hidden bg-slate-800 text-white rounded-2xl shadow-lg flex items-center justify-center p-6 text-center rotate-y-180">
                        <p className="text-lg font-semibold">{currentCard.definition}</p>
                    </div>
                </div>
            </div>
            
            {/* Controls */}
            <div className="flex items-center justify-between w-full max-w-xl mt-6">
                <button 
                    onClick={handlePrev} 
                    className="flex items-center gap-2 px-4 py-2 font-semibold text-slate-600 bg-white/50 backdrop-blur-sm rounded-full shadow-sm hover:bg-white/80 transition-colors border border-white/20"
                    aria-label="Previous card"
                >
                    <ArrowRightIcon className="h-5 w-5 transform rotate-180" />
                    Prev
                </button>
                <span className="font-bold text-slate-500" aria-live="polite">
                    {currentIndex + 1} / {flashcards.length}
                </span>
                <button 
                    onClick={handleNext} 
                    className="flex items-center gap-2 px-4 py-2 font-semibold text-slate-600 bg-white/50 backdrop-blur-sm rounded-full shadow-sm hover:bg-white/80 transition-colors border border-white/20"
                    aria-label="Next card"
                >
                    Next
                    <ArrowRightIcon className="h-5 w-5" />
                </button>
            </div>
        </div>
    );
};