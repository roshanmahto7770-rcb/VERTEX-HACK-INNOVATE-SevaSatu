'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
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
  ArrowLeft,
  LayoutDashboard,
  FileCheck,
} from 'lucide-react';
import { GeminiTriageOutput, Grievance, MasterComplaint } from '@/lib/types';

interface SubmitComplaintModalProps {
  isOpen: boolean;
  onClose: () => void;
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
  onSuccess,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [addressText, setAddressText] = useState('MG Road, Delhi');
  const [latitude, setLatitude] = useState(28.6304);
  const [longitude, setLongitude] = useState(77.2177);
  const [citizenPhone, setCitizenPhone] = useState('+91 98765 43210');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Field validation errors
  const [errors, setErrors] = useState<{
    title?: string;
    description?: string;
    image?: string;
  }>({});

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Submission & AI analysis state
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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Reset form completely
  const handleResetForm = () => {
    setTitle('');
    setDescription('');
    setSelectedImage(null);
    setErrors({});
    setErrorMsg(null);
    setResult(null);
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  // When modal closes, reset so reopening starts fresh
  const handleCloseModal = () => {
    handleResetForm();
    onClose();
  };

  // Simulate or execute Geolocation
  const handleDetectLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(Number(pos.coords.latitude.toFixed(4)));
          setLongitude(Number(pos.coords.longitude.toFixed(4)));
          setAddressText(
            `Detected GPS: Lat ${pos.coords.latitude.toFixed(4)}, Long ${pos.coords.longitude.toFixed(4)}`
          );
        },
        () => {
          setLatitude(28.6304);
          setLongitude(77.2177);
          setAddressText('MG Road, Delhi (Lat: 28.6304, Long: 77.2177)');
        }
      );
    }
  };

  // Toggle voice simulation
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
          'यहाँ एमजी रोड पर मेट्रो पिलर के सामने बहुत बड़ा गड्ढा है, गाड़ियां टकरा रही हैं। (There is a huge pothole causing accidents near metro pillar on MG Road.)';
        setDescription((prev) => (prev ? `${prev} ${sampleText}` : sampleText));
        if (!title) setTitle('Road pothole hazard reported via voice note');
        setErrors((prev) => ({ ...prev, description: undefined, title: undefined }));
      }, 2500);
    } else {
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  // Quick preset loader
  const applyPreset = (preset: typeof SAMPLE_PRESETS[0]) => {
    setTitle(preset.title);
    setDescription(preset.desc);
    setAddressText(preset.address);
    setLatitude(preset.lat);
    setLongitude(preset.lng);
    setSelectedImage(preset.image);
    setErrors({});
    setErrorMsg(null);
  };

  // Handle file input
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

  // Submit to API with strict validation (* required fields)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: { title?: string; description?: string; image?: string } = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required. Please provide a headline.';
    }
    if (!description.trim()) {
      newErrors.description = 'Description is required. Please explain the civic issue.';
    }
    if (!selectedImage) {
      newErrors.image = 'Photo evidence is required. Please upload or select an image.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setErrorMsg('Please fill in all mandatory fields marked with a red star (*).');
      return;
    }

    setErrors({});
    setIsAnalyzing(true);
    setErrorMsg(null);
    setResult(null);

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
          addressText,
          citizenPhone,
          citizenName: 'Citizen Reporter',
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
          {/* Quick Demo Test Presets */}
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

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2.5 text-xs text-red-700">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form View (when no result yet) */}
          {!result ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Mandatory Notice */}
              <div className="text-[11px] text-gray-500 flex items-center gap-1">
                Fields marked with <span className="text-red-500 font-bold text-sm leading-none">*</span> are mandatory.
              </div>

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

              {/* Location Field */}
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-orange-600" />
                    Complaint Location (PostGIS 50m Index)
                  </label>
                  <button
                    type="button"
                    onClick={handleDetectLocation}
                    className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Auto-Detect GPS
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={addressText}
                    onChange={(e) => setAddressText(e.target.value)}
                    placeholder="Address / Landmark"
                    className="sm:col-span-2 px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                  <div className="px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl text-gray-600 font-mono flex items-center justify-center">
                    {latitude}, {longitude}
                  </div>
                </div>
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
                      <Sparkles className="w-3.5 h-3.5" />
                      Run AI Triage & Submit
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* SUCCESS CONFIRMATION & TRIAGE RESULT VIEW */
            <div className="space-y-5 animate-in fade-in duration-300">
              {/* Big Success Banner */}
              <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50 border-2 border-emerald-300 text-emerald-950 space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-emerald-900">
                      🎉 Complaint Submitted Successfully!
                    </h4>
                    <p className="text-xs text-emerald-800 font-medium">
                      Your complaint has been logged and assigned Ticket ID{' '}
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
                    <span className="font-bold text-gray-900">
                      {result.triage.department}
                    </span>
                  </div>

                  <div className="p-2.5 bg-white rounded-xl border border-gray-100">
                    <span className="text-[10px] text-gray-400 block font-semibold">
                      Category
                    </span>
                    <span className="font-bold text-gray-900">
                      {result.triage.category}
                    </span>
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

              {/* Action Buttons to Go Back or Submit New Complaint */}
              <div className="pt-3 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                {/* Back to Submit New Complaint */}
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="w-full sm:w-auto px-4 py-2.5 text-xs font-bold text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  ← Back to Submit New Complaint
                </button>

                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <Link
                    href="/officer/dashboard"
                    onClick={handleCloseModal}
                    className="flex-1 sm:flex-initial px-4 py-2.5 text-xs font-semibold text-gray-700 hover:text-orange-600 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    Officer View
                  </Link>

                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 sm:flex-initial px-6 py-2.5 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow-md shadow-orange-600/30 transition-all cursor-pointer"
                  >
                    Done
                  </button>
                </div>
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
                <span className="text-xs text-orange-400 font-mono">
                  {analysisPhase}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
