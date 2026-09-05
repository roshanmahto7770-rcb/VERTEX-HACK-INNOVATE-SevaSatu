'use client';

import React, { useState } from 'react';
import { MapPin, Navigation, ExternalLink, Copy, Check, Compass } from 'lucide-react';

interface MiniMapProps {
  latitude: number;
  longitude: number;
  addressText?: string;
  height?: string;
  zoom?: number;
  showNavigationButton?: boolean;
  className?: string;
}

export const MiniMap: React.FC<MiniMapProps> = ({
  latitude,
  longitude,
  addressText,
  height = 'h-48',
  zoom = 16,
  showNavigationButton = true,
  className = '',
}) => {
  const [copied, setCopied] = useState(false);

  // Bounding box calculation around point (~500m radius)
  const delta = 0.004;
  const bbox = `${longitude - delta}%2C${latitude - delta}%2C${longitude + delta}%2C${latitude + delta}`;
  const embedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latitude}%2C${longitude}`;
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
  const osmUrl = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=${zoom}/${latitude}/${longitude}`;

  const handleCopyCoords = () => {
    navigator.clipboard.writeText(`${latitude}, ${longitude}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-gray-200 bg-slate-900 shadow-sm ${className}`}>
      {/* Interactive Map Iframe */}
      <div className={`relative w-full ${height} overflow-hidden`}>
        <iframe
          title="Incident Location Mini Map"
          width="100%"
          height="100%"
          frameBorder="0"
          scrolling="no"
          marginHeight={0}
          marginWidth={0}
          src={embedUrl}
          className="w-full h-full border-0 filter contrast-[1.05]"
          loading="lazy"
        />

        {/* Pulse pin marker overlay */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="relative flex items-center justify-center">
            <div className="absolute w-8 h-8 rounded-full bg-orange-500/30 animate-ping" />
            <div className="absolute w-5 h-5 rounded-full bg-orange-600/50" />
            <div className="relative p-1.5 rounded-full bg-orange-600 text-white shadow-lg shadow-orange-600/50">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Top Floating Badge */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/75 backdrop-blur-xs text-white text-[10px] font-bold shadow-md">
          <Compass className="w-3.5 h-3.5 text-orange-400 animate-spin" style={{ animationDuration: '8s' }} />
          <span>Live GPS Mini Map</span>
        </div>

        {/* Coordinates copy button */}
        <button
          type="button"
          onClick={handleCopyCoords}
          className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/90 hover:bg-white text-gray-800 text-[10px] font-mono font-bold shadow-md backdrop-blur-xs transition-colors cursor-pointer"
          title="Copy GPS coordinates"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-gray-500" />}
          <span>{latitude.toFixed(4)}, {longitude.toFixed(4)}</span>
        </button>
      </div>

      {/* Bottom Navigation Toolbar */}
      <div className="p-2.5 bg-gray-50/95 border-t border-gray-200 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 text-gray-600 min-w-0">
          <MapPin className="w-3.5 h-3.5 text-orange-600 shrink-0" />
          <span className="truncate text-[11px] font-medium" title={addressText}>
            {addressText || `GPS: ${latitude}, ${longitude}`}
          </span>
        </div>

        {showNavigationButton && (
          <div className="flex items-center gap-1.5 shrink-0 ml-auto">
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-[11px] font-bold shadow-sm shadow-orange-600/30 transition-all cursor-pointer"
              title="Open turn-by-turn navigation in Google Maps"
            >
              <Navigation className="w-3 h-3" />
              <span>Navigate on Google Maps</span>
              <ExternalLink className="w-2.5 h-2.5 opacity-70" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
