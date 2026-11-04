import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import HazardMap from './components/HazardMap'
import ReportForm from './components/ReportForm'
import RoutePlanner from './components/RoutePlanner'
import AnalyticsDashboard from './components/AnalyticsDashboard'
import { Moon, Sun, Map, AlertTriangle, Route, BarChart3 } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState('map')
  const [reports, setReports] = useState([])
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    // Check for saved dark mode preference
    const saved = localStorage.getItem('darkMode')
    if (saved === 'true') {
      setDarkMode(true)
      document.documentElement.classList.add('dark')
    }

    fetchReports()
    // Refresh reports every 30 seconds
    const interval = setInterval(fetchReports, 30000)
    return () => clearInterval(interval)
  }, [])

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
    document.documentElement.classList.toggle('dark')
    localStorage.setItem('darkMode', (!darkMode).toString())
  }

  const fetchReports = async () => {
    try {
      const response = await fetch('http://localhost:8000/reports/')
      const data = await response.json()
      setReports(data)
    } catch (error) {
      console.error('Failed to fetch reports:', error)
    }
  }

  const handleReportSubmit = async (reportData) => {
    try {
      const response = await fetch('http://localhost:8000/reports/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData)
      })
      if (response.ok) {
        fetchReports()
        toast.success('Report submitted successfully!')
      } else {
        toast.error('Failed to submit report')
      }
    } catch (error) {
      console.error('Failed to submit report:', error)
      toast.error('Failed to submit report')
    }
  }

  const tabs = [
    { id: 'map', label: 'Hazard Map', icon: <Map className="w-4 h-4" /> },
    { id: 'report', label: 'Report Damage', icon: <AlertTriangle className="w-4 h-4" /> },
    { id: 'route', label: 'Plan Route', icon: <Route className="w-4 h-4" /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> }
  ]

  return (
    <div className={`app ${darkMode ? 'dark' : ''}`}>
      <Toaster position="top-right" />

      <header className="header">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="header-content"
        >
          <div className="header-left">
            <h1>🛡️ RoadGuardian</h1>
            <p>Road damage detection and safe route planning</p>
          </div>
          <button
            onClick={toggleDarkMode}
            className="theme-toggle"
            aria-label="Toggle dark mode"
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </motion.div>
      </header>

      <nav className="nav">
        {tabs.map((tab) => (
          <motion.button
            key={tab.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
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
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'map' && <HazardMap reports={reports} />}
            {activeTab === 'report' && <ReportForm onSubmit={handleReportSubmit} />}
            {activeTab === 'route' && <RoutePlanner />}
            {activeTab === 'analytics' && <AnalyticsDashboard />}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="footer">
        <p>RoadGuardian v2.0 © 2026 | Team X_Coder</p>
      </footer>
    </div>
  )
}

export default App
