import { io } from 'socket.io-client';

const getSocketUrl = () => {
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:3000';
  }
  return `http://${hostname}:3000`;
};

export const socket = io(getSocketUrl(), {
  reconnectionAttempts: 5,
  timeout: 10000,
});