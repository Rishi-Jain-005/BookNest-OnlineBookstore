module.exports = function notFound(req, res, _next) {
  res.status(404).json({
    error: { code: 'NOT_FOUND', message: `No route for ${req.method} ${req.originalUrl}` }
  });
};
