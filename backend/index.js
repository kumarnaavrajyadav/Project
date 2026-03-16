const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const { Server } = require('socket.io');
const connectDB = require('./config/db');

dotenv.config();

connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
const path = require('path');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const userRoutes = require('./routes/userRoutes');
const friendRoutes = require('./routes/friendRoutes');
const messageRoutes = require('./routes/messageRoutes');

app.use('/api/users', userRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/messages', messageRoutes);

app.get('/', (req, res) => {
  res.send('FriendConnect API is running');
});

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('setup', (userData) => {
    // Join personal room to receive personal notifications/messages
    socket.join(userData._id);
    socket.emit('connected');
  });

  socket.on('join chat', (room) => {
    socket.join(room);
    console.log('User Joined Room: ' + room);
  });

  socket.on('typing', (room) => socket.in(room).emit('typing'));
  socket.on('stop typing', (room) => socket.in(room).emit('stop typing'));

  socket.on('new message', (newMessageReceived) => {
    let receiver = newMessageReceived.receiver;
    
    if (!receiver) return console.log('Message receiver not defined');

    // Emit to the receiver's personal room
    socket.in(receiver).emit('message received', newMessageReceived);
  });
  
  // Real-time friend request updates
  socket.on('send friend request', (requestData) => {
    socket.in(requestData.receiverId).emit('new friend request', requestData);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5002;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
