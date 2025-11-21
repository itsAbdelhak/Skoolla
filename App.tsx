

import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import CourseTutor from './components/CourseTutor';
import { useAuth } from './lib/AuthContext';
import { AuthPage } from './components/auth/AuthPage';
import { getSessionsForUser, Session, getUserProfile, UserProfile } from './lib/supabaseService';
import CourseLibrary from './components/CourseLibrary';
import { SettingsPage } from './components/SettingsPage';
import { ReviewHub } from './components/ReviewHub';

const MainApp: React.FC = () => {
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [courseTutorKey, setCourseTutorKey] = useState(0);
  const [activeView, setActiveView] = useState<'library' | 'tutor' | 'settings' | 'review'>('library');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);


  const fetchSessionsAndProfile = async () => {
    if (!user) return;
    setSessionsLoading(true);
    try {
      const [userSessions, profile] = await Promise.all([
          getSessionsForUser(user.id),
          getUserProfile(user.id)
      ]);
      setSessions(userSessions);
      setUserProfile(profile);
    } catch (error) {
      console.error("Failed to fetch sessions and profile:", error);
    } finally {
      setSessionsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionsAndProfile();
  }, [user]);
  
  const handleNavigate = (view: 'library' | 'settings' | 'review') => {
    setActiveView(view);
    setActiveSessionId(null);
  }

  const handleNewSession = () => {
    setActiveView('tutor');
    setActiveSessionId(null);
    setCourseTutorKey(prevKey => prevKey + 1);
  };
  
  const handleSessionSelect = (sessionId: string) => {
    if (sessionId !== activeSessionId || activeView !== 'tutor') {
      setActiveView('tutor');
      setActiveSessionId(sessionId);
      setCourseTutorKey(prevKey => prevKey + 1);
    }
    setIsSidebarOpen(false); // Close sidebar on mobile after selection
  };
  
  const handleSessionCreated = (newSessionId: string) => {
    setActiveView('tutor');
    setActiveSessionId(newSessionId);
    fetchSessionsAndProfile(); // Refresh session list and profile
  };
  
  const handleSessionUpdated = () => {
      fetchSessionsAndProfile();
  };

  const renderActiveView = () => {
    switch(activeView) {
        case 'library':
            return (
                <CourseLibrary 
                    sessions={sessions}
                    profile={userProfile}
                    loading={sessionsLoading}
                    onSessionSelect={handleSessionSelect}
                    onNewSession={handleNewSession}
                    onMenuClick={() => setIsSidebarOpen(true)}
                />
            );
        case 'tutor':
            return (
                <CourseTutor
                  key={courseTutorKey}
                  sessionId={activeSessionId}
                  onSessionCreated={handleSessionCreated}
                  onNewSessionRequest={handleNewSession}
                  onMenuClick={() => setIsSidebarOpen(true)}
                  onSessionUpdated={handleSessionUpdated}
                />
            );
        case 'settings':
            return (
                <SettingsPage 
                    userProfile={userProfile}
                    onProfileUpdated={fetchSessionsAndProfile}
                    onNavigateBack={() => handleNavigate('library')}
                />
            );
        case 'review':
            return <ReviewHub onMenuClick={() => setIsSidebarOpen(true)} />;
        default:
             return <CourseLibrary sessions={sessions} profile={userProfile} loading={sessionsLoading} onSessionSelect={handleSessionSelect} onNewSession={handleNewSession} onMenuClick={() => setIsSidebarOpen(true)} />;
    }
  }

  return (
    <div className="h-full overflow-hidden font-sans text-slate-800 lg:flex">
      <Sidebar 
        sessions={sessions}
        activeSessionId={activeSessionId}
        onNewSession={handleNewSession}
        onSessionSelect={handleSessionSelect}
        onNavigateToLibrary={() => handleNavigate('library')}
        onNavigateToSettings={() => handleNavigate('settings')}
        onNavigateToReview={() => handleNavigate('review')}
        activeView={activeView}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        isLoading={sessionsLoading}
        userProfile={userProfile}
      />
      <main className="flex-1 overflow-y-auto">
        {renderActiveView()}
      </main>
    </div>
  );
};


const App: React.FC = () => {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-500 font-semibold">Loading your study space...</div>
      </div>
    );
  }

  if (!session) {
    return <AuthPage />;
  }

  return <MainApp />;
};

export default App;