const { bootstrapServer } = require('../dist/main');

let cachedServer;

module.exports = async (req, res) => {
  try {
    if (!cachedServer) {
      cachedServer = await bootstrapServer();
    }
    return new Promise((resolve, reject) => {
      res.on('finish', resolve);
      res.on('error', reject);
      cachedServer(req, res);
    });
  } catch (err) {
    console.error('Fatal Serverless bootstrap error:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        statusCode: 500,
        message: 'Internal Server Error during backend cold start',
        error: err.message,
      })
    );
  }
};
