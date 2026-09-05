'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  MapPin,
  Phone,
  Save,
  CheckCircle2,
  Locate,
  Building2,
  Hash,
  Map,
} from 'lucide-react';

// ── Structured Address ─────────────────────────────────────────────────────────
export interface StructuredAddress {
  houseNo: string;     // House / Flat / Door number
  building: string;    // Building / Society / Colony name
  street: string;      // Street / Road / Area
  city: string;        // City / District
  state: string;       // State
  pincode: string;     // 6-digit PIN code
}

export interface UserProfile {
  name: string;
  phone: string;
  address: StructuredAddress;
  savedLat: number;
  savedLng: number;
}

// Backward-compat helper: build a single display string from structured address
export function formatAddress(addr: StructuredAddress): string {
  return [addr.houseNo, addr.building, addr.street, addr.city, addr.state, addr.pincode]
    .filter(Boolean)
    .join(', ');
}

const STORAGE_KEY = 'sevasetu_user_profile_v2';

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

// ── Nominatim reverse-geocode → StructuredAddress ─────────────────────────────
async function reverseGeocode(lat: number, lng: number): Promise<Partial<StructuredAddress>> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`;
    const res = await fetch(url, {
      headers: { 'Accept-Language': 'en', 'User-Agent': 'SevaSetu-GovPortal/1.0' },
    });
    if (!res.ok) return {};
    const json = await res.json();
    const a = json.address ?? {};

    return {
      // House number from OSM (may be absent)
      houseNo: a.house_number ?? '',
      // Building / Society / Colony
      building: a.building ?? a.amenity ?? a.neighbourhood ?? a.suburb ?? '',
      // Street / Road
      street: a.road ?? a.pedestrian ?? a.footway ?? a.path ?? '',
      // City / District / Town / Village
      city:
        a.city ?? a.town ?? a.village ?? a.district ?? a.county ?? '',
      // State
      state: a.state ?? '',
      // Pincode
      pincode: a.postcode ?? '',
    };
  } catch {
    return {};
  }
}

// ── Empty address helper ───────────────────────────────────────────────────────
const emptyAddress = (): StructuredAddress => ({
  houseNo: '',
  building: '',
  street: '',
  city: '',
  state: '',
  pincode: '',
});

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (profile: UserProfile) => void;
}

// ── Input field wrapper ────────────────────────────────────────────────────────
const Field: React.FC<{
  label: string;
  required?: boolean;
  icon?: React.ReactNode;
  error?: string;
  children: React.ReactNode;
}> = ({ label, required, icon, error, children }) => (
  <div className="space-y-1">
    <label className="flex items-center gap-1.5 text-[10px] font-bold text-gray-600 uppercase tracking-wider">
      {icon}
      {label}
      {required && <span className="text-red-500 text-sm leading-none">*</span>}
    </label>
    {children}
    {error && <p className="text-[11px] text-red-600 font-semibold">{error}</p>}
  </div>
);

const inputCls = (hasError?: boolean) =>
  `w-full px-3 py-2.5 text-sm bg-white border rounded-xl focus:outline-none focus:ring-2 transition-colors ${
    hasError
      ? 'border-red-400 focus:ring-red-200 bg-red-50/20'
      : 'border-gray-200 focus:ring-orange-500/20 focus:border-orange-500'
  }`;

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [addr, setAddr] = useState<StructuredAddress>(emptyAddress());
  const [savedLat, setSavedLat] = useState(0);
  const [savedLng, setSavedLng] = useState(0);

  const [saved, setSaved] = useState(false);
  const [detectingGps, setDetectingGps] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'locating' | 'geocoding' | 'done' | 'error'>('idle');

  const [errors, setErrors] = useState<Partial<Record<keyof StructuredAddress | 'name', string>>>({});

  // Patch a single address field
  const setField = (key: keyof StructuredAddress, value: string) => {
    setAddr((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  // Load existing profile on open
  useEffect(() => {
    if (isOpen) {
      setSaved(false);
      setGpsStatus('idle');
      const profile = getSavedProfile();
      if (profile) {
        setName(profile.name);
        setPhone(profile.phone);
        setAddr(profile.address ?? emptyAddress());
        setSavedLat(profile.savedLat);
        setSavedLng(profile.savedLng);
      } else {
        setName('');
        setPhone('');
        setAddr(emptyAddress());
        setSavedLat(0);
        setSavedLng(0);
      }
    }
  }, [isOpen]);

  // ── GPS + Reverse Geocode ────────────────────────────────────────────────────
  const handleAutoDetect = () => {
    if (!navigator.geolocation) {
      setGpsStatus('error');
      return;
    }
    setGpsStatus('locating');
    setDetectingGps(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        setSavedLat(lat);
        setSavedLng(lng);

        setGpsStatus('geocoding');
        const geocoded = await reverseGeocode(lat, lng);

        setAddr((prev) => ({
          houseNo:  geocoded.houseNo  ?? prev.houseNo,
          building: geocoded.building ?? prev.building,
          street:   geocoded.street   ?? prev.street,
          city:     geocoded.city     ?? prev.city,
          state:    geocoded.state    ?? prev.state,
          pincode:  geocoded.pincode  ?? prev.pincode,
        }));
        setErrors({});
        setGpsStatus('done');
        setDetectingGps(false);
      },
      () => {
        setGpsStatus('error');
        setDetectingGps(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // ── Validation & Save ────────────────────────────────────────────────────────
  const handleSave = () => {
    const newErrors: typeof errors = {};
    if (!name.trim())        newErrors.name    = 'Full name is required.';
    if (!addr.city.trim())   newErrors.city    = 'City is required.';
    if (!addr.state.trim())  newErrors.state   = 'State is required.';
    if (!addr.pincode.trim()) newErrors.pincode = 'Pincode is required.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const profile: UserProfile = {
      name: name.trim(),
      phone: phone.trim(),
      address: {
        houseNo:  addr.houseNo.trim(),
        building: addr.building.trim(),
        street:   addr.street.trim(),
        city:     addr.city.trim(),
        state:    addr.state.trim(),
        pincode:  addr.pincode.trim(),
      },
      savedLat,
      savedLng,
    };
    saveProfile(profile);
    onSaved(profile);
    setSaved(true);
    setTimeout(() => onClose(), 1200);
  };

  if (!isOpen) return null;

  const gpsLabel: Record<typeof gpsStatus, string> = {
    idle: '📍 Auto-detect My Location',
    locating: 'Getting GPS signal…',
    geocoding: 'Looking up address…',
    done: '✓ Location Filled',
    error: 'GPS failed — enter manually',
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-600 text-white flex items-center justify-center shadow-xs">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-gray-900 leading-tight">My Profile</h3>
              <p className="text-xs text-gray-500">Save once — auto-fills every complaint form</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-200/70 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 max-h-[80vh] overflow-y-auto space-y-5">
          {/* Info banner */}
          <div className="p-3.5 bg-orange-50 border border-orange-100 rounded-2xl text-xs text-orange-800 leading-relaxed">
            <strong>Save once, auto-fill forever.</strong> Your details are stored only on this device and auto-fill the complaint form every time.
          </div>

          {/* ── Personal Info ────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Full Name" required icon={<User className="w-3 h-3" />} error={errors.name}>
              <input
                type="text"
                placeholder="e.g., Roshan Kumar"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (e.target.value.trim()) setErrors((p) => ({ ...p, name: undefined }));
                }}
                className={inputCls(!!errors.name)}
              />
            </Field>

            <Field label="Mobile Number" icon={<Phone className="w-3 h-3" />}>
              <input
                type="tel"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputCls()}
              />
            </Field>
          </div>

          {/* ── Home Address ─────────────────────────────────────── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-orange-600" />
                Home / Office Address
              </span>

              {/* GPS Auto-detect button */}
              <button
                type="button"
                onClick={handleAutoDetect}
                disabled={detectingGps}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-60 ${
                  gpsStatus === 'done'
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                    : gpsStatus === 'error'
                    ? 'bg-red-100 text-red-700 border border-red-200'
                    : 'bg-orange-600 text-white shadow-sm shadow-orange-600/30 hover:bg-orange-700'
                }`}
              >
                <Locate className={`w-3.5 h-3.5 ${detectingGps ? 'animate-pulse' : ''}`} />
                {gpsLabel[gpsStatus]}
              </button>
            </div>

            {gpsStatus === 'done' && savedLat !== 0 && (
              <p className="text-[10px] text-emerald-600 font-mono bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
                📌 GPS Coords: {savedLat}, {savedLng} — fields filled from OpenStreetMap. Edit if needed.
              </p>
            )}

            {/* Row 1: House No + Building */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field
                label="House / Flat No."
                required
                icon={<Hash className="w-3 h-3" />}
                error={errors.houseNo}
              >
                <input
                  type="text"
                  placeholder="e.g., 42-B, Flat 301"
                  value={addr.houseNo}
                  onChange={(e) => setField('houseNo', e.target.value)}
                  className={inputCls(!!errors.houseNo)}
                />
              </Field>

              <Field
                label="Building / Society"
                icon={<Building2 className="w-3 h-3" />}
                error={errors.building}
              >
                <input
                  type="text"
                  placeholder="e.g., Green Park Apartments"
                  value={addr.building}
                  onChange={(e) => setField('building', e.target.value)}
                  className={inputCls(!!errors.building)}
                />
              </Field>
            </div>

            {/* Row 2: Street */}
            <Field
              label="Street / Road / Area"
              required
              icon={<Map className="w-3 h-3" />}
              error={errors.street}
            >
              <input
                type="text"
                placeholder="e.g., MG Road, Lajpat Nagar Block C"
                value={addr.street}
                onChange={(e) => setField('street', e.target.value)}
                className={inputCls(!!errors.street)}
              />
            </Field>

            {/* Row 3: City + State + Pincode */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="City / District" required error={errors.city}>
                <input
                  type="text"
                  placeholder="e.g., New Delhi"
                  value={addr.city}
                  onChange={(e) => setField('city', e.target.value)}
                  className={inputCls(!!errors.city)}
                />
              </Field>

              <Field label="State" required error={errors.state}>
                <input
                  type="text"
                  placeholder="e.g., Delhi"
                  value={addr.state}
                  onChange={(e) => setField('state', e.target.value)}
                  className={inputCls(!!errors.state)}
                />
              </Field>

              <Field label="Pincode" required error={errors.pincode}>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="110024"
                  value={addr.pincode}
                  onChange={(e) => setField('pincode', e.target.value.replace(/\D/g, ''))}
                  className={inputCls(!!errors.pincode)}
                />
              </Field>
            </div>
          </div>

          {/* Save / Cancel */}
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
                  Profile Saved!
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
