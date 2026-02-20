import { Server } from 'socket.io';

let io;

export const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: [
                "https://sheet-frontend-lemon.vercel.app",
                "https://sheet-backend-orpin.vercel.app",
                "https://placetest.in",
                "http://localhost:5173",
                "http://localhost:5174",
                "http://localhost:5714"
            ],
            methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
            credentials: true
        }
    });

    io.on('connection', (socket) => {
        console.log('New client connected:', socket.id);

        socket.on('join', (userId) => {
            if (userId) {
                const roomName = String(userId);
                socket.join(roomName);
                console.log(`Socket ${socket.id} joined room (User ID): ${roomName}`);
            } else {
                console.log(`Socket ${socket.id} tried to join with empty userId`);
            }
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized');
    }
    return io;
};

// Utility to emit event to a specific user
export const emitToUser = (userId, event, data) => {
    if (io && userId) {
        const roomName = String(userId);
        console.log(`Emitting ${event} and task_list_update to room: ${roomName}`);
        io.to(roomName).emit(event, data);
        // Also emit general update to trigger list refresh
        io.to(roomName).emit('task_list_update', data);
    } else {
        console.log('Cannot emit: io not initialized or userId missing', { hasIo: !!io, userId });
    }
};

// Utility to broadcast to everyone
export const broadcast = (event, data) => {
    if (io) {
        io.emit(event, data);
    }
};
