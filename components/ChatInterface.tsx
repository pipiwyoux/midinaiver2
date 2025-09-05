import React, { useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { MessageBubble } from './MessageBubble';
import { InputBar } from './InputBar';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  isLoading: boolean;
  isListening: boolean;
  isTtsEnabled: boolean;
  isCameraEnabled: boolean;
  error: string | null;
  voices: SpeechSynthesisVoice[];
  selectedVoiceUri: string | null;
  capturedImage: string | null;
  attachedFile: { name: string; mimeType: string; data: string; } | null;
  onSendMessage: (text: string) => void;
  onStartListening: () => void;
  onStopListening: () => void;
  onToggleTts: () => void;
  onToggleCamera: () => void;
  onVoiceChange: (voiceURI: string) => void;
  onImageClick: (imageUrl: string) => void;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onClearCapturedImage: () => void;
  onClearAttachedFile: () => void;
}

const SpeakerHighIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 0 0 1.5 12c0 .898.121 1.768.348 2.595.341 1.24 1.518 1.905 2.66 1.905H6.44l4.5 4.5c.945.945 2.56.276 2.56-1.06V4.06ZM18.584 5.106a.75.75 0 0 1 1.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 0 1-1.06-1.06 8.25 8.25 0 0 0 0-11.668.75.75 0 0 1 0-1.06Z" />
        <path d="M15.932 7.757a.75.75 0 0 1 1.061 0 6 6 0 0 1 0 8.486.75.75 0 0 1-1.06-1.061 4.5 4.5 0 0 0 0-6.364.75.75 0 0 1 0-1.06Z" />
    </svg>
);

const SpeakerMuteIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 0 0 1.5 12c0 .898.121 1.768.348 2.595.341 1.24 1.518 1.905 2.66 1.905H6.44l4.5 4.5c.945.945 2.56.276 2.56-1.06V4.06Z" />
        <path d="M17.28 9.22a.75.75 0 0 0-1.06 1.06l2.12 2.12-2.12 2.12a.75.75 0 1 0 1.06 1.06l2.12-2.12 2.12 2.12a.75.75 0 1 0 1.06-1.06L20.56 12l2.12-2.12a.75.75 0 0 0-1.06-1.06L19.5 10.94l-2.22-2.22Z" />
    </svg>
);

const CameraOnIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M4.5 4.5a3 3 0 0 0-3 3v9a3 3 0 0 0 3 3h8.25a3 3 0 0 0 3-3v-9a3 3 0 0 0-3-3H4.5ZM19.94 18.75l-2.69-2.69V7.94l2.69-2.69c.944-.945 2.56-.276 2.56 1.06v11.38c0 1.336-1.616 2.005-2.56 1.06Z" />
    </svg>
);

const CameraOffIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path d="M3.53 2.47a.75.75 0 0 0-1.06 1.06l18 18a.75.75 0 0 0 1.06-1.06l-18-18ZM20.25 5.507v11.38a.75.75 0 0 1-1.28.53l-2.22-2.22a.75.75 0 0 0-.53-.22H4.5a3 3 0 0 1-3-3v-9a3 3 0 0 1 3-3h8.25a3 3 0 0 1 3 3v.845l2.47-2.47a.75.75 0 0 1 1.28.53Z" />
    </svg>
);


export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  isLoading,
  isListening,
  isTtsEnabled,
  isCameraEnabled,
  error,
  voices,
  selectedVoiceUri,
  capturedImage,
  attachedFile,
  onSendMessage,
  onStartListening,
  onStopListening,
  onToggleTts,
  onToggleCamera,
  onVoiceChange,
  onImageClick,
  onFileChange,
  onClearCapturedImage,
  onClearAttachedFile
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  return (
    <div className="w-full h-2/3 md:w-3/5 md:h-full flex flex-col bg-slate-800">
      <header className="p-4 border-b border-slate-700 shadow-md bg-slate-900/50 backdrop-blur-sm flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-4">
        <div>
            <h1 className="text-xl font-bold text-cyan-400">MIDIN AI</h1>
            <p className="text-xs text-slate-400">Dibuat oleh Tim Tolopani Kemenag Kota Gorontalo</p>
        </div>
        <div className="flex items-center gap-2">
            {voices.length > 0 && selectedVoiceUri && (
                <select
                    value={selectedVoiceUri}
                    onChange={(e) => onVoiceChange(e.target.value)}
                    disabled={!isTtsEnabled}
                    className="bg-slate-700 border border-slate-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Select voice"
                >
                    {voices.map(voice => (
                        <option key={voice.voiceURI} value={voice.voiceURI}>
                            {voice.name} ({voice.lang})
                        </option>
                    ))}
                </select>
            )}
            <button
                onClick={onToggleCamera}
                className="p-2 rounded-full text-slate-300 hover:bg-slate-700 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500"
                aria-label={isCameraEnabled ? "Disable camera" : "Enable camera"}
            >
                {isCameraEnabled ? <CameraOnIcon /> : <CameraOffIcon />}
            </button>
            <button 
                onClick={onToggleTts} 
                className="p-2 rounded-full text-slate-300 hover:bg-slate-700 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500"
                aria-label={isTtsEnabled ? "Disable text-to-speech" : "Enable text-to-speech"}
            >
                {isTtsEnabled ? <SpeakerHighIcon /> : <SpeakerMuteIcon />}
            </button>
        </div>
      </header>
      
      {error && (
        <div className="p-2 bg-red-800 text-white text-center text-sm">
            {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg, index) => (
            <MessageBubble 
                key={msg.id} 
                message={msg} 
                isStreaming={isLoading && index === messages.length -1 && msg.role === 'model'}
                onImageClick={onImageClick}
            />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <InputBar
        isLoading={isLoading}
        isListening={isListening}
        onSendMessage={onSendMessage}
        onStartListening={onStartListening}
        onStopListening={onStopListening}
        capturedImage={capturedImage}
        attachedFile={attachedFile}
        onFileChange={onFileChange}
        onClearCapturedImage={onClearCapturedImage}
        onClearAttachedFile={onClearAttachedFile}
      />
    </div>
  );
};
