

import React, { useState, useMemo, useEffect } from 'react';
import { Session } from '../lib/supabaseService';
import { SearchIcon, XIcon, PlusIcon, ChatAltIcon } from './icons';

interface SearchModalProps {
    sessions: Session[];
    onClose: () => void;
    onSessionSelect: (sessionId: string) => void;
    onNewSession: () => void;
}

const groupSessionsByDate = (sessions: Session[]) => {
    const groups: { [key: string]: Session[] } = {
        Today: [],
        Yesterday: [],
        'Previous 7 Days': [],
        Older: [],
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    sessions.forEach(session => {
        const sessionDate = new Date(session.created_at);
        if (sessionDate >= today) {
            groups.Today.push(session);
        } else if (sessionDate >= yesterday) {
            groups.Yesterday.push(session);
        } else if (sessionDate >= sevenDaysAgo) {
            groups['Previous 7 Days'].push(session);
        } else {
            groups.Older.push(session);
        }
    });

    return groups;
};

export const SearchModal: React.FC<SearchModalProps> = ({ sessions, onClose, onSessionSelect, onNewSession }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredSessions = useMemo(() => {
        if (!searchTerm) return sessions;
        return sessions.filter(session =>
            session.title.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm, sessions]);

    const groupedSessions = useMemo(() => groupSessionsByDate(filteredSessions), [filteredSessions]);
    
    // Handle Escape key to close modal
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    return (
        <div 
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[110] flex justify-center p-4 pt-[10vh]"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
        >
            <div 
                className="bg-white/50 backdrop-blur-xl border border-white/20 w-full max-w-2xl h-fit max-h-[80vh] rounded-2xl shadow-2xl flex flex-col animate-fade-in"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center gap-2 p-4 border-b border-white/20">
                    <SearchIcon className="h-5 w-5 text-slate-400 flex-shrink-0" />
                    <input
                        type="text"
                        placeholder="Search chats..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-transparent focus:outline-none text-slate-800 placeholder-slate-500 font-semibold"
                        autoFocus
                    />
                    <button onClick={onClose} className="p-1 text-slate-500 hover:text-slate-800 rounded-full">
                        <XIcon className="h-6 w-6" />
                    </button>
                </div>

                <div className="flex-shrink-0 p-2 border-b border-white/20">
                    <button
                        onClick={onNewSession}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-slate-700 rounded-lg hover:bg-white/20 transition-colors"
                    >
                        <PlusIcon className="h-5 w-5 text-blue-500" />
                        New Topic
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-2">
                    {/* Fix: Explicitly type the destructured parameters to resolve a type inference issue where sessionList was being treated as 'unknown'. */}
                    {Object.entries(groupedSessions).map(([group, sessionList]: [string, Session[]]) =>
                        sessionList.length > 0 ? (
                            <div key={group}>
                                <h3 className="text-xs font-bold text-slate-400 uppercase px-3 py-2">{group}</h3>
                                <ul>
                                    {sessionList.map(session => (
                                        <li key={session.id}>
                                            <button 
                                                onClick={() => onSessionSelect(session.id)}
                                                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-slate-700 rounded-lg hover:bg-white/20 transition-colors text-left"
                                            >
                                                <ChatAltIcon className="h-5 w-5 flex-shrink-0" />
                                                <span className="flex-1 truncate">{session.title}</span>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : null
                    )}
                    {filteredSessions.length === 0 && (
                        <div className="text-center p-8 text-slate-500">
                            <p className="font-semibold">No sessions found</p>
                            <p className="text-sm mt-1">Try a different search term or start a new topic.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};