'use client';

import React, { useState, useEffect } from 'react';
import { X, User, MapPin, Phone, Save, CheckCircle2, RefreshCw } from 'lucide-react';

export interface UserProfile {
  name: string;
  phone: string;
  savedAddress: string;
  savedLat: number;
  savedLng: number;
}

const STORAGE_KEY = 'sevasetu_user_profile';

/** Read saved profile from localStorage (returns null if not found) */
export function getSavedProfile(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Persist profile to localStorage */
export function saveProfile(profile: UserProfile): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called after the profile has been saved so the parent can refresh */
  onSaved: (profile: UserProfile) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [savedAddress, setSavedAddress] = useState('');
  const [savedLat, setSavedLat] = useState(0);
  const [savedLng, setSavedLng] = useState(0);
  const [saved, setSaved] = useState(false);
  const [detectingGps, setDetectingGps] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; savedAddress?: string }>({});

  // Load existing profile when modal opens
  useEffect(() => {
    if (isOpen) {
      setSaved(false);
      const profile = getSavedProfile();
      if (profile) {
        setName(profile.name);
        setPhone(profile.phone);
        setSavedAddress(profile.savedAddress);
        setSavedLat(profile.savedLat);
        setSavedLng(profile.savedLng);
      }
    }
  }, [isOpen]);

  // Detect GPS for home address
  const handleDetectGps = () => {
    setDetectingGps(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = Number(pos.coords.latitude.toFixed(4));
          const lng = Number(pos.coords.longitude.toFixed(4));
          setSavedLat(lat);
          setSavedLng(lng);
          setSavedAddress(`GPS Location: Lat ${lat}, Long ${lng}`);
          setDetectingGps(false);
          setErrors((prev) => ({ ...prev, savedAddress: undefined }));
        },
        () => {
          setDetectingGps(false);
        }
      );
    } else {
      setDetectingGps(false);
    }
  };

  const handleSave = () => {
    const newErrors: { name?: string; savedAddress?: string } = {};
    if (!name.trim()) newErrors.name = 'Please enter your full name.';
    if (!savedAddress.trim()) newErrors.savedAddress = 'Please enter or detect your address.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const profile: UserProfile = {
      name: name.trim(),
      phone: phone.trim(),
      savedAddress: savedAddress.trim(),
      savedLat,
      savedLng,
    };
    saveProfile(profile);
    onSaved(profile);
    setSaved(true);

    // Auto-close after short confirmation delay
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-600 text-white flex items-center justify-center shadow-xs">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-gray-900 leading-tight">My Profile</h3>
              <p className="text-xs text-gray-500">Save once, auto-fill forever</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-200/70 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Info banner */}
          <div className="p-3.5 bg-orange-50 border border-orange-100 rounded-2xl text-xs text-orange-800">
            <strong>Why fill this?</strong> Your name and home/office address will auto-fill the
            complaint form so you never type them again. Stored only on this device.
          </div>

          {/* Name */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
              Full Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="e.g., Roshan Kumar"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (e.target.value.trim()) setErrors((prev) => ({ ...prev, name: undefined }));
                }}
                className={`w-full pl-9 pr-3.5 py-2.5 text-sm bg-white border rounded-xl focus:outline-none focus:ring-2 ${
                  errors.name
                    ? 'border-red-400 focus:ring-red-200 bg-red-50/20'
                    : 'border-gray-200 focus:ring-orange-500/20 focus:border-orange-500'
                }`}
              />
            </div>
            {errors.name && <p className="text-[11px] text-red-600 font-semibold">{errors.name}</p>}
          </div>

          {/* Phone */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
              Mobile Number (optional)
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="tel"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>
          </div>

          {/* Home / Office Address */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-orange-600" />
                Your Home / Office Address <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleDetectGps}
                disabled={detectingGps}
                className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${detectingGps ? 'animate-spin' : ''}`} />
                {detectingGps ? 'Detecting…' : 'Detect GPS'}
              </button>
            </div>
            <textarea
              rows={2}
              placeholder="e.g., 42-B, Lajpat Nagar Block C, New Delhi 110024"
              value={savedAddress}
              onChange={(e) => {
                setSavedAddress(e.target.value);
                if (e.target.value.trim())
                  setErrors((prev) => ({ ...prev, savedAddress: undefined }));
              }}
              className={`w-full px-3.5 py-2.5 text-sm bg-white border rounded-xl focus:outline-none focus:ring-2 resize-none ${
                errors.savedAddress
                  ? 'border-red-400 focus:ring-red-200 bg-red-50/20'
                  : 'border-gray-200 focus:ring-orange-500/20 focus:border-orange-500'
              }`}
            />
            {savedLat !== 0 && savedLng !== 0 && (
              <p className="text-[11px] text-gray-400 font-mono">
                GPS: {savedLat}, {savedLng}
              </p>
            )}
            {errors.savedAddress && (
              <p className="text-[11px] text-red-600 font-semibold">{errors.savedAddress}</p>
            )}
          </div>

          {/* Save Button */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-gray-600 hover:text-gray-900 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saved}
              className={`px-6 py-2.5 text-xs font-bold text-white rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2 ${
                saved
                  ? 'bg-emerald-600 shadow-emerald-600/30'
                  : 'bg-orange-600 hover:bg-orange-700 shadow-orange-600/30'
              }`}
            >
              {saved ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Saved!
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  Save Profile
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
