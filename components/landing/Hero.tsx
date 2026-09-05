'use client';

import React from 'react';
import { Plus, Search, CheckCircle2, Mic, MapPin, Sparkles } from 'lucide-react';

interface HeroProps {
  onSubmitClick: () => void;
  onTrackClick: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onSubmitClick, onTrackClick }) => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-orange-50/40 via-white to-white pt-12 pb-20 md:pt-20 md:pb-28">
      {/* Subtle background decorative dots */}
      <div className="absolute top-8 right-1/4 w-72 h-72 bg-orange-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-10 w-96 h-96 bg-amber-100/30 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Headline and Call-To-Actions */}
          <div className="lg:col-span-6 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-100/70 border border-orange-200/80 text-orange-800 text-xs font-semibold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-orange-600 animate-pulse" />
              <span>Powered by Google Gemini 2.5 Flash & PostGIS</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 tracking-tight leading-[1.12]">
              AI-Powered <br />
              <span className="text-orange-600">Grievance Redressal</span> <br />
              & Triage System
            </h1>

            <p className="text-base sm:text-lg text-gray-600 max-w-xl leading-relaxed">
              Submit issues in your area via text, voice or image. Our AI will analyze
              and route it to the right department for faster resolution.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4">
              <button
                onClick={onSubmitClick}
                className="inline-flex items-center gap-2 px-6 py-3.5 text-base font-semibold text-white bg-orange-600 hover:bg-orange-700 active:scale-98 rounded-xl shadow-lg shadow-orange-600/30 transition-all cursor-pointer"
              >
                <Plus className="w-5 h-5 stroke-[2.5]" />
                Submit a Complaint
              </button>

              <button
                onClick={onTrackClick}
                className="inline-flex items-center gap-2 px-6 py-3.5 text-base font-semibold text-gray-700 bg-white hover:bg-gray-50 active:scale-98 border border-gray-200/90 rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <Search className="w-4 h-4 text-gray-500" />
                Track Your Complaint
              </button>
            </div>

            {/* Micro proof counter */}
            <div className="pt-4 flex items-center gap-6 text-xs font-medium text-gray-500">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>Real-time Triage: &lt; 2.4s</span>
              </div>
              <div>• Spatial Clustering: 50m radius</div>
              <div>• Human-in-the-Loop</div>
            </div>
          </div>

          {/* Right Column: Phone Mockup & Floating AI Card (as shown in design) */}
          <div className="lg:col-span-6 flex justify-center lg:justify-end relative">
            {/* Background dot grid pattern */}
            <div className="absolute -top-6 right-8 grid grid-cols-6 gap-3 opacity-30 pointer-events-none">
              {Array.from({ length: 24 }).map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-orange-500" />
              ))}
            </div>

            {/* Outer Phone Wrapper */}
            <div className="relative w-full max-w-[340px] sm:max-w-[360px] bg-gray-900 p-3.5 rounded-[44px] shadow-2xl shadow-gray-900/25 border-4 border-gray-800">
              {/* Phone Speaker Notch */}
              <div className="absolute top-6 left-1/2 -translate-x-1/2 w-28 h-4 bg-gray-900 rounded-full z-30 flex items-center justify-center">
                <div className="w-10 h-1 bg-gray-700 rounded-full" />
              </div>

              {/* Inner Phone Screen */}
              <div className="relative w-full h-[540px] bg-slate-50 rounded-[34px] overflow-hidden flex flex-col pt-9 px-4 pb-4">
                {/* Speech Bubble: "Broken road in front of my house" */}
                <div className="self-end mb-3 max-w-[80%] bg-white px-3.5 py-2 rounded-2xl rounded-tr-xs shadow-xs border border-gray-100 text-xs font-medium text-gray-800">
                  Broken road in front of my house
                </div>

                {/* Complaint Image Thumbnail */}
                <div className="relative w-full h-44 rounded-2xl overflow-hidden border border-gray-200/80 shadow-inner mb-3">
                  <img
                    src="https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80"
                    alt="Pothole in road"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-[10px] font-semibold text-white">
                    Photo Evidence
                  </div>
                </div>

                {/* Audio Recording Pill & Waveform */}
                <div className="w-full bg-white px-3 py-2 rounded-xl border border-gray-100 shadow-xs flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                    <Mic className="w-4 h-4" />
                  </div>
                  {/* Waveform Bars */}
                  <div className="flex items-center gap-1 h-5 flex-1 justify-center">
                    <span className="w-1 bg-orange-400 rounded-full wave-bar-1" />
                    <span className="w-1 bg-orange-500 rounded-full wave-bar-2" />
                    <span className="w-1 bg-orange-600 rounded-full wave-bar-3" />
                    <span className="w-1 bg-orange-400 rounded-full wave-bar-4" />
                    <span className="w-1 bg-orange-500 rounded-full wave-bar-5" />
                    <span className="w-1 bg-orange-300 rounded-full wave-bar-1" />
                    <span className="w-1 bg-orange-600 rounded-full wave-bar-2" />
                    <span className="w-1 bg-orange-400 rounded-full wave-bar-3" />
                  </div>
                  <span className="text-[11px] font-mono text-gray-400">0:14</span>
                </div>

                {/* Map Preview with Pin */}
                <div className="relative w-full flex-1 rounded-2xl bg-slate-100 overflow-hidden border border-gray-200 flex items-center justify-center">
                  <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:12px_12px]" />
                  <div className="relative flex flex-col items-center">
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full bg-red-500/20 animate-ping absolute -top-1 -left-1" />
                      <MapPin className="w-6 h-6 text-red-500 fill-red-500 relative z-10 drop-shadow-md" />
                    </div>
                    <span className="text-[10px] font-bold text-gray-700 bg-white/90 px-2 py-0.5 rounded-full shadow-xs mt-1 border border-gray-200">
                      MG Road, Delhi
                    </span>
                  </div>
                </div>
              </div>

              {/* Floating AI Analysis Card (matches mockup exactly) */}
              <div className="absolute -bottom-4 -right-4 sm:-right-8 w-64 bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-gray-100 z-30 transform hover:-translate-y-1 transition-all duration-300">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <h4 className="text-xs font-bold text-gray-900">AI Analysis</h4>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                    99.2% Conf
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-gray-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>
                      <strong className="font-semibold text-gray-900">Category:</strong> Road Damage
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-gray-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>
                      <strong className="font-semibold text-gray-900">Department:</strong> PWD
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-gray-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>
                      <strong className="font-semibold text-gray-900">Priority:</strong> High (8/10)
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-gray-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>
                      <strong className="font-semibold text-gray-900">Status:</strong> Assigned
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
