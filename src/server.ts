import express from 'express';
import cors from 'cors';
import http from 'http';
import 'dotenv/config';
import log from './logger';
import { Server } from 'socket.io';
import { listeners } from './listeners';
import { instrument } from '@socket.io/admin-ui';
import config from './config/default';
import connectToDb from './db/conn';

const app = express();

const server = http.createServer(app);

app.use(
  cors({
    origin: 'http://localhost:3000',
  }),
);

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000', 'https://admin.socket.io/'],
  },
});

io.on('connect', (socket) => {
  listeners(socket);
});

instrument(io, { auth: false });

server.listen(config.port, () => {
  log.info(`Server is listening at ${config.port}`);
  connectToDb();
});
