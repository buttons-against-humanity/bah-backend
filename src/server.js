import express from 'express';
import http from 'http';
import packageJson from '../package.json';
import GameController from './controllers/gamecontroller';
import api from './routes/api';
import { getIO } from './helpers/socketioHelper';
import MultiNodeHelper from './helpers/multiNodeHelper';
import cookieParser from 'cookie-parser';
import uuid from 'uuid';

class PCAHServer {
  logger;

  gameController;

  static getPort() {
    return Number(process.env.PORT) || 8080;
  }

  constructor(logger) {
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = getIO(this.server);
    this.logger = logger;
    this.gameController = new GameController(logger);
  }

  start() {
    this.setup();
    this.gameController.start(this.io);
    this.server.listen(PCAHServer.getPort());
  }

  stop(next) {
    if (this.gameController) {
      this.gameController.stop();
    }
    if (this.server) {
      this.server.close(next);
    } else {
      next();
    }
  }

  setup() {
    this.app.set('trust proxy', true);
    this.app.use((req, res, next) => {
      req.log = this.logger.child({ id: uuid.v4(), url: req.originalUrl, userAgent: req.get('user-agent') });
      next();
    });
    if (MultiNodeHelper.isMultiNode()) {
      this.app.use(cookieParser());
    }
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
