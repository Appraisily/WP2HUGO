const { Logging } = require('@google-cloud/logging');
const pino = require('pino');
const { ErrorReporting } = require('@google-cloud/error-reporting');

class Logger {
  constructor() {
    this.cloudLogging = new Logging();
    this.errorReporting = new ErrorReporting();

    // Create a Pino logger for local development
    this.localLogger = pino({
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname'
        }
      }
    });

    // Set up Cloud Logging
    this.log = this.cloudLogging.log('wp2hugo');
  }

  async write(severity, message, metadata = {}) {
    const entry = {
      severity,
      message: typeof message === 'string' ? message : JSON.stringify(message),
      ...metadata,
      timestamp: new Date().toISOString()
    };

    // Write to Cloud Logging
    try {
      const cloudEntry = this.log.entry(metadata, message);
      await this.log.write(cloudEntry);
    } catch (error) {
      console.error('Failed to write to Cloud Logging:', error);
    }

    // Write to local logger
    this.localLogger[severity.toLowerCase()](entry);
  }

  async error(message, error = null, metadata = {}) {
    const errorMetadata = {
      ...metadata,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: error.code
      } : null
    };

    // Report error to Error Reporting
    if (error) {
      this.errorReporting.report(error);
    }

    await this.write('ERROR', message, errorMetadata);
  }

  async warn(message, metadata = {}) {
    await this.write('WARNING', message, metadata);
  }

  async info(message, metadata = {}) {
    await this.write('INFO', message, metadata);
  }

  async debug(message, metadata = {}) {
    await this.write('DEBUG', message, metadata);
  }

  createChild(component) {
    return {
      error: (msg, err, meta) => this.error(msg, err, { component, ...meta }),
      warn: (msg, meta) => this.warn(msg, { component, ...meta }),
      info: (msg, meta) => this.info(msg, { component, ...meta }),
      debug: (msg, meta) => this.debug(msg, { component, ...meta })
    };
  }
}

module.exports = new Logger();