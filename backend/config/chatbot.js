'use strict';

/**
 * Chatbot configuration: NVIDIA NIM LLM, memory, and defaults.
 */
const config = {
  /** NVIDIA NIM OpenAI-compatible API base URL */
  nvidiaBaseUrl: process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1',

  /**
   * NVIDIA API Key loaded from environment.
   * Obtainable from build.nvidia.com.
   */
  get nvidiaApiKey() {
    return process.env.NVIDIA_API_KEY;
  },

  /**
   * Model to use on NVIDIA NIM API.
   * High performance models with verified active endpoints:
   *   - nvidia/nemotron-3.5-lightning-30b-a3b
   *   - mistralai/mistral-large-4-1t-a52b
   */
  nvidiaModel: process.env.NVIDIA_MODEL || 'nvidia/nemotron-3.5-lightning-30b-a3b',

  /** Maximum recent messages to maintain in context memory */
  memoryWindow: 8,

  /** Max tokens for concise completion */
  maxTokens: 512,

  /** Temperature for factual consistency */
  temperature: 0.1,

  /** Timeout in ms for NVIDIA LLM calls (prevents long hanging delays) */
  timeoutMs: 6000,
};

module.exports = config;
