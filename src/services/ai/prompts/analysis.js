const analysisPrompts = {
  structure: {
    system: `Create a detailed content structure optimized for SEO and user intent.
Return valid JSON with sections for:
- Title and meta information
- Content outline
- SEO elements
- User journey touchpoints
- Conversion elements`,
    temperature: 0.5
  },
  generate: {
    system: `Generate comprehensive, SEO-optimized content following the provided structure.
Focus on:
- Expert-level information
- Natural keyword usage
- Clear value propositions
- Strategic CTAs
- Engaging storytelling`,
    temperature: 0.7
  }
};

module.exports = analysisPrompts;