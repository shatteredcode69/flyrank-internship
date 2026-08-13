// src/middleware/errorHandler.js
//
// One place decides how an error becomes an HTTP response, so no route
// handler ever lets an unhandled exception fall through to a bare 500 HTML
// page. Every error response is clean JSON with an honest status code.

class ApiError extends Error {
  constructor(status, error, message, details) {
    super(message || error);
    this.status = status;
    this.error = error;
    this.details = details;
  }
}

function notFoundHandler(req, res, _next) {
  res.status(404).json({ error: 'not_found', message: `No route for ${req.method} ${req.path}` });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  // express.json() body-parser throws a SyntaxError / entity.too.large for
  // malformed or oversized payloads — normalize both to clean 4xx JSON.
  if (err.type === 'entity.too.large' || err.status === 413) {
    return res.status(413).json({ error: 'payload_too_large', message: 'Request body exceeds the size limit' });
  }
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'invalid_json', message: 'Request body is not valid JSON' });
  }
  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: err.error, message: err.message, details: err.details });
  }

  console.error('[unhandled error]', err);
  return res.status(500).json({ error: 'internal_error', message: 'Something went wrong' });
}

module.exports = { ApiError, notFoundHandler, errorHandler };
