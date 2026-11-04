import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Activity, TrendingUp, Shield, Users, AlertTriangle } from 'lucide-react'
import './AnalyticsDashboard.css'

const COLORS = ['#0ea5e9', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6']

function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('http://localhost:8000/analytics/overview')
      const data = await response.json()
      setAnalytics(data)
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="analytics-dashboard">
        <div className="loading">Loading analytics...</div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="analytics-dashboard">
        <div className="error">Failed to load analytics</div>
      </div>
    )
  }

  const damageData = Object.entries(analytics.damage_distribution).map(([type, count]) => ({
    name: type,
    value: count
  }))

  const severityData = Object.entries(analytics.severity_distribution).map(([severity, count]) => ({
    name: `Severity ${severity}`,
    value: count
  }))

  const stats = [
    {
      label: 'Total Reports',
      value: analytics.total_reports,
      icon: <Activity className="w-6 h-6" />,
      color: 'bg-blue-500'
    },
    {
      label: 'Verified Reports',
      value: analytics.verified_reports,
      icon: <Shield className="w-6 h-6" />,
      color: 'bg-green-500'
    },
    {
      label: 'Active Users',
      value: analytics.total_users,
      icon: <Users className="w-6 h-6" />,
      color: 'bg-purple-500'
    },
    {
      label: 'Recent (7d)',
      value: analytics.recent_reports_7d,
      icon: <TrendingUp className="w-6 h-6" />,
      color: 'bg-orange-500'
    }
  ]

  return (
    <div className="analytics-dashboard">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="dashboard-header"
      >
        <h2>📊 Analytics Dashboard</h2>
        <p>Real-time insights into road safety data</p>
      </motion.div>

      <div className="stats-grid">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="stat-card"
          >
            <div className={`stat-icon ${stat.color}`}>
              {stat.icon}
            </div>
            <div className="stat-content">
              <div className="stat-label">{stat.label}</div>
              <div className="stat-value">{stat.value.toLocaleString()}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="charts-grid">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="chart-card"
        >
          <h3>Damage Type Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={damageData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {damageData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="chart-card"
        >
          <h3>Severity Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={severityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#0ea5e9" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="verification-rate"
      >
        <div className="verification-card">
          <AlertTriangle className="w-8 h-8 text-yellow-500" />
          <div>
            <h3>Verification Rate</h3>
            <p className="rate-value">{(analytics.verification_rate * 100).toFixed(1)}%</p>
            <p className="rate-label">of reports are community-verified</p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default AnalyticsDashboard
