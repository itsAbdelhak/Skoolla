import React, { useRef, useCallback, useState, useEffect } from 'react';
import { DocumentTextIcon, SparklesIcon, CheckCircleIcon, UploadIcon } from './icons';

interface FileInfo {
  dataUrl: string;
  name: string;
  type: string;
}

interface InteractiveUploadProps {
  onFilesUpload?: (files: FileInfo[]) => void;
  processingState?: 'analyzing' | 'generating' | 'ready' | null;
}

const analyzingMessages = [
    "Brewing a fresh pot of knowledge...",
    "My circuits are buzzing with this new info!",
    "Scanning pages... Ah, this looks interesting.",
    "Untangling the core concepts for you.",
    "Making friends with your PDF. It's a bit shy.",
    "Identifying keywords and important topics...",
];

const generatingMessages = [
    "Crafting your personalized learning path...",
    "Consulting the digital library gnomes...",
    "Assembling the perfect study plan just for you.",
    "Almost there, just polishing the details!",
];

const useRotatingMessage = (messages: string[], interval = 3000) => {
    const [index, setIndex] = useState(() => Math.floor(Math.random() * messages.length));
    useEffect(() => {
        const timer = setInterval(() => {
            if (messages.length > 0) {
              setIndex(prev => (prev + 1) % messages.length);
            }
        }, interval);
        return () => clearInterval(timer);
    }, [messages, interval]);
    return messages[index] || '';
};


export const InteractiveUpload: React.FC<InteractiveUploadProps> = ({ 
    onFilesUpload, 
    processingState = null,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const analyzingMessage = useRotatingMessage(analyzingMessages);
  const generatingMessage = useRotatingMessage(generatingMessages);

  const processFiles = useCallback((fileList: FileList | null) => {
    if (!fileList || fileList.length === 0 || !onFilesUpload) return;
    
    const files = Array.from(fileList);
    const filePromises = files.map(file => {
        return new Promise<FileInfo>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const dataUrl = e.target?.result as string;
                resolve({ dataUrl, name: file.name, type: file.type });
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    });

    Promise.all(filePromises)
      .then(onFilesUpload)
      .catch(err => console.error("Error reading files:", err));
  }, [onFilesUpload]);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(event.target.files);
    if (event.target) event.target.value = '';
  }, [processFiles]);
  
  const triggerFileInput = () => fileInputRef.current?.click();
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  };

  const isProcessing = processingState !== null;
  
  const getOrbContent = () => {
    if (processingState === 'analyzing') {
        return <DocumentTextIcon className="h-16 w-16 text-white animate-spin-slow" />;
    }
    if (processingState === 'generating') {
        return <SparklesIcon className="h-16 w-16 text-white animate-sway" />;
    }
    if (processingState === 'ready') {
        return <CheckCircleIcon className="h-20 w-20 text-white" />;
    }
    return <UploadIcon className={`h-16 w-16 text-white transition-transform duration-300 ${isDragging ? 'scale-110' : ''}`} />;
  };

  const getOrbClasses = () => {
     let classes = "relative h-48 w-48 rounded-full flex items-center justify-center transition-all duration-300 ease-in-out shadow-lg mx-auto";
     if (processingState === 'analyzing') return classes + " bg-blue-500 animate-pulse-fast";
     if (processingState === 'generating') return classes + " bg-purple-500 animate-pulse-fast";
     if (processingState === 'ready') return classes + " bg-accent";
     return classes + (isDragging ? " bg-primary-dark scale-105" : " bg-gradient-to-br from-blue-500 to-purple-600");
  };

  const getMessage = () => {
    if (processingState === 'analyzing') return analyzingMessage;
    if (processingState === 'generating') return generatingMessage;
    if (processingState === 'ready') return "Your personalized study session is ready!";
    if (isDragging) return "Release to upload your files!";
    return "Drag & drop files here to get started.";
  }

  if (!onFilesUpload && !isProcessing) return null;

  return (
    <div 
        className={`w-full max-w-lg mx-auto p-4 transition-all duration-300 ${onFilesUpload ? 'cursor-pointer' : ''}`}
        onDragOver={onFilesUpload ? handleDragOver : undefined}
        onDragLeave={onFilesUpload ? handleDragLeave : undefined}
        onDrop={onFilesUpload ? handleDrop : undefined}
        onClick={onFilesUpload ? triggerFileInput : undefined}
    >
        <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept=".txt,.md,.pdf,.png,.jpg,.jpeg,.webp"
            multiple
        />
        <div className="relative">
            <div className={getOrbClasses()}>
                {getOrbContent()}
            </div>
            {!isProcessing && (
                <>
                    <div className="absolute top-0 left-1/4 h-8 w-8 bg-yellow-300/80 rounded-full animate-blob blur-sm"></div>
                    <div className="absolute bottom-0 right-1/4 h-12 w-12 bg-pink-300/80 rounded-full animate-blob" style={{animationDelay: '2s'}}></div>
                    <div className="absolute top-1/2 left-1/5 h-6 w-6 bg-teal-300/80 rounded-full animate-blob" style={{animationDelay: '4s'}}></div>
                </>
            )}
        </div>
        <p className="font-semibold text-slate-600 mt-6 h-6">{getMessage()}</p>
    </div>
  );
};