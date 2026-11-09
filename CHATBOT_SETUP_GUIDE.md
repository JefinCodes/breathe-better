# Breathe Better Chatbot — Integration & Setup Guide

This document outlines the architecture, configuration instructions, database initialization steps, and usage guide for the **Breathe Better Air Quality Chatbot**.

---

## 1. Where to Place Environment Keys

All backend environment variables should be placed in `backend/.env`.

### File Location: `backend/.env`

Add the following keys to your `backend/.env`:

```env
# Existing Google Maps & Air Quality API Key
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# ---------------------------------------------------------------------------
# NVIDIA NIM LLM API Integration
# ---------------------------------------------------------------------------
# 1. Sign up / log in at https://build.nvidia.com
# 2. Select any model (e.g. meta/llama-3.3-70b-instruct or meta/llama-3.1-70b-instruct)
# 3. Click "Get API Key" and generate your key (starts with "nvapi-")
NVIDIA_API_KEY=nvapi-your_actual_nvidia_key_here
NVIDIA_MODEL=deepseek-ai/deepseek-v4.1-flash

# ---------------------------------------------------------------------------
# Neon PostgreSQL Database Integration (Sessions & Message Memory)
# ---------------------------------------------------------------------------
# 1. Go to https://console.neon.tech and create/select a project
# 2. Copy the "Connection Details" string (URI format)
# Note: In-memory fallback is active if DATABASE_URL is omitted.
DATABASE_URL=postgresql://neondb_owner:your_password@ep-sample-123456.region.aws.neon.tech/neondb?sslmode=require
```

---

## 2. Neon PostgreSQL Database Initialization

A dedicated database migration and initialization script has been created at:
`backend/scripts/initChatbotDb.js`

### How to Run the Database Initialization:

Run either of the following commands in your terminal:

```bash
# Option A (using npm script):
cd backend && npm run init-chatbot-db

# Option B (using node directly):
cd backend && node scripts/initChatbotDb.js
```

### What this Command Does:
1. Verifies connectivity to your Neon PostgreSQL cluster using `DATABASE_URL`.
2. Creates the `chatbot_sessions` table:
   - `conversation_id VARCHAR(100) PRIMARY KEY`
   - `last_city VARCHAR(255)`
   - `last_latitude DOUBLE PRECISION`
   - `last_longitude DOUBLE PRECISION`
   - `created_at TIMESTAMPTZ`, `updated_at TIMESTAMPTZ`
3. Creates the `chatbot_messages` table:
   - `id SERIAL PRIMARY KEY`
   - `conversation_id VARCHAR(100) REFERENCES chatbot_sessions(conversation_id) ON DELETE CASCADE`
   - `role VARCHAR(20) NOT NULL` ('user', 'assistant')
   - `content TEXT NOT NULL`
   - `created_at TIMESTAMPTZ`
4. Creates performance index `idx_chatbot_messages_conv` for fast retrieval of the recent chat window.
5. Runs a test query and logs a success confirmation.

> Note: Even if you run the app before configuring Neon PostgreSQL, the server includes a seamless in-memory fallback store (`Map`), preventing crashes and ensuring zero downtime.

---

## 3. Architecture & Features Overview

- **Session Lifecycle**: No user account is required. The client creates a session ID (`conversationId`). Navigating between Dashboard (`/`), Heat Map (`/map`), Location Comparison (`/compare`), Historical Tracker (`/history`), and AQI Guide (`/guide`) preserves the chatbot state without refreshing. When the user reloads the page (F5), a new `conversationId` is generated, ending the previous session.
- **Context & Follow-ups**: The server tracks the `last_city` discussed. Questions like *"Can I go today for cycling?"*, *"What will be the aqi index tomorrow?"*, or *"What precautions should I take?"* automatically resolve to the active city without re-prompting.
- **Factual Anti-Hallucination**:
  - Live AQI, forecasts, and historical trends are strictly fetched through the Google Air Quality API tools.
  - History is constrained to the Google upstream limit of 30 days. When queries ask for 2 months, the bot explicitly reports this API limit and analyzes the available 30-day window without guessing earlier data.
  - If a city is missing and cannot be inferred, the bot politely asks the user.
- **Conciseness**: Every answer is strictly bounded between **1 word and 4 sentences**.
