import express from 'express';
import cors from 'cors';
import http from 'http';
import 'dotenv/config';
import log from './logger';
import { Server } from 'socket.io';

const PORT = process.env.PORT;

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
    origin: 'http://localhost:3000',
  },
});

server.listen(PORT, () => {
  log.info(`Server is listening at ${PORT}`);
});
