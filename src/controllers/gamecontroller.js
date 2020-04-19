import Game, { ERRORS } from '../models/Game';
import { getGameManager } from '../helpers/gameHelper';
import StatsManager from '../managers/StatsManager';

const kicker = {};

const slackin = process.env.SLACKIN_URL;

class GameController {
  logger;

  config = {};

  /**
   * GameManager
   */
  gameManager;

  constructor(logger) {
    this.logger = logger;
    if (slackin) {
      this.config.slackin = slackin;
    }
    this.gameManager = getGameManager();
  }

  start(io) {
    this.io = io;
    this.gameManager.start();
  }

  stop() {
    this.gameManager.stop();
  }

  onConnection(socket) {
    StatsManager.addPlayer();
    socket.emit('welcome', this.config);

    const onNextRound = game_uuid => {
      this.gameManager.get(game_uuid).then(game => {
        try {
          const round = game.nextRound();
          if (round === false) {
            this.logger.info('Max round reached', game_uuid);
            onEndGame(game_uuid);
            return;
          }
          this.io.to(game_uuid).emit('round:start', round);
        } catch (e) {
          if (e.error_code) {
            if (e.error_code === ERRORS.NO_MORE_QUESTIONS) {
              this.logger.info('No more questions!', game_uuid);
              onEndGame(game_uuid, 'No more questions');
              return;
            }
          }
          onEndGame(game_uuid, e.message);
        }
      });
    };

    const onEndGame = (game_uuid, message = null) => {
      this.logger.info('Game ended', game_uuid);
      this.gameManager.delete(game_uuid).catch(err => this.logger.error('Faild to delete game', err.message));
      this.io.to(game_uuid).emit('game:ended', message);
    };

    const checkSocketStatus = async () => {
      if (socket.bah) {
        const { game_uuid } = socket.bah;
        const gameExists = await this.gameManager.exists(game_uuid);
        if (gameExists) {
          this.gameManager.touch(game_uuid).finally(() => {});
        } else {
          return false;
        }
      }
      return !!socket.bah;
    };

    const disconnectPlayer = async bah => {
      const { game_uuid } = bah;
      const gameExists = await this.gameManager.exists(game_uuid);
      if (!gameExists) {
        return;
      }
      this.logger.info('Player %s left', bah.player_uuid);
      const game = await this.gameManager.get(game_uuid);
      this.io.to(game_uuid).emit('player:left', game.getPlayerByUUID(bah.player_uuid));
      try {
        const { owner_changed, change_czar } = game.removePlayer(bah.player_uuid);
        if (owner_changed) {
          this.io.to(game_uuid).emit('game:owner_change', game.owner);
        }
        if (change_czar) {
          this.io.to(game_uuid).emit('game:czar_change', game.owner);
        }
        this.io.to(game_uuid).emit('game:players', game.getPlayers());
        if (game.haveAllAnswers()) {
          this.io.to(game_uuid).emit('round:answers', game.getAnswers());
        }
      } catch (e) {
        if (e.error_code === ERRORS.GAME_END) {
          onEndGame(game_uuid);
        }
      }
    };

    socket.on('disconnect', async () => {
      StatsManager.removePlayer();
      this.logger.debug('socket disconnects');
      const statusOk = await checkSocketStatus();
      if (!statusOk) {
        return;
      }
      const { bah } = socket;
      kicker[bah.player_uuid] = setTimeout(() => {
        disconnectPlayer(bah);
      }, 1000);
    });

    socket.on('reconnect', async () => {
      this.logger.debug('socket reconnects');
      const statusOk = await checkSocketStatus();
      if (!statusOk) {
        return;
      }
      const { bah } = socket;
      if (kicker[bah.player_uuid]) {
        clearTimeout(kicker[bah.player_uuid]);
        delete kicker[bah.player_uuid];
      }
    });

    socket.on('game:create', async data => {
      const { owner, rounds, expansions } = data;
      this.logger.info('New game with %s rounds by %s!', rounds, owner);
      const game = new Game(rounds, expansions);
      this.logger.info('Game ready', game.uuid);
      await this.gameManager.add(game);
      socket.emit('game:created', game.uuid);
      const player = game.addPlayer(owner);
      game.setOwner(player);
      socket.emit('game:joined', player);
      socket.join(game.uuid);
      socket.bah = {
        game_uuid: game.uuid,
        player_uuid: player.uuid
      };
    });

    socket.on('game:start', async () => {
      const statusOk = await checkSocketStatus();
      if (!statusOk) {
        return;
      }
      StatsManager.newGame();
      this.io.to(socket.bah.game_uuid).emit('game:started');
      const game = await this.gameManager.get(socket.bah.game_uuid);
      game.start();
      onNextRound(socket.bah.game_uuid);
    });

    socket.on('game:join', async data => {
      const { game_uuid, player_name } = data;
      const game = await this.gameManager.get(game_uuid);
      if (!game) {
        socket.emit('game:join_error', 'game not found');
        return;
      }

      try {
        const player = game.addPlayer(player_name);
        this.logger.info('%s joined a game!', player_name);
        socket.emit('game:joined', player);
        socket.join(game_uuid);
        socket.bah = {
          game_uuid: game_uuid,
          player_uuid: player.uuid
        };
        this.io.to(game_uuid).emit('player:joined', player_name);
        this.io.to(game_uuid).emit('game:players', game.getPlayers());
      } catch (e) {
        socket.emit('game:join_error', e.message);
      }
    });

    socket.on('game:end', () => {
      if (!checkSocketStatus()) {
        return;
      }
      onEndGame(socket.bah.game_uuid);
    });

    socket.on('round:answer', async answer => {
      const statusOk = await checkSocketStatus();
      if (!statusOk) {
        return;
      }
      const { player_uuid, game_uuid } = socket.bah;
      this.logger.debug('Player %s answered: %s', player_uuid, answer);
      const game = await this.gameManager.get(game_uuid);
      try {
        game.addAnswer(socket.bah.player_uuid, answer);
      } catch (e) {
        socket.emit('error:round', e.message);
        return;
      }

      this.io.to(socket.bah.game_uuid).emit('round:answers_count', game.current_answers.length);
      socket.emit('player:update', game.getFullPlayerByUUID(player_uuid));
      if (game.haveAllAnswers()) {
        this.logger.debug('Round end, answers', game.getAnswers());
        this.io.to(game_uuid).emit('round:answers', game.getAnswers());
      }
    });

    socket.on('round:winner', async answer => {
      const statusOk = await checkSocketStatus();
      if (!statusOk) {
        return;
      }
      const { game_uuid } = socket.bah;
      const game = await this.gameManager.get(game_uuid);
      if (answer) {
        game.addPoint(answer.player_uuid);
      }
      this.io.to(socket.bah.game_uuid).emit('round:start');
      this.io.to(socket.bah.game_uuid).emit('game:players', game.getPlayers());
      if (answer) {
        this.io.to(socket.bah.game_uuid).emit('round:winner', {
          text: answer.text,
          player: game.getPlayerByUUID(answer.player_uuid)
        });
      } else {
        this.io.to(socket.bah.game_uuid).emit('round:winner', {
          text: 'Round void, no one answered',
          player: ''
        });
      }
    });

    socket.on('round:next', async () => {
      const statusOk = await checkSocketStatus();
      if (!statusOk) {
        return;
      }
      onNextRound(socket.bah.game_uuid);
    });
  }
}

export default GameController;
