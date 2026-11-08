import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts'
import { Activity, TrendingUp, Shield, Users, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import { MOCK_ANALYTICS } from '../mockData'
import './AnalyticsDashboard.css'

const DAMAGE_PIE_COLORS = ['#ef4444', '#f97316', '#eab308', '#3b82f6']
const SEVERITY_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#f97316', '#ef4444']

function AnalyticsDashboard({ reports = [] }) {
  const [analytics, setAnalytics] = useState(MOCK_ANALYTICS)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('http://localhost:8000/analytics/overview', {
        signal: AbortSignal.timeout(2500)
      })
      if (response.ok) {
        const data = await response.json()
        setAnalytics(prev => ({
          ...prev,
          ...data
        }))
      }
    } catch {
      // Keep rich mock analytics for standalone presentation
    }
    setLoading(false)
  }

  const damageData = Object.entries(analytics.damage_distribution || {}).map(([type, count]) => ({
    name: type,
    value: count
  }))

  const severityData = Object.entries(analytics.severity_distribution || {}).map(([severity, count]) => ({
    name: severity,
    value: count
  }))

  const stats = [
    {
      label: 'Total Hazards Tracked',
      value: (analytics.total_reports || 0) + (reports.length > 6 ? reports.length - 6 : 0),
      icon: <Activity className="w-5 h-5" />,
      color: 'stat-blue',
      change: '+14% this month'
    },
    {
      label: 'Verified Hazards',
      value: analytics.verified_reports || 112,
      icon: <Shield className="w-5 h-5" />,
      color: 'stat-emerald',
      change: '88% accuracy rate'
    },
    {
      label: 'Hazards Resolved',
      value: analytics.resolved_hazards || 89,
      icon: <CheckCircle className="w-5 h-5" />,
      color: 'stat-purple',
      change: 'Avg 18h fix time'
    },
    {
      label: 'Active Contributors',
      value: analytics.total_users || 1840,
      icon: <Users className="w-5 h-5" />,
      color: 'stat-amber',
      change: '+128 new this week'
    }
  ]

  return (
    <div className="analytics-container">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="analytics-header"
      >
        <div>
          <h2>Road Safety & Damage Intelligence</h2>
          <p>Real-time telemetry, defect classification distribution, and municipal response indicators</p>
        </div>
      </motion.div>

      {/* Metric Cards Grid */}
      <div className="stats-cards-grid">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            className={`metric-stat-card ${stat.color}`}
          >
            <div className="stat-top">
              <span className="stat-label">{stat.label}</span>
              <div className="stat-icon-wrap">{stat.icon}</div>
            </div>
            <div className="stat-value">{stat.value.toLocaleString()}</div>
            <div className="stat-footnote">{stat.change}</div>
          </motion.div>
        ))}
      </div>

      {/* Visual Charts Grid */}
      <div className="charts-grid">
        {/* Trend Area Chart */}
        <div className="chart-card chart-wide">
          <div className="chart-title">
            <h3>Incident Reporting vs Resolution Trend</h3>
            <span className="chart-badge">Past 6 Months</span>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={analytics.monthly_trend || []}>
                <defs>
                  <linearGradient id="colorReported" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Legend />
                <Area type="monotone" dataKey="reported" stroke="#f59e0b" fillOpacity={1} fill="url(#colorReported)" name="Hazards Reported" />
                <Area type="monotone" dataKey="resolved" stroke="#10b981" fillOpacity={1} fill="url(#colorResolved)" name="Hazards Repaired" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Damage Breakdown Pie Chart */}
        <div className="chart-card">
          <div className="chart-title">
            <h3>Damage Classification</h3>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={damageData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {damageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={DAMAGE_PIE_COLORS[index % DAMAGE_PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Severity Distribution Bar Chart */}
        <div className="chart-card">
          <div className="chart-title">
            <h3>Severity Spectrum Distribution</h3>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={severityData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Bar dataKey="value" name="Report Count" radius={[6, 6, 0, 0]}>
                  {severityData.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={SEVERITY_COLORS[index % SEVERITY_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AnalyticsDashboard
