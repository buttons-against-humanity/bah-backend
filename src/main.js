import './appenv';
import PCAHServer from './server';
import Logger from 'bunyan';
import { loadDeck } from './models/Deck';
import { initGameManager } from './helpers/gameHelper';
const { LOG_LEVEL, LOG_FILE, COCKPIT_URL } = process.env;

let server;
let logger;

const shutdown = function() {
  if (server) {
    logger.info('Shutting down server...');
    server.stop(() => {
      process.exit(0);
    });
  } else {
    logger.info('Shutting down...');
    return process.exit(0);
  }
};

process.on('uncaughtException', err => {
  logger.error('Uncaught exception!', err);
  return process.exit(99);
});

process.on('SIGTERM', shutdown);

process.on('SIGINT', shutdown);

const startServer = async () => {
  setupLogger();
  initGameManager(logger);
  await loadDeck(COCKPIT_URL);
  server = new PCAHServer(logger);
  server.start();
};

const setupLogger = function() {
  const logParams = {
    serializers: {
      req: Logger.stdSerializers.req,
      res: Logger.stdSerializers.res,
      err: Logger.stdSerializers.err
    },
    level: LOG_LEVEL || 'INFO'
  };

  if (LOG_FILE) {
    logParams.streams = [{ path: LOG_FILE }];
  } else {
    logParams.streams = [{ stream: process.stderr }];
  }

  logParams.name = 'bah';

  logger = new Logger(logParams);

  logger.debug('Initializing');
};

if (!COCKPIT_URL) {
  console.error('Missing required COCKPIT_URL env');
  process.exit(1);
}

startServer().catch(e => {
  logger.error('Unable to start server', e.message);
  process.exit(2);
});
