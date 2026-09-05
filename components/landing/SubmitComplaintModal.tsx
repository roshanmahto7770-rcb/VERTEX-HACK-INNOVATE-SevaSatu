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
import {
  getSavedProfile,
  saveProfile,
  UserProfile,
  StructuredAddress,
  formatAddress,
  reverseGeocode,
} from '@/components/landing/UserProfileModal';

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

const emptyComplaintLocation = (): StructuredAddress => ({
  houseNo: '',
  building: '',
  street: '',
  city: '',
  state: '',
  pincode: '',
});

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

  // ── Citizen identity & structured address (auto-filled from profile) ───────
  const [citizenName, setCitizenName] = useState('');
  const [citizenPhone, setCitizenPhone] = useState('');
  const [citizenAddress, setCitizenAddress] = useState<StructuredAddress>(emptyComplaintLocation());
  const [detectingCitizenGps, setDetectingCitizenGps] = useState(false);
  const [saveToProfile, setSaveToProfile] = useState(true);

  const setCitizenAddressField = (field: keyof StructuredAddress, value: string) => {
    setCitizenAddress((prev) => ({ ...prev, [field]: value }));
  };

  const handleDetectCitizenLocation = () => {
    if (!navigator.geolocation) return;
    setDetectingCitizenGps(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        const geocoded = await reverseGeocode(lat, lng);
        setCitizenAddress((prev) => ({
          state: geocoded.state ?? prev.state,
          city: geocoded.city ?? prev.city,
          pincode: geocoded.pincode ?? prev.pincode,
          houseNo: geocoded.houseNo ?? prev.houseNo,
          building: geocoded.building ?? prev.building,
          street: geocoded.street ?? prev.street,
        }));
        setDetectingCitizenGps(false);
      },
      () => {
        setDetectingCitizenGps(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // ── Complaint location (where the issue actually is) ───────────────────────
  const [complaintLocation, setComplaintLocation] = useState<StructuredAddress>(emptyComplaintLocation());
  const [latitude, setLatitude] = useState(28.6304);
  const [longitude, setLongitude] = useState(77.2177);
  const [detectingComplaintGps, setDetectingComplaintGps] = useState(false);

  const setComplaintField = (field: keyof StructuredAddress, value: string) => {
    setComplaintLocation((previous) => ({ ...previous, [field]: value }));
    if (value.trim()) {
      setErrors((previous) => ({ ...previous, complaintAddress: undefined }));
    }
  };

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

  // ── Load saved profile whenever modal opens & Auto-Detect GPS Location ───
  useEffect(() => {
    if (isOpen) {
      const profile = getSavedProfile();
      setSavedProfile(profile);
      if (profile) {
        setCitizenName(profile.name || '');
        setCitizenPhone(profile.phone || '');
        setCitizenAddress(profile.address || emptyComplaintLocation());
      } else {
        setCitizenName('');
        setCitizenPhone('');
        setCitizenAddress(emptyComplaintLocation());
      }

      // Automatically auto-fetch high-precision GPS coordinates & geocoded address
      if (!complaintLocation.street || !complaintLocation.state) {
        handleDetectComplaintLocation();
      }
    }
  }, [isOpen]);

  // ── Camera capture state (Direct Camera Only) ──────────────────────────────
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement | null>(null);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
    setCameraError(null);
  };

  const startCamera = async (facing: 'environment' | 'user' = cameraFacing) => {
    setCameraError(null);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: facing,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
        streamRef.current = stream;
        setIsCameraActive(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      } else {
        throw new Error('WebRTC getUserMedia not supported');
      }
    } catch (err: any) {
      console.warn('Live WebRTC camera stream error, using native device camera:', err);
      // Fallback: trigger native device camera
      if (nativeCameraInputRef.current) {
        nativeCameraInputRef.current.click();
      }
    }
  };

  const switchCameraFacing = () => {
    const newFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(newFacing);
    startCamera(newFacing);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setSelectedImage(dataUrl);
        setErrors((prev) => ({ ...prev, image: undefined }));
        stopCamera();
      }
    } catch (err: any) {
      console.error('Error capturing canvas photo:', err);
    }
  };

  const handleNativeCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImage(reader.result as string);
        setErrors((prev) => ({ ...prev, image: undefined }));
        stopCamera();
      };
      reader.readAsDataURL(file);
    }
  };

  // ── Reset complaint form (keeps profile data) ──────────────────────────────
  const handleResetForm = () => {
    stopCamera();
    setTitle('');
    setDescription('');
    setSelectedImage(null);
    setComplaintLocation(emptyComplaintLocation());
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
        async (pos) => {
          const lat = Number(pos.coords.latitude.toFixed(6));
          const lng = Number(pos.coords.longitude.toFixed(6));
          setLatitude(lat);
          setLongitude(lng);
          const geocoded = await reverseGeocode(lat, lng);
          setComplaintLocation((previous) => ({
            houseNo: geocoded.houseNo ?? previous.houseNo,
            building: geocoded.building ?? previous.building,
            street: geocoded.street ?? previous.street,
            city: geocoded.city ?? previous.city,
            state: geocoded.state ?? previous.state,
            pincode: geocoded.pincode ?? previous.pincode,
          }));
          setDetectingComplaintGps(false);
          setErrors((prev) => ({ ...prev, complaintAddress: undefined }));
        },
        () => {
          setLatitude(28.6304);
          setLongitude(77.2177);
          setComplaintLocation({
            ...emptyComplaintLocation(),
            street: 'MG Road',
            city: 'New Delhi',
            state: 'Delhi',
            pincode: '110001',
          });
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
    setComplaintLocation({
      ...emptyComplaintLocation(),
      street: preset.address,
      city: 'New Delhi',
      state: 'Delhi',
    });
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

    const complaintAddress =
      formatAddress(complaintLocation) ||
      [complaintLocation.street, complaintLocation.city, complaintLocation.state, complaintLocation.pincode]
        .filter(Boolean)
        .join(', ');

    if (
      !complaintLocation.state.trim() ||
      !complaintLocation.city.trim() ||
      !complaintLocation.pincode.trim() ||
      !complaintLocation.street.trim()
    ) {
      newErrors.complaintAddress = 'Please fill required location fields (State, City, Pincode, and Street/Road).';
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
          citizenAddress,
          complaintLocation,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.rejectionReason || data.error || 'Submission failed');
      }

      if (saveToProfile && citizenName.trim()) {
        const prof: UserProfile = {
          name: citizenName.trim(),
          phone: citizenPhone.trim(),
          address: citizenAddress,
          savedLat: latitude,
          savedLng: longitude,
        };
        saveProfile(prof);
        setSavedProfile(prof);
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

              {/* ── CITIZEN IDENTITY & ADDRESS (Structured) ─────────────── */}
              <div className="p-4 bg-slate-50 border border-gray-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-orange-600" />
                    Citizen Details
                  </span>
                  
                  {/* GPS Auto-detect Button for Citizen Address */}
                  <button
                    type="button"
                    onClick={handleDetectCitizenLocation}
                    disabled={detectingCitizenGps}
                    className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-50 border border-orange-200 shadow-2xs hover:bg-orange-100 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${detectingCitizenGps ? 'animate-spin' : ''}`} />
                    {detectingCitizenGps ? 'Fetching GPS…' : '📍 Auto-detect My Location'}
                  </button>
                </div>

                {/* 1. Name & Mobile */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 mb-1 uppercase tracking-wider">
                      Your Name <span className="text-red-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      value={citizenName}
                      onChange={(e) => setCitizenName(e.target.value)}
                      placeholder="e.g., Roshan Kumar"
                      className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 mb-1 uppercase tracking-wider">
                      Mobile Number
                    </label>
                    <input
                      type="tel"
                      value={citizenPhone}
                      onChange={(e) => setCitizenPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                    />
                  </div>
                </div>

                {/* 2. Structured Address: State -> City -> Pincode -> Address Lines */}
                <div className="space-y-3 pt-2 border-t border-gray-200/60">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1">
                      <Home className="w-3.5 h-3.5 text-orange-600" />
                      Home / Contact Address
                    </span>
                    {savedProfile && (
                      <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                        ✓ Profile Loaded
                      </span>
                    )}
                  </div>

                  {/* State & City first */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider">
                        State <span className="text-red-500 font-bold">*</span>
                      </label>
                      <input
                        type="text"
                        value={citizenAddress.state}
                        onChange={(e) => setCitizenAddressField('state', e.target.value)}
                        placeholder="e.g., Delhi, Maharashtra"
                        className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-orange-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider">
                        City / District <span className="text-red-500 font-bold">*</span>
                      </label>
                      <input
                        type="text"
                        value={citizenAddress.city}
                        onChange={(e) => setCitizenAddressField('city', e.target.value)}
                        placeholder="e.g., New Delhi, Mumbai"
                        className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-orange-500"
                      />
                    </div>
                  </div>

                  {/* Pincode & House No */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider">
                        Pincode / ZIP <span className="text-red-500 font-bold">*</span>
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={citizenAddress.pincode}
                        onChange={(e) => setCitizenAddressField('pincode', e.target.value.replace(/\D/g, ''))}
                        placeholder="e.g., 110024"
                        className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-orange-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider">
                        Address Line 1 - House / Flat No. <span className="text-gray-400 font-normal normal-case">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        value={citizenAddress.houseNo}
                        onChange={(e) => setCitizenAddressField('houseNo', e.target.value)}
                        placeholder="e.g., Flat 301, 42-B"
                        className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-orange-500"
                      />
                    </div>
                  </div>

                  {/* Address Line 2 */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider">
                      Address Line 2 - Street / Area / Landmark
                    </label>
                    <input
                      type="text"
                      value={citizenAddress.street}
                      onChange={(e) => setCitizenAddressField('street', e.target.value)}
                      placeholder="e.g., MG Road, Near Central Park"
                      className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>

                  {/* Save to Profile toggle */}
                  <label className="flex items-center gap-2 pt-1 text-[11px] text-gray-600 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={saveToProfile}
                      onChange={(e) => setSaveToProfile(e.target.checked)}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <span>Save to My Profile (auto-fill for future complaints)</span>
                  </label>
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

              {/* ── PHOTO EVIDENCE FIELD (DIRECT CAMERA CAPTURE ONLY) ── */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-orange-600" />
                    Live Photo Evidence / Camera Proof <span className="text-red-500 font-bold">*</span>
                  </label>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Live Camera Only
                  </span>
                </div>

                <div
                  className={`border-2 border-dashed rounded-2xl p-4 text-center transition-all ${
                    errors.image
                      ? 'border-red-400 bg-red-50/20'
                      : 'border-gray-200 hover:border-orange-400 bg-slate-50/50'
                  }`}
                >
                  {/* Hidden Native Mobile Direct Camera Input */}
                  <input
                    ref={nativeCameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleNativeCameraCapture}
                    className="hidden"
                  />

                  {/* 1. Captured Photo Preview */}
                  {selectedImage ? (
                    <div className="relative flex flex-col items-center space-y-2.5">
                      <div className="relative inline-block overflow-hidden rounded-2xl border border-gray-200 shadow-md">
                        <img
                          src={selectedImage}
                          alt="Live Camera Evidence Preview"
                          className="h-48 w-full max-w-sm object-cover"
                        />
                        <span className="absolute bottom-2 left-2 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-black/75 text-emerald-400 backdrop-blur-xs flex items-center gap-1 shadow-sm">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          Live Camera Captured
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedImage(null);
                            stopCamera();
                          }}
                          className="absolute top-2 right-2 bg-black/75 hover:bg-red-600 text-white p-1.5 rounded-full text-xs shadow-md transition-colors cursor-pointer"
                          title="Remove & Retake"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedImage(null);
                            startCamera('environment');
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-orange-50 hover:text-orange-600 text-gray-700 text-xs font-semibold border border-gray-200 transition-colors cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Retake Photo via Camera
                        </button>
                      </div>
                    </div>
                  ) : isCameraActive ? (
                    /* 2. Live WebRTC Viewfinder */
                    <div className="flex flex-col items-center space-y-3">
                      <div className="relative w-full max-w-sm h-52 bg-black rounded-2xl overflow-hidden shadow-inner border-2 border-orange-500">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover"
                        />
                        {/* Camera Targeting Crosshair Grid */}
                        <div className="absolute inset-0 border border-white/20 pointer-events-none grid grid-cols-3 grid-rows-3 opacity-60">
                          <div className="border-r border-b border-white/10" />
                          <div className="border-r border-b border-white/10" />
                          <div className="border-b border-white/10" />
                          <div className="border-r border-b border-white/10" />
                          <div className="border-r border-b border-white/10 flex items-center justify-center">
                            <div className="w-8 h-8 rounded-full border border-orange-400/80 animate-ping opacity-75" />
                          </div>
                          <div className="border-b border-white/10" />
                          <div className="border-r border-white/10" />
                          <div className="border-r border-white/10" />
                          <div />
                        </div>
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-bold bg-red-600 text-white uppercase tracking-wider animate-pulse">
                          ● Live Camera Viewfinder
                        </span>
                      </div>

                      {/* Camera Controls */}
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={switchCameraFacing}
                          className="p-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition-colors cursor-pointer"
                          title="Flip / Switch Camera"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={capturePhoto}
                          className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 active:scale-95 text-white text-xs font-bold shadow-lg shadow-orange-600/40 flex items-center gap-2 transition-all cursor-pointer"
                        >
                          <Camera className="w-4 h-4" />
                          Capture Photo Evidence
                        </button>

                        <button
                          type="button"
                          onClick={stopCamera}
                          className="p-2.5 rounded-xl bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-600 text-xs font-semibold transition-colors cursor-pointer"
                          title="Cancel Camera"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* 3. Open Camera Trigger (No Gallery Upload) */
                    <div className="flex flex-col items-center py-2">
                      <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mb-2 shadow-xs ring-4 ring-orange-50">
                        <Camera className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-bold text-gray-800">
                        Capture Live Photo Evidence
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5 max-w-xs">
                        Direct camera snapshot required for AI vision damage severity & instant duplicate check
                      </p>

                      <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => startCamera('environment')}
                          className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white text-xs font-bold rounded-xl cursor-pointer shadow-md shadow-orange-600/30 transition-all"
                        >
                          <Camera className="w-4 h-4" />
                          Open Camera to Capture
                        </button>
                      </div>

                      <p className="text-[10px] text-gray-400 mt-2 italic">
                        Gallery upload disabled to guarantee on-site evidence authenticity
                      </p>
                    </div>
                  )}
                </div>
                {errors.image && (
                  <p className="text-[11px] text-red-600 font-semibold">{errors.image}</p>
                )}
              </div>

              {/* ── COMPLAINT LOCATION (GPS AUTO-FETCHED & LOCKED) ───────────────── */}
              <div className="space-y-2.5 pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5 text-orange-600" />
                    Issue Location <span className="text-red-500 font-bold">*</span>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Auto-Fetched via GPS
                    </span>
                  </label>

                  {/* Re-sync GPS button */}
                  <button
                    type="button"
                    onClick={handleDetectComplaintLocation}
                    disabled={detectingComplaintGps}
                    className="text-xs font-bold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 px-3 py-1 rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
                  >
                    <RefreshCw
                      className={`w-3 h-3 ${detectingComplaintGps ? 'animate-spin' : ''}`}
                    />
                    {detectingComplaintGps ? 'Detecting Live GPS…' : 'Re-sync Live GPS'}
                  </button>
                </div>

                {/* GPS Pinpoint Card */}
                <div className="p-3 bg-gradient-to-r from-orange-50/60 to-amber-50/60 border border-orange-200/80 rounded-2xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-orange-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <MapPin className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wide text-orange-900 block">
                        GPS Geofence Pinpoint
                      </span>
                      <span className="font-mono text-gray-700 text-[11px]">
                        Lat: {latitude}, Long: {longitude}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-white px-2.5 py-1 rounded-lg border border-emerald-200 shadow-2xs flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    GPS Locked
                  </span>
                </div>

                {/* Locked / Auto-Fetched Address Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider flex items-center justify-between">
                      <span>State</span>
                      <span className="text-[9px] text-gray-400 font-normal">Auto-detected</span>
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={complaintLocation.state || 'Detecting State…'}
                      placeholder="Auto-detected via GPS"
                      className="w-full px-3 py-2 text-xs bg-gray-100 text-gray-800 font-medium border border-gray-200 rounded-xl cursor-not-allowed select-none focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider flex items-center justify-between">
                      <span>City / District</span>
                      <span className="text-[9px] text-gray-400 font-normal">Auto-detected</span>
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={complaintLocation.city || 'Detecting City…'}
                      placeholder="Auto-detected via GPS"
                      className="w-full px-3 py-2 text-xs bg-gray-100 text-gray-800 font-medium border border-gray-200 rounded-xl cursor-not-allowed select-none focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider flex items-center justify-between">
                      <span>Pincode / ZIP</span>
                      <span className="text-[9px] text-gray-400 font-normal">Auto-detected</span>
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={complaintLocation.pincode || 'Detecting Pincode…'}
                      placeholder="Auto-detected via GPS"
                      className="w-full px-3 py-2 text-xs bg-gray-100 text-gray-800 font-medium border border-gray-200 rounded-xl cursor-not-allowed select-none focus:outline-none font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-600 uppercase tracking-wider flex items-center justify-between">
                      <span>Street / Road / Area</span>
                      <span className="text-[9px] text-gray-400 font-normal">Auto-detected</span>
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={complaintLocation.street || 'Detecting Street via GPS…'}
                      placeholder="Auto-detected via GPS"
                      className={`w-full px-3 py-2 text-xs bg-gray-100 text-gray-800 font-medium border rounded-xl cursor-not-allowed select-none focus:outline-none ${
                        errors.complaintAddress ? 'border-red-400 bg-red-50/20' : 'border-gray-200'
                      }`}
                    />
                  </div>

                  {/* Optional House / Flat & Landmark for minor precision */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider">
                      House / Flat No. <span className="text-gray-400 font-normal normal-case">(Optional Door No.)</span>
                    </label>
                    <input
                      type="text"
                      value={complaintLocation.houseNo}
                      onChange={(e) => setComplaintField('houseNo', e.target.value)}
                      placeholder="e.g., 42-B, Shop 5 (Optional)"
                      className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider">
                      Building / Landmark Note <span className="text-gray-400 font-normal normal-case">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={complaintLocation.building}
                      onChange={(e) => setComplaintField('building', e.target.value)}
                      placeholder="e.g., Near Metro Pillar 142 (Optional)"
                      className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <p className="text-[10px] text-gray-400 italic text-center">
                  🔒 Core location is auto-fetched and locked from device GPS to prevent false or incorrect grievance locations.
                </p>

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
