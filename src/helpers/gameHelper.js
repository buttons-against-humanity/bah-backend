import { isClusterMode } from './appHelper';
import ClusterGameManager from '../managers/ClusterGameManager';
import StandaloneGameManager from '../managers/StandaloneGameManager';

let gameManager;

const _getGameManager = function(logger) {
  if (isClusterMode()) {
    return new ClusterGameManager(logger);
  } else {
    return new StandaloneGameManager(logger);
  }
};

export const initGameManager = function(logger) {
  gameManager = _getGameManager(logger);
};

export const getGameManager = function() {
  return gameManager;
};
