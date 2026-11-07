# RoadGuardian 🛡️

**Road damage detection and safe route planning using AI**

RoadGuardian is a community-driven road safety platform that combines AI-powered damage detection with crowdsourced verification to help travelers find safer routes. Users can report road hazards (potholes, cracks, etc.) by uploading photos, which are analyzed by a YOLOv8 model trained on the RDD2022 dataset. Reports are verified by the community, and the system calculates risk scores to recommend safer routes using OSRM routing.

## Features

- **AI-Powered Detection**: YOLOv8 model trained on RDD2022 dataset for automatic road damage classification
- **Community Verification**: Crowd-sourced voting system to verify reported hazards
- **Risk Scoring**: Multi-factor risk calculation (severity × recency × verification × proximity)
- **Safe Route Planning**: Compare route alternatives by safety using OSRM routing engine
- **Interactive Hazard Map**: Real-time visualization of reported road hazards
- **Image-Based Reporting**: Upload photos for automatic damage type and severity detection

## Technology Stack

### Backend
- **FastAPI**: Modern Python web framework
- **SQLAlchemy**: ORM for database management
- **SQLite**: Lightweight database (production can use PostgreSQL)
- **Ultralytics YOLOv8**: Object detection for road damage
- **OSRM**: Open Source Routing Machine for route planning

### Frontend
- **React**: UI framework
- **Vite**: Build tool and dev server
- **Leaflet + React-Leaflet**: Interactive maps
- **Axios**: HTTP client

## Project Structure

```
RoadGuardian/
├── backend/
│   ├── app/
│   │   ├── api/           # API endpoints
│   │   │   ├── reports.py    # Report CRUD and voting
│   │   │   └── routing.py    # Route comparison
│   │   ├── core/          # Configuration
│   │   │   ├── config.py     # Settings
│   │   │   └── database.py   # DB connection
│   │   ├── models/        # Database models
│   │   │   └── report.py     # Report and Vote models
│   │   ├── services/      # Business logic
│   │   │   ├── detection.py  # YOLOv8 detection
│   │   │   ├── risk.py       # Risk scoring
│   │   │   └── routing.py    # OSRM routing
│   │   └── main.py        # FastAPI app
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── HazardMap.jsx     # Hazard visualization
    │   │   ├── ReportForm.jsx   # Damage reporting
    │   │   └── RoutePlanner.jsx # Route comparison
    │   ├── App.jsx
    │   └── main.jsx
    ├── package.json
    └── vite.config.js
```

## Installation

### Prerequisites
- Python 3.9+
- Node.js 18+
- pip
- npm

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Run migrations (automatic on first run)
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install
```

## Running the Application

### Start Backend

```bash
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

API docs: `http://localhost:8000/docs`

### Start Frontend

```bash
cd frontend
npm run dev
```

The frontend will be available at `http://localhost:5173`

## API Endpoints

### Reports
- `POST /reports/` - Create a new damage report
- `GET /reports/` - List all reports (optionally filtered by location)
- `POST /reports/{id}/vote` - Vote on a report (upvote/downvote)
- `GET /reports/risk/segment` - Get risk score for a road segment

### Routing
- `POST /routing/compare` - Compare route alternatives by safety
- `POST /routing/route` - Get a single route from OSRM

## Configuration

Edit `backend/.env` to customize:

- `DATABASE_URL`: Database connection string
- `OSRM_BASE_URL`: OSRM server URL
- `VERIFY_THRESHOLD`: Votes needed for auto-verification (default: 3)
- `RISK_WEIGHT_*`: Weights for risk calculation factors
- `REPORT_HALF_LIFE_HOURS`: Decay rate for recency factor (default: 168 hours = 7 days)
- `DETOUR_THRESHOLD_RATIO`: Max acceptable detour for safe route (default: 1.5)

## Risk Scoring Formula

The risk score for a report is calculated as:

```
Risk = (severity/5 × W_severity) +
       (recency_factor × W_recency) +
       (verification_factor × W_verification) +
       (proximity_factor × W_proximity)
```

Where:
- `severity`: 1-5 (user or AI-estimated)
- `recency_factor`: Exponential decay based on report age
- `verification_factor`: Based on vote count and verified status
- `proximity_factor`: Inverse distance from query point

## Damage Types (RDD2022)

- **D00**: Longitudinal Crack
- **D10**: Transverse Crack
- **D20**: Alligator Crack
- **D40**: Pothole

## Known Limitations

1. **Model Accuracy**: We did not measure the AI model's accuracy on the test set. The YOLOv8 weights should be evaluated on RDD2022 test data and local road images.

2. **Risk Calibration**: Risk weights are judgment-based, not calibrated against crash data. Future work should calibrate against public crash records.

3. **Vote De-duplication**: Vote deduplication is best-effort based on IP address. More sophisticated trust models could improve resistance to spam.

4. **Reporting Bias**: Report density follows where people report, not actual hazard distribution. Consider combining with passive sensing or periodic image sweeps.

5. **Severity Estimation**: Current severity estimation is heuristic (based on damage size). A dedicated severity classifier would improve accuracy.

## Future Work

- Evaluate model accuracy on RDD2022 test split
- Add dedicated severity classifier (two-stage pipeline)
- Implement federated learning for multi-city deployment
- Calibrate risk weights against crash data
- Add passive sensing (accelerometer-based detection)
- Implement more sophisticated trust/verification models
- Support real-time route updates during navigation

## Research References

This project builds on research from the Road Damage Detection Challenge series:

- **RDD2022 Dataset**: Arya et al. (2024). *Geoscience Data Journal* 11(4), 846–862
- **YOLOv8**: Ultralytics - https://github.com/ultralytics/ultralytics
- **OSRM**: Luxen & Vetter (2011). *ACM SIGSPATIAL GIS '11*
- **Crowdsourced Verification**: Inspired by CommuniSense (Santani et al., 2015)
- **Risk-Aware Routing**: Krumm & Horvitz (2017). *AAAI 2017*

See `RESEARCH.md` for full bibliography.

## License

This project is open source and available under the MIT License.

## Team

RoadGuardian is developed by **Team X_Coder**

## Acknowledgments

- RDD2022 dataset from Sekimoto Lab, University of Tokyo
- Ultralytics for YOLOv8 framework
- OSRM project for routing engine
- OpenStreetMap for map data
