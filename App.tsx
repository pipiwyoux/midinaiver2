import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, Chat, Part, Modality } from '@google/genai';
import { CameraView } from './components/CameraView';
import { ChatInterface } from './components/ChatInterface';
import { WelcomeScreen } from './components/WelcomeScreen';
import { ImagePreviewModal } from './components/ImagePreviewModal';
import { ChatMessage, SpeechRecognition } from './types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

type AttachedFile = {
    name: string;
    mimeType: string;
    data: string; // base64 string
};

const App: React.FC = () => {
    // UI state
    const [hasStarted, setHasStarted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [attachedFile, setAttachedFile] = useState<AttachedFile | null>(null);

    // Chat state
    const [chat, setChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [lastGeneratedImage, setLastGeneratedImage] = useState<string | null>(null);


    // Media and accessibility state
    const [isCameraEnabled, setIsCameraEnabled] = useState(true);
    const [isListening, setIsListening] = useState(false);
    const [isTtsEnabled, setIsTtsEnabled] = useState(true);
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [selectedVoiceUri, setSelectedVoiceUri] = useState<string | null>(null);

    // Refs
    const videoRef = useRef<HTMLVideoElement>(null);
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    
    const speakText = useCallback((text: string, voiceURI?: string) => {
        if (!isTtsEnabled || !text) return;

        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text.replace(/[*`#]/g, ''));
        
        const uriToUse = voiceURI || selectedVoiceUri;
        const selectedVoice = voices.find(v => v.voiceURI === uriToUse);

        if (selectedVoice) {
            utterance.voice = selectedVoice;
            utterance.lang = selectedVoice.lang;
        }
        
        window.speechSynthesis.speak(utterance);
    }, [isTtsEnabled, voices, selectedVoiceUri]);

    // Initialize TTS voices and set default to Indonesian
    useEffect(() => {
        const populateVoiceList = () => {
            const availableVoices = window.speechSynthesis.getVoices();
            if (availableVoices.length > 0) {
                setVoices(availableVoices);
                if (!selectedVoiceUri) {
                    const defaultVoice = 
                        availableVoices.find(voice => voice.lang === 'id-ID' && voice.name.includes('Google')) ||
                        availableVoices.find(voice => voice.lang === 'id-ID') || 
                        availableVoices[0];
                    if (defaultVoice) {
                        setSelectedVoiceUri(defaultVoice.voiceURI);
                    }
                }
            }
        };

        populateVoiceList();
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
            window.speechSynthesis.onvoiceschanged = populateVoiceList;
        }
    }, [selectedVoiceUri]);
    
    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
             try {
                recognitionRef.current.stop();
             } catch(e) {
                console.warn("Speech recognition could not be stopped:", e);
             } finally {
                setIsListening(false);
             }
        }
    },[]);

    const captureFrame = useCallback((): string | null => {
        if (!isCameraEnabled || !videoRef.current) return null;
        const video = videoRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.scale(-1, 1);
            ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
            return canvas.toDataURL('image/jpeg').split(',')[1];
        }
        return null;
    }, [isCameraEnabled]);

    const handleSendMessage = useCallback(async (text: string) => {
        if (isLoading || (!text.trim() && !capturedImage && !attachedFile)) return;

        setIsLoading(true);
        setError(null);
        stopListening();

        const userMessage: ChatMessage = {
            id: Date.now(),
            role: 'user',
            text,
            timestamp: new Date(),
            promptImageUrl: capturedImage ? `data:image/jpeg;base64,${capturedImage}` : undefined,
            attachedFile: attachedFile ? { name: attachedFile.name, type: attachedFile.mimeType } : undefined,
        };
        setMessages(prev => [...prev, userMessage]);
        
        // Store and clear attachments immediately
        const imageToSend = capturedImage;
        const fileToSend = attachedFile;
        setCapturedImage(null);
        setAttachedFile(null);

        const generationKeywords = ["buatkan gambar", "generate gambar", "create an image", "lukiskan"];
        const editKeywords = ["ubah", "tambahkan", "ganti", "edit", "add", "change", "make", "jadikan"];
        
        const generationKeyword = generationKeywords.find(keyword => text.toLowerCase().includes(keyword));
        const editKeyword = editKeywords.find(keyword => text.toLowerCase().includes(keyword));

        const modelMessageId = Date.now() + 1;

        if (fileToSend) {
            // Priority 1: Analyze attached file
            try {
                 if (!chat) throw new Error("Chat is not initialized.");

                const textPart = { text: text || `Analisis file ini: ${fileToSend.name}` };
                const filePart = { inlineData: { data: fileToSend.data, mimeType: fileToSend.mimeType } };

                setMessages(prev => [...prev, { id: modelMessageId, role: 'model', text: '', timestamp: new Date() }]);
                let streamedText = "";
                const stream = await chat.sendMessageStream({ message: [textPart, filePart] });

                for await (const chunk of stream) {
                    streamedText += chunk.text ?? '';
                    setMessages(prev => prev.map(msg => 
                        msg.id === modelMessageId ? { ...msg, text: streamedText } : msg
                    ));
                }
                if (streamedText) speakText(streamedText);
            } catch (err: any) {
                console.error("File analysis failed:", err);
                const errorMessage = "Maaf, terjadi kesalahan saat menganalisis file.";
                setError(errorMessage);
                setMessages(prev => prev.map(msg => 
                    msg.id === modelMessageId ? { ...msg, text: errorMessage } : msg
                ));
            } finally {
                setIsLoading(false);
            }
        } else if (imageToSend) {
            // Priority 2: Process captured image
            const placeholderMessage: ChatMessage = {
                id: modelMessageId,
                role: 'model',
                text: `Baik, saya akan memproses gambar Anda dengan prompt: "${text}"...`,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, placeholderMessage]);
            speakText(placeholderMessage.text);

            try {
                const imagePart = { inlineData: { data: imageToSend, mimeType: 'image/jpeg' } };
                const textPart = { text: text || "Jelaskan gambar ini." };

                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash-image-preview',
                    contents: { parts: [imagePart, textPart] },
                    config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
                });
                
                let newImageBase64: string | null = null;
                let responseText = "Berikut adalah hasilnya.";

                for (const part of response.candidates[0].content.parts) {
                    if (part.inlineData) {
                        newImageBase64 = part.inlineData.data;
                    } else if (part.text) {
                        responseText = part.text;
                    }
                }

                if (newImageBase64) {
                    setLastGeneratedImage(newImageBase64); // Update with the new image
                    const imageUrl = `data:image/jpeg;base64,${newImageBase64}`;
                    const imageMessage: ChatMessage = {
                        id: modelMessageId,
                        role: 'model',
                        text: responseText,
                        imageUrl: imageUrl,
                        timestamp: new Date()
                    };
                    setMessages(prev => prev.map(msg => msg.id === modelMessageId ? imageMessage : msg));
                    speakText(responseText);
                } else {
                    setMessages(prev => prev.map(msg => 
                        msg.id === modelMessageId ? { ...msg, text: responseText } : msg
                    ));
                    speakText(responseText);
                }

            } catch (err: any) {
                console.error("Image processing failed:", err);
                const errorMessage = "Maaf, terjadi kesalahan saat memproses gambar.";
                setError(errorMessage);
                setMessages(prev => prev.map(msg => 
                    msg.id === modelMessageId ? { ...msg, text: errorMessage } : msg
                ));
                speakText(errorMessage);
            } finally {
                setIsLoading(false);
            }

        } else if (generationKeyword) {
            const imagePrompt = text.substring(text.toLowerCase().indexOf(generationKeyword) + generationKeyword.length).trim();
            const placeholderMessage: ChatMessage = {
                id: modelMessageId,
                role: 'model',
                text: `Baik, saya akan membuatkan gambar: "${imagePrompt}"...`,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, placeholderMessage]);
            speakText(placeholderMessage.text);

            try {
                const response = await ai.models.generateImages({
                    model: 'imagen-4.0-generate-001',
                    prompt: imagePrompt,
                    config: { numberOfImages: 1, outputMimeType: 'image/jpeg' },
                });

                const base64ImageBytes = response.generatedImages[0].image.imageBytes;
                setLastGeneratedImage(base64ImageBytes); // Save for editing
                const imageUrl = `data:image/jpeg;base64,${base64ImageBytes}`;

                const imageMessage: ChatMessage = {
                    id: modelMessageId,
                    role: 'model',
                    text: 'Tentu, ini gambarnya.',
                    imageUrl: imageUrl,
                    timestamp: new Date()
                };
                setMessages(prev => prev.map(msg => msg.id === modelMessageId ? imageMessage : msg));
                speakText('Tentu, ini gambarnya.');

            } catch (err: any) {
                console.error("Image generation failed:", err);
                let errorMessage = "Maaf, saya tidak dapat membuat gambar saat ini.";
                if (err.message && err.message.includes('Responsible AI practices')) {
                    errorMessage = "Maaf, gambar tidak dapat dibuat karena permintaan Anda melanggar kebijakan konten kami. Silakan coba dengan deskripsi yang berbeda.";
                }
                setError(errorMessage);
                setMessages(prev => prev.map(msg => 
                    msg.id === modelMessageId ? { ...msg, text: errorMessage } : msg
                ));
                speakText(errorMessage);
            } finally {
                setIsLoading(false);
            }
        } else if (editKeyword && lastGeneratedImage) {
             const placeholderMessage: ChatMessage = {
                id: modelMessageId,
                role: 'model',
                text: `Baik, saya akan mengedit gambar sebelumnya...`,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, placeholderMessage]);
            speakText(placeholderMessage.text);

            try {
                const imagePart = { inlineData: { data: lastGeneratedImage, mimeType: 'image/jpeg' } };
                const textPart = { text: text };

                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash-image-preview',
                    contents: { parts: [imagePart, textPart] },
                    config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
                });
                
                let newImageBase64: string | null = null;
                let responseText = "Berikut adalah gambar yang telah diedit.";

                for (const part of response.candidates[0].content.parts) {
                    if (part.inlineData) {
                        newImageBase64 = part.inlineData.data;
                    } else if (part.text) {
                        responseText = part.text;
                    }
                }

                if (newImageBase64) {
                    setLastGeneratedImage(newImageBase64); // Update with the new image
                    const imageUrl = `data:image/jpeg;base64,${newImageBase64}`;
                    const imageMessage: ChatMessage = {
                        id: modelMessageId,
                        role: 'model',
                        text: responseText,
                        imageUrl: imageUrl,
                        timestamp: new Date()
                    };
                    setMessages(prev => prev.map(msg => msg.id === modelMessageId ? imageMessage : msg));
                    speakText(responseText);
                } else {
                    throw new Error("Model tidak menghasilkan gambar baru.");
                }

            } catch (err: any) {
                console.error("Image editing failed:", err);
                const errorMessage = "Maaf, terjadi kesalahan saat mengedit gambar.";
                setError(errorMessage);
                setMessages(prev => prev.map(msg => 
                    msg.id === modelMessageId ? { ...msg, text: errorMessage } : msg
                ));
                speakText(errorMessage);
            } finally {
                setIsLoading(false);
            }

        } else {
            // Regular chat flow
            let streamedText = "";

            try {
                if (!chat) throw new Error("Chat is not initialized.");
                
                const parts: Part[] = [];
                let textForModel = text;

                const visualKeywords = ["lihat", "gambarkan", "apa ini", "kamera", "gambar ini"];
                const isVisualQuery = isCameraEnabled && visualKeywords.some(kw => text.toLowerCase().includes(kw));
                
                if (isVisualQuery) {
                    const imageBase64 = captureFrame();
                    if (imageBase64) {
                        textForModel = `Dengan mempertimbangkan riwayat obrolan untuk konteks, dan berdasarkan gambar baru dari kamera ini, jawablah pertanyaan berikut: "${text}"`;
                        parts.push({ text: textForModel });
                        parts.push({ inlineData: { data: imageBase64, mimeType: 'image/jpeg' } });
                    } else {
                        parts.push({ text: textForModel });
                    }
                } else {
                    parts.push({ text: textForModel });
                }

                setMessages(prev => [...prev, { id: modelMessageId, role: 'model', text: '', timestamp: new Date() }]);
                
                const stream = await chat.sendMessageStream({ message: parts });

                for await (const chunk of stream) {
                    streamedText += chunk.text ?? '';
                    setMessages(prev => prev.map(msg => 
                        msg.id === modelMessageId ? { ...msg, text: streamedText } : msg
                    ));
                }

                if (streamedText) speakText(streamedText);

            } catch (err: any) {
                console.error("Error sending message:", err);
                const errorMessage = `Maaf, terjadi kesalahan. ${err.message || 'Silakan coba lagi.'}`;
                setError(errorMessage);
                setMessages(prev => prev.map(msg => 
                    msg.id === modelMessageId ? { ...msg, text: errorMessage, role: 'model' } : msg
                ));
            } finally {
                setIsLoading(false);
            }
        }
    }, [chat, isCameraEnabled, isLoading, stopListening, speakText, lastGeneratedImage, capturedImage, attachedFile, captureFrame]);

    // Initialize Speech Recognition
    useEffect(() => {
        const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognitionAPI) {
            console.warn("Speech Recognition API is not supported in this browser.");
            return;
        }
        
        const recognition = new SpeechRecognitionAPI();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = voices.find(v => v.voiceURI === selectedVoiceUri)?.lang || 'id-ID';

        recognition.onresult = (event: any) => {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                }
            }
            if (finalTranscript) {
                handleSendMessage(finalTranscript.trim());
            }
        };

        recognition.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            setError(`Kesalahan pengenalan suara: ${event.error}`);
            stopListening();
        };
        
        recognitionRef.current = recognition;

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, [handleSendMessage, stopListening, voices, selectedVoiceUri]);

    const startListening = () => {
        window.speechSynthesis.cancel();
        
        if (recognitionRef.current && !isListening) {
            try {
                recognitionRef.current.start();
                setIsListening(true);
            } catch (e) {
                 console.error("Could not start speech recognition:", e);
                 setError("Tidak dapat memulai pengenalan suara. Mungkin sudah berjalan.");
            }
        }
    };
    
    // Start the app and initialize chat
    const handleStart = () => {
        const newChat = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction: "Anda adalah asisten AI yang membantu dan kreatif bernama MIDIN AI. Anda diciptakan oleh Tim Tolopani Kemenag Kota Gorontalo. Anda harus selalu merespons dalam Bahasa Indonesia. Jadilah ramah dan komunikatif. Anda dapat melihat dunia melalui kamera pengguna dan mendeskripsikan apa yang Anda lihat jika ditanya. Anda juga dapat membuat dan mengedit gambar. Setelah membuat gambar, Anda dapat memberikan instruksi lanjutan untuk mengubahnya. Jangan pernah menyebut Google atau Gemini."
            }
        });
        setChat(newChat);

        const welcomeMessage: ChatMessage = {
            id: Date.now(),
            role: 'model',
            text: "Halo! Saya MIDIN AI. Ada yang bisa saya bantu hari ini? Anda bisa mengetik, menggunakan suara, atau menunjukkan sesuatu dengan kamera Anda.",
            timestamp: new Date()
        };
        setMessages([welcomeMessage]);
        speakText(welcomeMessage.text);
        setHasStarted(true);
    };
    
    const handleCapture = useCallback(() => {
        if (!isCameraEnabled) return;
        const frame = captureFrame();
        if (frame) {
            setAttachedFile(null); // Clear any attached file
            setCapturedImage(frame);
        }
    }, [isCameraEnabled, captureFrame]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const base64 = (e.target?.result as string).split(',')[1];
            if (base64) {
                setCapturedImage(null); // Clear any captured image
                setAttachedFile({
                    name: file.name,
                    mimeType: file.type,
                    data: base64,
                });
            }
        };
        reader.onerror = (err) => {
            console.error("File reading error:", err);
            setError("Gagal membaca file yang dipilih.");
        };
        reader.readAsDataURL(file);
    };

    const handleVoiceChange = useCallback((voiceURI: string) => {
        const selectedVoice = voices.find(v => v.voiceURI === voiceURI);
        if (!selectedVoice) return;
        
        window.speechSynthesis.cancel();
        stopListening();

        setSelectedVoiceUri(voiceURI);
        const newLang = selectedVoice.lang;

        if (recognitionRef.current) {
            recognitionRef.current.lang = newLang;
        }

        const newSystemInstruction = `Anda adalah asisten AI yang membantu dan kreatif bernama MIDIN AI. Anda diciptakan oleh Tim Tolopani Kemenag Kota Gorontalo. PENTING: Anda harus selalu merespons secara eksklusif dalam bahasa dengan tag IETF "${newLang}". Jadilah ramah dan komunikatif. Anda dapat melihat dunia melalui kamera pengguna dan mendeskripsikan apa yang Anda lihat jika ditanya. Anda juga dapat membuat dan mengedit gambar. Setelah membuat gambar, Anda dapat memberikan instruksi lanjutan untuk mengubahnya. Jangan pernah menyebut Google atau Gemini.`;

        const newChat = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: { systemInstruction: newSystemInstruction }
        });
        setChat(newChat);

        const langName = selectedVoice.name.split('(')[0].trim();
        const notificationMessage: ChatMessage = {
            id: Date.now(),
            role: 'model',
            text: `[Sistem] Bahasa telah diubah ke ${langName}.`,
            timestamp: new Date()
        };
        setMessages([notificationMessage]);
        
        speakText(notificationMessage.text, voiceURI);

    }, [voices, stopListening, speakText]);
    
    if (!hasStarted) {
        return <WelcomeScreen onStart={handleStart} />;
    }

    return (
        <div className="h-screen w-screen bg-slate-900 text-white flex flex-col md:flex-row font-sans">
            <CameraView 
                ref={videoRef} 
                isCameraEnabled={isCameraEnabled} 
                onCapture={handleCapture} 
            />
            <ChatInterface
                messages={messages}
                isLoading={isLoading}
                isListening={isListening}
                isTtsEnabled={isTtsEnabled}
                isCameraEnabled={isCameraEnabled}
                error={error}
                voices={voices}
                selectedVoiceUri={selectedVoiceUri}
                capturedImage={capturedImage}
                attachedFile={attachedFile}
                onSendMessage={handleSendMessage}
                onStartListening={startListening}
                onStopListening={stopListening}
                onToggleTts={() => setIsTtsEnabled(prev => !prev)}
                onToggleCamera={() => setIsCameraEnabled(prev => !prev)}
                onVoiceChange={handleVoiceChange}
                onImageClick={setPreviewImageUrl}
                onFileChange={handleFileChange}
                onClearCapturedImage={() => setCapturedImage(null)}
                onClearAttachedFile={() => setAttachedFile(null)}
            />
            {previewImageUrl && (
                <ImagePreviewModal imageUrl={previewImageUrl} onClose={() => setPreviewImageUrl(null)} />
            )}
        </div>
    );
};

export default App;
