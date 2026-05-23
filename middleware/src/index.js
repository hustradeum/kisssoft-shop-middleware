require('dotenv').config();
const logger = require('./utils/logger');
const createApp = require('./app');

if (!process.env.JWT_SECRET) {
  logger.error('JWT_SECRET is not set. Copy .env.example to .env and fill in the values.');
  process.exit(1);
}

const PORT = process.env.PORT || 3000;
const app = createApp();

const server = app.listen(PORT, () => {
  logger.info('KISSsoft Shop Middleware started', {
    port: PORT,
    env: process.env.NODE_ENV || 'development',
    allowedOrigin: process.env.ALLOWED_ORIGIN || '*',
  });
});

function shutdown(signal) {
  logger.info(`${signal} received, shutting down`);
  server.close(() => {
    logger.info('Shutdown complete');
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', { reason: String(reason) });
});

module.exports = server;
