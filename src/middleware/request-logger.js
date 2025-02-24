const logger = require('../utils/logging');
const monitoring = require('../utils/monitoring');

const requestLogger = logger.createChild('request-logger');

function logRequest(req, res, next) {
  const startTime = Date.now();
  
  // Log request
  requestLogger.info('Incoming request', {
    method: req.method,
    path: req.path,
    query: req.query,
    body: req.body
  });

  // Log response
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    requestLogger.info('Request completed', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration
    });

    // Record metrics
    monitoring.recordLatency('request_duration', startTime, {
      method: req.method,
      path: req.path,
      status: res.statusCode
    });
  });

  next();
}

module.exports = logRequest;