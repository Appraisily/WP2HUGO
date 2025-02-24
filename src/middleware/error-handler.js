const { BaseError } = require('../utils/errors/base');
const logger = require('../utils/logging');
const monitoring = require('../utils/monitoring');

const errorLogger = logger.createChild('error-handler');

function errorHandler(err, req, res, next) {
  // Log the error
  errorLogger.error('Request error', err, {
    path: req.path,
    method: req.method,
    query: req.query,
    body: req.body
  });

  // Record error metric
  monitoring.recordError('request_error', err, {
    path: req.path,
    method: req.method
  });

  // Handle known errors
  if (err instanceof BaseError) {
    return res.status(err.status).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details
      }
    });
  }

  // Handle unknown errors
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred'
    }
  });
}

module.exports = errorHandler;