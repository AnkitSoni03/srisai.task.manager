import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';

import authRoutes from './routes/auth.js';
import taskRoutes from './routes/tasks.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// CORS setup
app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://srisai360group.vercel.app",
    "https://srisai360group.vercel.app/"
  ],
  credentials: true
}));

app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

// Socket.IO setup
const io = new Server(httpServer, {
  cors: {
    origin: [
      "http://localhost:3000",
      "https://srisai360group.vercel.app",
      "https://srisai360group.vercel.app/"
    ],
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

// Store connected users
const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // User join par usko store karo
  socket.on('user_connected', (userData) => {
    connectedUsers.set(socket.id, {
      userId: userData.userId,
      userName: userData.userName,
      socketId: socket.id
    });
    
    console.log(`User ${userData.userName} connected with socket ${socket.id}`);
    
    // Sabko batayo kitne users online hain
    io.emit('users_update', {
      count: connectedUsers.size,
      users: Array.from(connectedUsers.values())
    });
  });

  socket.on('disconnect', () => {
    const user = connectedUsers.get(socket.id);
    if (user) {
      console.log(`User ${user.userName} disconnected`);
      connectedUsers.delete(socket.id);
      
      // Update users count
      io.emit('users_update', {
        count: connectedUsers.size,
        users: Array.from(connectedUsers.values())
      });
    }
  });
});

// IMPORTANT: io instance ko globally accessible banaye
app.set('io', io);

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Socket.IO server ready`);
});