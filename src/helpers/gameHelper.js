import { isClusterMode } from './appHelper';
import ClusterGameManager from '../managers/ClusterGameManager';
import StandaloneGameManager from '../managers/StandaloneGameManager';

const _getGameManager = function() {
  if (isClusterMode()) {
    return new ClusterGameManager();
  } else {
    return new StandaloneGameManager();
  }
};

const gameManager = _getGameManager();

export const getGameManager = function() {
  return gameManager;
};
