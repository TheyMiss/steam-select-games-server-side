import { Socket } from 'socket.io';
import { selectingSpecGamePair } from '../utils/selectingSpecGamePair';
import { sortPlayersHighestNumber } from '../utils/sortPlayersHighestNumber';

const rooms = {};
let playerAndRoom = {};
let gamePair;
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
      return socket.emit('game_info_message', { message: 'Room is full!' });
    }
  } else {
    socket.emit('game_info_message', { message: 'You need at least two players to play!' });
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
  playerAndRoom = { ...playerAndRoom, ...{ [socket.id]: payload.roomId } };

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
    } else {
      socket.emit('game_info_message', { message: 'Game in progress!' });
    }
  }
};

export const start_game = async function (roomId: string): Promise<void> {
  const socket = this;

  socket.to(roomId).emit('start_game', rooms[roomId].isStarted);

  if (rooms[roomId].isStarted === false) {
    gamePair = await selectingSpecGamePair();

    Object.keys(rooms[roomId].players).map((uid) => {
      rooms[roomId].players[uid].points = 0;
      rooms[roomId].players[uid].isPlaying = true;
      gameInfo[roomId][uid].points = 0;
      gameInfo[roomId][uid].round = 0;
    });

    rooms[roomId].isStarted = true;
    socket.to(roomId).emit('is_playing', { isPlaying: true });
  } else {
    return socket.emit('game_info_message', { message: 'Game in progress!' });
  }
};

const send = async (socket: Socket, roomId: string): Promise<void> => {
  if (!rooms[roomId].players[socket.id]) {
    return;
  }

  gamePair = await selectingSpecGamePair();

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

  if (!rooms[roomId].players[socket.id]) {
    return;
  }

  send(socket, roomId);

  const time = setInterval(() => {
    if (!rooms[roomId].players[socket.id]) {
      return;
    }

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

export const disconnect_room = function (): void {
  const socket = this;

  if (rooms[playerAndRoom[socket.id]]) {
    delete rooms[playerAndRoom[socket.id]].players[socket.id];

    const playerInRoom = Object.keys(rooms[playerAndRoom[socket.id]].players).length;

    if (playerInRoom < 1) {
      delete rooms[playerAndRoom[socket.id]];
    } else {
      const sortedPlayersTable = sortPlayersHighestNumber(rooms[playerAndRoom[socket.id]].players);
      socket.to(playerAndRoom[socket.id]).emit('players_table', sortedPlayersTable);
    }

    if (playerInRoom === 1) {
      socket
        .to(playerAndRoom[socket.id])
        .emit('game_info_message', { message: 'You need at least two players to play!' });
    }
  }

  socket.emit('players_table', {});

  delete playerAndRoom[socket.id];
};
