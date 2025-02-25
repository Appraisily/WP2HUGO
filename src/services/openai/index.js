// Mock OpenAI service that doesn't rely on the OpenAI API
class MockOpenAIService {
  constructor() {
    this.isInitialized = true;
  }

  async initialize() {
    console.log('[OPENAI] Mock service initialized');
    return true;
  }

  async chat(messages, options = {}) {
    console.log('[OPENAI] Mock chat completion with messages:', messages[messages.length-1].content.substring(0, 50) + '...');
    
    // Return a mock response
    return {
      choices: [
        {
          message: {
            content: JSON.stringify({
              title: "Mock Response",
              content: "This is a mock response from the OpenAI service replacement.",
              sections: [
                { title: "Section 1", content: "Content for section 1" },
                { title: "Section 2", content: "Content for section 2" }
              ],
              meta: {
                description: "Mock meta description",
                keywords: ["mock", "test", "placeholder"]
              }
            })
          }
        }
      ]
    };
  }

  async generateImage(prompt) {
    console.log('[OPENAI] Mock image generation for prompt:', prompt.substring(0, 50) + '...');
    
    // Return a mock image result
    return {
      data: [
        {
          url: "https://via.placeholder.com/1024x1024?text=Placeholder+Image"
        }
      ]
    };
  }
}

// Create a single instance of the mock service
const openaiService = new MockOpenAIService();

// Export the initialized service
module.exports = {
  openaiService,
  initialize: () => openaiService.initialize()
};