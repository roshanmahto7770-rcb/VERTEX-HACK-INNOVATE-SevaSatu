'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Camera,
  Upload,
  Mic,
  MapPin,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Layers,
  ArrowRight,
  FileCheck,
  RotateCcw,
  User,
  Home,
  Navigation,
} from 'lucide-react';
import { GeminiTriageOutput, Grievance, MasterComplaint } from '@/lib/types';
import { getSavedProfile, UserProfile, formatAddress } from '@/components/landing/UserProfileModal';

interface SubmitComplaintModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called after the modal opens so we can refresh profile data from localStorage */
  onOpenProfileModal?: () => void;
  onSuccess?: (grievance: Grievance, masterTicket: MasterComplaint | null) => void;
}

// Preset real-world civic issue presets for 1-click testing
const SAMPLE_PRESETS = [
  {
    name: 'Road Pothole (MG Road)',
    title: 'Huge crater and asphalt breakdown',
    desc: 'Deep pothole causing vehicle breakdown and near misses for two-wheelers right near metro pillar.',
    category: 'Road Damage',
    address: 'MG Road, Delhi',
    lat: 28.6304,
    lng: 77.2177,
    image: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Duplicate Pothole Check (< 50m)',
    title: 'Broken road in front of my house',
    desc: 'Very dangerous pothole at MG road, cars are swerving into oncoming traffic.',
    category: 'Road Damage',
    address: 'MG Road Metro Pillar 142, Delhi',
    lat: 28.6305,
    lng: 77.2178,
    image: 'https://images.unsplash.com/photo-1598971861713-54ad16a7e72e?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Sewer Overflow',
    title: 'Open manhole blackwater overflow',
    desc: 'Foul-smelling toxic black sewer water flooding footpath and park entrance.',
    category: 'Drainage',
    address: 'Lajpat Nagar Block B, Delhi',
    lat: 28.5678,
    lng: 77.2433,
    image: 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f9?w=600&auto=format&fit=crop&q=80',
  },
  {
    name: 'Exposed Electrical Wire',
    title: 'Sparking transformer & hanging live wires',
    desc: 'Uninsulated 440V wires hanging low over pedestrian street with visible sparks.',
    category: 'Electrical',
    address: 'Rajouri Garden Market, Delhi',
    lat: 28.6415,
    lng: 77.1211,
    image: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
  },
];

export const SubmitComplaintModal: React.FC<SubmitComplaintModalProps> = ({
  isOpen,
  onClose,
  onOpenProfileModal,
  onSuccess,
}) => {
  // ── Saved profile ──────────────────────────────────────────────────────────
  const [savedProfile, setSavedProfile] = useState<UserProfile | null>(null);

  // ── Complaint fields ───────────────────────────────────────────────────────
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // ── Citizen identity (auto-filled from profile) ────────────────────────────
  const [citizenName, setCitizenName] = useState('');
  const [citizenPhone, setCitizenPhone] = useState('');

  // ── User's own saved address (from profile — structured) ─────────────────
  const [userAddress, setUserAddress] = useState('');  // formatted display string

  // ── Complaint location (where the issue actually is) ───────────────────────
  const [complaintAddress, setComplaintAddress] = useState('');
  const [latitude, setLatitude] = useState(28.6304);
  const [longitude, setLongitude] = useState(77.2177);
  const [detectingComplaintGps, setDetectingComplaintGps] = useState(false);

  // ── Validation errors ──────────────────────────────────────────────────────
  const [errors, setErrors] = useState<{
    title?: string;
    description?: string;
    image?: string;
    complaintAddress?: string;
  }>({});

  // ── Voice recording state ──────────────────────────────────────────────────
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // ── Submission & AI analysis state ────────────────────────────────────────
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisPhase, setAnalysisPhase] = useState('');
  const [result, setResult] = useState<{
    grievance: Grievance;
    masterTicket: MasterComplaint;
    isClustered: boolean;
    clusterMatchScore?: number;
    clusterReasoning?: string;
    triage: GeminiTriageOutput;
  } | null>(null);
  const [isFinalSuccess, setIsFinalSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ── Load saved profile whenever modal opens ────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      const profile = getSavedProfile();
      setSavedProfile(profile);
      if (profile) {
        setCitizenName(profile.name);
        setCitizenPhone(profile.phone);
        // Build formatted display string from structured address
        setUserAddress(profile.address ? formatAddress(profile.address) : '');
      } else {
        setCitizenName('');
        setCitizenPhone('');
        setUserAddress('');
      }
    }
  }, [isOpen]);

  // ── Reset complaint form (keeps profile data) ──────────────────────────────
  const handleResetForm = () => {
    setTitle('');
    setDescription('');
    setSelectedImage(null);
    setComplaintAddress('');
    setLatitude(28.6304);
    setLongitude(77.2177);
    setErrors({});
    setErrorMsg(null);
    setResult(null);
    setIsFinalSuccess(false);
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  // ── Close modal and full reset ─────────────────────────────────────────────
  const handleCloseModal = () => {
    handleResetForm();
    onClose();
  };

  // ── Detect GPS for complaint location ─────────────────────────────────────
  const handleDetectComplaintLocation = () => {
    setDetectingComplaintGps(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = Number(pos.coords.latitude.toFixed(4));
          const lng = Number(pos.coords.longitude.toFixed(4));
          setLatitude(lat);
          setLongitude(lng);
          setComplaintAddress(`GPS Detected: Lat ${lat}, Long ${lng}`);
          setDetectingComplaintGps(false);
          setErrors((prev) => ({ ...prev, complaintAddress: undefined }));
        },
        () => {
          setLatitude(28.6304);
          setLongitude(77.2177);
          setComplaintAddress('MG Road, Delhi (Lat: 28.6304, Long: 77.2177)');
          setDetectingComplaintGps(false);
        }
      );
    } else {
      setDetectingComplaintGps(false);
    }
  };

  // ── Voice note simulation ──────────────────────────────────────────────────
  const toggleRecording = () => {
    if (!isRecording) {
      setIsRecording(true);
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);

      // Simulate Speech-to-Text transcript
      setTimeout(() => {
        const sampleText =
          'यहाँ एमजी रोड पर मेट्रो पिलर के सामने बहुत बड़ा गड्ढा है, गाड़ियां टकरा रही हैं। (There is a huge pothole causing accidents near metro pillar on MG Road.)';
        setDescription((prev) => (prev ? `${prev} ${sampleText}` : sampleText));
        if (!title) setTitle('Road pothole hazard reported via voice note');
        setErrors((prev) => ({ ...prev, description: undefined, title: undefined }));
      }, 2500);
    } else {
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  // ── Quick preset loader ────────────────────────────────────────────────────
  const applyPreset = (preset: (typeof SAMPLE_PRESETS)[0]) => {
    setTitle(preset.title);
    setDescription(preset.desc);
    setComplaintAddress(preset.address);
    setLatitude(preset.lat);
    setLongitude(preset.lng);
    setSelectedImage(preset.image);
    setErrors({});
    setErrorMsg(null);
  };

  // ── Handle file input ──────────────────────────────────────────────────────
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImage(reader.result as string);
        setErrors((prev) => ({ ...prev, image: undefined }));
      };
      reader.readAsDataURL(file);
    }
  };

  // ── Submit to API ──────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: {
      title?: string;
      description?: string;
      image?: string;
      complaintAddress?: string;
    } = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required. Please provide a headline.';
    }
    if (!description.trim()) {
      newErrors.description = 'Description is required. Please explain the civic issue.';
    }
    if (!selectedImage) {
      newErrors.image = 'Photo evidence is required. Please upload or select an image.';
    }
    if (!complaintAddress.trim()) {
      newErrors.complaintAddress = 'Please specify the location where the issue is occurring.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setErrorMsg('Please fill in all fields marked with * before submitting.');
      return;
    }

    setErrors({});
    setIsAnalyzing(true);
    setErrorMsg(null);
    setResult(null);
    setIsFinalSuccess(false);

    try {
      setAnalysisPhase('Invoking Gemini 2.5 Flash Multimodal Vision & Triage...');
      await new Promise((r) => setTimeout(r, 600));

      setAnalysisPhase('Executing PostGIS Spatial Proximity Check (Radius <= 50m)...');
      await new Promise((r) => setTimeout(r, 600));

      setAnalysisPhase('Computing Gemini Semantic Duplicate Similarity Score...');

      const response = await fetch('/api/grievances/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          imageBase64: selectedImage,
          latitude,
          longitude,
          addressText: complaintAddress.trim(),
          citizenPhone: citizenPhone || '+91 00000 00000',
          citizenName: citizenName || 'Citizen Reporter',
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.rejectionReason || data.error || 'Submission failed');
      }

      setResult(data);
      if (onSuccess) {
        onSuccess(data.grievance, data.masterTicket);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred during triage.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-gray-900 leading-tight">
                Submit Public Grievance
              </h3>
              <p className="text-xs text-gray-500">
                Multimodal AI Triage & Master Cluster Detection
              </p>
            </div>
          </div>
          <button
            onClick={handleCloseModal}
            className="w-8 h-8 rounded-full bg-gray-200/70 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[82vh] overflow-y-auto space-y-6">
          {/* Quick Demo Test Presets (Only shown when on form) */}
          {!result && !isFinalSuccess && (
            <div className="p-3.5 bg-orange-50/70 rounded-2xl border border-orange-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-orange-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-orange-600" />
                  Quick Test Samples:
                </span>
                <span className="text-[11px] text-orange-700 font-medium">
                  Click to autofill all required fields (*)
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {SAMPLE_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white hover:bg-orange-100 text-gray-700 hover:text-orange-900 border border-orange-200/80 shadow-2xs transition-colors cursor-pointer"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2.5 text-xs text-red-700">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              STATE 1: INPUT FORM
          ═══════════════════════════════════════════════════════════════════ */}
          {!result && !isFinalSuccess && (
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* ── CITIZEN IDENTITY (pre-filled from profile) ─────────────── */}
              <div className="p-4 bg-slate-50 border border-gray-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-orange-600" />
                    Citizen Details
                  </span>
                  {!savedProfile && (
                    <button
                      type="button"
                      onClick={onOpenProfileModal}
                      className="text-[11px] text-orange-600 font-semibold hover:underline cursor-pointer"
                    >
                      + Set up profile to auto-fill
                    </button>
                  )}
                  {savedProfile && (
                    <button
                      type="button"
                      onClick={onOpenProfileModal}
                      className="text-[11px] text-gray-400 font-semibold hover:text-orange-600 cursor-pointer"
                    >
                      ✏️ Edit Profile
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 mb-1 uppercase tracking-wider">
                      Your Name
                    </label>
                    <input
                      type="text"
                      value={citizenName}
                      onChange={(e) => setCitizenName(e.target.value)}
                      placeholder="Full name"
                      className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 mb-1 uppercase tracking-wider">
                      Mobile Number
                    </label>
                    <input
                      type="tel"
                      value={citizenPhone}
                      onChange={(e) => setCitizenPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    />
                  </div>
                </div>

                {/* User's Saved Home Address — structured read-only display */}
                <div>
                  <label className="block text-[10px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wider flex items-center gap-1">
                    <Home className="w-3 h-3" />
                    Your Home / Office Address
                    <span className="text-gray-400 font-normal">(for officer contact)</span>
                  </label>

                  {savedProfile && savedProfile.address ? (
                    // Structured address pill-grid from saved profile
                    <div className="bg-white border border-gray-200 rounded-xl p-3 space-y-2">
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                        {savedProfile.address.houseNo && (
                          <div><span className="text-gray-400">House/Flat: </span><span className="font-semibold text-gray-800">{savedProfile.address.houseNo}</span></div>
                        )}
                        {savedProfile.address.building && (
                          <div><span className="text-gray-400">Building: </span><span className="font-semibold text-gray-800">{savedProfile.address.building}</span></div>
                        )}
                        {savedProfile.address.street && (
                          <div className="col-span-2"><span className="text-gray-400">Street: </span><span className="font-semibold text-gray-800">{savedProfile.address.street}</span></div>
                        )}
                        <div><span className="text-gray-400">City: </span><span className="font-semibold text-gray-800">{savedProfile.address.city}</span></div>
                        <div><span className="text-gray-400">State: </span><span className="font-semibold text-gray-800">{savedProfile.address.state}</span></div>
                        <div><span className="text-gray-400">Pincode: </span><span className="font-semibold text-gray-800 font-mono">{savedProfile.address.pincode}</span></div>
                      </div>
                      <p className="text-[10px] text-emerald-600 font-semibold border-t border-gray-100 pt-1.5">
                        ✓ Auto-filled from your saved profile
                      </p>
                    </div>
                  ) : (
                    // Fallback plain input when no profile set
                    <input
                      type="text"
                      value={userAddress}
                      onChange={(e) => setUserAddress(e.target.value)}
                      placeholder="e.g., 42-B, Lajpat Nagar, New Delhi 110024"
                      className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    />
                  )}
                </div>
              </div>

              {/* ── COMPLAINT DETAILS ──────────────────────────────────────── */}

              {/* Title Field */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Issue Title / Headline <span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Large pothole in front of metro pillar"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (e.target.value.trim()) {
                      setErrors((prev) => ({ ...prev, title: undefined }));
                    }
                  }}
                  className={`w-full px-3.5 py-2.5 text-sm bg-white border rounded-xl focus:outline-none focus:ring-2 ${
                    errors.title
                      ? 'border-red-400 focus:ring-red-200 bg-red-50/20'
                      : 'border-gray-200 focus:ring-orange-500/20 focus:border-orange-500'
                  }`}
                />
                {errors.title && (
                  <p className="text-[11px] text-red-600 font-semibold">{errors.title}</p>
                )}
              </div>

              {/* Description Field + Voice Input */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Detailed Description <span className="text-red-500 font-bold">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={toggleRecording}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      isRecording
                        ? 'bg-red-500 text-white animate-pulse'
                        : 'bg-orange-100 hover:bg-orange-200 text-orange-800'
                    }`}
                  >
                    <Mic className="w-3.5 h-3.5" />
                    {isRecording ? `Recording (${recordingSeconds}s)...` : '🎙️ Dictate Voice Note'}
                  </button>
                </div>
                <textarea
                  rows={3}
                  placeholder="Describe what is damaged, danger to pedestrians or vehicles, traffic impact..."
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    if (e.target.value.trim()) {
                      setErrors((prev) => ({ ...prev, description: undefined }));
                    }
                  }}
                  className={`w-full px-3.5 py-2.5 text-sm bg-white border rounded-xl focus:outline-none focus:ring-2 ${
                    errors.description
                      ? 'border-red-400 focus:ring-red-200 bg-red-50/20'
                      : 'border-gray-200 focus:ring-orange-500/20 focus:border-orange-500'
                  }`}
                />
                {errors.description && (
                  <p className="text-[11px] text-red-600 font-semibold">{errors.description}</p>
                )}
              </div>

              {/* Photo Evidence Field */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Photo Evidence / Visual Proof <span className="text-red-500 font-bold">*</span>
                </label>
                <div
                  className={`border-2 border-dashed rounded-2xl p-5 text-center transition-colors ${
                    errors.image
                      ? 'border-red-400 bg-red-50/20'
                      : 'border-gray-200 hover:border-orange-400 bg-slate-50/50'
                  }`}
                >
                  {selectedImage ? (
                    <div className="relative inline-block">
                      <img
                        src={selectedImage}
                        alt="Evidence Preview"
                        className="h-44 w-full max-w-sm object-cover rounded-xl shadow-xs border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => setSelectedImage(null)}
                        className="absolute top-2 right-2 bg-black/70 hover:bg-red-600 text-white p-1 rounded-full text-xs shadow-md transition-colors cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Camera className="w-9 h-9 text-gray-400 mb-2" />
                      <p className="text-sm font-semibold text-gray-700">
                        Upload or capture photo evidence
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Required for Gemini 2.5 Flash Vision damage severity calculation
                      </p>
                      <label className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-sm shadow-orange-600/30">
                        <Upload className="w-3.5 h-3.5" />
                        Browse Image File
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}
                </div>
                {errors.image && (
                  <p className="text-[11px] text-red-600 font-semibold">{errors.image}</p>
                )}
              </div>

              {/* ── COMPLAINT LOCATION (where the issue is) ───────────────── */}
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5 text-orange-600" />
                    Issue Location <span className="text-red-500 font-bold">*</span>
                    <span className="text-gray-400 font-normal text-[10px] normal-case tracking-normal">
                      (where the problem is)
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={handleDetectComplaintLocation}
                    disabled={detectingComplaintGps}
                    className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw
                      className={`w-3 h-3 ${detectingComplaintGps ? 'animate-spin' : ''}`}
                    />
                    {detectingComplaintGps ? 'Detecting GPS…' : 'Use My GPS'}
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={complaintAddress}
                    onChange={(e) => {
                      setComplaintAddress(e.target.value);
                      if (e.target.value.trim())
                        setErrors((prev) => ({ ...prev, complaintAddress: undefined }));
                    }}
                    placeholder="Address / Landmark where the issue is"
                    className={`sm:col-span-2 px-3 py-2 text-xs bg-white border rounded-xl focus:outline-none focus:ring-1 focus:ring-orange-500 ${
                      errors.complaintAddress ? 'border-red-400 bg-red-50/20' : 'border-gray-200'
                    }`}
                  />
                  <div className="px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl text-gray-600 font-mono flex items-center justify-center">
                    {latitude}, {longitude}
                  </div>
                </div>
                {errors.complaintAddress && (
                  <p className="text-[11px] text-red-600 font-semibold">{errors.complaintAddress}</p>
                )}
              </div>

              {/* Modal Actions */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2.5 text-xs font-semibold text-gray-600 hover:text-gray-900 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAnalyzing}
                  className="px-6 py-2.5 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50 rounded-xl shadow-md shadow-orange-600/30 flex items-center gap-2 transition-all cursor-pointer"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Analyzing Issue...
                    </>
                  ) : (
                    <>
                      <span>Next</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              STATE 2: AI TRIAGE & MASTER CLUSTER OUTPUT VIEW
          ═══════════════════════════════════════════════════════════════════ */}
          {result && !isFinalSuccess && (
            <div className="space-y-5 animate-in fade-in duration-300">
              {/* Header Banner */}
              <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50 border-2 border-emerald-300 text-emerald-950 space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-emerald-900">
                      🎉 Complaint Processed & Ready for Confirmation
                    </h4>
                    <p className="text-xs text-emerald-800 font-medium">
                      Assigned Ticket ID:{' '}
                      <strong className="font-mono text-emerald-950 bg-emerald-200/80 px-2 py-0.5 rounded">
                        {result.grievance.ticketNumber}
                      </strong>
                    </p>
                  </div>
                </div>
              </div>

              {/* Master Cluster Status Banner */}
              <div
                className={`p-4 rounded-2xl border ${
                  result.isClustered
                    ? 'bg-purple-50 border-purple-200 text-purple-900'
                    : 'bg-blue-50 border-blue-200 text-blue-900'
                }`}
              >
                <div className="flex items-start gap-3">
                  {result.isClustered ? (
                    <Layers className="w-6 h-6 text-purple-600 shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle2 className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <h5 className="text-sm font-bold">
                      {result.isClustered
                        ? `Linked to Master Cluster ${result.masterTicket.masterTicketNumber}`
                        : `Standalone Master Ticket Created: ${result.masterTicket.masterTicketNumber}`}
                    </h5>
                    <p className="text-xs mt-1 leading-relaxed">
                      {result.isClustered
                        ? `AI Spatial-Semantic Engine detected an existing open issue within 50m with a ${result.clusterMatchScore}% similarity score. Grouped under Master Ticket for batch resolution.`
                        : `No duplicate open complaints within 50m. Created as a new primary Master Ticket prioritized with Score ${result.triage.severity_score}/10.`}
                    </p>
                  </div>
                </div>
              </div>

              {/* AI Structured Triage Breakdown */}
              <div className="bg-slate-50 border border-gray-100 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    Gemini 2.5 Flash Structured Triage Output
                  </span>
                  <span className="text-xs font-mono font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded">
                    Ticket: {result.grievance.ticketNumber}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-2.5 bg-white rounded-xl border border-gray-100">
                    <span className="text-[10px] text-gray-400 block font-semibold">
                      Department
                    </span>
                    <span className="font-bold text-gray-900">{result.triage.department}</span>
                  </div>

                  <div className="p-2.5 bg-white rounded-xl border border-gray-100">
                    <span className="text-[10px] text-gray-400 block font-semibold">Category</span>
                    <span className="font-bold text-gray-900">{result.triage.category}</span>
                  </div>

                  <div className="p-2.5 bg-white rounded-xl border border-gray-100">
                    <span className="text-[10px] text-gray-400 block font-semibold">
                      Severity Rating
                    </span>
                    <span
                      className={`font-black ${
                        result.triage.severity_score >= 8
                          ? 'text-red-600'
                          : result.triage.severity_score >= 6
                          ? 'text-orange-600'
                          : 'text-emerald-600'
                      }`}
                    >
                      {result.triage.severity_score}/10 ({result.triage.severity_level})
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-gray-100 space-y-1">
                  <span className="text-[10px] text-gray-400 font-semibold block">
                    AI Clinical Justification:
                  </span>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    {result.triage.severity_reasoning}
                  </p>
                </div>

                <div className="p-3 bg-white rounded-xl border border-gray-100 space-y-1">
                  <span className="text-[10px] text-gray-400 font-semibold block">
                    Recommended Action:
                  </span>
                  <p className="text-xs font-medium text-gray-800">
                    {result.triage.recommended_action}
                  </p>
                </div>
              </div>

              {/* Action Button: Click Done to see final confirmation on the SAME page */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setIsFinalSuccess(true)}
                  className="w-full sm:w-auto px-8 py-2.5 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow-md shadow-orange-600/30 transition-all cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              STATE 3: FINAL SUCCESS CONFIRMATION ON THE SAME SCREEN
          ═══════════════════════════════════════════════════════════════════ */}
          {isFinalSuccess && result && (
            <div className="text-center py-8 px-4 space-y-6 animate-in zoom-in-95 duration-200">
              {/* Celebratory Check Icon */}
              <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner border-4 border-emerald-200">
                <CheckCircle2 className="w-12 h-12" />
              </div>

              <div className="space-y-2">
                <span className="inline-block px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Registration Successful
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                  🎉 Complaint Submitted Successfully!
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
                  Your grievance has been officially registered in the municipal portal. Department
                  field officers have been notified for immediate inspection.
                </p>
              </div>

              {/* Big Clean Official Receipt Box */}
              <div className="bg-slate-50/80 border-2 border-emerald-200 rounded-2xl p-5 max-w-md mx-auto space-y-3.5 text-left shadow-xs">
                <div className="flex items-center justify-between border-b border-gray-200 pb-2.5">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Complaint Ticket ID
                  </span>
                  <span className="font-mono text-base font-black text-orange-600 bg-orange-100 px-3 py-1 rounded-lg">
                    {result.grievance.ticketNumber}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-medium">Issue Title:</span>
                    <span className="font-bold text-gray-900 max-w-[220px] truncate text-right">
                      {result.grievance.issueTitle}
                    </span>
                  </div>

                  {citizenName && (
                    <div className="flex justify-between">
                      <span className="text-gray-500 font-medium">Filed By:</span>
                      <span className="font-bold text-gray-900 text-right">{citizenName}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-gray-500 font-medium">Assigned Department:</span>
                    <span className="font-bold text-gray-900 text-right">
                      {result.triage.department}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-500 font-medium">Category:</span>
                    <span className="font-bold text-gray-900">{result.triage.category}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-500 font-medium">Priority Rating:</span>
                    <span className="font-bold text-red-600">
                      {result.triage.severity_score}/10 ({result.triage.severity_level})
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-500 font-medium">Issue Location:</span>
                    <span className="font-bold text-gray-900 max-w-[220px] truncate text-right">
                      {result.grievance.addressText}
                    </span>
                  </div>

                  <div className="flex justify-between border-t border-gray-200/80 pt-2">
                    <span className="text-gray-500 font-medium">Cluster Status:</span>
                    <span className="font-bold text-purple-700">
                      {result.isClustered
                        ? `Grouped with Master ${result.masterTicket.masterTicketNumber}`
                        : 'Standalone Master Ticket'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons Right on the Same Page */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="w-full sm:w-auto px-6 py-3 text-xs font-bold text-orange-700 bg-orange-100 hover:bg-orange-200 border border-orange-300 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                >
                  <RotateCcw className="w-4 h-4" />
                  Submit Another Complaint
                </button>

                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="w-full sm:w-auto px-8 py-3 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow-md shadow-orange-600/30 transition-all cursor-pointer"
                >
                  Close Window
                </button>
              </div>
            </div>
          )}

          {/* Real-time Loader Overlay during Analysis */}
          {isAnalyzing && (
            <div className="p-6 bg-slate-900 text-white rounded-2xl flex flex-col items-center justify-center text-center space-y-3 shadow-xl">
              <div className="w-10 h-10 rounded-full border-3 border-orange-500 border-t-transparent animate-spin" />
              <div className="space-y-1">
                <span className="text-sm font-bold text-white block">
                  Processing Multimodal Triage
                </span>
                <span className="text-xs text-orange-400 font-mono">{analysisPhase}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
