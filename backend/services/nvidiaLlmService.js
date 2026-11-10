'use strict';

const axios = require('axios');
const chatbotConfig = require('../config/chatbot');
const chatbotDb = require('../db/chatbotDb');
const { CPCB_REFERENCE_TEXT } = require('./cpcbKnowledge');
const {
  TOOL_DEFINITIONS,
  executeTool,
  getLocationCoordinates,
  getCurrentAirQuality,
  getForecastAirQuality,
  getHistoricalAirQuality,
} = require('./chatbotTools');

/**
 * Stop words that should never be mistaken for city names.
 */
const STOP_WORDS = new Set([
  'today', 'tomorrow', 'yesterday', 'now', 'current', 'daily', 'cycling', 'running',
  'walking', 'workout', 'jogging', 'exercise', 'morning', 'evening', 'afternoon',
  'night', 'day', 'week', 'month', 'months', 'year', 'here', 'my location', 'air',
  'aqi', 'index', 'pollution', 'pm10', 'pm25', 'pm2.5', 'ozone', 'cpcb', 'values',
  'value', 'level', 'levels', 'status', 'condition', 'conditions', 'forecast', 'trend',
  'trends', 'history', 'historical', 'past', 'last', 'next', 'this', 'that', 'what',
  'when', 'where', 'how', 'hows', 'why', 'who', 'which', 'can', 'will', 'should',
  'could', 'would', 'is', 'are', 'am', 'was', 'were', 'the', 'a', 'an', 'and', 'or',
  'in', 'at', 'for', 'of', 'to', 'from', 'with', 'tell', 'give', 'show', 'check',
  'know', 'see', 'seen', 'understand', 'understandings', 'city', 'location', 'place',
  'state', 'india', 'indian', 'please', 'hi', 'hii', 'hello', 'hey', 'heyy', 'yes',
  'no', 'okay', 'ok', 'sure', 'good', 'bad', 'poor', 'severe', 'moderate', 'satisfactory',
  'safe', 'danger', 'precaution', 'precautions', 'run', 'walk', 'breathe', 'better',
  'assistant', 'bot', 'weather', 'temp', 'temperature', 'i', 'go', 'outdoor', 'outdoors'
]);

/**
 * Trims text to at most maxSentences.
 */
function limitSentences(text, maxSentences = 4) {
  if (!text) return '';
  const trimmed = text.trim();
  const sentences = trimmed.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g);
  if (!sentences || sentences.length <= maxSentences) {
    return trimmed;
  }
  return sentences.slice(0, maxSentences).join(' ').trim();
}

/**
 * Extracts recognized cities from a user query using aliases and SQLite exact lookups.
 * Safe from substring false matches (e.g. "i go" will NEVER match "Wāri Godri", "in the" will NEVER match "Narāin Ther").
 */
async function extractCitiesFromQuery(query) {
  if (!query || typeof query !== 'string') return [];

  const clean = query
    .toLowerCase()
    .replace(/[?.,!/\\:;()[\]{}"'~`@#$%^&*+=<>_-]/g, ' ')
    .trim();
  const words = clean.split(/\s+/).filter(Boolean);
  const found = [];

  // 1. Check bigrams (e.g. "new delhi")
  for (let i = 0; i < words.length - 1; i++) {
    const w1 = words[i];
    const w2 = words[i + 1];
    // Skip if both words are basic stop words
    if (STOP_WORDS.has(w1) && STOP_WORDS.has(w2)) continue;
    const bigram = `${w1} ${w2}`;
    if (STOP_WORDS.has(bigram)) continue;

    const coords = await getLocationCoordinates({ query: bigram });
    if (coords.found && !STOP_WORDS.has(coords.name.toLowerCase())) {
      if (!found.some((x) => x.name.toLowerCase() === coords.name.toLowerCase())) {
        found.push(coords);
      }
    }
  }

  // 2. Check single words
  for (const w of words) {
    if (STOP_WORDS.has(w) || w.length < 3) continue;
    const coords = await getLocationCoordinates({ query: w });
    if (coords.found && !STOP_WORDS.has(coords.name.toLowerCase())) {
      if (!found.some((x) => x.name.toLowerCase() === coords.name.toLowerCase())) {
        found.push(coords);
      }
    }
  }

  return found;
}

/**
 * Builds the strict system prompt for NVIDIA LLM.
 */
function buildSystemPrompt(session, userLocation) {
  let contextInfo = '';
  if (session?.last_city) {
    contextInfo += `Active Discussion Context: The last discussed city is ${session.last_city}`;
    if (session.last_latitude && session.last_longitude) {
      contextInfo += ` (Latitude: ${session.last_latitude}, Longitude: ${session.last_longitude})`;
    }
    contextInfo += `. If the user asks a follow-up question (e.g. "Can I go for cycling?", "What will be the aqi tomorrow?", "What precautions should I take?") without naming a new location, refer directly to ${session.last_city}.\n`;
  } else if (userLocation?.city || (userLocation?.latitude && userLocation?.longitude)) {
    contextInfo += `User's Detected Geolocation: ${userLocation.city || 'Current Location'} (Lat: ${userLocation.latitude}, Lon: ${userLocation.longitude}). Use these coordinates when the user asks for AQI at "my location" or "here".\n`;
  }

  return `You are "Breathe Better Assistant", a friendly, empathetic, and expert air quality assistant for India.
You help citizens understand live air quality data, CPCB standards, outdoor safety guidelines, and health recommendations.

STRICT INSTRUCTIONS:
1. Speak ONLY based on facts from the provided tools and the CPCB reference text below.
2. For greetings (e.g. "hi", "hello", "hey"), identity queries ("who are you?"), or pleasantries ("thank you", "how are you?"), respond warmly and helpfully from your perspective as the Breathe Better Assistant.
3. NEVER hallucinate or guess AQI numbers, pollutant levels, or dates.
4. If you lack the required location to check live air quality, ask the user for clarification (e.g. "Which city or location would you like to check the air quality for?").
5. If a tool reports that Google Air Quality API history is limited to 30 days (such as when asked about 2 months), clearly state that history is available for up to 30 days and analyze the available data.
6. CONCISENESS REQUIREMENT: Keep every answer between 1 word and 4 sentences at maximum. Never exceed 4 sentences.
7. Use tools whenever asked about live AQI, forecast, history, or comparison.
8. For definitions (AQI, PM10, PM2.5, Ground-level Ozone, CPCB, categories), answer accurately using the CPCB text below.

${contextInfo}
--- CPCB AIR QUALITY REFERENCE KNOWLEDGE ---
${CPCB_REFERENCE_TEXT}
--------------------------------------------`;
}

/**
 * Handles LLM completion via NVIDIA NIM OpenAI-compatible API.
 */
async function generateNvidiaResponse({ userMessage, conversationId, session, userLocation, recentMessages = [] }) {
  const query = userMessage.trim();

  // 1. Fast path: Immediately handle greetings, pleasantries, bot identity, and CPCB definitions (<1ms)
  const directResponse = await evaluateFastPath({ userMessage: query, conversationId, session, userLocation });
  if (directResponse) {
    return directResponse;
  }

  // 2. Structured Air Quality Actions:
  // Live AQI lookup, cycling check, tomorrow's forecast, 30-day historical trend,
  // 2-city comparison, geolocation check, or missing-info response (e.g. user just provided city name).
  // Fulfill directly with Google Air Quality API & CPCB rules for maximum response speed and consistency.
  const lower = query.toLowerCase();
  const extractedCities = await extractCitiesFromQuery(query);
  const isCompare = lower.includes('compare') || lower.includes('vs') || lower.includes('versus') || lower.includes('difference between');
  const isCycling = lower.includes('cycling') || lower.includes('workout') || lower.includes('jogging') || lower.includes('run') || lower.includes('exercise') || lower.includes('go outside');
  const isForecast = lower.includes('tomorrow') || lower.includes('forecast') || lower.includes('upcoming');
  const isHistory = lower.includes('month') || lower.includes('historical') || lower.includes('past') || lower.includes('trend');
  const isLiveAqi = lower.includes('aqi') || lower.includes('air quality') || lower.includes('pollution') || lower.includes('today') || lower.includes('current') || lower.includes('how is') || lower.includes('hows');
  const isLocationAqi = lower.includes('my location') || lower.includes('here');
  const isMissingInfoResponse = Boolean(session?.pending_intent && (extractedCities.length > 0 || isLocationAqi));

  if (isCompare || isCycling || isForecast || isHistory || isLiveAqi || isLocationAqi || isMissingInfoResponse) {
    return await deterministicFallbackHandler({ userMessage: query, conversationId, session, userLocation });
  }

  const apiKey = chatbotConfig.nvidiaApiKey;

  // Fallback to grounded tool engine if NVIDIA_API_KEY is not configured
  if (!apiKey) {
    return await deterministicFallbackHandler({ userMessage: query, conversationId, session, userLocation });
  }

  const systemPrompt = buildSystemPrompt(session, userLocation);

  const messages = [
    { role: 'system', content: systemPrompt },
    ...recentMessages.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: query },
  ];

  const toolsUsed = [];

  try {
    const client = axios.create({
      baseURL: chatbotConfig.nvidiaBaseUrl,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: chatbotConfig.timeoutMs || 6000,
    });

    let currentMessages = [...messages];
    let iterations = 0;
    const MAX_TOOL_ITERATIONS = 4;

    while (iterations < MAX_TOOL_ITERATIONS) {
      iterations++;

      const payload = {
        model: chatbotConfig.nvidiaModel,
        messages: currentMessages,
        tools: TOOL_DEFINITIONS,
        tool_choice: 'auto',
        temperature: chatbotConfig.temperature,
        max_tokens: chatbotConfig.maxTokens,
      };

      const res = await client.post('/chat/completions', payload);
      const choice = res.data.choices?.[0];
      const responseMessage = choice?.message;

      if (!responseMessage) {
        break;
      }

      // If the model called tools
      if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
        currentMessages.push(responseMessage);

        let isFirstCity = true;
        for (const toolCall of responseMessage.tool_calls) {
          const toolName = toolCall.function.name;
          toolsUsed.push(toolName);
          let parsedArgs = {};
          try {
            parsedArgs = JSON.parse(toolCall.function.arguments || '{}');
          } catch {
            parsedArgs = {};
          }

          // SYNCHRONIZATION SAFETY:
          // If parsedArgs provided a cityName, DO NOT inject old session coordinates!
          if (!parsedArgs.cityName) {
            if (session?.last_city) {
              parsedArgs.cityName = session.last_city;
              if (parsedArgs.latitude == null && session.last_latitude != null) {
                parsedArgs.latitude = session.last_latitude;
                parsedArgs.longitude = session.last_longitude;
              }
            } else if (userLocation?.latitude && userLocation?.longitude) {
              parsedArgs.latitude = userLocation.latitude;
              parsedArgs.longitude = userLocation.longitude;
              parsedArgs.cityName = userLocation.city || 'Your Location';
            }
          }

          // In comparison or multi-tool calls, only the first city sets session context
          const toolOptions = {
            ...parsedArgs,
            skipSessionUpdate: !isFirstCity,
          };
          isFirstCity = false;

          const toolResult = await executeTool(toolName, toolOptions, conversationId);

          currentMessages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(toolResult),
          });
        }
      } else {
        // Final assistant answer returned
        let replyText = responseMessage.content || '';

        // Handle models that output into reasoning_content
        if (!replyText.trim() && responseMessage.reasoning_content) {
          replyText = extractFinalFromReasoning(responseMessage.reasoning_content);
        }

        if (replyText.trim()) {
          return {
            reply: limitSentences(replyText, 4),
            toolsUsed,
            source: 'nvidia_nim_llm',
          };
        }
        break;
      }
    }

    // If loop completed without final text message, request final synthesis
    const finalRes = await client.post('/chat/completions', {
      model: chatbotConfig.nvidiaModel,
      messages: currentMessages,
      temperature: chatbotConfig.temperature,
      max_tokens: chatbotConfig.maxTokens,
    });
    const finalChoice = finalRes.data.choices?.[0]?.message;
    let finalText = finalChoice?.content || '';
    if (!finalText.trim() && finalChoice?.reasoning_content) {
      finalText = extractFinalFromReasoning(finalChoice.reasoning_content);
    }
    if (!finalText.trim()) {
      finalText = 'Here is the requested air quality information.';
    }

    return {
      reply: limitSentences(finalText, 4),
      toolsUsed,
      source: 'nvidia_nim_llm',
    };
  } catch (err) {
    console.error('[nvidiaLlmService] NVIDIA API error or timeout, falling back to tool engine:', err.message);
    const fallbackRes = await deterministicFallbackHandler({ userMessage: query, conversationId, session, userLocation });
    return {
      ...fallbackRes,
      warning: `NVIDIA NIM API encountered an error (${err.message}). Grounded fallback used.`,
    };
  }
}

/**
 * Extracts assistant response from thinking / reasoning tokens if content was null.
 */
function extractFinalFromReasoning(reasoning) {
  if (!reasoning) return '';
  const match = reasoning.match(/(?:output|answer|response):\s*["']?([^"'\n]+)/i);
  if (match) return match[1].trim();
  const lines = reasoning.split('\n').map((l) => l.trim()).filter(Boolean);
  return lines[lines.length - 1] || '';
}

/**
 * Fast-path evaluator:
 * Handles greetings, CPCB definitions, and pleasantries instantly (<1ms).
 */
async function evaluateFastPath({ userMessage }) {
  const query = userMessage.toLowerCase().trim();
  const normalizedQuery = query.replace(/[?.,!]/g, '').trim();

  // 1. Generic Greetings & Small Talk
  const greetings = new Set([
    'hi', 'hii', 'hiii', 'hello', 'helloo', 'hey', 'heyy', 'namaste', 'greetings',
    'good morning', 'good afternoon', 'good evening', 'yo', 'sup', 'hola',
  ]);
  if (greetings.has(normalizedQuery) || (/^(hi|hii|hello|hey|namaste)\b/i.test(normalizedQuery) && normalizedQuery.split(/\s+/).length <= 2)) {
    return {
      reply: "Hello! I'm your Breathe Better Assistant 🌱. I can help you check live AQI across India, evaluate outdoor activities like cycling, view forecasts, and understand CPCB standards. Which city's air quality should we check today?",
      toolsUsed: [],
      source: 'breathe_better_persona',
    };
  }

  // 2. Bot Identity / Capabilities
  if (
    query.includes('who are you') ||
    query.includes('what are you') ||
    query.includes('what can you do') ||
    query.includes('what is breathe better') ||
    query === 'help' ||
    query === 'about'
  ) {
    return {
      reply: "I am the Breathe Better Assistant, your air quality and respiratory wellness guide for India. I provide real-time CPCB AQI data, 72-hour forecasts, 30-day historical trends, and outdoor exercise safety advisories for any Indian city. Just ask about a city to get started!",
      toolsUsed: [],
      source: 'breathe_better_persona',
    };
  }

  // 3. Pleasantries & Well-being
  if (query.includes('how are you') || query.includes('how do you do') || query.includes("how's it going")) {
    return {
      reply: "I'm doing well, thank you! I'm here and ready to help you navigate air quality conditions and stay healthy outdoors. Which city or location would you like to explore?",
      toolsUsed: [],
      source: 'breathe_better_persona',
    };
  }

  // 4. Gratitude & Closings
  if (
    normalizedQuery === 'thank you' ||
    normalizedQuery === 'thanks' ||
    normalizedQuery === 'thx' ||
    normalizedQuery === 'thank you so much' ||
    normalizedQuery.startsWith('thank you')
  ) {
    return {
      reply: "You're very welcome! Stay safe, breathe clean air, and reach out anytime you need live air quality insights.",
      toolsUsed: [],
      source: 'breathe_better_persona',
    };
  }

  if (
    normalizedQuery === 'bye' ||
    normalizedQuery === 'goodbye' ||
    normalizedQuery === 'see you' ||
    normalizedQuery === 'cya' ||
    normalizedQuery === 'take care'
  ) {
    return {
      reply: "Goodbye! Take care, protect your lungs, and breathe better!",
      toolsUsed: [],
      source: 'breathe_better_persona',
    };
  }

  // 5. CPCB Knowledge Questions
  if (query.includes("what's is aqi") || query.includes('what is aqi') || query.includes('what is air quality index') || query === 'aqi index') {
    return {
      reply: 'The Air Quality Index (AQI) is a daily reporting scale from 0 to 500 created under the motto "One Number – One Colour – One Description" to communicate outdoor pollution levels and associated health risks.',
      toolsUsed: [],
      source: 'cpcb_knowledge',
    };
  }

  if (query.includes('what is pm10') || (query.includes('pm10') && (query.includes('what') || query.includes('define') || query.includes('meaning')))) {
    return {
      reply: 'PM10 refers to inhalable airborne particles 10 micrometers or smaller from road dust and construction. They irritate the eyes, nose, and upper respiratory tract.',
      toolsUsed: [],
      source: 'cpcb_knowledge',
    };
  }

  if (query.includes('what is pm2.5') || query.includes('what is pm25') || ((query.includes('pm2.5') || query.includes('pm25')) && (query.includes('what') || query.includes('define') || query.includes('meaning')))) {
    return {
      reply: 'PM2.5 comprises microscopic fine particles 2.5 micrometers or smaller from vehicle emissions and combustion. Due to their minute size, they penetrate deep into the lungs and bloodstream.',
      toolsUsed: [],
      source: 'cpcb_knowledge',
    };
  }

  if (query.includes('ground level ozone') || query.includes('ground-level ozone') || (query.includes('ozone') && (query.includes('issue') || query.includes('harm') || query.includes('effect') || query.includes('problem')))) {
    return {
      reply: 'Ground-level ozone (O3) is a secondary pollutant formed when sunlight reacts with vehicle and industrial emissions. It triggers chest pain, coughing, throat irritation, and worsens asthma.',
      toolsUsed: [],
      source: 'cpcb_knowledge',
    };
  }

  if (query.includes('categories') && (query.includes('aqi') || query.includes('scale') || query.includes('index'))) {
    return {
      reply: 'India’s CPCB AQI has 6 categories: Good (0–50), Satisfactory (51–100), Moderate (101–200), Poor (201–300), Very Poor (301–400), and Severe (401–500).',
      toolsUsed: [],
      source: 'cpcb_knowledge',
    };
  }

  if ((query.includes('very poor') || query.includes('severe') || query.includes('poor')) && (query.includes('precaution') || query.includes('protect') || query.includes('what should i do'))) {
    return {
      reply: 'For Very Poor AQI (301–400), limit outdoor physical activity and keep residential windows tightly closed. Run indoor HEPA air purifiers, wear a well-fitted N95 mask if commuting, and vulnerable individuals should stay indoors.',
      toolsUsed: [],
      source: 'cpcb_knowledge',
    };
  }

  return null;
}

/**
 * Deterministic rule-based engine:
 * Fulfills all air quality actions using real Google API tools & CPCB text with robust context management.
 */
async function deterministicFallbackHandler({ userMessage, conversationId, session, userLocation }) {
  const query = userMessage.toLowerCase().trim();
  const toolsUsed = [];

  // Extract all recognized cities from query
  const extractedCities = await extractCitiesFromQuery(userMessage);

  // 1. Two-city comparison (e.g. "compare aqi of Delhi and Chennai")
  const isCompare = query.includes('compare') || query.includes('vs') || query.includes('versus') || query.includes('difference between');
  if (isCompare && extractedCities.length >= 2) {
    const cityA = extractedCities[0];
    const cityB = extractedCities[1];

    toolsUsed.push('get_current_air_quality');
    const [aqiA, aqiB] = await Promise.all([
      getCurrentAirQuality({ latitude: cityA.latitude, longitude: cityA.longitude, cityName: cityA.name, conversationId }),
      getCurrentAirQuality({ latitude: cityB.latitude, longitude: cityB.longitude, cityName: cityB.name, skipSessionUpdate: true }),
    ]);

    // Retain cityA (the primary comparison subject) in session atomically
    if (conversationId && cityA.name) {
      await chatbotDb.upsertSession(conversationId, {
        lastCity: cityA.name,
        lastLatitude: cityA.latitude,
        lastLongitude: cityA.longitude,
        pendingIntent: null,
      });
    }

    const valA = aqiA.primaryIndex?.aqi ?? 'N/A';
    const catA = aqiA.primaryIndex?.category ?? 'Unknown';
    const valB = aqiB.primaryIndex?.aqi ?? 'N/A';
    const catB = aqiB.primaryIndex?.category ?? 'Unknown';

    let winnerText = '';
    if (typeof valA === 'number' && typeof valB === 'number') {
      winnerText = valA < valB ? `${cityA.name} currently enjoys cleaner air.` : `${cityB.name} currently enjoys cleaner air.`;
    }

    return {
      reply: `In ${cityA.name}, the AQI is currently ${valA} (${catA}), while in ${cityB.name}, it is ${valB} (${catB}). ${winnerText}`,
      toolsUsed,
      source: 'grounded_rules',
    };
  }

  // 2. Identify target city & coordinates
  let targetCity = null;
  let targetLat = null;
  let targetLon = null;

  if (extractedCities.length > 0) {
    // User explicitly mentioned a city in this message
    targetCity = extractedCities[0].name;
    targetLat = extractedCities[0].latitude;
    targetLon = extractedCities[0].longitude;
  } else if (query.includes('my location') || query.includes('here')) {
    if (userLocation?.latitude && userLocation?.longitude) {
      targetLat = userLocation.latitude;
      targetLon = userLocation.longitude;
      targetCity = userLocation.city || 'Your Location';
    } else {
      return {
        reply: "I need your location coordinates to check air quality here. Please grant browser location access or type your city name.",
        toolsUsed,
        source: 'grounded_rules',
      };
    }
  } else if (session?.last_city && session?.last_latitude && session?.last_longitude) {
    // Seamless follow-up context using the active session city
    targetCity = session.last_city;
    targetLat = session.last_latitude;
    targetLon = session.last_longitude;
  }

  // 3. Detect the action/intent of the query
  const isHistoryQuery = query.includes('month') || query.includes('historical') || query.includes('past') || query.includes('trend');
  const isForecastQuery = query.includes('tomorrow') || query.includes('forecast') || query.includes('next day') || query.includes('upcoming');
  const isCyclingQuery = query.includes('cycling') || query.includes('workout') || query.includes('jogging') || query.includes('run') || query.includes('running') || query.includes('exercise') || query.includes('go outside');
  const isLiveAqiQuery = query.includes('aqi') || query.includes('air quality') || query.includes('pollution') || query.includes('today') || query.includes('how is') || query.includes('hows');

  // Check if we are answering a previously pending intent
  let effectiveIntent = null;
  if (isHistoryQuery) effectiveIntent = 'history';
  else if (isForecastQuery) effectiveIntent = 'forecast';
  else if (isCyclingQuery) effectiveIntent = 'cycling';
  else if (isLiveAqiQuery) effectiveIntent = 'current';
  else if (session?.pending_intent) {
    // User responded with a city to fulfill a previous request
    effectiveIntent = session.pending_intent;
  } else {
    effectiveIntent = 'current';
  }

  // 4. Missing Information Handling
  // If no city known at all, ask for it and remember the user's intended action
  if (!targetLat || !targetLon || !targetCity) {
    const pendingAction = isCyclingQuery ? 'cycling' : isForecastQuery ? 'forecast' : isHistoryQuery ? 'history' : 'current';
    if (conversationId) {
      await chatbotDb.upsertSession(conversationId, {
        pendingIntent: pendingAction,
      });
    }
    return {
      reply: 'Which city or location would you like to check the air quality for?',
      toolsUsed,
      source: 'grounded_rules',
    };
  }

  // Clear pending intent once city is provided and update session
  if (conversationId && targetCity) {
    await chatbotDb.upsertSession(conversationId, {
      lastCity: targetCity,
      lastLatitude: targetLat,
      lastLongitude: targetLon,
      pendingIntent: null,
    });
  }

  // 5. Historical Analysis (1 month / 2 months)
  if (effectiveIntent === 'history') {
    const isTwoMonths = query.includes('2 month') || query.includes('two month');
    toolsUsed.push('get_historical_air_quality');
    const hist = await getHistoricalAirQuality({
      latitude: targetLat,
      longitude: targetLon,
      cityName: targetCity,
      days: isTwoMonths ? 60 : 30,
      conversationId,
    });

    if (hist.error || !hist.averageAqi) {
      return {
        reply: `Historical observations for ${targetCity} are currently unavailable upstream.`,
        toolsUsed,
        source: 'grounded_rules',
      };
    }

    if (isTwoMonths) {
      return {
        reply: `The Google Air Quality History API limits queries to the last 30 days. Over the available 30-day window in ${targetCity}, AQI averaged ${hist.averageAqi} (${hist.overallCategory}) with ${hist.prominentPollutant?.toUpperCase()} as the primary pollutant.`,
        toolsUsed,
        source: 'grounded_rules',
      };
    }

    return {
      reply: `Over the past month in ${targetCity}, the AQI averaged ${hist.averageAqi} (${hist.overallCategory}), ranging from ${hist.minAqi} to ${hist.maxAqi}. ${hist.prominentPollutant?.toUpperCase()} remained the dominant pollutant throughout this period.`,
      toolsUsed,
      source: 'grounded_rules',
    };
  }

  // 6. Forecast / Tomorrow
  if (effectiveIntent === 'forecast') {
    toolsUsed.push('get_air_quality_forecast');
    const fc = await getForecastAirQuality({
      latitude: targetLat,
      longitude: targetLon,
      cityName: targetCity,
      conversationId,
    });

    const tom = fc.tomorrowSummary;
    if (!tom || !tom.averageAqi) {
      return {
        reply: `Forecast data for ${targetCity} is currently updating. Please try again in a moment.`,
        toolsUsed,
        source: 'grounded_rules',
      };
    }

    return {
      reply: `Tomorrow in ${targetCity}, the AQI is forecasted to average ${tom.averageAqi} (${tom.expectedCategory}), with values between ${tom.minAqi} and ${tom.maxAqi}. ${tom.healthAdvisory}`,
      toolsUsed,
      source: 'grounded_rules',
    };
  }

  // 7. Outdoor Activity / Cycling Advisory
  if (effectiveIntent === 'cycling') {
    toolsUsed.push('get_current_air_quality');
    const live = await getCurrentAirQuality({
      latitude: targetLat,
      longitude: targetLon,
      cityName: targetCity,
      conversationId,
    });

    if (live.error || live.primaryIndex?.aqi == null) {
      return {
        reply: `Air quality observations for ${targetCity} are currently updating. Please try again in a moment.`,
        toolsUsed,
        source: 'grounded_rules',
      };
    }

    const aqiVal = live.primaryIndex.aqi;
    const cat = live.cpcbStandard?.officialCategory || live.primaryIndex?.category || 'Moderate';
    const guidance = live.cpcbStandard?.outdoorActivityGuidance || '';

    if (aqiVal <= 100) {
      return {
        reply: `Yes, air quality in ${targetCity} is currently ${cat} (AQI ${aqiVal}). ${guidance}`,
        toolsUsed,
        source: 'grounded_rules',
      };
    } else if (aqiVal <= 200) {
      return {
        reply: `Air quality in ${targetCity} is currently ${cat} (AQI ${aqiVal}). You may cycle with caution, but sensitive individuals and seniors should reduce strenuous outdoor exertion.`,
        toolsUsed,
        source: 'grounded_rules',
      };
    } else {
      return {
        reply: `Cycling outdoors is not recommended in ${targetCity} today as AQI is ${aqiVal} (${cat}). Avoid extended outdoor exertion to safeguard your respiratory health.`,
        toolsUsed,
        source: 'grounded_rules',
      };
    }
  }

  // 8. Default: Real-time AQI Check
  toolsUsed.push('get_current_air_quality');
  const live = await getCurrentAirQuality({
    latitude: targetLat,
    longitude: targetLon,
    cityName: targetCity,
    conversationId,
  });

  if (live.error || live.primaryIndex?.aqi == null) {
    return {
      reply: `Air quality observations for ${targetCity} are currently updating. Please try again in a moment.`,
      toolsUsed,
      source: 'grounded_rules',
    };
  }

  const aqiVal = live.primaryIndex.aqi;
  const cat = live.cpcbStandard?.officialCategory || live.primaryIndex?.category || 'Unknown';
  const dominant = live.primaryIndex?.dominantPollutant?.toUpperCase() || 'PM2.5';
  const guidance = live.cpcbStandard?.healthImpact || '';

  return {
    reply: `In ${targetCity}, the AQI is currently ${aqiVal} (${cat}) with ${dominant} as the prominent pollutant. ${guidance}`,
    toolsUsed,
    source: 'grounded_rules',
  };
}

module.exports = {
  buildSystemPrompt,
  generateNvidiaResponse,
  deterministicFallbackHandler,
  extractCitiesFromQuery,
  limitSentences,
};
