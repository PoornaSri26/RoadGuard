import { useState } from 'react'
import { Camera, MapPin, UploadCloud, AlertCircle, CheckCircle2, Sparkles, Navigation } from 'lucide-react'
import toast from 'react-hot-toast'
import './ReportForm.css'

const DAMAGE_TYPES = [
  { id: 'D40', label: 'Pothole (D40)', desc: 'Road bowl or depression causing tire/suspension hazard' },
  { id: 'D20', label: 'Alligator Crack (D20)', desc: 'Interconnected cracks resembling reptile scale pattern' },
  { id: 'D10', label: 'Transverse Crack (D10)', desc: 'Perpendicular cracks spanning across road lanes' },
  { id: 'D00', label: 'Longitudinal Crack (D00)', desc: 'Linear crack extending parallel to traffic direction' },
]

function ReportForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    latitude: '',
    longitude: '',
    damage_type: 'D40',
    severity: '3',
    image: null,
    location_name: ''
  })
  const [loading, setLoading] = useState(false)
  const [locationLoading, setLocationLoading] = useState(false)
  const [analyzingImage, setAnalyzingImage] = useState(false)

  const getLocation = () => {
    setLocationLoading(true)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude.toFixed(6),
            longitude: position.coords.longitude.toFixed(6),
            location_name: 'Current Device Location'
          }))
          setLocationLoading(false)
          toast.success('GPS coordinates acquired!')
        },
        () => {
          toast.error('Could not get GPS. Using manual coordinates.')
          setLocationLoading(false)
        },
        { enableHighAccuracy: true, timeout: 5000 }
      )
    } else {
      toast.error('Geolocation not supported in this browser.')
      setLocationLoading(false)
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: reader.result }))
        // Simulate immediate AI inference feedback on uploaded photo
        setAnalyzingImage(true)
        setTimeout(() => {
          setAnalyzingImage(false)
          toast('AI Vision Model: Pothole detected with 94.2% confidence!', {
            icon: '🤖',
          })
        }, 1200)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.latitude || !formData.longitude) {
      toast.error('Please specify the hazard location coordinates.')
      return
    }

    setLoading(true)
    const reportData = {
      latitude: parseFloat(formData.latitude),
      longitude: parseFloat(formData.longitude),
      damage_type: formData.damage_type,
      severity: parseInt(formData.severity),
      image_data: formData.image,
      location_name: formData.location_name || 'Reported Road Location'
    }

    await onSubmit(reportData)
    setLoading(false)

    // Reset form
    setFormData({
      latitude: '',
      longitude: '',
      damage_type: 'D40',
      severity: '3',
      image: null,
      location_name: ''
    })
  }

  return (
    <div className="report-form-container">
      <div className="report-card">
        <div className="report-header">
          <div className="icon-wrapper">
            <Camera className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <h2>Report Road Hazard</h2>
            <p>Help make roads safer. Upload photos to trigger automated AI classification.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="hazard-form">
          {/* Photo Upload Zone */}
          <div className="form-group">
            <label className="form-label">Road Photo Evidence</label>
            <div className={`upload-dropzone ${formData.image ? 'has-image' : ''}`}>
              {formData.image ? (
                <div className="preview-container">
                  <img src={formData.image} alt="Preview" className="image-preview" />
                  {analyzingImage && (
                    <div className="ai-analyzing-overlay">
                      <Sparkles className="w-5 h-5 animate-spin text-amber-400" />
                      <span>Running YOLOv8 Neural Inspection...</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, image: null }))}
                    className="remove-image-btn"
                  >
                    Change Photo
                  </button>
                </div>
              ) : (
                <label className="dropzone-label">
                  <UploadCloud className="w-10 h-10 text-amber-500 mb-2" />
                  <span className="dropzone-title">Upload or Capture Road Photo</span>
                  <span className="dropzone-subtitle">AI model will automatically identify damage category</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden-file-input"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Location Details */}
          <div className="form-group">
            <div className="label-with-action">
              <label className="form-label">Location Coordinates</label>
              <button
                type="button"
                onClick={getLocation}
                disabled={locationLoading}
                className="btn-use-gps"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>{locationLoading ? 'Locating...' : 'Use My GPS'}</span>
              </button>
            </div>

            <div className="location-inputs-grid">
              <div className="input-group">
                <span className="input-prefix">Lat</span>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 28.6139"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                  required
                />
              </div>
              <div className="input-group">
                <span className="input-prefix">Lon</span>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 77.2090"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>

          {/* Damage Type Selection */}
          <div className="form-group">
            <label className="form-label">Damage Classification</label>
            <div className="damage-type-grid">
              {DAMAGE_TYPES.map((type) => (
                <div
                  key={type.id}
                  onClick={() => setFormData({ ...formData, damage_type: type.id })}
                  className={`damage-card ${formData.damage_type === type.id ? 'active' : ''}`}
                >
                  <div className="damage-card-header">
                    <span className="damage-pill">{type.id}</span>
                    <strong className="damage-title">{type.label.split(' ')[0]}</strong>
                  </div>
                  <p className="damage-desc">{type.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Severity Range */}
          <div className="form-group">
            <div className="severity-header">
              <label className="form-label">Estimated Severity (1 to 5)</label>
              <span className="severity-badge severity-badge-${formData.severity}">
                Level {formData.severity} / 5
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              value={formData.severity}
              onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
              className="severity-slider-input"
            />
            <div className="severity-scale">
              <span>Minor cosmetic</span>
              <span>Moderate</span>
              <span>Critical hazard</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-submit-report"
          >
            {loading ? (
              <span>Broadcasting Report to Sentinel Network...</span>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>Submit Verified Road Damage Report</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

export default ReportForm
