// Custom error class
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

// 404 Not Found middleware
const notFoundMiddleware = (req, res, next) => {
  const error = new AppError(`Cannot find ${req.originalUrl} on this server`, 404);
  next(error);
};

// Global error handling middleware
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || 'Internal Server Error';

  // Wrong MongoDB ID error
  if (err.name === 'CastError') {
    const message = `Resource not found. Invalid: ${err.path}`;
    err = new AppError(message, 400);
  }

  // JWT error
  if (err.name === 'JsonWebTokenError') {
    const message = 'JSON Web Token is invalid, try again';
    err = new AppError(message, 401);
  }

  // JWT expire error
  if (err.name === 'TokenExpiredError') {
    const message = 'JSON Web Token is expired, try again';
    err = new AppError(message, 401);
  }

  // Duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field} already exists`;
    err = new AppError(message, 400);
  }

  res.status(err.statusCode).json({
    success: false,
    statusCode: err.statusCode,
    message: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

export { AppError, notFoundMiddleware, errorHandler };
