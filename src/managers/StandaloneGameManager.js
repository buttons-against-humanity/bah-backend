import GameManager from './gameManager';

const games = {};

const MAX_GAME_IDLE_TIME = Number(process.env.MAX_GAME_IDLE_TIME) || 3600000;

class StandaloneGameManager extends GameManager {
  gameCleaner;

  start() {
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

  async add(game) {
    games[game.uuid] = game;
  }

  async get(game_uuid) {
    return games[game_uuid];
  }

  async delete(game_uuid) {
    delete games[game_uuid];
  }

  async exists(game_uuid) {
    return typeof games[game_uuid] === 'object';
  }

  async touch(game_uuid) {
    if (games[game_uuid]) {
      games[game_uuid].last_touch = Date.now();
    }
  }
}

export default StandaloneGameManager;
