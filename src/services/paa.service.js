
// MOCK PAA SERVICE FOR LOCAL DEVELOPMENT
class PeopleAlsoAskService {
  constructor() {
    this.initialized = false;
  }

  async initialize() {
    console.log('[PAA] Initializing mock PAA service');
    this.initialized = true;
    return true;
  }

  async getQuestions(keyword) {
    console.log('[PAA] Getting mock questions for:', keyword);
    
    return {
      keyword,
      results: [
        {
          question: `What is the value of ${keyword}?`,
          answer: `The value of ${keyword} depends on factors like condition, rarity, and provenance. Prices typically range from $100 to $5,000 for common items, with rare pieces commanding much higher prices.`
        },
        {
          question: `How can I identify authentic ${keyword}?`,
          answer: `To identify authentic ${keyword}, look for maker's marks, examine materials and craftsmanship, research the design period, and consider getting an appraisal from a reputable antiques dealer.`
        },
        {
          question: `Where can I buy ${keyword}?`,
          answer: `You can purchase ${keyword} from antique shops, specialty dealers, auction houses, online marketplaces like eBay or Etsy, estate sales, and antique fairs or shows.`
        },
        {
          question: `How do I care for ${keyword}?`,
          answer: `To care for ${keyword}, keep it away from direct sunlight and extreme temperature changes, clean gently with appropriate methods for the material, handle with clean hands, and store properly to prevent damage.`
        },
        {
          question: `Are ${keyword} a good investment?`,
          answer: `${keyword} can be a good investment if you focus on quality pieces with historical significance or from renowned makers. The market can fluctuate, so it's best to buy pieces you also enjoy for their aesthetic and historical value.`
        }
      ],
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = new PeopleAlsoAskService();
  