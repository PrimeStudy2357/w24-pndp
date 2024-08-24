const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const redis = require('redis');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// 클라이언트와 소켓이 연결 되었을 때 (Socket.IO)
io.on('connection', async (socket) => {
    // Redis 클라이언트 설정
    const redisClient = redis.createClient();
    await redisClient.connect();

    // Redis 구독 설정
    const redisSubscriber = redis.createClient();
    await redisSubscriber.connect();
    await redisSubscriber.subscribe('chat', (message) => {
        // Redis에서 메시지를 수신 했을 때
        console.log('message received :: ', message);
        // 현재 소켓의 주인에게 메시지를 전달
        socket.emit('message', message);
    });

    console.log('New client connected');

    // 클라이언트로부터 메시지를 수신 했을 때 (Socket.IO)
    socket.on('sendMessage', (message) => {
        // 소켓으로 받은 메시지를 Redis에게 발행
        redisClient.publish('chat', message).then(() => {
            console.log('message sent :: ', message);
        });
    });

    // 클라이언트가 연결을 끊었을 때 (Socket.IO)
    socket.on('disconnect', () => {
        console.log('Client disconnect');
    });
});

// public/index.html 배포
app.use(express.static('public'));

// 서버 실행
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});