export class GameManager {
  logger;

  constructor(logger) {
    this.logger = logger;
  }

  async add(game) {}

  async delete(game_uuid) {}

  async exists(game_uuid) {}

  async get(game_uuid) {}

  async touch(game_uuid) {}

  start() {}

  stop() {}
}

export default GameManager;
