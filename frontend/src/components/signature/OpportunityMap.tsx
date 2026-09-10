import React, { useEffect, useRef, useState } from 'react';
import { Filter, Users, MapPin as MapPinIcon, CheckCircle2, ShieldCheck, Phone } from 'lucide-react';

export interface MapWorkerPin {
  id: string;
  name: string;
  profession?: string;
  skills?: string[];
  lat: number;
  lng: number;
  type: 'WORKER' | 'CUSTOMER' | 'JOB';
  rating?: number;
  fairnessDebt?: number;
  isAvailable?: boolean;
  phone?: string;
  address?: string;
  serviceRadiusKm?: number;
}

interface OpportunityMapProps {
  center?: [number, number];
  zoom?: number;
  workers?: MapWorkerPin[];
  height?: string;
}

export const OpportunityMap: React.FC<OpportunityMapProps> = ({
  center = [12.9716, 77.5946], // Bengaluru center
  zoom = 12,
  workers = [],
  height = '420px',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  const [selectedProfession, setSelectedProfession] = useState<string>('ALL');
  const [onlyAvailable, setOnlyAvailable] = useState<boolean>(false);
  const [selectedWorkerDetail, setSelectedWorkerDetail] = useState<MapWorkerPin | null>(null);

  // Extract unique professions
  const professions = ['ALL', ...Array.from(new Set(workers.map((w) => w.profession).filter(Boolean))) as string[]];

  const filteredWorkers = workers.filter((w) => {
    const matchesProf = selectedProfession === 'ALL' || w.profession === selectedProfession;
    const matchesAvail = !onlyAvailable || w.isAvailable;
    return matchesProf && matchesAvail;
  });

  const [isLeafletReady, setIsLeafletReady] = useState<boolean>(!!(window as any).L);

  useEffect(() => {
    if ((window as any).L) {
      setIsLeafletReady(true);
      return;
    }
    const checkInterval = setInterval(() => {
      if ((window as any).L) {
        setIsLeafletReady(true);
        clearInterval(checkInterval);
      }
    }, 200);
    return () => clearInterval(checkInterval);
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current || !isLeafletReady) return;

    const L = (window as any).L;
    if (!L) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current).setView(center, zoom);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      mapInstanceRef.current = map;
    } else {
      mapInstanceRef.current.setView(center, zoom);
    }

    const map = mapInstanceRef.current;

    // Clear existing markers
    map.eachLayer((layer: any) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    // Add worker pins to Leaflet map
    filteredWorkers.forEach((pin) => {
      const isAvailable = pin.isAvailable !== false;
      const color = isAvailable ? '#10B981' : '#6B7280'; // Emerald if available, gray if offline

      const customIcon = L.divIcon({
        className: 'custom-map-pin',
        html: `
          <div style="
            background-color: ${color};
            color: white;
            width: 34px;
            height: 34px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 13px;
            font-weight: bold;
            box-shadow: 0 4px 12px rgba(0,0,0,0.35);
            border: 2.5px solid white;
            transition: transform 0.2s;
          ">
            👷
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 34],
      });

      const popupContent = `
        <div style="font-family: system-ui, sans-serif; padding: 6px; min-width: 180px;">
          <div style="font-weight: 800; font-size: 14px; color: #1B3B2B; margin-bottom: 2px;">${pin.name}</div>
          <div style="font-size: 11px; font-weight: 600; color: #D97706; margin-bottom: 4px;">${pin.profession || 'Worker'}</div>
          <div style="font-size: 11px; color: #4B5563; margin-bottom: 2px;">⭐ ${pin.rating || 5.0} • Fairness Debt: +${pin.fairnessDebt || 0}</div>
          <div style="font-size: 10px; color: #6B7280;">Radius: ${pin.serviceRadiusKm || 15}km • ${isAvailable ? '🟢 Online' : '⚪ Offline'}</div>
        </div>
      `;

      const marker = L.marker([pin.lat, pin.lng], { icon: customIcon })
        .addTo(map)
        .bindPopup(popupContent);

      marker.on('click', () => {
        setSelectedWorkerDetail(pin);
      });
    });

  }, [center, zoom, filteredWorkers, isLeafletReady]);

  return (
    <div className="space-y-3">
      {/* Filter Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-stone-900 text-stone-100 p-3 rounded-xl border border-stone-800 text-xs">
        <div className="flex items-center space-x-3">
          <Filter className="w-4 h-4 text-emerald-400" />
          <span className="font-bold text-stone-200">Filter Bengaluru Workers:</span>
          
          <select
            value={selectedProfession}
            onChange={(e) => setSelectedProfession(e.target.value)}
            className="bg-stone-800 text-stone-200 border border-stone-700 px-2.5 py-1 rounded-lg font-medium focus:outline-none"
          >
            {professions.map((p) => (
              <option key={p} value={p}>
                {p === 'ALL' ? 'All Professions' : p}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={onlyAvailable}
              onChange={(e) => setOnlyAvailable(!onlyAvailable)}
              className="accent-emerald-500 rounded"
            />
            <span className="text-stone-300 font-medium">Online Only</span>
          </label>
          <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-mono px-2 py-0.5 rounded border border-emerald-500/30">
            {filteredWorkers.length} Workers Shown
          </span>
        </div>
      </div>

      {/* Map Element */}
      <div className="relative rounded-xl overflow-hidden border border-coop-border shadow-coop">
        <div ref={mapContainerRef} style={{ height }} />
        
        {/* Legend */}
        <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-coop-border text-[11px] font-semibold flex items-center gap-3 z-[1000] shadow-sm">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500" /> Online & Dispatchable
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-stone-400" /> Offline / Resting
          </span>
        </div>
      </div>

      {/* Selected Worker Info Modal Bar */}
      {selectedWorkerDetail && (
        <div className="bg-white border-2 border-coop-forest p-4 rounded-xl shadow-md flex flex-wrap items-center justify-between gap-4 animate-in fade-in duration-150">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-base">
              👷
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="font-extrabold text-coop-forest text-sm">{selectedWorkerDetail.name}</h4>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {selectedWorkerDetail.profession}
                </span>
              </div>
              <p className="text-xs text-coop-charcoal-light mt-0.5">
                Skills: {selectedWorkerDetail.skills?.join(', ') || 'Certified Professional'} • Radius: {selectedWorkerDetail.serviceRadiusKm || 15}km
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <div className="text-right">
              <div className="font-extrabold text-coop-forest">⭐ {selectedWorkerDetail.rating || 5.0}</div>
              <div className="text-[10px] text-coop-saffron-dark font-bold">Debt: +{selectedWorkerDetail.fairnessDebt || 0}</div>
            </div>
            <button
              onClick={() => setSelectedWorkerDetail(null)}
              className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
