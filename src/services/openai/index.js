const BaseOpenAIService = require('./base.service');

// Create a single instance of the base service
const openaiService = new BaseOpenAIService();

// Export the initialized service
module.exports = {
  openaiService,
  initialize: () => openaiService.initialize()
};