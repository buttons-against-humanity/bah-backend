import Game, { ERRORS } from '../models/Game';

const games = {};

const kicker = {};

const MAX_GAME_IDLE_TIME = Number(process.env.MAX_GAME_IDLE_TIME) || 3600000;

const slackin = process.env.SLACKIN_URL;

class GameController {
  logger;

  gameCleaner;

  config = {};

  constructor(logger) {
    this.logger = logger;
    if (slackin) {
      this.config.slackin = slackin;
    }
  }

  start(io) {
    this.io = io;
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
  }

  stop() {
    if (this.gameCleaner) {
      clearInterval(this.gameCleaner);
    }
  }

  onConnection(socket) {
    socket.emit('welcome', this.config);
    const onNextRound = game_uuid => {
      const round = games[game_uuid].nextRound();
      this.io.to(game_uuid).emit('round:start', round);
    };

    const onEndGame = game_uuid => {
      this.logger.info('Game ended', game_uuid);
      delete games[game_uuid];
      this.io.to(game_uuid).emit('game:ended');
    };

    const checkSocketStatus = () => {
      if (socket.pcah) {
        if (games[socket.pcah.game_uuid]) {
          games[socket.pcah.game_uuid].last_touch = Date.now();
        } else {
          return false;
        }
      }
      return !!socket.pcah;
    };

    const disconnectPlayer = pcah => {
      if (!games[pcah.game_uuid]) {
        return;
      }
      this.logger.info('Player %s left', pcah.player_uuid);
      this.io.to(pcah.game_uuid).emit('player:left', games[pcah.game_uuid].getPlayerByUUID(pcah.player_uuid));
      try {
        const { owner_changed, change_czar } = games[pcah.game_uuid].removePlayer(pcah.player_uuid);
        if (owner_changed) {
          this.io.to(pcah.game_uuid).emit('game:owner_change', games[pcah.game_uuid].owner);
        }
        if (change_czar) {
          this.io.to(pcah.game_uuid).emit('game:czar_change', games[pcah.game_uuid].owner);
        }
        this.io.to(pcah.game_uuid).emit('game:players', games[pcah.game_uuid].getPlayers());
        if (games[pcah.game_uuid].haveAllAnswers()) {
          this.io.to(pcah.game_uuid).emit('round:answers', games[pcah.game_uuid].getAnswers());
        }
      } catch (e) {
        if (e.error_code === ERRORS.GAME_END) {
          onEndGame(pcah.game_uuid);
        }
      }
    };

    socket.on('disconnect', () => {
      this.logger.debug('socket disconnects');
      if (!checkSocketStatus()) {
        return;
      }
      const { pcah } = socket;
      kicker[pcah.player_uuid] = setTimeout(() => {
        disconnectPlayer(pcah);
      }, 1000);
    });
    socket.on('reconnect', () => {
      this.logger.debug('socket reconnects');
      if (!checkSocketStatus()) {
        return;
      }
      const { pcah } = socket;
      if (kicker[pcah.player_uuid]) {
        clearTimeout(kicker[pcah.player_uuid]);
        delete kicker[pcah.player_uuid];
      }
    });
    socket.on('game:create', data => {
      const { owner, expansions } = data;
      this.logger.info('New game by %s!', owner);
      const game = new Game(expansions);
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
      this.logger.debug('Got %s answer: %s', socket.pcah.player_uuid, answer);
      games[socket.pcah.game_uuid].addAnswer(socket.pcah.player_uuid, answer);
      this.io
        .to(socket.pcah.game_uuid)
        .emit('round:answers_count', games[socket.pcah.game_uuid].current_answers.length);
      socket.emit('player:update', games[socket.pcah.game_uuid].getFullPlayerByUUID(socket.pcah.player_uuid));
      if (games[socket.pcah.game_uuid].haveAllAnswers()) {
        this.logger.debug('Round end, answers', games[socket.pcah.game_uuid].getAnswers());
        this.io.to(socket.pcah.game_uuid).emit('round:answers', games[socket.pcah.game_uuid].getAnswers());
      }
    });
    socket.on('round:winner', answer => {
      if (!checkSocketStatus()) {
        return;
      }
      if (answer) {
        games[socket.pcah.game_uuid].addPoint(answer.player_uuid);
      }

      this.io.to(socket.pcah.game_uuid).emit('round:start');
      this.io.to(socket.pcah.game_uuid).emit('game:players', games[socket.pcah.game_uuid].getPlayers());
      if (answer) {
        this.io.to(socket.pcah.game_uuid).emit('round:winner', {
          text: answer.text,
          player: games[socket.pcah.game_uuid].getPlayerByUUID(answer.player_uuid)
        });
      } else {
        this.io.to(socket.pcah.game_uuid).emit('round:winner', {
          text: 'Round void, no one answered',
          player: ''
        });
      }
    });

    socket.on('round:next', () => {
      if (!checkSocketStatus()) {
        return;
      }
      onNextRound(socket.pcah.game_uuid);
    });
  }
}

export default GameController;
