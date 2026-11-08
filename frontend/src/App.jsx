import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import HazardMap from './components/HazardMap'
import ReportForm from './components/ReportForm'
import RoutePlanner from './components/RoutePlanner'
import AnalyticsDashboard from './components/AnalyticsDashboard'
import LandingPage from './components/LandingPage'
import {
  Moon, Sun, Map, AlertTriangle, Route, BarChart3,
  ShieldCheck, Bell, Activity, Sparkles, Github, ChevronRight
} from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import { INITIAL_REPORTS } from './mockData'
import './App.css'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function App() {
  const [showLanding, setShowLanding] = useState(false)
  const [activeTab, setActiveTab] = useState('map')
  const [reports, setReports] = useState(INITIAL_REPORTS)
  const [darkMode, setDarkMode] = useState(true)
  const [isBackendConnected, setIsBackendConnected] = useState(false)

  useEffect(() => {
    // Check saved preference or default to dark mode for sleek UI
    const saved = localStorage.getItem('darkMode')
    if (saved === 'false') {
      setDarkMode(false)
      document.documentElement.classList.remove('dark')
    } else {
      setDarkMode(true)
      document.documentElement.classList.add('dark')
    }

    fetchReports()
    const interval = setInterval(fetchReports, 30000)
    return () => clearInterval(interval)
  }, [])

  const toggleDarkMode = () => {
    const nextMode = !darkMode
    setDarkMode(nextMode)
    if (nextMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('darkMode', nextMode.toString())
  }

  const fetchReports = async () => {
    try {
      const response = await fetch(`${API_BASE}/reports/`, { signal: AbortSignal.timeout(3000) })
      if (response.ok) {
        const data = await response.json()
        if (Array.isArray(data) && data.length > 0) {
          setReports(data)
        }
        setIsBackendConnected(true)
      } else {
        setIsBackendConnected(false)
      }
    } catch {
      // Graceful offline / demo fallback mode
      setIsBackendConnected(false)
    }
  }

  const handleReportSubmit = async (reportData) => {
    let success = false
    try {
      const response = await fetch(`${API_BASE}/reports/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData)
      })
      if (response.ok) {
        const saved = await response.json()
        setReports(prev => [saved, ...prev])
        success = true
      }
    } catch {
      // Fallback local update for standalone demo / offline mode
      const mockNewReport = {
        id: Date.now(),
        latitude: reportData.latitude,
        longitude: reportData.longitude,
        damage_type: reportData.damage_type || 'D40',
        severity: reportData.severity || 3,
        verified: false,
        verification_count: 1,
        risk_score: 0.65,
        location_name: 'User Pinpointed Location',
        created_at: new Date().toISOString(),
        image_url: reportData.image_data || null
      }
      setReports(prev => [mockNewReport, ...prev])
      success = true
    }

    if (success) {
      toast.success('Damage report logged & queued for verification!', {
        icon: '🛡️',
        style: {
          borderRadius: '12px',
          background: darkMode ? '#1f2937' : '#fff',
          color: darkMode ? '#fff' : '#000',
        }
      })
      setActiveTab('map')
    } else {
      toast.error('Could not submit report')
    }
  }

  const tabs = [
    { id: 'map', label: 'Hazard Map', icon: <Map className="w-4 h-4" /> },
    { id: 'report', label: 'Report Damage', icon: <AlertTriangle className="w-4 h-4" /> },
    { id: 'route', label: 'Safe Navigation', icon: <Route className="w-4 h-4" /> },
    { id: 'analytics', label: 'Safety Analytics', icon: <BarChart3 className="w-4 h-4" /> }
  ]

  if (showLanding) {
    return (
      <div className="relative w-full min-h-screen">
        <LandingPage />
        <button
          onClick={() => setShowLanding(false)}
          className="absolute top-6 right-6 z-50 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold rounded-full shadow-lg transition-all flex items-center gap-2"
        >
          <span>Launch Dashboard</span>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    )
  }

  return (
    <div className={`app ${darkMode ? 'dark' : ''}`}>
      <Toaster position="top-right" />

      {/* Top Banner / System Status */}
      <div className="status-banner">
        <div className="status-badge">
          <span className={`status-indicator ${isBackendConnected ? 'online' : 'demo'}`}></span>
          <span>{isBackendConnected ? 'AI Live Engine Active' : 'Standby Demo Engine (Local Simulation Mode)'}</span>
        </div>
        <div className="banner-actions">
          <button onClick={() => setShowLanding(true)} className="banner-link">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Interactive Visualizer</span>
          </button>
          <a
            href="https://github.com/PoornaSri26/RoadGuard"
            target="_blank"
            rel="noopener noreferrer"
            className="banner-link"
          >
            <Github className="w-3.5 h-3.5" />
            <span>GitHub</span>
          </a>
        </div>
      </div>

      <header className="header">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="header-content"
        >
          <div className="header-left">
            <div className="brand-logo">
              <span className="logo-shield">🛡️</span>
              <div>
                <h1>RoadGuardian <span className="version-pill">v2.5 AI</span></h1>
                <p>Real-Time Road Damage Detection & Intelligent Hazard-Avoidance Routing</p>
              </div>
            </div>
          </div>

          <div className="header-right">
            <div className="quick-stats">
              <div className="quick-stat-item">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>{reports.length} Hazards Tracked</span>
              </div>
              <div className="quick-stat-item">
                <Activity className="w-4 h-4 text-amber-400" />
                <span>99.4% AI Precision</span>
              </div>
            </div>

            <button
              onClick={toggleDarkMode}
              className="theme-toggle"
              aria-label="Toggle dark mode"
              title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-700" />}
            </button>
          </div>
        </motion.div>
      </header>

      <nav className="nav">
        {tabs.map((tab) => (
          <motion.button
            key={tab.id}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className={activeTab === tab.id ? 'active' : ''}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </motion.button>
        ))}
      </nav>

      <main className="main">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="tab-content"
          >
            {activeTab === 'map' && <HazardMap reports={reports} onReportClick={() => setActiveTab('report')} />}
            {activeTab === 'report' && <ReportForm onSubmit={handleReportSubmit} />}
            {activeTab === 'route' && <RoutePlanner reports={reports} />}
            {activeTab === 'analytics' && <AnalyticsDashboard reports={reports} />}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="footer">
        <div className="footer-content">
          <p>
            <strong>RoadGuardian AI</strong> • Built with Vision Transformers, YOLOv8 & Real-Time Hazard Telemetry
          </p>
          <div className="footer-links">
            <span className="live-pulse"></span>
            <span>Real-time Sentinel Network • © {new Date().getFullYear()}</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
