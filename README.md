# LumenRoute

LumenRoute is an AI-powered traffic safety and eco-routing platform that transforms existing traffic infrastructure into an intelligent safety network. By combining live traffic camera feeds, environmental data, and AI-verified community reports, LumenRoute detects road hazards in real time and recommends safer, more sustainable routes.

---

## Features

### 🚦 Guardian Dashboard
Monitor live traffic conditions through an interactive dashboard that analyzes traffic camera feeds in real time. The system automatically detects hazards such as:

- Traffic accidents
- Flooding
- Road debris
- Lane obstructions
- Other roadway incidents

### 🌱 Eco-Route Planner
Generate routes optimized for more than just travel time. LumenRoute considers:

- Carbon emissions
- Air quality
- Active road hazards
- Safety score
- Route efficiency

to recommend safer and more environmentally friendly alternatives.

### 📍 Scout Mode
Users can report infrastructure issues directly from the application, including:

- Potholes
- Broken EV chargers
- Damaged road signs
- Other roadway hazards

Each report is automatically verified using AI-powered image analysis to reduce spam and false submissions.

### 🤖 Multimodal AI Analysis
LumenRoute combines multiple sources of information into a single decision-making pipeline, including:

- Live traffic camera imagery
- User-submitted photos
- Weather conditions
- Air quality data
- Traffic information

This enables more accurate hazard detection and smarter routing decisions.

---

## Tech Stack

### Frontend

- React
- Vite
- TypeScript
- Leaflet
- Tailwind CSS

### Backend

- Bun
- Hono

### AI & APIs

- Google Gemini 1.5 Flash (Vision)
- Google Gemini Pro (Reasoning)
- Google Maps API
- GDOT Traffic Camera API
- Weather & Air Quality APIs

---

## Architecture

```
Traffic Cameras ──┐
                  │
Weather APIs ─────┤
                  │
Air Quality ──────┤
                  │
User Reports ─────┤
                  ▼
          AI Processing Layer
        (Google Gemini Models)
                  │
                  ▼
        Hazard Detection Engine
                  │
                  ▼
         Route Recommendation
                  │
                  ▼
            React Frontend
```

---

## Challenges

### Real-Time Data Synchronization

Traffic camera APIs provide a large volume of constantly changing information. Continuously processing every camera feed introduces unnecessary latency and API overhead.

**Solution**

The backend implements a polling and diffing strategy that only processes cameras whose state has changed since the previous update, reducing bandwidth usage while maintaining near real-time responsiveness.

---

### Verifying Community Reports

Crowdsourced reports can contain inaccurate or misleading information.

**Solution**

Submitted images are analyzed using Gemini Vision to verify that the uploaded photo matches the selected report category before it is accepted.

---

## Getting Started

### Prerequisites

- Node.js 18+
  **or**
- Bun

---

## Installation

Clone the repository.

```bash
git clone https://github.com/your-username/lumenroute.git
cd lumenroute
```

Install dependencies.

Using Bun:

```bash
bun install
```

Or using npm:

```bash
npm install
```

---

## Environment Variables

Create a `.env` file in the project root.

```env
GOOGLE_MAPS_API_KEY=
GEMINI_API_KEY=
WEATHER_API_KEY=
```

Add any additional API keys required by your deployment.

---

## Running the Project

Using Bun:

```bash
bun run dev
```

Using npm:

```bash
npm run dev
```

Default local endpoints:

Frontend

```
http://localhost:8000
```

Backend

```
http://localhost:3000
```

---

## Project Structure

```
lumenroute/
├── frontend/
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   ├── assets/
│   └── utils/
│
├── backend/
│   ├── routes/
│   ├── services/
│   ├── ai/
│   ├── middleware/
│   └── utils/
│
├── config/
├── public/
└── README.md
```

---

## Future Improvements

- Predictive hazard forecasting
- Live traffic congestion estimation
- Emergency vehicle routing
- Personalized route preferences
- Mobile application
- Push notifications for nearby hazards
- Historical traffic analytics
- Expanded infrastructure reporting

---

## License

This project is licensed under the MIT License.

---

## Acknowledgments

- Google Gemini API
- Google Maps Platform
- Georgia Department of Transportation (GDOT) Open Traffic Camera Data
