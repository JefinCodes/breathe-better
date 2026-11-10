'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const chatbotDb = require('../db/chatbotDb');
const nvidiaLlmService = require('../services/nvidiaLlmService');

async function runTests() {
  const conversationId = 'test-conv-' + Date.now();
  console.log('--- Testing Chatbot with Conversation ID:', conversationId, '---\n');

  const testQueries = [
    // 1. Generic messages & Small talk (User issue: "chatbot appears to break for messages like hii")
    { q: "hii", note: "Generic greeting (breathe better persona)" },
    { q: "who are you?", note: "Bot identity & capabilities" },

    // 2. Missing info handling (User issue: "model ask for missing info and when info is given it keeps again repeatedly asking")
    { q: "Can I go today for cycling?", note: "Activity check without city (bot should ask for city)" },
    { q: "Delhi", note: "User provides missing city (bot must directly answer cycling for Delhi)" },
    { q: "What will be the aqi tomorrow?", note: "Follow-up forecast using remembered city Delhi" },

    // 3. City context switching (User issue: "sometimes last mentioned city saved and response of another city")
    { q: "Hows the aqi index at Pune?", note: "Switch context to Pune" },
    { q: "Can I go today for cycling?", note: "Follow-up cycling check for Pune (must NOT be Delhi)" },

    // 4. Comparison without session context corruption
    { q: "Compare aqi of Delhi and Chennai?", note: "Two-city comparison" },

    // 5. CPCB Knowledge questions
    { q: "What's is aqi index?", note: "Concept definition" },
    { q: "What is pm10?", note: "Pollutant definition" },
    { q: "What are the issues caused by ground level ozone?", note: "Ozone health impact" },
    { q: "What categories are there in aqi index?", note: "Categories & ranges" },
    { q: "Aqi index is very poor here so what precautions should I take?", note: "Health precautions" },

    // 6. Historical queries
    { q: "What do you understand from aqi values seen in the last 1 month?", note: "Historical 1-month analysis" },
    { q: "What do you understand from the aqi values seen in the last 2 months?", note: "Historical 2-months (API limit awareness)" },

    // 7. Geolocation
    { q: "How's the aqi index at my location?", userLocation: { latitude: 12.9716, longitude: 77.5946, city: "Bengaluru" }, note: "User geolocation AQI" },

    // 8. Polite closing
    { q: "thank you so much", note: "Polite gratitude closing" },
  ];

  for (const item of testQueries) {
    console.log(`\n======================================================`);
    console.log(`USER: "${item.q}" (${item.note})`);

    const session = await chatbotDb.getSession(conversationId);
    const recent = await chatbotDb.getRecentMessages(conversationId, 8);

    await chatbotDb.saveMessage(conversationId, 'user', item.q);

    const t0 = Date.now();
    const res = await nvidiaLlmService.generateNvidiaResponse({
      userMessage: item.q,
      conversationId,
      session,
      userLocation: item.userLocation,
      recentMessages: recent,
    });
    const elapsed = Date.now() - t0;

    await chatbotDb.saveMessage(conversationId, 'assistant', res.reply);
    const updated = await chatbotDb.getSession(conversationId);

    console.log(`BOT [${res.source}] (${elapsed}ms): ${res.reply}`);
    console.log(`Session Last City: ${updated.last_city || 'None'}`);
    console.log(`Pending Intent: ${updated.pending_intent || 'None'}`);
    console.log(`Tools Used: ${JSON.stringify(res.toolsUsed)}`);
  }

  console.log('\n--- All test scenarios completed successfully! ---');
  process.exit(0);
}

runTests().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
