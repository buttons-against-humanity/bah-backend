let games = 0;
let players = 0;
let maxConcurrentPlayers = 0;

class StatsManager {
  static getGames() {
    return games;
  }

  static newGame() {
    games++;
  }

  static addPlayer() {
    players++;
    if (players > maxConcurrentPlayers) {
      maxConcurrentPlayers++;
    }
  }

  static removePlayer() {
    players--;
  }

  static getPlayers() {
    return players;
  }

  static getMaxConcurrentPlayers() {
    return maxConcurrentPlayers;
  }

  static getStats() {
    return {
      games,
      players,
      maxConcurrentPlayers
    };
  }
}

export default StatsManager;
