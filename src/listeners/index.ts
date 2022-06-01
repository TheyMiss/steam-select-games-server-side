const rooms = {};
export const listeners = (socket) => {
  socket.on('join_room', (data: { roomId: string; username: string }) => {
    socket.leaveAll();
    socket.join(data.roomId);

    if (rooms[data.roomId] !== undefined) {
      const playerInRoom = Object.keys(rooms[data.roomId].players).length;
      const maxPlayersinRoom = 10;

      if (playerInRoom >= maxPlayersinRoom) {
        return socket.emit('message', { message: 'Room is full!' });
      }
    }

    //Creates object of room id which has a players names and ids
    rooms[data.roomId] = {
      players:
        rooms[data.roomId] !== undefined
          ? { ...rooms[data.roomId].players, [socket.id]: data.username }
          : { [socket.id]: data.username },
    };

    socket.to(data.roomId).emit('party_members', rooms[data.roomId]);
  });

  socket.on('leave_room', (roomId: string) => {
    delete rooms[roomId].players[socket.id];

    socket.leave(roomId);

    socket.to(roomId).emit('party_members', rooms[roomId]);
  });
};
