

import React, { useState, useRef } from 'react';

interface InputBarProps {
  isLoading: boolean;
  isListening: boolean;
  capturedImage: string | null;
  attachedFile: { name: string } | null;
  onSendMessage: (text: string) => void;
  onStartListening: () => void;
  onStopListening: () => void;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onClearCapturedImage: () => void;
  onClearAttachedFile: () => void;
}

const SendIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className || "w-6 h-6"}>
        <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
    </svg>
);

const MicIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className || "w-6 h-6"}>
        <path d="M8.25 4.5a3.75 3.75 0 1 1 7.5 0v8.25a3.75 3.75 0 1 1-7.5 0V4.5Z" />
        <path d="M6 10.5a.75.75 0 0 1 .75.75v.75a4.5 4.5 0 0 0 9 0v-.75a.75.75 0 0 1 1.5 0v.75a6 6 0 1 1-12 0v-.75A.75.75 0 0 1 6 10.5Z" />
    </svg>
);

const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className || "w-6 h-6"}>
        <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
    </svg>
);

const PaperClipIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className || "w-6 h-6"}>
        <path fillRule="evenodd" d="M18.97 3.659a2.25 2.25 0 0 0-3.182 0l-10.12 10.12a.75.75 0 0 0 1.06 1.061l10.12-10.12a.75.75 0 0 1 1.06 0a.75.75 0 0 1 0 1.06l-8.995 8.994a1.5 1.5 0 0 1-2.121 0a1.5 1.5 0 0 1 0-2.121l7.93-7.93a2.25 2.25 0 0 0-3.182-3.182l-7.93 7.93a4.5 4.5 0 0 0 6.364 6.364l8.995-8.994a2.25 2.25 0 0 0 0-3.182Z" clipRule="evenodd" />
    </svg>
);

export const InputBar: React.FC<InputBarProps> = ({ 
    isLoading, isListening, onSendMessage, onStartListening, onStopListening, 
    capturedImage, onClearCapturedImage, attachedFile, onClearAttachedFile, onFileChange 
}) => {
  const [text, setText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if ((text.trim() || capturedImage || attachedFile) && !isLoading) {
      onSendMessage(text);
      setText('');
    }
  };
  
  const handleMicClick = () => {
    if (isListening) {
        onStopListening();
    } else {
        onStartListening();
    }
  };

  const handleAttachClick = () => {
      fileInputRef.current?.click();
  };

  return (
    <div className="p-4 border-t border-slate-700 bg-slate-900/50">
      {capturedImage && (
            <div className="relative w-24 h-24 mb-2 rounded-lg overflow-hidden border-2 border-cyan-500">
                <img src={`data:image/jpeg;base64,${capturedImage}`} alt="Captured prompt" className="w-full h-full object-cover" />
                <button 
                    onClick={onClearCapturedImage}
                    className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-black/80"
                    aria-label="Clear captured image"
                >
                    <CloseIcon className="w-4 h-4" />
                </button>
            </div>
      )}
      {attachedFile && (
            <div className="relative flex items-center gap-3 p-2 mb-2 rounded-lg border-2 border-cyan-500 bg-slate-700/50 max-w-xs">
                <PaperClipIcon className="w-5 h-5 text-slate-300 flex-shrink-0"/>
                <p className="text-sm text-slate-200 truncate" title={attachedFile.name}>{attachedFile.name}</p>
                <button 
                    onClick={onClearAttachedFile}
                    className="ml-auto bg-black/50 text-white rounded-full p-1 hover:bg-black/80 flex-shrink-0"
                    aria-label="Clear attached file"
                >
                    <CloseIcon className="w-4 h-4" />
                </button>
            </div>
      )}
      <form onSubmit={handleSend} className="flex items-center space-x-3">
        <input
          ref={fileInputRef}
          type="file"
          onChange={onFileChange}
          accept="image/*,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="hidden"
        />
        <button
            type="button"
            onClick={handleAttachClick}
            disabled={isLoading || isListening}
            className="p-3 rounded-full text-slate-300 hover:bg-slate-700 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Attach file"
        >
            <PaperClipIcon />
        </button>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={
            isLoading ? "Waiting for response..." 
            : capturedImage ? "Tambahkan prompt untuk gambar Anda..." 
            : attachedFile ? "Tambahkan prompt untuk file Anda..."
            : "Type a message or use the mic..."
          }
          disabled={isLoading || isListening}
          className="flex-1 bg-slate-700 border border-slate-600 rounded-full py-3 px-5 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition duration-200"
        />
        <button
            type="button"
            onClick={handleMicClick}
            disabled={isLoading}
            className={`relative p-3 rounded-full transition-colors duration-200 ${
                isListening 
                ? 'bg-red-500 text-white animate-pulse' 
                : 'bg-cyan-500 text-white hover:bg-cyan-400'
            } disabled:bg-slate-600 disabled:cursor-not-allowed`}
        >
            <MicIcon />
            {isListening && (
                 <span className="absolute inset-0 rounded-full bg-red-500 opacity-75 animate-ping"></span>
            )}
        </button>
        <button
          type="submit"
          disabled={isLoading || (text.trim() === '' && !capturedImage && !attachedFile)}
          className="p-3 bg-cyan-500 rounded-full text-white hover:bg-cyan-400 disabled:bg-slate-600 disabled:cursor-not-allowed transition duration-200"
        >
          <SendIcon />
        </button>
      </form>
    </div>
  );
};
