import http from 'http';
import app from './src/server.js';
import { scheduleDailyReminders } from './src/services/reminderService.js';
import { initSocket } from './src/socket.js';

const PORT = process.env.PORT || 5003;

const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 API URL: http://localhost:${PORT}`);

    // Start daily reminder cron job (9:00 AM IST every day)
    scheduleDailyReminders();
});
