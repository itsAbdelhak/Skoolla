import React, { useState } from 'react';
import { XIcon } from './icons';
import { InteractiveUpload } from './InteractiveUpload';

interface FileInfo { dataUrl: string; name: string; type: string; }

interface AddDocumentsModalProps {
    onClose: () => void;
    onUpload: (files: FileInfo[]) => Promise<void>;
}

export const AddDocumentsModal: React.FC<AddDocumentsModalProps> = ({ onClose, onUpload }) => {
    const [isUploading, setIsUploading] = useState(false);

    const handleFiles = async (files: FileInfo[]) => {
        if (files.length === 0) return;
        setIsUploading(true);
        await onUpload(files);
        // The parent component (CourseTutor) is responsible for closing the modal
        // and handling errors, so we don't need to change state here as the
        // component will be unmounted.
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
            <div className="relative bg-white/50 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl w-full max-w-3xl p-6 sm:p-8 transform transition-all text-center" role="document">
                <button onClick={onClose} disabled={isUploading} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors p-1 disabled:opacity-50" aria-label="Close">
                    <XIcon className="h-6 w-6" />
                </button>
                
                 <div className="mb-6">
                    <h2 className="font-display text-2xl font-bold text-slate-800">Add More Materials</h2>
                    <p className="text-slate-500 mt-1">Upload more documents to expand your study plan.</p>
                </div>

                <InteractiveUpload
                    onFilesUpload={handleFiles}
                    processingState={isUploading ? 'analyzing' : null}
                />
            </div>
        </div>
    );
};