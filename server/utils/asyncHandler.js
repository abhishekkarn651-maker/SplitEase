/**
 * asyncHandler
 * ------------
 * A utility wrapper for async route handlers / controllers.
 *
 * Instead of writing try/catch in every controller, wrap the
 * function with asyncHandler and any thrown errors will be
 * automatically passed to Express's next() error handler.
 *
 * Usage:
 *   router.get("/groups", asyncHandler(async (req, res) => {
 *     const groups = await Group.find();
 *     res.json(groups);
 *   }));
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
