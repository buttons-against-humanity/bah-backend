import redis from 'redis';

const { REDIS_HOST, REDIS_PORT, REDIS_PASSWORD, REDIS_OPTS } = process.env;

const getRedisOpts = function() {
  const opts = {
    host: REDIS_HOST || 'localhost',
    port: Number(REDIS_PORT) || 6379
  };
  if (REDIS_PASSWORD) {
    opts.password = REDIS_PASSWORD;
  }
  if (REDIS_OPTS) {
    const _opts = JSON.parse(REDIS_OPTS);
    Object.keys(_opts).forEach(k => {
      opts[k] = _opts[k];
    });
  }
  return opts;
};

export const getRedis = function() {
  return redis.createClient(getRedisOpts());
};
