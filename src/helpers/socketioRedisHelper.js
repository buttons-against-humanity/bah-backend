import redis from 'socket.io-redis';
import { getRedisOpts } from './redisHelper';

export const getIORedis = function() {
  return redis(getRedisOpts());
};
