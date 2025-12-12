import { io } from "socket.io-client";
import config from '../config';

const SOCKET_URL = config.API_URL;

/**
 * Socket.IO Client Instance
 * 
 * We use 'autoConnect: false' so we can control exactly when the connection starts
 * (e.g., inside a specific React component lifecycle).
 */
export const socket = io(SOCKET_URL, {
    autoConnect: false,
    transports: ["websocket"] // Force WebSocket for better performance/compatibility
});

/**
 * Helper to establish the connection if not already active.
 */
export const connectSocket = () => {
    if (!socket.connected) {
        socket.connect();
    }
};

/**
 * Helper to gracefully close the connection.
 */
export const disconnectSocket = () => {
    if (socket.connected) {
        socket.disconnect();
    }
};
