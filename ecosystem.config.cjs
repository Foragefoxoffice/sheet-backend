module.exports = {
    apps: [{
        name: 'task-management-api',
        script: './index.js',
        instances: 'max',
        exec_mode: 'cluster',
        env: {
            NODE_ENV: 'production',
            PORT: 5003
        },
        error_file: './logs/err.log',
        out_file: './logs/out.log',
        log_file: './logs/combined.log',
        time: true,
        autorestart: true,
        max_restarts: 10,
        min_uptime: '10s',
        max_memory_restart: '1G'
    }]
};
