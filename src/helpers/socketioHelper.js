import socketio from 'socket.io';
import { getIORedis } from './socketioRedisHelper';
import { isClusterMode } from './appHelper';

export const getIO = function(server) {
  const io = socketio(server);
  if (isClusterMode()) {
    const redis = getIORedis();
    io.adapter(redis);
  }
  return io;
};
