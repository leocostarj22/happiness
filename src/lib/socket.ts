import { io } from 'socket.io-client';

const getSocketConfig = () => {
  const isDev = import.meta.env.DEV;
  
  if (isDev) {
    return {
      url: 'http://localhost:3000',
      options: {
        path: '/socket.io',
        reconnectionAttempts: 5,
        timeout: 10000,
      }
    };
  }
  
  // In production, connect to the same origin (relative)
  // The reverse proxy will handle the redirection to port 3000
  return {
    url: undefined, // undefined lets socket.io determine the URL (same origin)
    options: {
      path: '/happiness/socket.io', // Specific path for subfolder deployment
      reconnectionAttempts: 5,
      timeout: 10000,
      transports: ['polling', 'websocket'] // Force polling first for better compatibility behind proxies
    }
  };
};

const config = getSocketConfig();
export const socket = io(config.url || undefined, config.options);