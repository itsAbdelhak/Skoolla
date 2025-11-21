

import React from 'react';
import { useAuth } from '../lib/AuthContext';
import type { Session, UserProfile } from '../lib/supabaseService';
import { MenuIcon, SearchIcon, ChevronDownIcon, PlusIcon, SpinnerIcon, BadgeCheckIcon } from './icons';

interface CourseLibraryProps {
    sessions: Session[];
    profile: UserProfile | null;
    loading: boolean;
    onSessionSelect: (sessionId: string) => void;
    onNewSession: () => void;
    onMenuClick: () => void;
}

const timeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return "just now";
};

const CourseCard: React.FC<{ session: Session; onSelect: () => void }> = ({ session, onSelect }) => {
    return (
        <button onClick={onSelect} className="bg-white/40 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-white/20 hover:border-white/50 hover:-translate-y-1 transition-all group text-left w-full">
            <div className="flex justify-between items-start mb-3">
                <h3 className="font-display text-lg font-bold text-slate-800 tracking-tight pr-4">{session.title}</h3>
                {session.subject && (
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full bg-white/30 text-slate-700`}>
                        {session.subject}
                    </span>
                )}
            </div>
            <p className="text-slate-600 text-sm mb-6 h-10 overflow-hidden">
                Exploring the core concepts of {session.title.toLowerCase()}. Dive deep into the key topics.
            </p>
            <div className="w-full bg-black/10 rounded-full h-1.5 mb-2">
                <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${session.progress}%` }}></div>
            </div>
            <div className="flex justify-between items-center text-xs text-slate-500 font-semibold">
                <span>Progress: {session.progress}%</span>
                <span>Last studied: {timeAgo(session.created_at)}</span>
            </div>
        </button>
    );
};

const NewSessionCard: React.FC<{ onSelect: () => void }> = ({ onSelect }) => {
    return (
        <button onClick={onSelect} className="border-2 border-dashed border-white/50 rounded-2xl flex flex-col items-center justify-center p-6 text-center text-slate-500 hover:border-white hover:text-slate-700 hover:bg-white/20 transition-all group min-h-[190px]">
            <div className="h-16 w-16 mb-4 bg-white/30 group-hover:bg-white/50 rounded-full flex items-center justify-center transition-colors">
                <PlusIcon className="h-8 w-8" />
            </div>
            <h3 className="font-bold text-slate-700 group-hover:text-slate-800">Start a New Session</h3>
            <p className="text-sm mt-1">Begin a new learning adventure and track your progress.</p>
        </button>
    );
};

const CourseLibrary: React.FC<CourseLibraryProps> = ({ sessions, profile, loading, onSessionSelect, onNewSession, onMenuClick }) => {
  const { user } = useAuth();
  const fullName = user?.user_metadata?.full_name?.split(' ')[0] || 'Abdelhak';

  return (
    <div className="w-full p-4 sm:p-6 lg:p-8">
       <header className="mb-6 sm:mb-8">
            <div className="flex items-center gap-4 sm:items-start">
                <button onClick={onMenuClick} className="lg:hidden text-slate-500 flex-shrink-0">
                    <MenuIcon className="h-6 w-6"/>
                </button>
                <div>
                    <h1 className="font-display text-2xl font-bold text-slate-900 tracking-tight sm:text-3xl">
                        Welcome back, {fullName}!
                    </h1>
                    <p className="text-slate-600 mt-1 text-base">Let's keep growing together 🌱</p>
                </div>
            </div>
        </header>
      
      <div className="mb-8 flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
        <div className="relative w-full sm:flex-1">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
            <input 
                type="text" 
                placeholder="Search sessions or topics..." 
                className="w-full bg-white/50 border border-white/20 backdrop-blur-sm rounded-xl py-3 pl-11 pr-4 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors text-slate-900 placeholder-slate-600"
            />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
            <button className="flex-1 sm:flex-initial justify-center flex items-center gap-2 px-4 py-3 bg-white/50 border border-white/20 backdrop-blur-sm text-sm font-semibold text-slate-700 rounded-xl hover:bg-white/70 transition-colors">Subject <ChevronDownIcon className="h-4 w-4" /></button>
            <button className="flex-1 sm:flex-initial justify-center flex items-center gap-2 px-4 py-3 bg-white/50 border border-white/20 backdrop-blur-sm text-sm font-semibold text-slate-700 rounded-xl hover:bg-white/70 transition-colors">Date <ChevronDownIcon className="h-4 w-4" /></button>
            <button className="flex-1 sm:flex-initial justify-center flex items-center gap-2 px-4 py-3 bg-white/50 border border-white/20 backdrop-blur-sm text-sm font-semibold text-slate-700 rounded-xl hover:bg-white/70 transition-colors">Completion % <ChevronDownIcon className="h-4 w-4" /></button>
        </div>
      </div>

      <div>
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <SpinnerIcon className="h-10 w-10 text-slate-700 animate-spin" />
            <p className="ml-4 font-semibold text-slate-600">Loading your courses...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {sessions.map(session => (
              <CourseCard key={session.id} session={session} onSelect={() => onSessionSelect(session.id)} />
            ))}
            <NewSessionCard onSelect={onNewSession} />
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseLibrary;