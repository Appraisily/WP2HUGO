const BasePipelineStage = require('./base');
const contentEnhancer = require('../../ai/content/enhancer');
const contentGenerator = require('../../ai/content/generator');
const imageGenerator = require('../../ai/image/generator');

class EnhancerStage extends BasePipelineStage {
  constructor() {
    super('Enhancer');
    this.enhancer = contentEnhancer;
    this.generator = contentGenerator;
    this.imageGen = imageGenerator;
  }

  async _initialize() {
    await Promise.all([
      this.enhancer.initialize(),
      this.generator.initialize(),
      this.imageGen.initialize()
    ]);
    return true;
  }

  async _process({ keyword, research, analysis }) {
    console.log('[ENHANCER] Starting content enhancement for:', keyword);

    // Generate content structure
    const structure = await this.generator.generateStructure(
      keyword,
      { research, analysis }
    );

    // Generate images based on structure
    const images = await Promise.all(
      structure.images.map(img => 
        this.imageGen.generate(img.description, {
          keyword,
          size: "1024x1024",
          quality: "standard"
        })
      )
    );

    // Generate content with images
    const content = await this.generator.generateContent(
      structure,
      keyword
    );

    // Enhance the generated content
    const enhanced = await this.enhancer.enhance(
      content.content,
      keyword
    );

    return {
      keyword,
      research,
      analysis,
      content: {
        structure,
        images,
        raw: content,
        enhanced
      }
    };
  }
}

module.exports = new EnhancerStage();