import React, { useState } from 'react';
import { AuthForm } from './AuthForm';

export const AuthPage: React.FC = () => {
    const [isLoginView, setIsLoginView] = useState(true);

    return (
        <div className="flex flex-col min-h-screen bg-gradient-to-br from-sky-200 via-sky-100 to-white p-6 font-sans">
            <header className="flex items-center h-8">
                 {/* StudyGen text removed */}
            </header>

            <main className="flex-1 flex items-center justify-center">
                <div className="w-full max-w-md bg-white/50 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 transition-all duration-300">
                    <div className="flex flex-col items-center text-center">
                        {/* StudyGen text removed */}
                        <h2 className="font-display text-2xl font-bold text-slate-800 tracking-tight">
                            {isLoginView ? 'Welcome Back!' : 'Join the Study Revolution!'}
                        </h2>
                        <p className="text-slate-600 mt-2">
                            {isLoginView ? "Let's pick up where you left off on your learning adventure." : 'Unlock your personal AI teacher and make learning fun. For free!'}
                        </p>
                    </div>
                    
                    <div className="mt-8">
                        <AuthForm type={isLoginView ? 'login' : 'signup'} />
                    </div>

                     <div className="mt-8 text-center text-sm">
                        <button onClick={() => setIsLoginView(!isLoginView)} className="font-semibold text-slate-600 hover:text-slate-900 transition-colors">
                            {isLoginView ? 'Don’t have an account? Sign up' : 'Already have an account? Sign in'}
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
};
