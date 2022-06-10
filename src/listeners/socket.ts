import { Socket } from 'socket.io';
import { selectingSpecGamePair } from '../selectSpecGames';
import { sortPlayersHighestNumber } from '../utils/sortPlayersHighestNumber';

const rooms = {};
let currentRoomId = '';
let gamePair = selectingSpecGamePair();
let points = 0;
let round = 0;
let gameInfo = {};

export const join_room = function (payload: { roomId: string; username: string }): void {
  const socket = this;

  socket.leaveAll();
  socket.join(payload.roomId);

  if (rooms[payload.roomId] !== undefined) {
    const playerInRoom = Object.keys(rooms[payload.roomId].players).length;
    const maxPlayersinRoom = 3;

    if (playerInRoom >= maxPlayersinRoom) {
      return socket.emit('message', { message: 'Room is full!' });
    }
  }

  //Creates object of room id which has a players names and ids
  rooms[payload.roomId] = {
    players:
      rooms[payload.roomId] !== undefined
        ? { ...rooms[payload.roomId].players, [socket.id]: { uid: socket.id, username: payload.username, points: 0 } }
        : { [socket.id]: { uid: socket.id, username: payload.username, points: 0 } },
  };

  gameInfo = { ...gameInfo, [currentRoomId]: { [socket.id]: { points: 0, rounds: 0 } } };

  const sortedPlayersTable = sortPlayersHighestNumber(rooms[payload.roomId].players);

  socket.to(payload.roomId).emit('players_table', sortedPlayersTable);

  socket.emit('joined_room', { uid: socket.id, joined: true, roomId: payload.roomId });
};

export const start_game = function (roomId: string): void {
  const socket = this;

  currentRoomId = roomId;
  gamePair = selectingSpecGamePair();
  points = 0;
  round = 0;
  rooms[currentRoomId].players[socket.id].points = 0;

  socket.broadcast.to(currentRoomId).emit('start_game');
};

const send = (socket: Socket): void => {
  gamePair = selectingSpecGamePair();
  const sortedPlayersTable = sortPlayersHighestNumber(rooms[currentRoomId].players);
  rooms[currentRoomId].players[socket.id].points = points;
  socket.to(currentRoomId).emit('players_table', sortedPlayersTable);
  socket.emit('send_data', { games: gamePair, points: points, round: round });
};

export const get_data = function (): void {
  const socket = this;
  let timeleft = {};

  timeleft = { ...timeleft, [currentRoomId]: { [socket.id]: 6 } };

  const time = setInterval(() => {
    socket.emit('send_time', { timeleft: timeleft[currentRoomId][socket.id] });

    timeleft[currentRoomId][socket.id] -= 1;

    if (timeleft[currentRoomId][socket.id] === 5) {
      send(socket);
    }

    if (timeleft[currentRoomId][socket.id] <= 0) {
      round += 1;
      timeleft[currentRoomId][socket.id] = 6;
    }

    console.log(timeleft);

    if (round >= 3) {
      clearInterval(time);
      timeleft[currentRoomId][socket.id] = 0;
      round = 0;
      socket.emit('end_game');
    }
  }, 1000);
};

export const selected_game = function (payload: { gameId: string; roomId: string }): void {
  const socket = this;

  if (round <= 9) {
    const gameWithMoreReviews = gamePair[0].reviews > gamePair[1].reviews ? gamePair[0] : gamePair[1];

    if (gameWithMoreReviews.id === payload.gameId) {
      points = points + 5;
    }

    round = round + 1;

    send(socket);
  }

  if (round >= 10) {
    socket.emit('end_game');
  }
};
