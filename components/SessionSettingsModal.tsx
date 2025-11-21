import React, { useState, useEffect } from 'react';
import { XIcon, SparklesIcon, PlusIcon, CheckIcon } from './icons';

interface SessionSettingsModalProps {
    onClose: () => void;
    sessionTitle: string;
    sessionSubject?: string | null;
    onTitleChange: (newTitle: string) => Promise<void>;
    onSubjectChange: (newSubject: string) => Promise<void>;
    onEditPreferences: () => void;
    onAddDocuments: () => void;
    onArchiveSession: () => Promise<void>;
    onDeleteSession: () => Promise<void>;
}

const predefinedSubjects = ["Science", "Math", "History", "Psychology", "Business", "Economics", "Art", "Other"];

const SettingRow: React.FC<{ label: string; children: React.ReactNode; }> = ({ label, children }) => (
    <div>
        <label className="block text-sm font-bold text-slate-700 mb-2">{label}</label>
        {children}
    </div>
);

const ActionButton: React.FC<{ onClick: () => void; children: React.ReactNode; className?: string; }> = ({ onClick, children, className = '' }) => (
    <button
        onClick={onClick}
        className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all duration-200 text-sm sm:text-base font-semibold bg-white/50 border-white/20 text-slate-700 hover:bg-white/80 ${className}`}
    >
        {children}
    </button>
);

const DangerButton: React.FC<{ onClick: () => void; children: React.ReactNode; }> = ({ onClick, children }) => (
    <button
        onClick={onClick}
        className="w-full text-left px-4 py-3 rounded-xl border-2 transition-all duration-200 text-sm sm:text-base font-semibold bg-red-50 border-red-200 text-red-700 hover:bg-red-100 hover:border-red-300"
    >
        {children}
    </button>
);

export const SessionSettingsModal: React.FC<SessionSettingsModalProps> = ({
    onClose, sessionTitle, sessionSubject, onTitleChange, onSubjectChange,
    onEditPreferences, onAddDocuments, onArchiveSession, onDeleteSession
}) => {
    const [title, setTitle] = useState(sessionTitle);
    const [subject, setSubject] = useState(sessionSubject || '');
    const [customSubject, setCustomSubject] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        if (sessionSubject && !predefinedSubjects.includes(sessionSubject)) {
            setSubject('Other');
            setCustomSubject(sessionSubject);
        } else {
            setSubject(sessionSubject || '');
        }
    }, [sessionSubject]);

    const handleSave = () => {
        if (title.trim() && title.trim() !== sessionTitle) {
            onTitleChange(title.trim());
        }
        const finalSubject = subject === 'Other' ? customSubject.trim() : subject;
        if (finalSubject && finalSubject !== sessionSubject) {
            onSubjectChange(finalSubject);
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="relative bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-lg p-6 sm:p-8">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors p-1" aria-label="Close">
                    <XIcon className="h-6 w-6" />
                </button>
                
                <div className="mb-6">
                    <h1 className="font-display text-2xl font-bold text-slate-800 tracking-tight">Session Settings</h1>
                    <p className="text-slate-500">Manage your current study session.</p>
                </div>

                <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
                    {/* General Settings */}
                    <div className="space-y-4 p-4 rounded-2xl bg-black/5">
                        <h2 className="font-bold text-slate-700">General</h2>
                        <SettingRow label="Topic Title">
                            <input 
                                type="text" 
                                value={title} 
                                onChange={(e) => setTitle(e.target.value)} 
                                className="w-full px-4 py-3 bg-white/50 border-2 border-white/30 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-slate-900" 
                            />
                        </SettingRow>
                        <SettingRow label="Subject">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {predefinedSubjects.map(s => (
                                    <button key={s} onClick={() => setSubject(s)} className={`relative p-3 w-full text-center rounded-xl border-2 transition-all duration-200 font-semibold ${subject === s ? 'bg-primary text-white border-primary' : 'bg-white/50 border-white/20 text-slate-700 hover:border-white/50'}`}>
                                        {s}
                                        {subject === s && <CheckIcon className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 text-white" />}
                                    </button>
                                ))}
                            </div>
                            {subject === 'Other' && (
                                <input
                                    type="text"
                                    placeholder="Enter your subject"
                                    value={customSubject}
                                    onChange={e => setCustomSubject(e.target.value)}
                                    className="mt-3 w-full px-4 py-3 bg-white/50 border-2 border-white/30 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-slate-900 animate-fade-in"
                                />
                            )}
                        </SettingRow>
                    </div>

                    {/* Actions */}
                    <div className="space-y-3 p-4 rounded-2xl bg-black/5">
                        <h2 className="font-bold text-slate-700">Actions</h2>
                        <ActionButton onClick={onAddDocuments}><div className="flex items-center gap-3"><PlusIcon className="h-5 w-5"/> Add More Documents</div></ActionButton>
                        <ActionButton onClick={onEditPreferences}><div className="flex items-center gap-3"><SparklesIcon className="h-5 w-5"/> Edit Study Preferences</div></ActionButton>
                    </div>

                    {/* Danger Zone */}
                    <div className="space-y-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
                        <h2 className="font-bold text-red-800">Danger Zone</h2>
                        <ActionButton onClick={onArchiveSession} className="bg-amber-500/10 border-amber-500/20 text-amber-800 hover:bg-amber-500/20">Archive Session</ActionButton>
                        
                        {showDeleteConfirm ? (
                            <div className="p-3 bg-red-100 rounded-lg text-center animate-fade-in">
                                <p className="text-sm text-red-800 font-semibold">Are you sure? This action cannot be undone.</p>
                                <div className="mt-3 flex gap-2">
                                    <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 px-3 py-2 text-sm font-semibold text-slate-600 bg-white/80 rounded-md hover:bg-white">Cancel</button>
                                    <button onClick={onDeleteSession} className="flex-1 px-3 py-2 text-sm font-semibold text-white bg-red-600 rounded-md hover:bg-red-700">Yes, Delete</button>
                                </div>
                            </div>
                        ) : (
                           <DangerButton onClick={() => setShowDeleteConfirm(true)}>Delete Session Permanently</DangerButton>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-6 flex justify-end gap-3">
                    <button onClick={onClose} className="px-5 py-2.5 bg-white/40 text-slate-700 font-semibold rounded-xl hover:bg-white/60 transition-colors">
                        Cancel
                    </button>
                    <button onClick={handleSave} className="px-5 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors shadow-lg">
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};