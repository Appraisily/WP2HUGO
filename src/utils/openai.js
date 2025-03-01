/**
 * OpenAI API Client Utility
 * 
 * Provides a configured OpenAI API client for use throughout the application.
 * Handles authentication and configuration for API requests.
 */

const { OpenAI } = require('openai');
require('dotenv').config();

// Check if OpenAI API key is available
if (!process.env.OPENAI_API_KEY) {
  console.warn('WARNING: OPENAI_API_KEY is not set in environment variables. Some features will not work.');
}

// Initialize OpenAI client with API key from environment
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

module.exports = openai; 