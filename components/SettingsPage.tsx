

import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { updateUserProfile, UserProfile } from '../lib/supabaseService';
import { countries } from '../lib/countries';
import { SpinnerIcon, UserCircleIcon, LockIcon, GlobeAltIcon, MailIcon, CheckCircleIcon, ArrowLeftIcon } from './icons';

interface SettingsPageProps {
    userProfile: UserProfile | null;
    onProfileUpdated: () => void;
    onNavigateBack: () => void;
}

type SettingsTab = 'profile' | 'security';

const SettingsTabButton: React.FC<{
    label: string;
    icon: React.ReactNode;
    isActive: boolean;
    onClick: () => void;
}> = ({ label, icon, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-lg transition-colors ${
            isActive ? 'bg-slate-200/60 text-slate-900' : 'text-slate-600 hover:bg-slate-100/80'
        }`}
    >
        {icon}
        {label}
    </button>
);

const SettingsInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { icon: React.ReactNode }> = ({ icon, ...props }) => (
    <div className="relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
            {icon}
        </span>
        <input
            {...props}
            className="block w-full appearance-none rounded-xl border-2 border-slate-200 bg-slate-50/50 px-3.5 py-3 pl-11 text-slate-900 placeholder-slate-500 shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm transition-colors"
        />
    </div>
);

const SettingsSelect: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { icon: React.ReactNode }> = ({ icon, children, ...props }) => (
     <div className="relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
            {icon}
        </span>
        <select
            {...props}
            className="block w-full appearance-none rounded-xl border-2 border-slate-200 bg-slate-50/50 px-3.5 py-3 pl-11 text-slate-900 placeholder-slate-500 shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm transition-colors"
        >
            {children}
        </select>
    </div>
);


export const SettingsPage: React.FC<SettingsPageProps> = ({ userProfile, onProfileUpdated, onNavigateBack }) => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
    
    // Profile state
    const [fullName, setFullName] = useState('');
    const [country, setCountry] = useState('');

    // Security state
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    // General state
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        if (userProfile) {
            setFullName(userProfile.full_name || '');
            setCountry(userProfile.country || '');
        }
    }, [userProfile]);

    const handleProfileSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setLoading(true);
        setMessage(null);
        try {
            await updateUserProfile(user.id, { full_name: fullName, country });
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
            onProfileUpdated(); // Re-fetch profile data in App.tsx
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setMessage({ type: 'error', text: 'Passwords do not match.' });
            return;
        }
        if (password.length < 6) {
            setMessage({ type: 'error', text: 'Password must be at least 6 characters long.'});
            return;
        }

        setLoading(true);
        setMessage(null);
        try {
            const { error } = await supabase.auth.updateUser({ password });
            if (error) throw error;
            setMessage({ type: 'success', text: 'Password updated successfully!' });
            setPassword('');
            setConfirmPassword('');
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setLoading(false);
        }
    };
    
    const renderContent = () => {
        if (activeTab === 'profile') {
            return (
                <form onSubmit={handleProfileSave} className="space-y-6">
                    <div className="space-y-1">
                         <label htmlFor="fullName" className="text-sm font-semibold text-slate-700">Full Name</label>
                         <SettingsInput id="fullName" value={fullName} onChange={e => setFullName(e.target.value)} icon={<UserCircleIcon className="w-5 h-5" />} />
                    </div>
                     <div className="space-y-1">
                         <label htmlFor="country" className="text-sm font-semibold text-slate-700">Country</label>
                         <SettingsSelect id="country" value={country} onChange={e => setCountry(e.target.value)} icon={<GlobeAltIcon className="w-5 h-5"/>}>
                            <option value="">Select your country</option>
                            {countries.map(c => <option key={c.code} value={c.name}>{c.name}</option>)}
                         </SettingsSelect>
                    </div>
                     <div className="pt-2 flex justify-end">
                        <button type="submit" disabled={loading} className="px-5 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors shadow-sm disabled:bg-slate-400">
                           {loading ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : 'Save Changes'}
                        </button>
                    </div>
                </form>
            )
        }
        
        if (activeTab === 'security') {
            return (
                 <form onSubmit={handlePasswordChange} className="space-y-6">
                    <div className="space-y-1">
                         <label htmlFor="email" className="text-sm font-semibold text-slate-700">Email Address</label>
                         <SettingsInput id="email" value={user?.email || ''} readOnly disabled icon={<MailIcon className="w-5 h-5"/>} />
                         <p className="text-xs text-slate-500 pl-1">Email address cannot be changed.</p>
                    </div>
                    <div className="space-y-1">
                         <label htmlFor="password"  className="text-sm font-semibold text-slate-700">New Password</label>
                         <SettingsInput id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter new password" icon={<LockIcon className="w-5 h-5"/>} />
                    </div>
                     <div className="space-y-1">
                         <label htmlFor="confirmPassword"  className="text-sm font-semibold text-slate-700">Confirm New Password</label>
                         <SettingsInput id="confirmPassword" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm new password" icon={<LockIcon className="w-5 h-5"/>} />
                    </div>
                    <div className="pt-2 flex justify-end">
                        <button type="submit" disabled={loading} className="px-5 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors shadow-sm disabled:bg-slate-400">
                           {loading ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : 'Update Password'}
                        </button>
                    </div>
                </form>
            )
        }
        return null;
    }


    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            <header className="mb-8">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={onNavigateBack} 
                        className="flex-shrink-0 p-2 text-slate-500 hover:bg-white/50 rounded-full transition-colors"
                        aria-label="Back to library"
                    >
                        <ArrowLeftIcon className="h-6 w-6" />
                    </button>
                    <div>
                        <h1 className="font-display text-3xl font-bold text-slate-900 tracking-tight">Account Settings</h1>
                        <p className="text-slate-600 mt-1">Manage your personal information and security.</p>
                    </div>
                </div>
            </header>
            
            <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar */}
                <aside className="w-full md:w-56 flex-shrink-0">
                    <nav className="space-y-1.5">
                        <SettingsTabButton label="My Profile" icon={<UserCircleIcon className="w-5 h-5" />} isActive={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
                        <SettingsTabButton label="Security" icon={<LockIcon className="w-5 h-5" />} isActive={activeTab === 'security'} onClick={() => setActiveTab('security')} />
                    </nav>
                </aside>

                {/* Content */}
                <main className="flex-1">
                    <div className="bg-white/40 backdrop-blur-xl p-6 sm:p-8 rounded-2xl shadow-lg border border-white/20">
                       {renderContent()}
                    </div>
                     {message && (
                        <div className={`mt-6 flex items-center gap-3 text-sm font-semibold p-3 rounded-xl ${message.type === 'success' ? 'bg-green-100/70 text-green-800' : 'bg-red-100/70 text-red-800'}`}>
                           {message.type === 'success' && <CheckCircleIcon className="w-5 h-5"/>}
                           <span>{message.text}</span>
                        </div>
                    )}
                </main>
            </div>
        </div>
    )
}