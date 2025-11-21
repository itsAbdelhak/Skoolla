


import React, { useState, useEffect, useRef } from 'react';
import { ClockIcon } from './icons';

const FOCUS_DURATION = 25 * 60; // 25 minutes
const BREAK_DURATION = 5 * 60; // 5 minutes

export const FocusModeTimer: React.FC = () => {
    const [mode, setMode] = useState<'focus' | 'break'>('focus');
    const [timeLeft, setTimeLeft] = useState(FOCUS_DURATION);
    const [isActive, setIsActive] = useState(false);
    // Fix: Use `ReturnType<typeof setInterval>` for browser compatibility instead of the Node.js-specific `NodeJS.Timeout`.
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (isActive) {
            intervalRef.current = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else {
            if (intervalRef.current) clearInterval(intervalRef.current);
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isActive]);

    useEffect(() => {
        if (timeLeft <= 0) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            setIsActive(false);
            // Switch modes
            if (mode === 'focus') {
                setMode('break');
                setTimeLeft(BREAK_DURATION);
            } else {
                setMode('focus');
                setTimeLeft(FOCUS_DURATION);
            }
        }
    }, [timeLeft, mode]);

    const toggleTimer = () => setIsActive(!isActive);

    const resetTimer = () => {
        setIsActive(false);
        setMode('focus');
        setTimeLeft(FOCUS_DURATION);
    };

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const totalDuration = mode === 'focus' ? FOCUS_DURATION : BREAK_DURATION;
    const progress = (timeLeft / totalDuration) * 100;

    return (
        <div className="flex items-center gap-2">
            <div className="relative h-9 w-9">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="16" fill="none" className="text-slate-200" strokeWidth="3"></circle>
                    <circle
                        cx="18"
                        cy="18"
                        r="16"
                        fill="none"
                        className={mode === 'focus' ? "text-primary" : "text-accent"}
                        strokeWidth="3"
                        strokeDasharray="100"
                        strokeDashoffset={100 - progress}
                        strokeLinecap="round"
                    ></circle>
                </svg>
                 <div className="absolute inset-0 flex items-center justify-center">
                    <button onClick={toggleTimer} className="text-slate-600 hover:text-primary">
                        <ClockIcon className="h-5 w-5" />
                    </button>
                 </div>
            </div>
            <div className="w-16 text-sm font-semibold text-slate-700">{formatTime(timeLeft)}</div>
        </div>
    );
};