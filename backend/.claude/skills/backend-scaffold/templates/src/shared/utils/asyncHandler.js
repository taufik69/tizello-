// Wraps async route/middleware handlers so a rejected promise is forwarded
// to next(err) instead of requiring a try/catch in every controller. Every
// async controller must be mounted through this — an unwrapped rejection in
// Express 4 hangs the request instead of reaching the error middleware.

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export { asyncHandler };
export default asyncHandler;
