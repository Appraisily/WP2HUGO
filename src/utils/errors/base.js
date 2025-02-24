class BaseError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = this.constructor.name;
    this.code = options.code || 'UNKNOWN_ERROR';
    this.status = options.status || 500;
    this.details = options.details || {};
    this.timestamp = new Date().toISOString();
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      status: this.status,
      details: this.details,
      timestamp: this.timestamp,
      stack: this.stack
    };
  }
}

class ValidationError extends BaseError {
  constructor(message, details = {}) {
    super(message, {
      code: 'VALIDATION_ERROR',
      status: 400,
      details
    });
  }
}

class NotFoundError extends BaseError {
  constructor(message, details = {}) {
    super(message, {
      code: 'NOT_FOUND',
      status: 404,
      details
    });
  }
}

class APIError extends BaseError {
  constructor(message, details = {}) {
    super(message, {
      code: 'API_ERROR',
      status: details.status || 500,
      details
    });
  }
}

class StorageError extends BaseError {
  constructor(message, details = {}) {
    super(message, {
      code: 'STORAGE_ERROR',
      status: 500,
      details
    });
  }
}

class AIError extends BaseError {
  constructor(message, details = {}) {
    super(message, {
      code: 'AI_ERROR',
      status: 500,
      details
    });
  }
}

module.exports = {
  BaseError,
  ValidationError,
  NotFoundError,
  APIError,
  StorageError,
  AIError
};