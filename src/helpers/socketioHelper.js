import socketio from 'socket.io';

export const getIO = function(server) {
  return socketio(server);
};
