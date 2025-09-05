// FIX: Removed the self-import of 'Role'. The type is defined in this file, so importing it causes a naming conflict.

// FIX: Add SpeechRecognition types to Window object for cross-browser compatibility.
// These APIs are not yet part of the standard TypeScript DOM library.
// FIX: Export the SpeechRecognition interface to make it accessible in other modules.
export interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (event: any) => void;
  onerror: (event: any) => void;
  start: () => void;
  stop: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: { new(): SpeechRecognition };
    webkitSpeechRecognition: { new(): SpeechRecognition };
  }
}

export type Role = 'user' | 'model';

export interface Message {
  text: string;
}

export interface ChatMessage {
  id: number;
  role: Role;
  text: string;
  timestamp: Date;
  imageUrl?: string; // For model-generated images
  promptImageUrl?: string; // For user-captured images
  attachedFile?: { name: string; type: string }; // For user-uploaded files
}
