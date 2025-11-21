import React, { useState } from 'react';
import { QuizData } from '../services/geminiService';
import { QuestionMarkCircleIcon, CheckIcon, XIcon } from './icons';

export const QuizDisplay: React.FC<{ quizData: QuizData }> = ({ quizData }) => {
    const [selectedAnswers, setSelectedAnswers] = useState<(string | null)[]>(Array(quizData.questions.length).fill(null));
    const [submitted, setSubmitted] = useState(false);

    const handleSelect = (qIndex: number, option: string) => {
        if (submitted) return;
        const newAnswers = [...selectedAnswers];
        newAnswers[qIndex] = option.substring(0, 1);
        setSelectedAnswers(newAnswers);
    };

    const handleSubmit = () => setSubmitted(true);

    return (
        <div className="space-y-6">
            <h3 className="font-display text-xl font-bold text-slate-800 flex items-center gap-2">
                <QuestionMarkCircleIcon className="h-6 w-6 text-blue-500" />
                Check Your Knowledge
            </h3>
            {quizData.questions.map((q, qIndex) => (
                <div key={qIndex} className="border-t border-white/30 pt-5">
                    <p className="font-bold text-slate-700 mb-4">{qIndex + 1}. {q.question}</p>
                    <div className="space-y-2.5">
                        {q.options.map((option, oIndex) => {
                            const optionLetter = option.substring(0, 1);
                            const isSelected = selectedAnswers[qIndex] === optionLetter;
                            const isCorrect = q.answer === optionLetter;
                            let stateClasses = 'border-white/30 bg-white/30 text-slate-700 hover:bg-white/50';
                            let icon = null;

                            if (submitted) {
                                if (isCorrect) {
                                    stateClasses = 'border-accent bg-accent-light text-green-800 font-semibold ring-2 ring-accent/50';
                                    icon = <CheckIcon className="h-5 w-5 text-accent" />;
                                } else if (isSelected && !isCorrect) {
                                    stateClasses = 'border-red-400 bg-red-50 text-red-800';
                                    icon = <XIcon className="h-5 w-5 text-red-500" />;
                                }
                            } else if (isSelected) {
                                stateClasses = 'border-blue-500 bg-blue-500 text-white ring-2 ring-blue-500/50';
                            }

                            return (
                                <button
                                    key={oIndex}
                                    onClick={() => handleSelect(qIndex, option)}
                                    disabled={submitted}
                                    className={`w-full text-left p-3 rounded-xl border-2 transition-all duration-200 flex items-center justify-between ${stateClasses}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="font-bold">{option.substring(0, 2)}</span>
                                        <span>{option.substring(3)}</span>
                                    </div>
                                    {icon}
                                </button>
                            );
                        })}
                    </div>
                    {submitted && (
                        <div className="mt-3 p-3 rounded-lg bg-white/20 text-sm">
                            <p><strong className="font-semibold text-slate-700">Answer: {q.answer}</strong>. {q.explanation}</p>
                        </div>
                    )}
                </div>
            ))}
            {!submitted && (
                <button
                    onClick={handleSubmit}
                    disabled={selectedAnswers.some(a => a === null)}
                    className="appearance-none w-full mt-4 flex justify-center rounded-xl border-2 border-primary-dark bg-primary py-3 px-4 font-semibold text-white shadow-sm transition-colors hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-dark disabled:bg-slate-500 disabled:cursor-not-allowed"
                >
                    Submit Answers
                </button>
            )}
        </div>
    );
};