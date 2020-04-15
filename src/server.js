import express from 'express';
import http from 'http';
import socketio from 'socket.io';
import packageJson from '../package.json';
import GameController from './controllers/gamecontroller';
import api from './routes/api';

class PCAHServer {
  logger;

  gameController;

  constructor(logger) {
    this.app = express();
    this.server = http.Server(this.app);
    this.io = socketio(this.server);
    this.logger = logger;
    this.gameController = new GameController(logger);
  }

  start() {
    this.setup();
    this.gameController.start(this.io);
    this.server.listen(Number(process.env.PORT) || 8080);
  }

  stop() {
    if (this.gameController) {
      this.gameController.stop();
    }
  }

  setup() {
    this.app.get('/', function(req, res) {
      res.json({ name: packageJson.name, version: packageJson.version });
    });

    this.app.use('/api', api);

    this.io.on('connection', socket => {
      this.gameController.onConnection(socket);
    });
  }
}

export default PCAHServer;
