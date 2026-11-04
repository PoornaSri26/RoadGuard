import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet'
import L from 'leaflet'
import './HazardMap.css'

// Custom marker icons
const getMarkerIcon = (severity, verified) => {
  const color = verified ? '#22c55e' : '#ef4444'
  const size = 10 + severity * 4

  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      width: ${size}px;
      height: ${size}px;
      background: ${color};
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size/2, size/2]
  })
}

const DAMAGE_LABELS = {
  'D00': 'Longitudinal Crack',
  'D10': 'Transverse Crack',
  'D20': 'Alligator Crack',
  'D40': 'Pothole'
}

function HazardMap({ reports }) {
  const defaultCenter = [20.5937, 78.9629] // India center
  const defaultZoom = 5

  return (
    <div className="hazard-map">
      <h2>Road Hazard Map</h2>
      <p className="map-stats">
        {reports.length} reported hazards
      </p>

      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        style={{ height: '600px', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {reports.map((report) => (
          <Marker
            key={report.id}
            position={[report.latitude, report.longitude]}
            icon={getMarkerIcon(report.severity, report.verified)}
          >
            <Popup>
              <div className="popup-content">
                <h3>{DAMAGE_LABELS[report.damage_type] || report.damage_type}</h3>
                <p><strong>Severity:</strong> {report.severity}/5</p>
                <p><strong>Verified:</strong> {report.verified ? '✅ Yes' : '❌ No'}</p>
                <p><strong>Votes:</strong> {report.verification_count}</p>
                {report.risk_score !== null && (
                  <p><strong>Risk Score:</strong> {(report.risk_score * 100).toFixed(1)}%</p>
                )}
                <p className="popup-date">
                  {new Date(report.created_at).toLocaleString()}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Risk zones - circles around high-risk areas */}
        {reports
          .filter(r => r.risk_score > 0.5)
          .map((report) => (
            <Circle
              key={`risk-${report.id}`}
              center={[report.latitude, report.longitude]}
              radius={200}
              pathOptions={{
                color: `rgba(239, 68, 68, ${report.risk_score})`,
                fillColor: `rgba(239, 68, 68, ${report.risk_score * 0.3})`,
                fillOpacity: 0.3,
                weight: 2
              }}
            />
          ))}
      </MapContainer>

      <div className="legend">
        <h3>Legend</h3>
        <div className="legend-item">
          <span className="legend-color" style={{ background: '#ef4444' }}></span>
          <span>Unverified</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ background: '#22c55e' }}></span>
          <span>Verified</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ background: 'rgba(239, 68, 68, 0.5)' }}></span>
          <span>High-risk zone</span>
        </div>
      </div>
    </div>
  )
}

export default HazardMap
