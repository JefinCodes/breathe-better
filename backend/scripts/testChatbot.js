'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const chatbotDb = require('../db/chatbotDb');
const nvidiaLlmService = require('../services/nvidiaLlmService');

async function runTests() {
  const conversationId = 'test-conv-' + Date.now();
  console.log('--- Testing Chatbot with Conversation ID:', conversationId, '---\n');

  const testQueries = [
    { q: "What's is aqi index?", note: "Concept definition" },
    { q: "What is pm10?", note: "Pollutant definition" },
    { q: "What are the issues caused by ground level ozone?", note: "Ozone health impact" },
    { q: "What categories are there in aqi index?", note: "Categories & ranges" },
    { q: "Aqi index is very poor here so what precautions should I take?", note: "Health precautions" },
    { q: "Hows the aqi index at Mumbai?", note: "City live AQI" },
    { q: "Can I go today for cycling?", note: "Follow-up cycling advisory for Mumbai" },
    { q: "What will be the aqi index tomorrow?", note: "Follow-up forecast for Mumbai" },
    { q: "Compare aqi of Delhi and Chennai?", note: "Two-city comparison" },
    { q: "What do you understand from aqi values seen in the last 1 month?", note: "Historical 1-month analysis" },
    { q: "What do you understand from the aqi values seen in the last 2 months?", note: "Historical 2-months (API limit awareness)" },
    { q: "How's the aqi index at my location?", userLocation: { latitude: 12.9716, longitude: 77.5946, city: "Bengaluru" }, note: "User geolocation AQI" },
    { q: "How's the aqi index today?", note: "Follow-up today check for active city" },
  ];

  for (const item of testQueries) {
    console.log(`\n======================================================`);
    console.log(`USER: "${item.q}" (${item.note})`);
    const session = await chatbotDb.getSession(conversationId);
    const recent = await chatbotDb.getRecentMessages(conversationId, 8);

    await chatbotDb.saveMessage(conversationId, 'user', item.q);

    const res = await nvidiaLlmService.generateNvidiaResponse({
      userMessage: item.q,
      conversationId,
      session,
      userLocation: item.userLocation,
      recentMessages: recent,
    });

    await chatbotDb.saveMessage(conversationId, 'assistant', res.reply);
    const updated = await chatbotDb.getSession(conversationId);

    console.log(`BOT [${res.source}]: ${res.reply}`);
    console.log(`Session Last City: ${updated.last_city || 'None'}`);
    console.log(`Tools Used: ${JSON.stringify(res.toolsUsed)}`);
  }

  console.log('\n--- All tests completed successfully! ---');
  process.exit(0);
}

runTests().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
