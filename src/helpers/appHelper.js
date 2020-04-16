const { CLUSTER_MODE } = process.env;

const clusterMode = CLUSTER_MODE && (CLUSTER_MODE === '1' || CLUSTER_MODE === 'true' || CLUSTER_MODE === 'on');

export const isClusterMode = function() {
  return clusterMode;
};
