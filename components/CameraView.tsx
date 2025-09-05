import React, { useEffect, useState, forwardRef, useRef } from 'react';

const CameraIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.55a1 1 0 011.45.89v6.22a1 1 0 01-1.45.89L15 14M5 9V5a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H7a2 2 0 01-2-2v-4l-3-2 3-2z" />
    </svg>
);

const CameraOffIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.55a1 1 0 011.45.89v6.22a1 1 0 01-1.45.89L15 14M5 9V5a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H7a2 2 0 01-2-2v-4l-3-2 3-2z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
    </svg>
);

const CaptureIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
        <path d="M12 9a3.75 3.75 0 1 0 0 7.5A3.75 3.75 0 0 0 12 9Z" />
        <path fillRule="evenodd" d="M9.344 3.071a49.52 49.52 0 0 1 5.312 0c.967.052 1.83.585 2.342 1.374a3.026 3.026 0 0 1 .42 2.657A49.52 49.52 0 0 1 18 12c0 .976-.04 1.952-.118 2.919a3.026 3.026 0 0 1-.42 2.657 3.024 3.024 0 0 1-2.342 1.374 49.52 49.52 0 0 1-5.312 0 3.024 3.024 0 0 1-2.342-1.374 3.026 3.026 0 0 1-.42-2.657A49.52 49.52 0 0 1 6 12c0-.976.04-1.952.118-2.919a3.026 3.026 0 0 1 .42-2.657 3.024 3.024 0 0 1 2.342-1.374ZM12 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12Z" clipRule="evenodd" />
    </svg>
);

interface CameraViewProps {
    isCameraEnabled: boolean;
    onCapture: () => void;
}

export const CameraView = forwardRef<HTMLVideoElement, CameraViewProps>(({ isCameraEnabled, onCapture }, ref) => {
    const [error, setError] = useState<string | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    useEffect(() => {
        const videoElement = (ref as React.RefObject<HTMLVideoElement>)?.current;
        
        const getCameraStream = async () => {
            if (!videoElement) return;
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
                streamRef.current = stream;
                videoElement.srcObject = stream;
                setError(null);
            } catch (err) {
                console.error("Error accessing camera:", err);
                setError("Camera access was denied. Please enable it in your browser settings to use this feature.");
            }
        };

        const stopCameraStream = () => {
             if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }
            if (videoElement) {
                videoElement.srcObject = null;
            }
        };

        if (isCameraEnabled) {
            getCameraStream();
        } else {
            stopCameraStream();
        }
        
        return () => {
            stopCameraStream();
        };

    }, [ref, isCameraEnabled]);

    return (
        <div className="relative w-full h-1/3 md:w-2/5 md:h-full bg-slate-900 flex items-center justify-center p-4 border-b-2 md:border-b-0 md:border-r-2 border-slate-700">
            {error ? (
                <div className="text-center text-slate-400">
                    <CameraIcon />
                    <p className="mt-4">{error}</p>
                </div>
            ) : !isCameraEnabled ? (
                <div className="text-center text-slate-400">
                    <CameraOffIcon />
                    <p className="mt-4">Camera is disabled.</p>
                </div>
            ) : (
                 <>
                    <div className="relative w-full h-full rounded-lg overflow-hidden shadow-2xl">
                        <video ref={ref} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1]"></video>
                        <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">LIVE FEED</div>
                    </div>
                    <button 
                        onClick={onCapture}
                        className="absolute bottom-6 bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white p-4 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white"
                        aria-label="Capture image"
                    >
                        <CaptureIcon />
                    </button>
                </>
            )}
        </div>
    );
});
