import { useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet'
import L from 'leaflet'
import { AlertTriangle, ShieldCheck, MapPin, Layers, Filter, Eye } from 'lucide-react'
import { DAMAGE_LABELS, DAMAGE_COLORS } from '../mockData'
import './HazardMap.css'

// Custom marker icons with glow and pulse
const getMarkerIcon = (severity, verified, damageType) => {
  const color = DAMAGE_COLORS[damageType] || (verified ? '#10b981' : '#f59e0b')
  const size = Math.max(16, 12 + severity * 4)

  return L.divIcon({
    className: 'custom-hazard-marker',
    html: `
      <div style="
        position: relative;
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border-radius: 50%;
        border: 2.5px solid #ffffff;
        box-shadow: 0 0 12px ${color}88, 0 4px 10px rgba(0,0,0,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        color: white;
        font-weight: bold;
      ">
        ${severity >= 4 ? '!' : ''}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  })
}

function MapViewController({ center, zoom }) {
  const map = useMap()
  if (center) {
    map.setView(center, zoom || 6)
  }
  return null
}

function HazardMap({ reports = [], onReportClick }) {
  const [selectedDamageFilter, setSelectedDamageFilter] = useState('ALL')
  const [minSeverity, setMinSeverity] = useState(1)
  const [centerCoords, setCenterCoords] = useState([20.5937, 78.9629]) // India center

  const filteredReports = reports.filter(r => {
    const matchesType = selectedDamageFilter === 'ALL' || r.damage_type === selectedDamageFilter
    const matchesSeverity = (r.severity || 1) >= minSeverity
    return matchesType && matchesSeverity
  })

  const quickJumpToCity = (coords) => {
    setCenterCoords(coords)
  }

  return (
    <div className="hazard-map-container">
      {/* Control / Filter Bar */}
      <div className="map-toolbar">
        <div className="toolbar-left">
          <div className="filter-pill">
            <Filter className="w-4 h-4 text-amber-500" />
            <select
              value={selectedDamageFilter}
              onChange={(e) => setSelectedDamageFilter(e.target.value)}
              className="filter-select"
            >
              <option value="ALL">All Hazard Types ({reports.length})</option>
              <option value="D40">Potholes (D40)</option>
              <option value="D20">Alligator Cracks (D20)</option>
              <option value="D10">Transverse Cracks (D10)</option>
              <option value="D00">Longitudinal Cracks (D00)</option>
            </select>
          </div>

          <div className="filter-pill">
            <span>Min Severity: {minSeverity}+</span>
            <input
              type="range"
              min="1"
              max="5"
              value={minSeverity}
              onChange={(e) => setMinSeverity(Number(e.target.value))}
              className="severity-slider"
            />
          </div>
        </div>

        <div className="toolbar-right">
          <span className="text-xs text-slate-400">Quick Focus:</span>
          <button onClick={() => quickJumpToCity([28.6139, 77.2090])} className="city-btn">Delhi</button>
          <button onClick={() => quickJumpToCity([19.0760, 72.8777])} className="city-btn">Mumbai</button>
          <button onClick={() => quickJumpToCity([12.9716, 77.5946])} className="city-btn">Bengaluru</button>
          <button onClick={() => quickJumpToCity([17.3850, 78.4867])} className="city-btn">Hyderabad</button>
        </div>
      </div>

      <div className="map-wrapper">
        <MapContainer
          center={centerCoords}
          zoom={5}
          style={{ height: '620px', width: '100%', borderRadius: '16px' }}
        >
          <MapViewController center={centerCoords} zoom={6} />

          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {filteredReports.map((report) => (
            <Marker
              key={report.id}
              position={[report.latitude, report.longitude]}
              icon={getMarkerIcon(report.severity || 3, report.verified, report.damage_type)}
            >
              <Popup className="road-hazard-popup">
                <div className="popup-card">
                  {report.image_url && (
                    <img
                      src={report.image_url}
                      alt="Hazard evidence"
                      className="popup-thumb"
                    />
                  )}
                  <div className="popup-body">
                    <div className="popup-badge" style={{ backgroundColor: DAMAGE_COLORS[report.damage_type] || '#f97316' }}>
                      {DAMAGE_LABELS[report.damage_type] || report.damage_type}
                    </div>

                    {report.location_name && (
                      <p className="popup-location">
                        <MapPin className="w-3.5 h-3.5 inline mr-1 text-slate-400" />
                        {report.location_name}
                      </p>
                    )}

                    <div className="popup-metrics">
                      <div className="metric">
                        <span className="metric-label">Severity</span>
                        <span className="metric-val text-amber-500 font-bold">{report.severity || 3}/5</span>
                      </div>
                      <div className="metric">
                        <span className="metric-label">Risk Level</span>
                        <span className="metric-val text-red-500 font-bold">
                          {((report.risk_score || 0.6) * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="metric">
                        <span className="metric-label">Community Votes</span>
                        <span className="metric-val font-semibold">{report.verification_count || 1}</span>
                      </div>
                    </div>

                    <div className="popup-status">
                      {report.verified ? (
                        <span className="status-verified">
                          <ShieldCheck className="w-3.5 h-3.5 inline mr-1" />
                          Authority / Community Verified
                        </span>
                      ) : (
                        <span className="status-pending">
                          <AlertTriangle className="w-3.5 h-3.5 inline mr-1" />
                          Pending Crowdsource Audit
                        </span>
                      )}
                    </div>

                    <div className="popup-footer">
                      <span className="popup-time">
                        {report.created_at ? new Date(report.created_at).toLocaleDateString() : 'Active'}
                      </span>
                      <span className="popup-coords">
                        {report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}
                      </span>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* High risk zone radar overlays */}
          {filteredReports
            .filter(r => (r.risk_score || 0.5) >= 0.75)
            .map((report) => (
              <Circle
                key={`danger-${report.id}`}
                center={[report.latitude, report.longitude]}
                radius={25000}
                pathOptions={{
                  color: '#ef4444',
                  fillColor: '#ef4444',
                  fillOpacity: 0.15,
                  weight: 1.5,
                  dashArray: '4, 4'
                }}
              />
            ))}
        </MapContainer>

        {/* Floating Quick Legend */}
        <div className="floating-legend">
          <div className="legend-title">Hazard Severity Index</div>
          <div className="legend-items">
            <div className="legend-entry">
              <span className="dot" style={{ backgroundColor: '#ef4444' }}></span>
              <span>Pothole (D40)</span>
            </div>
            <div className="legend-entry">
              <span className="dot" style={{ backgroundColor: '#f97316' }}></span>
              <span>Alligator Crack (D20)</span>
            </div>
            <div className="legend-entry">
              <span className="dot" style={{ backgroundColor: '#eab308' }}></span>
              <span>Transverse (D10)</span>
            </div>
            <div className="legend-entry">
              <span className="dot" style={{ backgroundColor: '#3b82f6' }}></span>
              <span>Longitudinal (D00)</span>
            </div>
          </div>
          <div className="legend-action">
            <button onClick={onReportClick} className="btn-report-quick">
              + Report New Incident
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HazardMap
