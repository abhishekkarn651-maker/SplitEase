/**
 * errorHandler Middleware
 * ----------------------
 * A centralized error-handling middleware for Express.
 *
 * How it works:
 *  1. If the error has a statusCode, use it; otherwise default to 500.
 *  2. Send a structured JSON response with the error message.
 *  3. In development mode, include the error stack trace for easier debugging.
 *
 * Usage:
 *  In any controller, you can do: next(error) or throw an error,
 *  and this middleware will catch it.
 */
const errorHandler = (err, req, res, next) => {
  // Default to 500 if no status code was set
  const statusCode = err.statusCode || 500;

  // Build the error response
  const response = {
    success: false,
    message: err.message || "Internal Server Error",
  };

  // In development, include the stack trace for debugging
  if (process.env.NODE_ENV === "development") {
    response.stack = err.stack;
  }

  console.error(`❌ Error: ${err.message}`);

  res.status(statusCode).json(response);
};

/**
 * notFound Middleware
 * ------------------
 * Catches requests to undefined routes and passes a 404 error
 * to the error handler.
 */
const notFound = (req, res, next) => {
  const error = new Error(`Not Found — ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

module.exports = { errorHandler, notFound };
