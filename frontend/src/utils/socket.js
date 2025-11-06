import { io } from 'socket.io-client'

// Development URL
const SOCKET_URL = 'http://localhost:5000'

// Create socket connection with options
export const socket = io(SOCKET_URL, {
  transports: ['websocket', 'polling'], // Multiple transport methods
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
})

// Connection events for debugging
socket.on('connect', () => {
  console.log('Connected to server with socket ID:', socket.id)
})

socket.on('disconnect', (reason) => {
  console.log('Disconnected from server:', reason)
})

socket.on('connect_error', (error) => {
  console.error('Connection error:', error)
})

socket.on('reconnect', (attemptNumber) => {
  console.log('Reconnected to server. Attempt:', attemptNumber)
})