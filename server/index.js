let app;
let initError = null;

try {
  app = require('./src/server');
} catch (e) {
  console.error('[FATAL INIT ERROR]', e);
  initError = {
    message: e.message,
    stack: e.stack,
    name: e.name
  };
}

module.exports = (req, res) => {
  if (initError) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({
      error: 'Backend Initialization Failed',
      details: initError
    }, null, 2));
  }
  return app(req, res);
};
