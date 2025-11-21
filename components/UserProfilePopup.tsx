
import React, { useRef, useEffect } from 'react';
import { useAuth } from '../lib/AuthContext';
import { 
    UserCircleIcon, 
    UpgradeIcon, 
    ClockIcon, 
    CogIcon, 
    QuestionMarkCircleIcon, 
    ChevronRightIcon, 
    LogoutIcon,
    RefreshIcon
} from './icons';

interface UserProfilePopupProps {
  onClose: () => void;
  onNavigateToSettings: () => void;
  onNavigateToReview: () => void;
  isCollapsed?: boolean;
}

const PopupItem: React.FC<{
    icon: React.ReactNode;
    label: string;
    onClick?: () => void;
    hasChevron?: boolean;
}> = ({ icon, label, onClick, hasChevron = false }) => (
    <button
        onClick={onClick}
        className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors text-slate-700 hover:bg-slate-100"
        
    >
        <span className="text-slate-500">{icon}</span>
        <span className="flex-1 text-left">{label}</span>
        {hasChevron && <ChevronRightIcon className="h-4 w-4 text-slate-400" />}
    </button>
);

export const UserProfilePopup: React.FC<UserProfilePopupProps> = ({ onClose, onNavigateToSettings, onNavigateToReview, isCollapsed = false }) => {
    const { user, signOut } = useAuth();
    const popupRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);

    const handleSignOut = () => {
        signOut();
        // Defer closing to ensure the sign-out action is processed before unmounting.
        setTimeout(onClose, 0);
    };
    
    const handleSettingsClick = () => {
        onNavigateToSettings();
        // Defer closing to the next event loop tick. This is a common pattern
        // to prevent the component from unmounting before the navigation state update is processed.
        setTimeout(onClose, 0);
    };

    const handleReviewClick = () => {
        onNavigateToReview();
        // Defer closing to ensure navigation is processed.
        setTimeout(onClose, 0);
    };
    
    const popupClasses = isCollapsed
        ? "absolute left-full ml-2 bottom-0 w-64 bg-white rounded-xl shadow-lg border border-slate-200 p-2 z-50 animate-fade-in"
        : "absolute bottom-full mb-2 w-64 bg-white rounded-xl shadow-lg border border-slate-200 p-2 z-50 animate-fade-in";
    
    const popupStyle = isCollapsed ? {} : { left: '0.5rem' };

    return (
        <div 
            ref={popupRef} 
            className={popupClasses}
            style={popupStyle}
        >
            <div className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-500">
                <UserCircleIcon className="h-5 w-5" />
                <span className="flex-1 text-left truncate">{user?.email}</span>
            </div>

            <div className="my-1">
                <PopupItem icon={<UpgradeIcon className="h-5 w-5" />} label="Upgrade plan" />
                <PopupItem icon={<RefreshIcon className="h-5 w-5" />} label="Smart Review" onClick={handleReviewClick} />
                <PopupItem icon={<ClockIcon className="h-5 w-5" />} label="Personalization" />
                <PopupItem icon={<CogIcon className="h-5 w-5" />} label="Settings" onClick={handleSettingsClick} />
            </div>

            <hr className="border-slate-200 my-1" />
            
            <div className="my-1">
                <PopupItem icon={<QuestionMarkCircleIcon className="h-5 w-5" />} label="Help" hasChevron />
                <PopupItem icon={<LogoutIcon className="h-5 w-5" />} label="Log out" onClick={handleSignOut} />
            </div>
        </div>
    );
};
