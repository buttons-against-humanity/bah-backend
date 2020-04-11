import express from 'express';
import http from 'http';
import socketio from 'socket.io';
import packageJson from '../package.json';
import Game from './models/Game';

const games = {};

class PCAHServer {
  constructor() {
    this.app = express();
    this.server = http.Server(this.app);
    this.io = socketio(this.server);
  }

  start() {
    this.setup();
    this.server.listen(Number(process.env.PORT) || 8080);
  }

  async stop() {}

  setup() {
    this.app.get('/', function(req, res) {
      res.json({ name: packageJson.name, version: packageJson.version });
    });

    const onNextRound = game_uuid => {
      const round = games[game_uuid].nextRound();
      this.io.to(game_uuid).emit('round:start', round);
    };

    this.io.on('connection', socket => {
      const checkSocketStatus = () => {
        return !!socket.pcah;
      };

      socket.emit('news', { hello: 'world' });
      socket.on('game:create', owner => {
        console.log('New game by %s!', owner);
        const game = new Game(owner);
        console.log('Game ready', game.uuid);
        games[game.uuid] = game;
        socket.emit('game:created', game.uuid);
        const player = game.addPlayer(owner);
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
