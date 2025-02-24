const { EventEmitter } = require('events');

class BasePipelineStage extends EventEmitter {
  constructor(name) {
    super();
    this.name = name;
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) {
      return true;
    }

    try {
      await this._initialize();
      this.isInitialized = true;
      console.log(`[PIPELINE] ${this.name} stage initialized`);
      return true;
    } catch (error) {
      console.error(`[PIPELINE] ${this.name} stage initialization failed:`, error);
      throw error;
    }
  }

  async _initialize() {
    // Override in subclasses
    return true;
  }

  async process(data) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      console.log(`[PIPELINE] ${this.name} stage processing started`);
      const result = await this._process(data);
      console.log(`[PIPELINE] ${this.name} stage processing completed`);
      this.emit('complete', { stage: this.name, result });
      return result;
    } catch (error) {
      console.error(`[PIPELINE] ${this.name} stage processing failed:`, error);
      this.emit('error', { stage: this.name, error });
      throw error;
    }
  }

  async _process(data) {
    // Override in subclasses
    throw new Error('_process must be implemented by subclass');
  }
}

module.exports = BasePipelineStage;