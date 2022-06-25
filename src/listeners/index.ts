import { Socket } from 'socket.io';
import { disconnect_room, get_data, join_room, selected_game, start_game } from './socket';

export const listeners = (socket: Socket): void => {
  socket.on('join_room', join_room);
  socket.on('start_game', start_game);
  socket.on('get_data', get_data);
  socket.on('selected_game', selected_game);
  socket.on('leave_room', disconnect_room);
  socket.on('disconnect', disconnect_room);
};
