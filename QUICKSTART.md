# Quick Start Guide

Get RoadGuardian up and running in 5 minutes.

## 1. Clone and Navigate

```bash
cd RoadGuardian
```

## 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Mac/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment config
cp .env.example .env

# Start server
uvicorn app.main:app --reload --port 8000
```

Backend will run at http://localhost:8000

## 3. Frontend Setup (New Terminal)

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend will run at http://localhost:5173

## 4. Test the Application

1. Open http://localhost:5173 in your browser
2. Click "Report Damage" to submit a test report
3. Click "Hazard Map" to see reports on the map
4. Click "Plan Route" to compare safe routes

## 5. (Optional) Test API Directly

```bash
# Create a report
curl -X POST http://localhost:8000/api/reports/ \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 20.5937,
    "longitude": 78.9629,
    "damage_type": "D40",
    "severity": 3
  }'

# List reports
curl http://localhost:8000/api/reports/

# Get API docs
open http://localhost:8000/docs
```

## Troubleshooting

**Port already in use?**
```bash
# Use different port for backend
uvicorn app.main:app --reload --port 8001

# Use different port for frontend
npm run dev -- --port 5174
```

**CORS errors?**
The frontend is configured to proxy `/api` requests to the backend. If you see CORS errors, check that both servers are running.

**YOLO model not downloading?**
The first time you run detection, YOLOv8 will download weights automatically. Ensure you have internet connection.

## Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Check [RESEARCH.md](RESEARCH.md) for research references
- Customize settings in `backend/.env`
