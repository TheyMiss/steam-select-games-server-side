import { selectingSpecGamePair } from '../selectSpecGames';

const rooms = {};
//const score = {};
export const listeners = (socket) => {
  socket.on('join_room', (data: { roomId: string; username: string }) => {
    socket.leaveAll();
    socket.join(data.roomId);

    if (rooms[data.roomId] !== undefined) {
      const playerInRoom = Object.keys(rooms[data.roomId].players).length;
      const maxPlayersinRoom = 3;

      if (playerInRoom >= maxPlayersinRoom) {
        return socket.emit('message', { message: 'Room is full!' });
      }
    }

    //Creates object of room id which has a players names and ids
    rooms[data.roomId] = {
      players:
        rooms[data.roomId] !== undefined
          ? { ...rooms[data.roomId].players, [socket.id]: { username: data.username, points: points } }
          : { [socket.id]: { username: data.username, points: points } },
    };

    // score[data.roomId] = {
    //   players:
    //     score[data.roomId] !== undefined
    //       ? { ...score[data.roomId].players, [rooms[data.roomId].players[socket.id]]: { points: points } }
    //       : { [rooms[data.roomId].players[socket.id]]: { points: points } },
    // };

    socket.to(data.roomId).emit('party_members', rooms[data.roomId]);
    socket.emit('joined_room', { joined: true, roomId: data.roomId });
  });

  socket.on('leave_room', (roomId: string) => {
    delete rooms[roomId].players[socket.id];

    socket.leave(roomId);

    socket.to(roomId).emit('party_members', rooms[roomId]);
  });

  let gamePair = selectingSpecGamePair();
  let points = 0;
  let round = 1;

  socket.on('start_game', (roomId: string) => {
    socket.to(roomId).emit('send_data', { games: gamePair, points: points, round: round, scoreBoard: rooms[roomId] });

    //socket.to(roomId).emit('send_scoreBoard', rooms[roomId]);
  });

  socket.on('selected_game', (data: { gameId: string; roomId: string }) => {
    if (round <= 10) {
      if (data.gameId === undefined) {
        round = round + 1;
        gamePair = selectingSpecGamePair();
        return socket.emit('send_data', {
          gameData: { games: gamePair, points: points, round: round },
          scoreBoard: rooms[data.roomId],
        });
      }

      const gameWithMoreReviews = gamePair[0].reviews > gamePair[1].reviews ? gamePair[0] : gamePair[1];

      if (gameWithMoreReviews.id === data.gameId) {
        points = points + 5;
      }

      round = round + 1;

      if (round <= 10) {
        gamePair = selectingSpecGamePair();
      }

      //  score[data.roomId].players[rooms[data.roomId].players[socket.id]].points = points;

      rooms[data.roomId].players[socket.id].points = points;

      //socket.to(data.roomId).emit('send_scoreBoard', rooms[data.roomId]);

      socket.emit('send_data', {
        gameData: { games: gamePair, points: points, round: round },
        scoreBoard: rooms[data.roomId],
      });
    }
  });
};
