<div align="center">
  <img src="frontend/public/logo.png" alt="Breathe Better Logo" width="120" />
  <h1>Breathe Better</h1>
  <p><strong>Intelligent Air Quality Monitoring, Public Health Awareness and Community Locality Action Platform</strong></p>

  [![Live Demo](https://img.shields.io/badge/Live_Demo-breathe--better--app.vercel.app-22c55e?style=for-the-badge&logo=vercel)](https://breathe-better-app.vercel.app/)
</div>

---

## 📌 Project Description

**Breathe Better** is a comprehensive air quality monitoring and health awareness platform built to empower individuals and communities across India with clear, actionable environmental insights. In addition to nationwide and city-level data, Breathe Better introduces a dedicated **Locality Feature** that empowers citizens to track precise atmospheric metrics in their neighborhood, spot and report hyper-local pollution hotspots, and collaborate as a community to organise ground activities and tackle air pollution together.

---

## 🔍 Overview: The Problem We Are Solving

- **A Pressing Public Health Crisis**: Air pollution represents one of the most critical public health hazards today, triggering acute respiratory distress, cardiovascular conditions, and long-term health complications.
- **The Interpretation Gap**: Raw Air Quality Index (AQI) values, sub-index formulas, and particulate matter concentrations (such as $\text{PM}_{2.5}$, $\text{PM}_{10}$, $\text{NO}_2$, $\text{O}_3$, $\text{CO}$, and $\text{SO}_2$) are often confusing and difficult for everyday citizens to decipher.
- **Missing Actionable Health Guidance**: People do not just need numbers; they need understandable health advisories and tailored precautions (e.g., whether to wear a mask, run an air purifier, limit outdoor workouts, or keep sensitive groups indoors).
- **Translating Data to Action**: Breathe Better translates complex raw AQI metrics into intuitive categories, clear visual indicators, and medically aligned health recommendations.
- **Locality-Wise Community Action**: Beyond individual awareness, pollution is fundamentally local. Breathe Better provides an active, hyper-local platform where residents can pinpoint neighborhood pollution hotspots, start community threads, coordinate cleanup or mitigation activities, and work cooperatively to resolve environmental issues.

---

## ✨ Features

- **🔴 Live Air Quality Dashboard**
  - Instant location-based AQI detection (via browser geolocation or instant city search).
  - Detailed concentrations and breakdown for critical pollutants ($\text{PM}_{2.5}$, $\text{PM}_{10}$, $\text{NO}_2$, $\text{O}_3$, $\text{CO}$, $\text{SO}_2$).
  - Actionable health advisories customized for the general population and vulnerable/sensitive groups.
  - Multi-day hourly air quality forecasts.

- **🗺️ Pollution Heat Map**
  - Interactive India-wide heat map overlay powered by Leaflet.
  - Switchable map tile overlays for general AQI and $\text{PM}_{2.5}$ pollutant intensity.
  - Dynamic visual heat gradients for tracking macro regional pollution shifts.

- **📊 Multiple City Comparisons**
  - Side-by-side comparative analysis of multiple Indian cities simultaneously.
  - Contrast live and historical AQI levels along with individual pollutant concentrations to evaluate environmental disparities.

- **📅 City Pollution History Tracker**
  - Up to 30 days of continuous historical AQI and pollutant trends.
  - Interactive charts (using Recharts) to analyze trends, cyclical variations, and peak pollution periods.

- **📖 AQI Guide**
  - Complete educational breakdown of the AQI scale designed for everyday users.
  - Clear explanations of color codes, categories (Good, Satisfactory, Moderate, Poor, Very Poor, Severe), associated health risks, and precautionary checklists.

- **🏘️ Locality (Hyper-Local Community Action)**
  - Track metrics specific to your neighborhood within a configurable radius (e.g., 5 km).
  - Spot and post hyper-local pollution hotspots (e.g., garbage burning, unpaved construction dust, traffic bottlenecks).
  - Community discussion threads to plan on-ground activities, share updates, and notify thread creators when an issue is resolved.

- **🤖 AI Chatbot (Conversational Air Quality Assistant)**
  - Context-aware conversational assistant powered by LLM tool calling.
  - Answers strictly grounded in real-time air quality data, forecasts, and historical trends fetched via deterministic tools.
  - Provides reliable health precautions without generating ungrounded facts or hallucinations.

---

## 🛠️ Technology Stack

### Frontend
- **Framework & Language**: [React 19](https://react.dev/), [JavaScript (ES6+)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **State Management & Caching**: [@tanstack/react-query](https://tanstack.com/query)
- **Mapping Packages**: [Leaflet](https://leafletjs.com/)
- **Data Visualization & Icons**: [Recharts](https://recharts.org/), [Lucide React](https://lucide.dev/)
- **Routing & Markdown**: [React Router](https://reactrouter.com/), [React Markdown](https://github.com/remarkjs/react-markdown)

### Backend
- **Runtime Environment**: [Node.js](https://nodejs.org/)
- **Server Framework**: [Express.js](https://expressjs.com/)
- **Cross-Origin & Networking**: `cors`, `axios`, `dotenv`

### Databases
- **SQLite (`better-sqlite3`)**: Houses a comprehensive local Indian city dataset with normalized prefix indexing for zero-latency, high-performance instant autocomplete.
- **PostgreSQL ([Neon DB](https://neon.tech/))**: Serverless cloud PostgreSQL storing locality profiles, user authentication, pollution hotspot threads, discussion messages, and chatbot conversation history.

### External APIs & Models
- **[Google Air Quality API](https://developers.google.com/maps/documentation/air-quality)**: Comprehensive real-time conditions, pollutant metrics, hourly forecasts, historical data, and raster heatmap tiles.
- **[NVIDIA API](https://build.nvidia.com/)**: High-performance LLM endpoint powering the context-aware chatbot with function calling capabilities.

### Deployment & Hosting
- **Frontend**: [Vercel](https://vercel.com/) — [https://breathe-better-app.vercel.app/](https://breathe-better-app.vercel.app/)
- **Backend**: [Render](https://render.com/) — [https://breathe-better.onrender.com/](https://breathe-better.onrender.com/)

---

## 🏛️ System Architecture

The diagram below illustrates the end-to-end request flow and external service integrations:

```
+-----------------------------------------------------------------------------------+
|                                    User                                           |
+-----------------------------------------------------------------------------------+
                                          |
                                          | - - - (HTTPS Requests) - - - >
                                          v
+-----------------------------------------------------------------------------------+
|                              React Frontend (Vercel)                              |
|          https://breathe-better-app.vercel.app/ (Client-side Query Cache)         |
+-----------------------------------------------------------------------------------+
                                          |
                                          | - - - (REST API Calls) - - - >
                                          v
+-----------------------------------------------------------------------------------+
|                              Express Backend (Render)                             |
|          https://breathe-better.onrender.com/ (In-Memory Heatmap Tile Cache)      |
+-----------------------------------------------------------------------------------+
       | - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -|
       |                                     |                                      |
       | - - - (Fast Local Queries) - - >    | - - - (Data & Tiles) - - - >         | - - - (Tool-Assisted Prompt) - - - >
       v                                     v                                      v
+-----------------------------+   +-----------------------------+   +-----------------------------+
|    SQLite Cities (Local)    |   |   Google Air Quality API    |   |         NVIDIA API          |
|  (Indexed Indian Datasets)  |   | (Current / Forecast / Tiles)|   | (Context-Aware LLM Chatbot) |
+-----------------------------+   +-----------------------------+   +-----------------------------+
       |                                     |                                      |
       | - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -|
                                          |
                                          | - - - (Data Aggregation & Schema Validation)
                                          v
+-----------------------------------------------------------------------------------+
|                        PostgreSQL Database (Neon Cloud DB)                        |
|             (Stores Locality Threads, Hotspot Records & Chatbot Messages)         |
+-----------------------------------------------------------------------------------+
                                          |
                                          | - - - (Processed JSON Response) - - - >
                                          v
+-----------------------------------------------------------------------------------+
|                                   Frontend UI                                     |
|           (Renders Live AQI, Heatmaps, History Charts & Locality Threads)         |
+-----------------------------------------------------------------------------------+
```

---

## 💡 Key Design Decisions

1. **Google Air Quality API Selection**
   - Chosen over alternative providers due to its comprehensive geographical coverage of India, high data reliability, validated pollutant dispersion models, and integrated hourly forecast and raster heatmap tile support.

2. **Local SQLite Indian Cities Database**
   - A normalized dataset of Indian cities with dedicated B-tree prefix indexes (`idx_cities_normalized_name`) is packaged directly with the backend.
   - Operating in read-only mode avoids external database network latencies, delivering instant sub-millisecond autocomplete suggestions as users type.

3. **Grounded AI Chatbot via Tool Calling (No Hallucinations)**
   - The chatbot does not formulate air quality answers from raw model assumptions.
   - It utilizes strictly bounded tool-calling functions (`get_current_air_quality`, `get_air_quality_forecast`, `get_historical_air_quality`, `get_heatmap_info`). It fetches deterministic live API data first and formats its health recommendations directly from that grounded context.

4. **In-Memory Heatmap Tile Caching in Backend**
   - Heatmap tiles ($256 \times 256$ PNG rasters) are generated by Google at fixed 1-hour update windows.
   - The Express backend caches requested tiles in-memory for the duration of the 1-hour window with concurrent in-flight deduplication (preventing thundering herd problems) and serves repeat requests instantly without invoking redundant upstream Google API calls.

5. **Client-Side City AQI & History Caching**
   - Implemented via `@tanstack/react-query` in the React frontend with designated `staleTime` windows (5–30 minutes).
   - Prevents duplicate network round-trips when users toggle between tabs, compare cities, or inspect 30-day historical trends repeatedly.

---

## 📁 Project Folder Structure

```
breathe-better/
├── backend/
│   ├── config/                     # Configuration constants (chatbot, air quality limits)
│   ├── controllers/                # Request handlers (airQuality, chatbot, locality)
│   ├── data/                       # Local database binaries (india_cities.db)
│   ├── db/                         # Database connections & migrations
│   │   ├── database.js             # SQLite singleton read-only connection
│   │   ├── chatbotDb.js            # Neon PostgreSQL connection & schema for chatbot
│   │   ├── localityDb.js           # Neon PostgreSQL connection for locality
│   │   └── locality_schema.sql     # SQL schema for locality users, threads, and messages
│   ├── india-city-data/            # Source data & processing scripts for Indian cities
│   ├── routes/                     # Express route definitions
│   │   ├── airQuality.js           # /api/air-quality endpoints
│   │   ├── chatbot.js              # /api/chatbot endpoints
│   │   ├── cities.js               # /api/cities search endpoint
│   │   └── locality.js             # /api/locality endpoints
│   ├── scripts/                    # Database initialization & testing utilities
│   ├── services/                   # Business logic (Google API, NVIDIA LLM, Tile Cache)
│   ├── package.json
│   └── server.js                   # Express application entry point
├── frontend/
│   ├── public/                     # Static assets (logo.png, icons.svg, favicon)
│   ├── src/
│   │   ├── api/                    # Axios API client modules
│   │   ├── assets/                 # Component images & graphics
│   │   ├── components/
│   │   │   ├── chatbot/            # AI assistant drawer & chat bubble UI
│   │   │   ├── comparison/         # Multi-city comparison views & charts
│   │   │   ├── dashboard/          # Real-time AQI gauge, pollutant cards, forecast
│   │   │   ├── guide/              # AQI category cards & educational components
│   │   │   ├── heatmap/            # Leaflet map container & metric selectors
│   │   │   ├── history/            # 30-day trend charts & date range pickers
│   │   │   ├── locality/           # Locality onboarding, hotspot threads & message board
│   │   │   ├── CityAutocomplete.jsx
│   │   │   └── Navbar.jsx
│   │   ├── hooks/                  # Custom React hooks (useGeolocation, useCitySearch)
│   │   ├── lib/                    # AQI category helpers, color mappers, date utilities
│   │   ├── pages/                  # Route views (Dashboard, HeatMap, History, Locality, etc.)
│   │   ├── App.jsx                 # Main application routes & query provider
│   │   ├── index.css               # Tailwind CSS declarations
│   │   └── main.jsx
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── vercel.json                     # Frontend SPA routing configuration
└── README.md                       # Project documentation
```

---

## 🚀 Getting Started Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.x or later recommended)
- `npm` or `yarn`
- A free [Neon](https://neon.tech/) PostgreSQL account
- A [Google Cloud Console](https://console.cloud.google.com/) account with **Air Quality API** enabled
- An [NVIDIA Build](https://build.nvidia.com/) account for NIM API access

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/breathe-better.git
cd breathe-better
```

### 2. Configure Backend
```bash
cd backend
npm install
```
Create a `.env` file inside the `backend/` directory (see the [Environment Variables](#-environment-variables-template) section below):
```bash
cp .env.example .env  # or create manually
```
Initialize the PostgreSQL schemas on Neon:
```bash
npm run init-chatbot-db
npm run init-locality-db
```
Start the backend server:
```bash
# Development mode (auto-reload)
npm run dev

# Production mode
npm start
```
The server will start on `http://localhost:3001`.

### 3. Configure Frontend
Open a new terminal tab and navigate to the frontend directory:
```bash
cd frontend
npm install
```
Create a `.env` file in the `frontend/` directory:
```bash
VITE_API_BASE_URL=http://localhost:3001
```
Start the Vite development server:
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:5173`.

---

## 🔐 Environment Variables Template

### Backend (`backend/.env`)
```ini
# Server Configuration
PORT=3001
FRONTEND_URL=http://localhost:5173

# Google Maps / Air Quality API Key
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# NVIDIA NIM LLM API (https://build.nvidia.com)
NVIDIA_API_KEY=nvapi-your_nvidia_api_key_here
NVIDIA_MODEL=nvidia/nemotron-3.5-lightning-30b-a3b

# Neon Cloud PostgreSQL (https://console.neon.tech)
DATABASE_URL=postgresql://username:password@ep-sample-12345.region.aws.neon.tech/neondb?sslmode=require
```

### Frontend (`frontend/.env`)
```ini
# Backend API Base URL
VITE_API_BASE_URL=http://localhost:3001
```

---

## 📡 API Documentation

### 1. City Search
- **`GET /api/cities/search?q={query}`**
  - Prefix search across Indian cities using local indexed SQLite.
  - Returns up to 10 matching cities sorted by population.

### 2. Air Quality
- **`GET /api/air-quality/current?latitude={lat}&longitude={lon}`**
  - Fetches real-time AQI, sub-indexes, individual pollutant levels, and dominant pollutant.
- **`GET /api/air-quality/forecast?latitude={lat}&longitude={lon}`**
  - Hourly forecast projections for up to 96 hours.
- **`GET /api/air-quality/history?latitude={lat}&longitude={lon}&startDate={YYYY-MM-DD}&endDate={YYYY-MM-DD}`**
  - Historical hourly air quality observations (date range $\le$ 30 days).
- **`GET /api/air-quality/heatmap?metric={mapType}&zoom={z}&x={x}&y={y}`**
  - Proxies 256×256 PNG heatmap raster tiles with 1-hour backend caching.
- **`GET /api/air-quality/heatmap/metadata`**
  - Current heatmap update timestamps and supported overlay metrics.

### 3. AI Chatbot
- **`POST /api/chatbot/message`**
  - Body: `{ message: string, conversationId: string, currentCity?: string, coordinates?: { latitude, longitude } }`
  - Returns grounded AI responses assisted by real-time tools.
- **`GET /api/chatbot/session/:conversationId`**
  - Retrieves active conversation history and context state.
- **`DELETE /api/chatbot/session/:conversationId`**
  - Clears session history and resets conversation context.

### 4. Locality & Community
- **`POST /api/locality/auth/signup`** & **`POST /api/locality/auth/login`**: User authentication.
- **`POST /api/locality/auth/google`**: Google OAuth integration.
- **`POST /api/locality/setup`**: Set or update user neighborhood coordinate center and radius.
- **`GET /api/locality/threads`**: Retrieve pollution hotspot threads within the user's locality radius.
- **`POST /api/locality/threads`**: Report a new neighborhood pollution hotspot thread.
- **`POST /api/locality/threads/:id/resolve-notify`**: Notify the thread creator of issue resolution.
- **`GET /api/locality/threads/:id/messages`** & **`POST /api/locality/threads/:id/messages`**: Community discussion forum for a hotspot thread.

---

## 🗄️ Database Design

### 1. Local SQLite (`backend/data/india_cities.db`)
Optimized for read-only autocomplete searches:
```sql
CREATE TABLE cities (
  geonameid INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  ascii_name TEXT,
  normalized_name TEXT NOT NULL,
  state TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  population INTEGER
);

CREATE INDEX idx_cities_normalized_name ON cities(normalized_name);
```

### 2. Serverless PostgreSQL ([Neon DB](https://neon.tech/))
Manages locality user profiles, community threads, messages, and chatbot sessions:
- **`locality_users`**: User credentials, emails, and OAuth identifiers.
- **`user_localities`**: User-defined locality center (`latitude`, `longitude`), neighborhood name, and radius (in km).
- **`pollution_threads`**: User-submitted pollution hotspots with geo-coordinates, title, description, and status (`open`, `resolved`).
- **`pollution_messages`**: Discussion messages attached to each pollution hotspot thread.
- **`thread_resolve_notifications`**: Resolution notifications submitted by community members to thread creators.
- **`chatbot_sessions`** & **`chatbot_messages`**: Conversation state tracking and message persistence for grounded dialogue.

---

## 🌐 Deployment Information

| Layer | Platform | URL | Notes |
|---|---|---|---|
| **Frontend** | [Vercel](https://vercel.com/) | [https://breathe-better-app.vercel.app/](https://breathe-better-app.vercel.app/) | Single-page application with client routing rewrite rules (`vercel.json`). |
| **Backend** | [Render](https://render.com/) | [https://breathe-better.onrender.com/](https://breathe-better.onrender.com/) | Managed Node.js web service running Express with automated health checks. |
| **Indian Cities DB** | Local SQLite | Embedded in backend container (`data/india_cities.db`) | In-memory read-only disk access for zero network latency. |
| **Chat & Locality DB** | [Neon](https://neon.tech/) | Managed Cloud PostgreSQL instance | Serverless autoscaling PostgreSQL for dynamic user interactions. |

---

## 🔮 Future Improvements

- [ ] **Mobile UI Optimization**: Enhance the existing user interface to provide a fully responsive and mobile-friendly experience, optimizing layouts, navigation, component sizing, and interactions for smartphones and tablets.
- [ ] **Enhanced Chatbot Intelligence**: Further refine the chatbot's conversational capabilities to improve response accuracy, contextual understanding, query interpretation, and the overall quality of user interactions.
- [ ] **Indian Cities Database Refinement**: Improve the existing city database by expanding city coverage, identifying and removing duplicate entries, correcting inaccurate records, and eliminating invalid or incomplete location data to ensure reliable city searches.
- [ ] **AQI Threshold Cross Alert System**: Configurable email and push notifications alerting registered users whenever tracked cities or neighborhood localities exceed safe AQI thresholds.
