import { useState } from 'react'
import './ReportForm.css'

function ReportForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    latitude: '',
    longitude: '',
    damage_type: '',
    severity: '',
    image: null
  })
  const [loading, setLoading] = useState(false)
  const [locationLoading, setLocationLoading] = useState(false)

  const getLocation = () => {
    setLocationLoading(true)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData({
            ...formData,
            latitude: position.coords.latitude.toFixed(6),
            longitude: position.coords.longitude.toFixed(6)
          })
          setLocationLoading(false)
        },
        (error) => {
          alert('Failed to get location. Please enter manually.')
          setLocationLoading(false)
        }
      )
    } else {
      alert('Geolocation not supported')
      setLocationLoading(false)
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData({
          ...formData,
          image: reader.result
        })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    const reportData = {
      latitude: parseFloat(formData.latitude),
      longitude: parseFloat(formData.longitude),
      damage_type: formData.damage_type || null,
      severity: formData.severity ? parseInt(formData.severity) : null,
      image_data: formData.image
    }

    await onSubmit(reportData)
    setLoading(false)

    // Reset form
    setFormData({
      latitude: '',
      longitude: '',
      damage_type: '',
      severity: '',
      image: null
    })
  }

  return (
    <div className="report-form">
      <h2>Report Road Damage</h2>
      <p className="form-description">
        Submit a road damage report. If you upload an image, our AI will automatically
        detect the damage type and estimate severity.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Location</label>
          <div className="location-inputs">
            <input
              type="number"
              step="any"
              placeholder="Latitude"
              value={formData.latitude}
              onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
              required
            />
            <input
              type="number"
              step="any"
              placeholder="Longitude"
              value={formData.longitude}
              onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
              required
            />
            <button
              type="button"
              onClick={getLocation}
              disabled={locationLoading}
              className="location-btn"
            >
              {locationLoading ? '📍...' : '📍 Use My Location'}
            </button>
          </div>
        </div>

        <div className="form-group">
          <label>Damage Image (Optional)</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="file-input"
          />
          {formData.image && (
            <div className="image-preview">
              <img src={formData.image} alt="Preview" />
            </div>
          )}
        </div>

        <div className="form-group">
          <label>Damage Type (Optional - AI will detect if image provided)</label>
          <select
            value={formData.damage_type}
            onChange={(e) => setFormData({ ...formData, damage_type: e.target.value })}
          >
            <option value="">Auto-detect from image</option>
            <option value="D00">Longitudinal Crack (D00)</option>
            <option value="D10">Transverse Crack (D10)</option>
            <option value="D20">Alligator Crack (D20)</option>
            <option value="D40">Pothole (D40)</option>
          </select>
        </div>

        <div className="form-group">
          <label>Severity (1-5, Optional - AI will estimate if image provided)</label>
          <select
            value={formData.severity}
            onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
          >
            <option value="">Auto-estimate from image</option>
            <option value="1">1 - Minor</option>
            <option value="2">2 - Low</option>
            <option value="3">3 - Moderate</option>
            <option value="4">4 - High</option>
            <option value="5">5 - Severe</option>
          </select>
        </div>

        <button type="submit" disabled={loading} className="submit-btn">
          {loading ? 'Submitting...' : 'Submit Report'}
        </button>
      </form>

      <div className="form-info">
        <h3>How it works</h3>
        <ul>
          <li>Upload an image and AI will detect damage type and severity</li>
          <li>You can override AI predictions manually</li>
          <li>Community votes verify reports (3+ upvotes = verified)</li>
          <li>Verified reports contribute to risk scores for route planning</li>
        </ul>
      </div>
    </div>
  )
}

export default ReportForm
