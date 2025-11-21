
import React, { useState, useEffect } from 'react';
import {
  LogoIcon,
  XIcon,
  PlusIcon,
  LogoutIcon,
  CheckIcon,
  HomeIcon,
  SearchIcon,
  RefreshIcon,
  SparklesIcon,
  ClockIcon,
  BadgeCheckIcon,
} from './icons';
import { useAuth } from '../lib/AuthContext';
import { Session, UserProfile } from '../lib/supabaseService';
import { SearchModal } from './SearchModal';
import { UserProfilePopup } from './UserProfilePopup';

interface SidebarProps {
  sessions: Session[];
  activeSessionId: string | null;
  onNewSession: () => void;
  onSessionSelect: (sessionId: string) => void;
  onNavigateToLibrary: () => void;
  onNavigateToSettings: () => void;
  onNavigateToReview: () => void;
  activeView: 'library' | 'tutor' | 'settings' | 'review';
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  isLoading: boolean;
  userProfile: UserProfile | null;
}

const ProgressRing: React.FC<{ progress: number }> = ({ progress }) => {
    const size = 28;
    const strokeWidth = 2.5;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (progress / 100) * circumference;

    if (progress >= 100) {
        return (
            <div className="relative flex-shrink-0 h-7 w-7 flex items-center justify-center">
                <BadgeCheckIcon className="w-6 h-6 text-accent" />
            </div>
        );
    }
    
    return (
        <div className="relative h-7 w-7 flex-shrink-0">
            <svg
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
                className="transform -rotate-90"
            >
                <circle
                    className="text-black/10"
                    strokeWidth={strokeWidth}
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                />
                <circle
                    className="text-blue-500"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                />
            </svg>
            {progress > 0 && (
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-slate-500">
                    {progress}
                </span>
            )}
        </div>
    );
};

const SessionItem: React.FC<{
  session: Session;
  isActive: boolean;
  onClick: () => void;
}> = ({ session, isActive, onClick }) => {
    return (
      <li>
        <button
          onClick={onClick}
          className={`flex items-center w-full gap-3 px-3.5 py-3 text-sm font-semibold rounded-xl transition-all duration-200 group text-left ${
            isActive
              ? 'bg-white/40 text-slate-900 shadow-sm'
              : 'text-slate-700 hover:bg-white/20'
          }`}
        >
          <span className="flex-1 whitespace-nowrap overflow-hidden text-ellipsis">{session.title}</span>
          <ProgressRing progress={session.progress} />
        </button>
      </li>
    );
};

const UserProfileDisplay: React.FC<{ isCollapsed: boolean, userProfile: UserProfile | null, onClick: () => void }> = ({ isCollapsed, userProfile, onClick }) => {
    const { user } = useAuth();
    const email = user?.email || 'no-email';
    const fullName = user?.user_metadata?.full_name || 'StudyGen User';
    const streak = userProfile?.streak || 0;

    return (
        <button onClick={onClick} className={`w-full flex items-center p-2 rounded-lg transition-colors hover:bg-white/20 ${isCollapsed ? 'justify-center' : ''}`} aria-label="Open user menu">
            <img src={`https://i.pravatar.cc/40?u=${email}`} alt="User" className="w-10 h-10 rounded-full" />
            <div className={`ml-3 overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
                <p className="font-bold text-sm text-slate-800 whitespace-nowrap text-left">{fullName}</p>
                 <p className="text-xs text-slate-500 whitespace-nowrap truncate text-left">🔥 {streak}-day streak – keep it up!</p>
            </div>
        </button>
    );
};

const StudyStats: React.FC<{ userProfile: UserProfile | null }> = ({ userProfile }) => {
    const studyPoints = userProfile?.study_points || 0;
    const completedToday = userProfile?.completed_today_count || 0;
    const timeStudied = userProfile?.time_studied_today_minutes || 0;

    return (
        <div className="px-2 my-4 animate-fade-in">
            <p className="text-sm font-semibold text-slate-500 px-2 mb-2">
                Daily Progress
            </p>
            <div className="space-y-2.5 p-3 bg-white/20 rounded-xl border border-white/20">
                <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2.5 text-slate-600 font-semibold">
                        <SparklesIcon className="w-5 h-5 text-yellow-500" />
                        <span>Study Points</span>
                    </div>
                    <span className="font-bold text-slate-800">{studyPoints}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2.5 text-slate-600 font-semibold">
                        <BadgeCheckIcon className="w-5 h-5 text-accent" />
                        <span>Topics Today</span>
                    </div>
                    <span className="font-bold text-slate-800">{completedToday}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2.5 text-slate-600 font-semibold">
                        <ClockIcon className="w-5 h-5 text-blue-500" />
                        <span>Time Studied</span>
                    </div>
                    <span className="font-bold text-slate-800">{timeStudied} min</span>
                </div>
            </div>
        </div>
    );
};

const CollapsedNavItem: React.FC<{ label: string; onClick: () => void; children: React.ReactNode; isActive?: boolean; }> = 
({ label, onClick, children, isActive }) => (
    <div className="relative group flex justify-center">
        <button
            onClick={onClick}
            className={`w-12 h-12 flex items-center justify-center rounded-xl transition-colors ${
                isActive ? 'bg-white/40 text-slate-900' : 'text-slate-600 hover:bg-white/20'
            }`}
            aria-label={label}
        >
            {children}
        </button>
        <div className="absolute left-full ml-3 px-2 py-1 bg-slate-800 text-white text-xs font-semibold rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
            {label}
        </div>
    </div>
);


const SidebarContent: React.FC<{
    isCollapsed: boolean;
    sessions: Session[];
    activeSessionId: string | null;
    onNewSession: () => void;
    onSessionSelect: (sessionId: string) => void;
    onNavigateToLibrary: () => void;
    onNavigateToSettings: () => void;
    onNavigateToReview: () => void;
    onSearchClick: () => void;
    activeView: 'library' | 'tutor' | 'settings' | 'review';
    isLoading: boolean;
    userProfile: UserProfile | null;
    isProfilePopupOpen: boolean;
    setIsProfilePopupOpen: (isOpen: boolean) => void;
    onClose?: () => void;
}> = (props) => {
    const { 
        isCollapsed, sessions, activeSessionId, onNewSession, onSessionSelect, 
        onNavigateToLibrary, onNavigateToSettings, onNavigateToReview, onSearchClick, activeView, isLoading, 
        userProfile, isProfilePopupOpen, setIsProfilePopupOpen, onClose 
    } = props;
    
    if (isCollapsed) {
        return (
            <div className="h-full flex flex-col items-center p-3 font-sans">
                <div className="h-14 mb-4 flex items-center justify-center">
                    <LogoIcon className="h-8 w-8" />
                </div>
                <nav className="flex flex-col items-center gap-3">
                    <CollapsedNavItem label="New Topic" onClick={() => { onNewSession(); onClose?.(); }}>
                        <PlusIcon className="w-6 h-6" />
                    </CollapsedNavItem>
                    <CollapsedNavItem label="Search Topics" onClick={onSearchClick}>
                        <SearchIcon className="w-6 h-6" />
                    </CollapsedNavItem>
                    <CollapsedNavItem label="My Topics" onClick={() => { onNavigateToLibrary(); onClose?.(); }} isActive={activeView === 'library'}>
                        <HomeIcon className="w-6 h-6" />
                    </CollapsedNavItem>
                </nav>
                <div className="relative mt-auto pt-4 border-t border-white/20 w-full">
                    <UserProfileDisplay isCollapsed={isCollapsed} userProfile={userProfile} onClick={() => setIsProfilePopupOpen(!isProfilePopupOpen)} />
                    {isProfilePopupOpen && (
                        <UserProfilePopup 
                            onClose={() => setIsProfilePopupOpen(false)} 
                            onNavigateToSettings={onNavigateToSettings}
                            onNavigateToReview={onNavigateToReview}
                            isCollapsed={isCollapsed} 
                        />
                    )}
                </div>
            </div>
        )
    }

    return (
     <div className="h-full flex flex-col p-3 font-sans">
        {/* Header */}
        <div className={`flex items-center justify-between h-14 mb-4 pl-1`}>
            <div className={`flex items-center gap-2 overflow-hidden`}>
                <LogoIcon className="h-8 w-8 flex-shrink-0" />
                <span className="text-2xl font-display font-bold text-slate-800 whitespace-nowrap">StudyGen</span>
            </div>
            {onClose && (
                <button onClick={onClose} className="lg:hidden p-1 text-slate-500 hover:text-slate-800">
                    <XIcon className="w-6 h-6"/>
                </button>
            )}
        </div>

        {/* Main Nav */}
        <div className="px-1 mb-2 space-y-2">
            <button
                onClick={() => { onNavigateToLibrary(); onClose?.(); }}
                className={`w-full flex items-center justify-start gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${
                    activeView === 'library'
                    ? 'bg-white/40 text-slate-900'
                    : 'text-slate-600 hover:bg-white/20'
                }`}
            >
                <HomeIcon className="w-5 h-5" />
                <span>My Topics</span>
            </button>
        </div>
        
        <div className="flex items-center justify-between px-2 my-2">
            <p className="text-sm font-semibold text-slate-500">
                Recent Sessions
            </p>
            <div className="flex items-center gap-1">
                <button onClick={onSearchClick} className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-white/20 rounded-md transition-colors" aria-label="Search sessions">
                    <SearchIcon className="w-4 h-4" />
                </button>
                <button onClick={() => { onNewSession(); onClose?.(); }} className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-white/20 rounded-md transition-colors" aria-label="Start new session">
                    <PlusIcon className="w-4 h-4" />
                </button>
            </div>
        </div>
        
        {/* Session List */}
        <nav className="flex-grow overflow-y-auto min-h-0">
          <ul className="space-y-1.5">
             {sessions.map((session) => (
              <SessionItem
                key={session.id}
                session={session}
                isActive={activeSessionId === session.id}
                onClick={() => onSessionSelect(session.id)}
              />
            ))}
          </ul>
           {isLoading && (
             <div className="text-center p-4 text-sm text-slate-500">Loading sessions...</div>
           )}
           {!isLoading && sessions.length === 0 && (
            <div className="text-center p-4 text-sm text-slate-500">
                No sessions yet — start learning something new! 🚀
            </div>
           )}
        </nav>

        <StudyStats userProfile={userProfile} />

        {/* Footer */}
        <div className="relative mt-auto pt-4 border-t border-white/20">
            <UserProfileDisplay isCollapsed={isCollapsed} userProfile={userProfile} onClick={() => setIsProfilePopupOpen(!isProfilePopupOpen)} />
            {isProfilePopupOpen && <UserProfilePopup onClose={() => setIsProfilePopupOpen(false)} onNavigateToSettings={onNavigateToSettings} onNavigateToReview={onNavigateToReview} isCollapsed={isCollapsed} />}
        </div>
    </div>
    )
};


export const Sidebar: React.FC<SidebarProps> = (props) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfilePopupOpen, setIsProfilePopupOpen] = useState(false);

  return (
    <>
        {isSearchOpen && (
            <SearchModal 
                sessions={props.sessions}
                onClose={() => setIsSearchOpen(false)}
                onSessionSelect={(sessionId) => {
                    props.onSessionSelect(sessionId);
                    setIsSearchOpen(false);
                }}
                onNewSession={() => {
                    props.onNewSession();
                    setIsSearchOpen(false);
                }}
            />
        )}
        {/* Mobile Sidebar */}
        <div 
            className={`fixed inset-0 bg-slate-900/50 z-[90] lg:hidden transition-opacity duration-300 ${props.isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            onClick={() => props.setIsOpen(false)}
        ></div>
        <aside 
            className={`fixed inset-y-0 left-0 w-72 bg-b9defb backdrop-blur-xl border-r border-white/20 z-[100] lg:hidden transform transition-transform duration-300 ease-in-out shadow-2xl ${props.isOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
             <SidebarContent 
                {...props}
                isCollapsed={false}
                onSearchClick={() => setIsSearchOpen(true)}
                onClose={() => props.setIsOpen(false)}
                isProfilePopupOpen={isProfilePopupOpen}
                setIsProfilePopupOpen={setIsProfilePopupOpen}
            />
        </aside>

        {/* Desktop Sidebar */}
        <aside className={`relative h-full flex-shrink-0 flex-col transition-all duration-300 ease-in-out hidden lg:flex bg-b9defb backdrop-blur-xl border-r border-white/20 z-30 ${isCollapsed ? 'w-20 border-l-2 border-l-[#aed0e3]' : 'w-[280px]'}`}>
            <SidebarContent 
                {...props}
                isCollapsed={isCollapsed}
                onSearchClick={() => setIsSearchOpen(true)}
                isProfilePopupOpen={isProfilePopupOpen}
                setIsProfilePopupOpen={setIsProfilePopupOpen}
            />
            <button 
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="absolute top-8 -right-3.5 h-7 w-7 bg-white/50 backdrop-blur-sm border border-white/20 rounded-full flex items-center justify-center text-slate-500 hover:bg-white/80 hover:text-slate-800 transition-transform focus:outline-none z-10 hover:scale-110"
                aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : 'rotate-0'}`}><path fillRule="evenodd" d="M15.79 14.77a.75.75 0 01-1.06.02l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 111.04 1.08L11.832 10l3.938 3.71a.75.75 0 01.02 1.06zm-6.06 0a.75.75 0 01-1.06.02l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 111.04 1.08L5.772 10l3.938 3.71a.75.75 0 01.02 1.06z" clipRule="evenodd" /></svg>
            </button>
        </aside>
    </>
  );
};
