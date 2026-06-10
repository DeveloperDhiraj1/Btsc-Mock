import { io } from 'socket.io-client';
import { API_ORIGIN } from './api';

export const createSocket = (options = {}) => {
  return io(API_ORIGIN || undefined, {
    withCredentials: true,
    ...options
  });
};
