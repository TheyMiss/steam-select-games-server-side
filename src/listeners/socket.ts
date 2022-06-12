import { Socket } from 'socket.io';
import { selectingSpecGamePair } from '../selectSpecGames';
import { sortPlayersHighestNumber } from '../utils/sortPlayersHighestNumber';

const rooms = {};
let gamePair = selectingSpecGamePair();
const gameInfo = {};
const timeleft = {};

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
        ? {
            ...rooms[payload.roomId].players,
            [socket.id]: { uid: socket.id, username: payload.username, points: 0, isPlaying: false },
          }
        : { [socket.id]: { uid: socket.id, username: payload.username, points: 0, isPlaying: false } },
    isStarted: false,
  };

  timeleft[payload.roomId] = { ...timeleft[payload.roomId], ...{ [socket.id]: 6 } };
  gameInfo[payload.roomId] = { ...gameInfo[payload.roomId], ...{ [socket.id]: { points: 0, round: 0 } } };

  const sortedPlayersTable = sortPlayersHighestNumber(rooms[payload.roomId].players);

  socket.to(payload.roomId).emit('players_table', sortedPlayersTable);

  socket.emit('joined_room', { uid: socket.id, joined: true, roomId: payload.roomId });
};

const checkIsGameOver = (roomId: string, socket: Socket): void => {
  if (rooms[roomId].isStarted) {
    const isPlayersDonePlaying = Object.keys(rooms[roomId].players).every(
      (uid) => rooms[roomId].players[uid].isPlaying === false,
    );

    if (isPlayersDonePlaying) {
      rooms[roomId].isStarted = false;
      setTimeout(() => {
        socket.to(roomId).emit('is_playing', { isPlaying: false });
      }, 6 * 1000);
    }
  }
};

export const start_game = function (roomId: string): void {
  const socket = this;

  socket.to(roomId).emit('start_game', rooms[roomId].isStarted);

  if (rooms[roomId].isStarted === false) {
    gamePair = selectingSpecGamePair();

    Object.keys(rooms[roomId].players).map((uid) => {
      rooms[roomId].players[uid].points = 0;
      rooms[roomId].players[uid].isPlaying = true;
      gameInfo[roomId][uid].points = 0;
      gameInfo[roomId][uid].round = 0;
    });

    rooms[roomId].isStarted = true;
    socket.to(roomId).emit('is_playing', { isPlaying: true });
  } else {
    return socket.emit('message', { message: 'Game in progress!' });
  }
};

const send = (socket: Socket, roomId: string): void => {
  gamePair = selectingSpecGamePair();

  rooms[roomId].players[socket.id].points = gameInfo[roomId][socket.id].points;

  const sortedPlayersTable = sortPlayersHighestNumber(rooms[roomId].players);

  socket.to(roomId).emit('players_table', sortedPlayersTable);

  socket.emit('send_data', {
    games: gamePair,
    gameInfo: { points: gameInfo[roomId][socket.id].points, round: gameInfo[roomId][socket.id].round },
  });
};

export const get_data = function (roomId: string): void {
  const socket = this;

  send(socket, roomId);

  const time = setInterval(() => {
    timeleft[roomId][socket.id] -= 1;
    socket.emit('send_time', { timeleft: timeleft[roomId][socket.id] });

    if (timeleft[roomId][socket.id] <= 0 && gameInfo[roomId][socket.id].round <= 5) {
      gameInfo[roomId][socket.id].round += 1;
      timeleft[roomId][socket.id] = 6;
      send(socket, roomId);
    }

    if (gameInfo[roomId][socket.id].round >= 5) {
      clearInterval(time);
      socket.emit('send_time', { timeleft: 0 });
      rooms[roomId].players[socket.id].isPlaying = false;
      send(socket, roomId);
      socket.emit('end_game');
      checkIsGameOver(roomId, socket);
      timeleft[roomId][socket.id] = 6;
    }
  }, 1000);
};

export const selected_game = function (payload: { gameId: string; roomId: string }): void {
  const socket = this;

  if (gameInfo[payload.roomId][socket.id].round <= 4) {
    const gameWithMoreReviews = gamePair[0].reviews > gamePair[1].reviews ? gamePair[0] : gamePair[1];
    if (gameWithMoreReviews.id === payload.gameId) {
      gameInfo[payload.roomId][socket.id].points += 5;
    }
    gameInfo[payload.roomId][socket.id].round += 1;
    if (gameInfo[payload.roomId][socket.id].round < 5) send(socket, payload.roomId);
    timeleft[payload.roomId][socket.id] = 6;
  }

  if (gameInfo[payload.roomId][socket.id].round >= 5) {
    socket.emit('send_time', { timeleft: 0 });
    timeleft[payload.roomId][socket.id] = 6;
    rooms[payload.roomId].players[socket.id].isPlaying = false;
    socket.emit('end_game');
    send(socket, payload.roomId);
    checkIsGameOver(payload.roomId, socket);
  }
};
