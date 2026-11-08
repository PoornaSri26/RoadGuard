// Mock data provider to ensure RoadGuard works seamlessly even when backend is offline or during static demo deployment

export const INITIAL_REPORTS = [
  {
    id: 1,
    latitude: 28.6139,
    longitude: 77.2090,
    damage_type: 'D40',
    severity: 4,
    verified: true,
    verification_count: 12,
    risk_score: 0.88,
    location_name: 'Connaught Place, New Delhi',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    image_url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 2,
    latitude: 19.0760,
    longitude: 72.8777,
    damage_type: 'D20',
    severity: 3,
    verified: true,
    verification_count: 8,
    risk_score: 0.65,
    location_name: 'Western Express Hwy, Mumbai',
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    image_url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 3,
    latitude: 12.9716,
    longitude: 77.5946,
    damage_type: 'D00',
    severity: 2,
    verified: false,
    verification_count: 3,
    risk_score: 0.35,
    location_name: 'Outer Ring Road, Bengaluru',
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    image_url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 4,
    latitude: 13.0827,
    longitude: 80.2707,
    damage_type: 'D10',
    severity: 3,
    verified: true,
    verification_count: 9,
    risk_score: 0.58,
    location_name: 'Anna Salai, Chennai',
    created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
    image_url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186f5f7?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 5,
    latitude: 17.3850,
    longitude: 78.4867,
    damage_type: 'D40',
    severity: 5,
    verified: true,
    verification_count: 24,
    risk_score: 0.94,
    location_name: 'HITEC City Flyover, Hyderabad',
    created_at: new Date(Date.now() - 3600000 * 1).toISOString(),
    image_url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 6,
    latitude: 22.5726,
    longitude: 88.3639,
    damage_type: 'D20',
    severity: 2,
    verified: false,
    verification_count: 2,
    risk_score: 0.42,
    location_name: 'Park Street, Kolkata',
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    image_url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=400&q=80'
  }
]

export const MOCK_ANALYTICS = {
  total_reports: 148,
  verified_reports: 112,
  total_users: 1840,
  recent_reports_7d: 37,
  resolved_hazards: 89,
  avg_resolution_time_hrs: 18.4,
  damage_distribution: {
    'Potholes (D40)': 62,
    'Alligator Cracks (D20)': 41,
    'Transverse Cracks (D10)': 28,
    'Longitudinal Cracks (D00)': 17
  },
  severity_distribution: {
    '1 (Low)': 14,
    '2 (Moderate)': 32,
    '3 (Substantial)': 51,
    '4 (Severe)': 36,
    '5 (Critical)': 15
  },
  monthly_trend: [
    { month: 'Jun', reported: 45, resolved: 38 },
    { month: 'Jul', reported: 68, resolved: 52 },
    { month: 'Aug', reported: 85, resolved: 70 },
    { month: 'Sep', reported: 72, resolved: 65 },
    { month: 'Oct', reported: 94, resolved: 82 },
    { month: 'Nov', reported: 112, resolved: 89 }
  ]
}

export const DAMAGE_LABELS = {
  'D00': 'Longitudinal Crack',
  'D10': 'Transverse Crack',
  'D20': 'Alligator Crack',
  'D40': 'Pothole'
}

export const DAMAGE_COLORS = {
  'D40': '#ef4444', // Red
  'D20': '#f97316', // Orange
  'D10': '#eab308', // Yellow
  'D00': '#3b82f6'  // Blue
}

