import { useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet'
import L from 'leaflet'
import './RoutePlanner.css'

// Custom icons
const startIcon = L.divIcon({
  className: 'route-marker',
  html: '<div style="font-size: 24px;">🚀</div>',
  iconSize: [30, 30],
  iconAnchor: [15, 15]
})

const endIcon = L.divIcon({
  className: 'route-marker',
  html: '<div style="font-size: 24px;">🎯</div>',
  iconSize: [30, 30],
  iconAnchor: [15, 15]
})

function RoutePlanner() {
  const [formData, setFormData] = useState({
    startLat: '',
    startLon: '',
    endLat: '',
    endLon: ''
  })
  const [routeResult, setRouteResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [startLocationLoading, setStartLocationLoading] = useState(false)
  const [endLocationLoading, setEndLocationLoading] = useState(false)

  const getLocation = (field) => {
    const setLoading = field === 'start' ? setStartLocationLoading : setEndLocationLoading

    setLoading(true)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData({
            ...formData,
            [field === 'start' ? 'startLat' : 'endLat']: position.coords.latitude.toFixed(6),
            [field === 'start' ? 'startLon' : 'endLon']: position.coords.longitude.toFixed(6)
          })
          setLoading(false)
        },
        (error) => {
          alert('Failed to get location')
          setLoading(false)
        }
      )
    } else {
      alert('Geolocation not supported')
      setLoading(false)
    }
  }

  const handleCompare = async () => {
    setLoading(true)
    try {
      const response = await fetch('http://localhost:8000/routing/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start_lat: parseFloat(formData.startLat),
          start_lon: parseFloat(formData.startLon),
          end_lat: parseFloat(formData.endLat),
          end_lon: parseFloat(formData.endLon)
        })
      })

      const data = await response.json()
      setRouteResult(data)
    } catch (error) {
      console.error('Failed to compare routes:', error)
      alert('Failed to get route data')
    }
    setLoading(false)
  }

  const decodePolyline = (encoded) => {
    // Simple polyline decoder (using browser's built-in if available, or fallback)
    // For production, use the polyline library
    try {
      const points = []
      let index = 0
      let lat = 0
      let lon = 0

      while (index < encoded.length) {
        let b
        let shift = 0
        let result = 0

        do {
          b = encoded.charCodeAt(index++) - 63
          result |= (b & 0x1f) << shift
          shift += 5
        } while (b >= 0x20)

        lat += ((result & 1) ? ~(result >> 1) : (result >> 1))

        shift = 0
        result = 0

        do {
          b = encoded.charCodeAt(index++) - 63
          result |= (b & 0x1f) << shift
          shift += 5
        } while (b >= 0x20)

        lon += ((result & 1) ? ~(result >> 1) : (result >> 1))

        points.push([lat / 1e5, lon / 1e5])
      }

      return points
    } catch (e) {
      console.error('Failed to decode polyline:', e)
      return []
    }
  }

  return (
    <div className="route-planner">
      <h2>Safe Route Planner</h2>
      <p className="planner-description">
        Compare route alternatives by safety. The system will find the safest route
        considering reported road hazards.
      </p>

      <div className="route-form">
        <div className="form-row">
          <div className="form-group">
            <label>Start Location</label>
            <div className="location-inputs">
              <input
                type="number"
                step="any"
                placeholder="Latitude"
                value={formData.startLat}
                onChange={(e) => setFormData({ ...formData, startLat: e.target.value })}
                required
              />
              <input
                type="number"
                step="any"
                placeholder="Longitude"
                value={formData.startLon}
                onChange={(e) => setFormData({ ...formData, startLon: e.target.value })}
                required
              />
              <button
                type="button"
                onClick={() => getLocation('start')}
                disabled={startLocationLoading}
                className="location-btn"
              >
                {startLocationLoading ? '📍...' : '📍'}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>End Location</label>
            <div className="location-inputs">
              <input
                type="number"
                step="any"
                placeholder="Latitude"
                value={formData.endLat}
                onChange={(e) => setFormData({ ...formData, endLat: e.target.value })}
                required
              />
              <input
                type="number"
                step="any"
                placeholder="Longitude"
                value={formData.endLon}
                onChange={(e) => setFormData({ ...formData, endLon: e.target.value })}
                required
              />
              <button
                type="button"
                onClick={() => getLocation('end')}
                disabled={endLocationLoading}
                className="location-btn"
              >
                {endLocationLoading ? '📍...' : '📍'}
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={handleCompare}
          disabled={loading || !formData.startLat || !formData.startLon || !formData.endLat || !formData.endLon}
          className="compare-btn"
        >
          {loading ? 'Analyzing...' : 'Compare Routes'}
        </button>
      </div>

      {routeResult && (
        <div className="route-results">
          <div className="result-card primary">
            <h3>🛡️ Recommended: {routeResult.recommendation === 'safest' ? 'Safest Route' : 'Fastest Route'}</h3>
            <p className="result-message">{routeResult.message}</p>
            <div className="result-stats">
              <div className="stat">
                <span className="stat-label">Distance</span>
                <span className="stat-value">{(routeResult.safest_route.distance / 1000).toFixed(2)} km</span>
              </div>
              <div className="stat">
                <span className="stat-label">Duration</span>
                <span className="stat-value">{Math.round(routeResult.safest_route.duration / 60)} min</span>
              </div>
              <div className="stat">
                <span className="stat-label">Risk Score</span>
                <span className="stat-value risk">{(routeResult.safest_route.risk_score * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>

          <div className="result-card secondary">
            <h3>⚡ Fastest Route (for comparison)</h3>
            <div className="result-stats">
              <div className="stat">
                <span className="stat-label">Distance</span>
                <span className="stat-value">{(routeResult.fastest_route.distance / 1000).toFixed(2)} km</span>
              </div>
              <div className="stat">
                <span className="stat-label">Duration</span>
                <span className="stat-value">{Math.round(routeResult.fastest_route.duration / 60)} min</span>
              </div>
              <div className="stat">
                <span className="stat-label">Risk Score</span>
                <span className="stat-value risk">{(routeResult.fastest_route.risk_score * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>

          <div className="route-map">
            <MapContainer
              center={[
                (parseFloat(formData.startLat) + parseFloat(formData.endLat)) / 2,
                (parseFloat(formData.startLon) + parseFloat(formData.endLon)) / 2
              ]}
              zoom={12}
              style={{ height: '400px', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <Marker
                position={[parseFloat(formData.startLat), parseFloat(formData.startLon)]}
                icon={startIcon}
              >
                <Popup>Start</Popup>
              </Marker>

              <Marker
                position={[parseFloat(formData.endLat), parseFloat(formData.endLon)]}
                icon={endIcon}
              >
                <Popup>End</Popup>
              </Marker>

              {routeResult.safest_route.geometry && (
                <Polyline
                  positions={decodePolyline(routeResult.safest_route.geometry)}
                  color="#22c55e"
                  weight={5}
                  opacity={0.8}
                />
              )}
            </MapContainer>
          </div>
        </div>
      )}
    </div>
  )
}

export default RoutePlanner
