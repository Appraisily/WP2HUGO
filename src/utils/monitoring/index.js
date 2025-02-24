const logger = require('../logging');

class Monitoring {
  constructor() {
    this.logger = logger.createChild('monitoring');
    this.metrics = new Map();
  }

  recordMetric(name, value, labels = {}) {
    const metric = {
      name,
      value,
      labels,
      timestamp: new Date().toISOString()
    };

    this.metrics.set(name, metric);
    this.logger.debug('Recorded metric', metric);
  }

  incrementCounter(name, labels = {}) {
    const current = this.metrics.get(name)?.value || 0;
    this.recordMetric(name, current + 1, labels);
  }

  recordLatency(name, startTime, labels = {}) {
    const duration = Date.now() - startTime;
    this.recordMetric(name, duration, {
      ...labels,
      unit: 'ms'
    });
  }

  recordError(name, error, labels = {}) {
    this.incrementCounter(`${name}_errors`, {
      ...labels,
      error_type: error.name,
      error_code: error.code
    });
  }

  getMetrics() {
    return Array.from(this.metrics.values());
  }

  async reportMetrics() {
    try {
      const metrics = this.getMetrics();
      await this.logger.info('Reporting metrics', { metrics });
      this.metrics.clear();
    } catch (error) {
      await this.logger.error('Failed to report metrics', error);
    }
  }
}

module.exports = new Monitoring();