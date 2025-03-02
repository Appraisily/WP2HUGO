/**
 * OpenAI API Client Utility
 * 
 * Provides a configured OpenAI API client for use throughout the application.
 * Handles authentication and configuration for API requests.
 * In test mode, provides a mock client when no API key is available.
 */

const { OpenAI } = require('openai');
require('dotenv').config();

// Check if OpenAI API key is available
if (!process.env.OPENAI_API_KEY) {
  console.warn('WARNING: OPENAI_API_KEY is not set in environment variables. Using mock client for testing.');
}

let openai;

// If no API key is available, create a mock client for testing
if (!process.env.OPENAI_API_KEY) {
  // Mock OpenAI client for testing
  openai = {
    chat: {
      completions: {
        create: async () => ({
          choices: [
            {
              message: {
                content: "This is a mock response from the OpenAI API. Please set OPENAI_API_KEY in your .env file for actual API responses."
              }
            }
          ]
        })
      }
    }
  };
} else {
  // Initialize OpenAI client with API key from environment
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

module.exports = openai; 