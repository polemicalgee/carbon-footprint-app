import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Flame, RefreshCw, Info } from 'lucide-react';

const KENYA_EMISSION_DATA = [
  {
    name: 'Nairobi',
    lat: -1.286, lon: 36.817,
    co2PerCapita: 2.8,    
    totalCO2: 8400000,       
    transport: 42,           
    industrial: 28,
    energy: 22,
    waste: 8,
    population: 4397073,
    type: 'Megacity',
    drivers: ['Heavy traffic', 'Industrial zone', 'Power demand'],
  },
  {
    name: 'Mombasa',
    lat: -4.043, lon: 39.668,
    co2PerCapita: 2.1,
    totalCO2: 2100000,
    transport: 38, industrial: 35, energy: 20, waste: 7,
    population: 1208333,
    type: 'Port city',
    drivers: ['Port operations', 'Cement industry', 'Tourism'],
  },
  {
    name: 'Thika',
    lat: -1.033, lon: 37.069,
    co2PerCapita: 2.4,
    totalCO2: 1440000,
    transport: 25, industrial: 55, energy: 15, waste: 5,
    population: 139853,
    type: 'Industrial hub',
    drivers: ['Manufacturing', 'Food processing', 'Factories'],
  },
  {
    name: 'Kisumu',
    lat: -0.091, lon: 34.768,
    co2PerCapita: 1.4,
    totalCO2: 700000,
    transport: 44, industrial: 20, energy: 28, waste: 8,
    population: 610082,
    type: 'Lake city',
    drivers: ['Fishing industry', 'Sugar mills', 'Transport'],
  },
  {
    name: 'Nakuru',
    lat: -0.303, lon: 36.080,
    co2PerCapita: 1.6,
    totalCO2: 800000,
    transport: 40, industrial: 30, energy: 22, waste: 8,
    population: 570674,
    type: 'Rift Valley',
    drivers: ['Agriculture', 'Flower farms', 'Tanneries'],
  },
  {
    name: 'Eldoret',
    lat: 0.514, lon: 35.270,
    co2PerCapita: 1.2,
    totalCO2: 480000,
    transport: 45, industrial: 22, energy: 25, waste: 8,
    population: 475716,
    type: 'North Rift',
    drivers: ['Wheat farming', 'Transport hub', 'Universities'],
  },
  {
    name: 'Naivasha',
    lat: -0.717, lon: 36.431,
    co2PerCapita: 1.8,
    totalCO2: 360000,
    transport: 30, industrial: 45, energy: 18, waste: 7,
    population: 226054,
    type: 'Rift Valley',
    drivers: ['Flower industry', 'Geothermal', 'Horticulture'],
  },
  {
    name: 'Machakos',
    lat: -1.517, lon: 37.266,
    co2PerCapita: 0.9,
    totalCO2: 270000,
    transport: 48, industrial: 18, energy: 26, waste: 8,
    population: 273662,
    type: 'Eastern',
    drivers: ['Quarrying', 'Agriculture', 'Trade'],
  },
  {
    name: 'Kisii',
    lat: -0.682, lon: 34.766,
    co2PerCapita: 0.8,
    totalCO2: 192000,
    transport: 50, industrial: 15, energy: 27, waste: 8,
    population: 226461,
    type: 'Nyanza',
    drivers: ['Tea farming', 'Soapstone', 'Agriculture'],
  },
  {
    name: 'Nyeri',
    lat: -0.417, lon: 36.951,
    co2PerCapita: 0.7,
    totalCO2: 140000,
    transport: 45, industrial: 15, energy: 32, waste: 8,
    population: 159463,
    type: 'Central',
    drivers: ['Coffee farming', 'Tourism', 'Agriculture'],
  },
  {
    name: 'Malindi',
    lat: -3.219, lon: 40.117,
    co2PerCapita: 0.9,
    totalCO2: 102600,
    transport: 40, industrial: 18, energy: 34, waste: 8,
    population: 119859,
    type: 'Coastal',
    drivers: ['Tourism', 'Fishing', 'Beach resorts'],
  },
  {
    name: 'Garissa',
    lat: -0.453, lon: 39.646,
    co2PerCapita: 0.5,
    totalCO2: 87000,
    transport: 55, industrial: 10, energy: 28, waste: 7,
    population: 153667,
    type: 'North East',
    drivers: ['Livestock', 'Trade routes', 'Refugee camp'],
  },
  {
    name: 'Kitale',
    lat: 1.015, lon: 35.006,
    co2PerCapita: 0.6,
    totalCO2: 96000,
    transport: 48, industrial: 14, energy: 30, waste: 8,
    population: 185738,
    type: 'Trans Nzoia',
    drivers: ['Maize farming', 'Agriculture', 'Trade'],
  },
  {
    name: 'Lamu',
    lat: -2.269, lon: 40.902,
    co2PerCapita: 0.4,
    totalCO2: 14800,
    transport: 35, industrial: 8, energy: 45, waste: 12,
    population: 101539,
    type: 'Coastal heritage',
    drivers: ['Tourism', 'Dhow trade', 'Fishing'],
  },
];


const classifyCO2 = (co2) => {
  if (co2 >= 2.5) return { level: 'critical', color: '#ef4444', bg: '#fef2f2', border: '#fecaca', label: 'Very High',  textColor: '#dc2626' };
  if (co2 >= 1.8) return { level: 'high',     color: '#f97316', bg: '#fff7ed', border: '#fed7aa', label: 'High',      textColor: '#ea580c' };
  if (co2 >= 1.0) return { level: 'moderate', color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', label: 'Moderate',  textColor: '#d97706' };
  return               { level: 'low',      color: '#00a650', bg: '#f0fdf4', border: '#bbf7d0', label: 'Low',       textColor: '#16a34a' };
};

const SOURCE_COLORS = {
  transport:  '#3b82f6',
  industrial: '#8b5cf6',
  energy:     '#f59e0b',
  waste:      '#6b7280',
};

const KenyaCarbonHeatmap = () => {
  const mapRef     = useRef(null);
  const leafletRef = useRef(null);
  const markersRef = useRef([]);
  const heatLayerRef = useRef(null);
  const [mapReady, setMapReady]   = useState(false);
  const [selected, setSelected]   = useState(null);
  const [viewMode, setViewMode]   = useState('heatmap'); // 'heatmap' | 'circles'
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    setLoading(true);
    const loadScript = (src, id) => new Promise((resolve) => {
      if (document.getElementById(id)) { resolve(); return; }
      const s = document.createElement('script');
      s.src = src; s.id = id;
      s.onload = resolve;
      document.head.appendChild(s);
    });

    const loadCss = (href, id) => {
      if (document.getElementById(id)) return;
      const l = document.createElement('link');
      l.rel = 'stylesheet'; l.href = href; l.id = id;
      document.head.appendChild(l);
    };

    loadCss('https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css', 'leaflet-css');

    loadScript('https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js', 'leaflet-js')
      .then(() => loadScript(
        'https://cdnjs.cloudflare.com/ajax/libs/leaflet.heat/0.2.0/leaflet-heat.js',
        'leaflet-heat-js'
      ))
      .then(() => { setMapReady(true); setLoading(false); });
  }, []);

   useEffect(() => {
    if (!mapReady || !window.L || leafletRef.current) return;
    const L = window.L;

    const map = L.map(mapRef.current, {
      center: [-0.8, 37.5],
      zoom: 6,
      zoomControl: true,
      scrollWheelZoom: false,
    });

        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap © CARTO',
      maxZoom: 18,
    }).addTo(map);

    leafletRef.current = map;
    return () => { map.remove(); leafletRef.current = null; };
  }, [mapReady]);

    useEffect(() => {
    if (!leafletRef.current || !window.L) return;
    const L = window.L;
    const map = leafletRef.current;

      markersRef.current.forEach(m => map.removeLayer(m));
    markersRef.current = [];
    if (heatLayerRef.current) { map.removeLayer(heatLayerRef.current); heatLayerRef.current = null; }

    if (viewMode === 'heatmap' && L.heatLayer) {
  
    const maxCO2 = Math.max(...KENYA_EMISSION_DATA.map(d => d.co2PerCapita));
      const heatPoints = KENYA_EMISSION_DATA.map(d => [
        d.lat, d.lon,
        d.co2PerCapita / maxCO2  
      ]);

      heatLayerRef.current = L.heatLayer(heatPoints, {
        radius: 55,
        blur: 40,
        maxZoom: 10,
        max: 1.0,
        gradient: {
          0.0: '#00a650',  
          0.4: '#f59e0b',  
          0.65: '#f97316', 
          1.0: '#ef4444',  
        }
      }).addTo(map);

      KENYA_EMISSION_DATA.forEach(loc => {
        const { label, textColor } = classifyCO2(loc.co2PerCapita);
        const icon = L.divIcon({
          className: '',
          html: `<div style="
            background:white;
            border:2px solid ${textColor};
            border-radius:99px;
            padding:2px 8px;
            font-size:11px;
            font-weight:700;
            color:${textColor};
            white-space:nowrap;
            box-shadow:0 1px 4px rgba(0,0,0,0.15);
            cursor:pointer;
          ">${loc.name} · ${loc.co2PerCapita}t</div>`,
          iconAnchor: [40, 10],
        });
        const marker = L.marker([loc.lat, loc.lon], { icon })
          .addTo(map)
          .on('click', () => setSelected(loc));
        markersRef.current.push(marker);
      });

    } else {
      const maxTotal = Math.max(...KENYA_EMISSION_DATA.map(d => d.totalCO2));
      KENYA_EMISSION_DATA.forEach(loc => {
        const { color } = classifyCO2(loc.co2PerCapita);
        const radius = 10 + (loc.totalCO2 / maxTotal) * 40;

        const glow = L.circleMarker([loc.lat, loc.lon], {
          radius: radius + 8, color, fillColor: color,
          fillOpacity: 0.15, weight: 0,
        }).addTo(map);

        const circle = L.circleMarker([loc.lat, loc.lon], {
          radius, color: '#fff', fillColor: color,
          fillOpacity: 0.80, weight: 2,
        }).addTo(map);

        const popup = `
          <div style="font-family:sans-serif;padding:4px 0;min-width:160px">
            <p style="font-weight:800;font-size:13px;margin:0 0 2px;color:#111">${loc.name}</p>
            <p style="font-size:11px;color:#888;margin:0 0 8px">${loc.type}</p>
            <div style="display:flex;justify-content:space-between;margin-bottom:4px">
              <span style="font-size:11px;color:#555">CO₂ per capita</span>
              <span style="font-weight:700;font-size:13px;color:${color}">${loc.co2PerCapita}t/yr</span>
            </div>
            <div style="display:flex;justify-content:space-between">
              <span style="font-size:11px;color:#555">City total</span>
              <span style="font-weight:600;font-size:12px;color:#333">${(loc.totalCO2 / 1000000).toFixed(1)}M t/yr</span>
            </div>
          </div>`;

        circle.bindPopup(popup, { maxWidth: 200 });
        circle.on('click', () => setSelected(loc));
        glow.on('click',   () => { circle.openPopup(); setSelected(loc); });
        markersRef.current.push(circle, glow);
      });
    }
  }, [mapReady, viewMode]);

  const sorted = [...KENYA_EMISSION_DATA].sort((a, b) => b.co2PerCapita - a.co2PerCapita);
  const totalKenya = KENYA_EMISSION_DATA.reduce((s, d) => s + d.totalCO2, 0);
  const counts = KENYA_EMISSION_DATA.reduce((acc, d) => {
    const { level } = classifyCO2(d.co2PerCapita);
    acc[level] = (acc[level] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">

        <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Flame className="text-red-500" size={20} />
          <h2 className="text-lg font-bold text-gray-900">Kenya Carbon Emissions Heatmap</h2>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setViewMode('heatmap')}
            className={`px-3 py-1 rounded-full text-xs font-semibold border transition ${viewMode === 'heatmap' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
            Heatmap
          </button>
          <button onClick={() => setViewMode('circles')}
            className={`px-3 py-1 rounded-full text-xs font-semibold border transition ${viewMode === 'circles' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
            Bubbles
          </button>
        </div>
      </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {[
          { label: 'Total Kenya CO₂', value: `${(totalKenya / 1000000).toFixed(1)}M t/yr`, color: 'text-gray-900' },
          { label: 'Cities tracked', value: KENYA_EMISSION_DATA.length, color: 'text-blue-600' },
          { label: 'Highest emitter', value: sorted[0].name, color: 'text-red-500' },
          { label: 'Lowest emitter',  value: sorted[sorted.length - 1].name, color: 'text-green-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
            <p className="text-xs text-gray-400 font-medium">{label}</p>
            <p className={`text-base font-black mt-0.5 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

            <div className="flex flex-wrap gap-2 mb-4">
        {[
          { level: 'low',      color: '#00a650', bg: '#f0fdf4', border: '#bbf7d0', label: 'Low  < 1.0t',      n: counts.low      || 0 },
          { level: 'moderate', color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', label: 'Moderate 1.0–1.8t', n: counts.moderate || 0 },
          { level: 'high',     color: '#f97316', bg: '#fff7ed', border: '#fed7aa', label: 'High 1.8–2.5t',     n: counts.high     || 0 },
          { level: 'critical', color: '#ef4444', bg: '#fef2f2', border: '#fecaca', label: 'Very High > 2.5t',  n: counts.critical || 0 },
        ].map(({ color, bg, border, label, n }) => (
          <div key={label} style={{ background: bg, border: `1px solid ${border}` }}>
            <span className="w-2 h-2 rounded-full" style={{ background: color }}></span>
            {label} ({n})
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-xl overflow-hidden border border-gray-100" style={{ height: '400px' }}>
          {loading ? (
            <div className="flex items-center justify-center h-full bg-gray-50">
              <div className="flex flex-col items-center gap-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00a650]"></div>
                <p className="text-sm text-gray-400">Loading map...</p>
              </div>
            </div>
          ) : (
            <div ref={mapRef} style={{ height: '100%', width: '100%' }} />
          )}
        </div>

        <div className="overflow-y-auto" style={{ maxHeight: '400px' }}>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 sticky top-0 bg-white pb-1">
            CO₂ per capita (t/yr)
          </p>
          {sorted.map((loc, i) => {
            const { color, label } = classifyCO2(loc.co2PerCapita);
            const pct = (loc.co2PerCapita / sorted[0].co2PerCapita) * 100;
            return (
              <div key={loc.name} onClick={() => setSelected(loc)}
                className={`p-2.5 rounded-lg cursor-pointer mb-1 transition border ${selected?.name === loc.name ? 'border-gray-200 bg-gray-50' : 'border-transparent hover:bg-gray-50'}`}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs font-bold text-gray-300 w-4">{i + 1}</span>
                  <span className="text-xs font-semibold text-gray-800 flex-1">{loc.name}</span>
                  <span className="text-sm font-black" style={{ color }}>{loc.co2PerCapita}t</span>
                </div>
              
                <div className="ml-6 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }}></div>
                </div>
                <div className="ml-6 flex justify-between mt-0.5">
                  <span className="text-xs text-gray-400">{loc.type}</span>
                  <span className="text-xs font-medium" style={{ color }}>{label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selected && (
        <div className="mt-4 p-4 rounded-xl border border-gray-100 bg-gray-50">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="font-bold text-gray-900 text-base">{selected.name}
                <span className="text-gray-400 font-normal text-sm ml-2">{selected.type}</span>
              </p>
              <p className="text-sm text-gray-500">
                {selected.co2PerCapita}t CO₂/capita/yr •{' '}
                <span className="font-semibold" style={{ color: classifyCO2(selected.co2PerCapita).color }}>
                  {classifyCO2(selected.co2PerCapita).label}
                </span>
                {' '}• {(selected.totalCO2 / 1000000).toFixed(2)}M tonnes total
              </p>
            </div>
            <button onClick={() => setSelected(null)} className="text-gray-300 hover:text-gray-500 text-xl">×</button>
          </div>

          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Emission sources</p>
          <div className="grid grid-cols-4 gap-2 mb-3">
            {[
              { key: 'transport',  label: 'Transport',   value: selected.transport  },
              { key: 'industrial', label: 'Industrial',  value: selected.industrial },
              { key: 'energy',     label: 'Energy',      value: selected.energy     },
              { key: 'waste',      label: 'Waste',       value: selected.waste      },
            ].map(({ key, label, value }) => (
              <div key={key} className="bg-white rounded-lg p-2 border border-gray-100 text-center">
                <div className="w-full bg-gray-100 rounded-full h-1.5 mb-1">
                  <div className="h-1.5 rounded-full" style={{ width: `${value}%`, background: SOURCE_COLORS[key] }}></div>
                </div>
                <p className="text-sm font-black text-gray-800">{value}%</p>
                <p className="text-xs text-gray-400">{label}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-400 font-medium">Key drivers:</span>
            {selected.drivers.map(d => (
              <span key={d} className="text-xs bg-white border border-gray-200 text-gray-600 px-2 py-0.5 rounded-full">{d}</span>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-gray-300 mt-3">
        Data: Kenya National Bureau of Statistics, UNEP, World Bank • CO₂ per capita in tonnes/year • Click any location for breakdown
      </p>
    </div>
  );
};

export default KenyaCarbonHeatmap;
