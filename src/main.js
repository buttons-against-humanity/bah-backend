import './appenv';
import PCAHServer from './server';

let server;

const shutdown = function() {
  console.log('Shutting down...');
  if (server) {
    console.log('Shutting down server...');
    return server.stop().finally(() => process.exit(0));
  } else {
    return process.exit(0);
  }
};

process.on('uncaughtException', err => {
  console.error('Uncaught exception!', err);
  return process.exit(99);
});

process.on('SIGTERM', shutdown);

process.on('SIGINT', shutdown);

const startServer = () => {
  server = new PCAHServer();
  server.start();
};

startServer();
