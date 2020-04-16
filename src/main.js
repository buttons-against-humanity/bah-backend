import './appenv';
import PCAHServer from './server';
import Logger from 'bunyan';
const { LOG_LEVEL, LOG_FILE } = process.env;

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

const startServer = () => {
  setupLogger();
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

startServer();
