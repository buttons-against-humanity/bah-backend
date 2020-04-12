import express from 'express';
import http from 'http';
import socketio from 'socket.io';
import packageJson from '../package.json';
import Game, { ERRORS } from './models/Game';

const games = {};

const MAX_GAME_IDLE_TIME = Number(process.env.MAX_GAME_IDLE_TIME) || 3600000;

class PCAHServer {
  logger;

  constructor(logger) {
    this.app = express();
    this.server = http.Server(this.app);
    this.io = socketio(this.server);
    this.logger = logger;
  }

  start() {
    this.setup();
    this.gameCleaner = setInterval(() => {
      Object.keys(games).forEach(game_uuid => {
        if (Date.now() - games[game_uuid].last_touch > MAX_GAME_IDLE_TIME) {
          this.logger.info(
            'Cleaning up game %s last used %s',
            game_uuid,
            new Date(games[game_uuid].last_touch).toISOString()
          );
          delete games[game_uuid];
        }
      });
    }, 60000);
    this.server.listen(Number(process.env.PORT) || 8080);
  }

  async stop() {
    if (this.gameCleaner) {
      clearInterval(this.gameCleaner);
    }
  }

  setup() {
    this.app.get('/', function(req, res) {
      res.json({ name: packageJson.name, version: packageJson.version });
    });

    const onNextRound = game_uuid => {
      const round = games[game_uuid].nextRound();
      this.io.to(game_uuid).emit('round:start', round);
    };

    this.io.on('connection', socket => {
      const onEndGame = game_uuid => {
        this.logger.info('Game ended', game_uuid);
        delete games[game_uuid];
        this.io.to(game_uuid).emit('game:ended');
      };

      const checkSocketStatus = () => {
        if (socket.pcah) {
          games[socket.pcah.game_uuid].last_event = Date.now();
        }
        return !!socket.pcah;
      };

      socket.on('disconnect', () => {
        if (!checkSocketStatus()) {
          return;
        }
        this.logger.info('Player %s left', socket.pcah.player_uuid);
        this.io
          .to(socket.pcah.game_uuid)
          .emit('player:left', games[socket.pcah.game_uuid].getPlayerByUUID(socket.pcah.player_uuid));
        try {
          const owner_changed = games[socket.pcah.game_uuid].removePlayer(socket.pcah.player_uuid);
          if (owner_changed) {
            this.io.to(socket.pcah.game_uuid).emit('game:owner_change', games[socket.pcah.game_uuid].owner);
          }
          this.io.to(socket.pcah.game_uuid).emit('game:players', games[socket.pcah.game_uuid].getPlayers());
        } catch (e) {
          if (e.status_code === ERRORS.GAME_END) {
            onEndGame(socket.pcah.game_uuid);
          }
        }
      });

      socket.on('game:create', owner => {
        this.logger.info('New game by %s!', owner);
        const game = new Game();
        this.logger.info('Game ready', game.uuid);
        games[game.uuid] = game;
        socket.emit('game:created', game.uuid);
        const player = game.addPlayer(owner);
        game.setOwner(player);
        socket.emit('game:joined', player);
        socket.join(game.uuid);
        socket.pcah = {
          game_uuid: game.uuid,
          player_uuid: player.uuid
        };
      });
      socket.on('game:start', () => {
        if (!checkSocketStatus()) {
          return;
        }
        this.io.to(socket.pcah.game_uuid).emit('game:started');
        games[socket.pcah.game_uuid].start();
        onNextRound(socket.pcah.game_uuid);
      });
      socket.on('game:join', data => {
        const { game_uuid, player_name } = data;
        if (!games[game_uuid]) {
          socket.emit('game:join_error', 'game not found');
          return;
        }
        try {
          const player = games[game_uuid].addPlayer(player_name);
          this.logger.info('%s joined a game!', player_name);
          socket.emit('game:joined', player);
          socket.join(game_uuid);
          socket.pcah = {
            game_uuid: game_uuid,
            player_uuid: player.uuid
          };
          this.io.to(game_uuid).emit('player:joined', player_name);
          this.io.to(game_uuid).emit('game:players', games[game_uuid].getPlayers());
        } catch (e) {
          socket.emit('game:join_error', e.message);
        }
      });
      socket.on('game:end', () => {
        if (!checkSocketStatus()) {
          return;
        }
        onEndGame(socket.pcah.game_uuid);
      });
      socket.on('round:answer', answer => {
        if (!checkSocketStatus()) {
          return;
        }
        games[socket.pcah.game_uuid].addAnswer(socket.pcah.player_uuid, answer);
        this.io
          .to(socket.pcah.game_uuid)
          .emit('round:answers_count', games[socket.pcah.game_uuid].current_answers.length);
        socket.emit('player:update', games[socket.pcah.game_uuid].getFullPlayerByUUID(socket.pcah.player_uuid));
        if (games[socket.pcah.game_uuid].current_answers.length === games[socket.pcah.game_uuid].players.length - 1) {
          this.io.to(socket.pcah.game_uuid).emit('round:answers', games[socket.pcah.game_uuid].getAnswers());
        }
      });
      socket.on('round:winner', answer => {
        if (!checkSocketStatus()) {
          return;
        }
        games[socket.pcah.game_uuid].addPoint(answer.player_uuid);
        this.io.to(socket.pcah.game_uuid).emit('round:start');
        this.io.to(socket.pcah.game_uuid).emit('game:players', games[socket.pcah.game_uuid].getPlayers());
        this.io.to(socket.pcah.game_uuid).emit('round:winner', {
          text: answer.text,
          player: games[socket.pcah.game_uuid].getPlayerByUUID(answer.player_uuid)
        });
      });

      socket.on('round:next', () => {
        if (!checkSocketStatus()) {
          return;
        }
        onNextRound(socket.pcah.game_uuid);
      });
    });
  }
}

export default PCAHServer;
