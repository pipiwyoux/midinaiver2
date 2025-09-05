import React from 'react';

interface WelcomeScreenProps {
  onStart: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart }) => {
  return (
    <div className="flex items-center justify-center h-screen bg-slate-900 text-white">
      <div className="text-center p-6 sm:p-10 bg-slate-800 rounded-xl shadow-2xl max-w-lg mx-auto border border-slate-700">
        <h1 className="text-3xl sm:text-4xl font-bold text-cyan-400 mb-4">
          Selamat Datang di MIDIN AI
        </h1>
        <p className="text-slate-300 mb-8 text-lg">
          Rasakan masa depan percakapan. Berinteraksi dengan AI yang bisa melihat dan mendengar, dipersembahkan oleh Tim Tolopani Kemenag Kota Gorontalo.
        </p>
        <p className="text-sm text-slate-400 mb-8">
            Untuk memulai, mohon berikan izin akses kamera dan mikrofon saat diminta.
        </p>
        <button
          onClick={onStart}
          className="bg-cyan-500 text-white font-bold py-3 px-8 rounded-full hover:bg-cyan-400 transition-all duration-300 transform hover:scale-105 shadow-lg focus:outline-none focus:ring-4 focus:ring-cyan-500/50"
        >
          Mulai Percakapan
        </button>
      </div>
    </div>
  );
};