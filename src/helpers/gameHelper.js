import StandaloneGameManager from '../managers/StandaloneGameManager';

let gameManager;

const _getGameManager = function(logger) {
  return new StandaloneGameManager(logger);
};

export const initGameManager = function(logger) {
  gameManager = _getGameManager(logger);
};

export const getGameManager = function() {
  return gameManager;
};
