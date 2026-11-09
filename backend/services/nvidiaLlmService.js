'use strict';

const axios = require('axios');
const chatbotConfig = require('../config/chatbot');
const { CPCB_REFERENCE_TEXT, CPCB_CATEGORIES, getCategoryForAqi } = require('./cpcbKnowledge');
const { TOOL_DEFINITIONS, executeTool, getLocationCoordinates, getCurrentAirQuality, getForecastAirQuality, getHistoricalAirQuality } = require('./chatbotTools');

/**
 * Trims text to at most maxSentences.
 */
function limitSentences(text, maxSentences = 4) {
  if (!text) return '';
  const trimmed = text.trim();
  // Split on sentence terminators (.!?) followed by space or end of string
  const sentences = trimmed.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g);
  if (!sentences || sentences.length <= maxSentences) {
    return trimmed;
  }
  return sentences.slice(0, maxSentences).join(' ').trim();
}

/**
 * Builds the strict system prompt for NVIDIA LLM.
 */
function buildSystemPrompt(session, userLocation) {
  let contextInfo = '';
  if (session?.last_city) {
    contextInfo += `Active Discussion Context: The last city discussed is ${session.last_city}`;
    if (session.last_latitude && session.last_longitude) {
      contextInfo += ` (Latitude: ${session.last_latitude}, Longitude: ${session.last_longitude})`;
    }
    contextInfo += `. If the user asks a follow-up question (e.g. "Can I go for cycling?", "What will be the aqi tomorrow?", "What precautions should I take?") without specifying a new location, refer to ${session.last_city}.\n`;
  } else if (userLocation?.city || (userLocation?.latitude && userLocation?.longitude)) {
    contextInfo += `User's Detected Geolocation: ${userLocation.city || 'Current Location'} (Lat: ${userLocation.latitude}, Lon: ${userLocation.longitude}). Use these coordinates when the user asks for AQI at "my location" or "here".\n`;
  }

  return `You are "Breathe Better Assistant", an expert, empathetic air quality assistant for India.
You help citizens understand air quality data, CPCB standards, and health recommendations.

STRICT INSTRUCTIONS:
1. Speak ONLY based on facts from the provided tools and the CPCB reference text below.
2. NEVER hallucinate or guess AQI numbers, pollutant levels, or dates.
3. If you lack the required data or city, ask the user for clarification (e.g. "Which city would you like to check?").
4. If a tool reports that Google Air Quality API history is limited to 30 days (such as when asked about 2 months), clearly state that history is available for up to 30 days and analyze the available data.
5. CONCISENESS REQUIREMENT: Keep every answer between 1 word and 4 sentences at maximum. Never exceed 4 sentences.
6. Use tools whenever asked about live AQI, forecast, history, or comparison.
7. For definitions (AQI, PM10, PM2.5, Ground-level Ozone, CPCB, categories), answer accurately using the CPCB text below.

${contextInfo}
--- CPCB AIR QUALITY REFERENCE KNOWLEDGE ---
${CPCB_REFERENCE_TEXT}
--------------------------------------------`;
}

/**
 * Handles LLM completion via NVIDIA NIM OpenAI-compatible API.
 */
async function generateNvidiaResponse({ userMessage, conversationId, session, userLocation, recentMessages }) {
  const apiKey = chatbotConfig.nvidiaApiKey;

  // Fallback to deterministic tool engine if NVIDIA_API_KEY is not configured
  if (!apiKey) {
    return await deterministicFallbackHandler({ userMessage, conversationId, session, userLocation });
  }

  const systemPrompt = buildSystemPrompt(session, userLocation);

  const messages = [
    { role: 'system', content: systemPrompt },
    ...recentMessages.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMessage },
  ];

  const toolsUsed = [];

  try {
    const client = axios.create({
      baseURL: chatbotConfig.nvidiaBaseUrl,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
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

        for (const toolCall of responseMessage.tool_calls) {
          const toolName = toolCall.function.name;
          toolsUsed.push(toolName);
          let parsedArgs = {};
          try {
            parsedArgs = JSON.parse(toolCall.function.arguments || '{}');
          } catch {
            parsedArgs = {};
          }

          // If city was omitted in tool args but known from session/context
          if (!parsedArgs.cityName && session?.last_city) {
            parsedArgs.cityName = session.last_city;
          }
          if ((parsedArgs.latitude == null || parsedArgs.longitude == null) && session?.last_latitude && session?.last_longitude) {
            parsedArgs.latitude = session.last_latitude;
            parsedArgs.longitude = session.last_longitude;
          } else if ((parsedArgs.latitude == null || parsedArgs.longitude == null) && userLocation?.latitude && userLocation?.longitude) {
            parsedArgs.latitude = userLocation.latitude;
            parsedArgs.longitude = userLocation.longitude;
            parsedArgs.cityName = parsedArgs.cityName || userLocation.city || 'Your Location';
          }

          const toolResult = await executeTool(toolName, parsedArgs, conversationId);

          currentMessages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(toolResult),
          });
        }
      } else {
        // Final assistant answer returned
        const replyText = responseMessage.content || '';
        return {
          reply: limitSentences(replyText, 4),
          toolsUsed,
          source: 'nvidia_nim_llm',
        };
      }
    }

    // If loop ended after tool calls without text message, request final synthesis
    const finalRes = await client.post('/chat/completions', {
      model: chatbotConfig.nvidiaModel,
      messages: currentMessages,
      temperature: chatbotConfig.temperature,
      max_tokens: chatbotConfig.maxTokens,
    });
    const finalText = finalRes.data.choices?.[0]?.message?.content || 'Here is the requested air quality information.';
    return {
      reply: limitSentences(finalText, 4),
      toolsUsed,
      source: 'nvidia_nim_llm',
    };
  } catch (err) {
    console.error('[nvidiaLlmService] NVIDIA API error, falling back to tool engine:', err.response?.data || err.message);
    // Graceful fallback to deterministic engine so user query is never lost
    const fallbackRes = await deterministicFallbackHandler({ userMessage, conversationId, session, userLocation });
    return {
      ...fallbackRes,
      warning: `NVIDIA NIM API encountered an error (${err.message}). Grounded fallback used.`,
    };
  }
}

/**
 * Deterministic rule-based engine when NVIDIA_API_KEY is not yet configured.
 * Directly fulfills all requirements using real Google API tools & CPCB text.
 */
async function deterministicFallbackHandler({ userMessage, conversationId, session, userLocation }) {
  const query = userMessage.toLowerCase().trim();
  const toolsUsed = [];

  // Stop words that should never be mistaken for city names
  const STOP_WORDS = new Set([
    'today', 'tomorrow', 'yesterday', 'cycling', 'my location', 'here', 'last',
    'past', 'this', 'next', 'month', 'months', 'year', 'week', 'values', 'air',
    'aqi', 'index', 'what', 'will', 'see', 'seen', 'the', 'now', 'current',
  ]);

  // Safe city name extractor using word boundaries
  let detectedCity = null;
  const cityMatch = query.match(/\b(?:in|at|for|around|of)\s+([a-zA-Z\s]+)/i);
  if (cityMatch) {
    const candidate = (cityMatch[1] || '')
      .replace(/[?.,!]/g, '')
      .trim();

    // Split words to ensure it's not starting with stop words like "the last..."
    const firstWord = candidate.split(/\s+/)[0]?.toLowerCase();
    if (candidate && !STOP_WORDS.has(candidate.toLowerCase()) && !STOP_WORDS.has(firstWord)) {
      // Clean candidate of trailing time words if present (e.g. "Mumbai today" -> "Mumbai")
      const words = candidate.split(/\s+/).filter(w => !STOP_WORDS.has(w.toLowerCase()));
      if (words.length > 0) {
        detectedCity = words.join(' ');
      }
    }
  }

  // Location comparison: e.g. "compare aqi of Delhi and Chennai"
  const compareMatch = query.match(/compare(?:\s+aqi)?(?:\s+of)?\s+([a-zA-Z\s]+?)\s+and\s+([a-zA-Z\s?]+)/i);
  if (compareMatch) {
    const cityA = compareMatch[1].trim();
    const cityB = compareMatch[2].replace(/[?.,]/g, '').trim();

    toolsUsed.push('get_location_coordinates', 'get_current_air_quality');
    const [coordsA, coordsB] = await Promise.all([
      getLocationCoordinates({ query: cityA }),
      getLocationCoordinates({ query: cityB }),
    ]);

    if (coordsA.found && coordsB.found) {
      const [aqiA, aqiB] = await Promise.all([
        getCurrentAirQuality({ latitude: coordsA.latitude, longitude: coordsA.longitude, cityName: coordsA.name, conversationId }),
        getCurrentAirQuality({ latitude: coordsB.latitude, longitude: coordsB.longitude, cityName: coordsB.name, conversationId }),
      ]);

      const valA = aqiA.primaryIndex?.aqi ?? 'N/A';
      const catA = aqiA.primaryIndex?.category ?? 'Unknown';
      const valB = aqiB.primaryIndex?.aqi ?? 'N/A';
      const catB = aqiB.primaryIndex?.category ?? 'Unknown';

      return {
        reply: `In ${coordsA.name}, the AQI is currently ${valA} (${catA}), while in ${coordsB.name}, it is ${valB} (${catB}). ${
          valA < valB ? coordsA.name : coordsB.name
        } currently enjoys cleaner air.`,
        toolsUsed,
        source: 'grounded_rules',
      };
    }
  }

  // CPCB General Knowledge questions
  if (query.includes("what's is aqi") || query.includes('what is aqi') || query.includes('air quality index')) {
    return {
      reply: 'The Air Quality Index (AQI) is a daily reporting scale from 0 to 500 created under the motto "One Number – One Colour – One Description" to communicate outdoor pollution levels and associated health risks.',
      toolsUsed,
      source: 'cpcb_knowledge',
    };
  }

  if (query.includes('pm10') || query.includes('particulate matter 10')) {
    return {
      reply: 'PM10 refers to inhalable airborne particles 10 micrometers or smaller from road dust and construction. They irritate the eyes, nose, and upper respiratory tract.',
      toolsUsed,
      source: 'cpcb_knowledge',
    };
  }

  if (query.includes('pm2.5') || query.includes('pm25')) {
    return {
      reply: 'PM2.5 comprises microscopic fine particles 2.5 micrometers or smaller from vehicle emissions and combustion. Due to their minute size, they penetrate deep into the lungs and bloodstream.',
      toolsUsed,
      source: 'cpcb_knowledge',
    };
  }

  if (query.includes('ground level ozone') || query.includes('ground-level ozone') || (query.includes('ozone') && query.includes('issue'))) {
    return {
      reply: 'Ground-level ozone (O3) is a secondary pollutant formed when sunlight reacts with vehicle and industrial emissions. It triggers chest pain, coughing, throat irritation, and worsens asthma.',
      toolsUsed,
      source: 'cpcb_knowledge',
    };
  }

  if (query.includes('categories') && (query.includes('aqi') || query.includes('scale'))) {
    return {
      reply: 'India’s CPCB AQI has 6 categories: Good (0–50), Satisfactory (51–100), Moderate (101–200), Poor (201–300), Very Poor (301–400), and Severe (401–500).',
      toolsUsed,
      source: 'cpcb_knowledge',
    };
  }

  // Precautions when AQI is very poor
  if (query.includes('very poor') && (query.includes('precaution') || query.includes('protect') || query.includes('what should i do'))) {
    return {
      reply: 'For Very Poor AQI (301–400), limit outdoor physical activity and keep residential windows tightly closed. Run indoor HEPA air purifiers, wear a well-fitted N95 mask if commuting, and vulnerable individuals should stay indoors.',
      toolsUsed,
      source: 'cpcb_knowledge',
    };
  }

  // Determine active city coordinates
  let targetCity = detectedCity || session?.last_city;
  let targetLat = session?.last_latitude;
  let targetLon = session?.last_longitude;

  if (query.includes('my location') || query.includes('here')) {
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
  } else if (detectedCity) {
    toolsUsed.push('get_location_coordinates');
    const coords = await getLocationCoordinates({ query: detectedCity });
    if (coords.found) {
      targetCity = coords.name;
      targetLat = coords.latitude;
      targetLon = coords.longitude;
    } else if (session?.last_city && session?.last_latitude) {
      targetCity = session.last_city;
      targetLat = session.last_latitude;
      targetLon = session.last_longitude;
    } else {
      return {
        reply: `I could not locate "${detectedCity}". Could you please verify the city name or provide a neighboring major district?`,
        toolsUsed,
        source: 'grounded_rules',
      };
    }
  }

  // If no city known at all
  if (!targetLat || !targetLon) {
    return {
      reply: 'Which city or location would you like to check the air quality for?',
      toolsUsed,
      source: 'grounded_rules',
    };
  }

  // History questions (last 1 month or 2 months)
  if (query.includes('month') || query.includes('historical') || query.includes('past')) {
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

  // Forecast / Tomorrow questions
  if (query.includes('tomorrow') || query.includes('forecast')) {
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

  // Outdoor activity / Cycling question
  if (query.includes('cycling') || query.includes('workout') || query.includes('jogging') || query.includes('run') || query.includes('go outside')) {
    toolsUsed.push('get_current_air_quality');
    const live = await getCurrentAirQuality({
      latitude: targetLat,
      longitude: targetLon,
      cityName: targetCity,
      conversationId,
    });

    const aqiVal = live.primaryIndex?.aqi ?? 0;
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
        reply: `Air quality in ${targetCity} is currently ${cat} (AQI ${aqiVal}). You may cycle with caution, but sensitive individuals and seniors should reduce strenuous exertion.`,
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

  // Default: Real-time AQI check
  toolsUsed.push('get_current_air_quality');
  const live = await getCurrentAirQuality({
    latitude: targetLat,
    longitude: targetLon,
    cityName: targetCity,
    conversationId,
  });

  const aqiVal = live.primaryIndex?.aqi ?? 'N/A';
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
  limitSentences,
};
