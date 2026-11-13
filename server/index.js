const express = require('express');
const cors = require('cors');
const http = require('http');
const dotenv = require('dotenv');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const issueRoutes = require('./routes/issues');

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const port = process.env.PORT || 5000;
const server = http.createServer(app);

app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
const clientOrigin = process.env.CLIENT_URL || 'http://localhost:5173';
const isAllowedOrigin = (origin) => {
    const isLocalDevOrigin = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin || '');
    const isCloudflareQuickTunnel = /^https:\/\/[a-z0-9-]+\.trycloudflare\.com$/i.test(origin || '');
    const isHostedDomain = /^https:\/\/[a-z0-9-]+\.(vercel\.app|onrender\.com|netlify\.app)$/i.test(origin || '');
    return !origin || origin === clientOrigin || isLocalDevOrigin || isCloudflareQuickTunnel || isHostedDomain;
};
const checkOrigin = (origin, callback) => {
    if (isAllowedOrigin(origin)) return callback(null, true);
    return callback(new Error('Origin is not allowed by CORS.'));
};
app.use(cors({ origin: checkOrigin }));
const io = new Server(server, { cors: { origin: checkOrigin } });
app.set('io', io);
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ limit: '15mb', extended: true }));
app.use(morgan('dev'));

// Static files from built client
const clientDistPath = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDistPath)) {
    app.use(express.static(clientDistPath));
}

app.get('/api/health', (req, res) => {
    const connectionState = mongoose.connection.readyState;
    res.json({
        status: 'ok',
        service: 'Campus Fix API',
        storageMode: connectionState === 1 ? 'mongodb' : connectionState === 2 ? 'connecting' : 'local',
    });
});

app.use('/api/issues', (req, res, next) => {
    if (req.method !== 'GET' && process.env.MONGODB_URI && mongoose.connection.readyState === 2) {
        return res.status(503).json({ message: 'The database is still connecting. Please retry shortly.' });
    }
    return next();
});

app.use('/api/issues', issueRoutes);

// Fallback all non-API GET requests to index.html for SPA (Express 5 safe)
if (fs.existsSync(clientDistPath)) {
    app.use((req, res, next) => {
        if (req.method !== 'GET') return next();
        if (req.path.startsWith('/api')) return next();
        res.sendFile(path.join(clientDistPath, 'index.html'));
    });
}

app.use((error, req, res, next) => {
    console.error(error);
    res.status(error.status || 500).json({ message: error.message || 'Something went wrong.' });
});

server.listen(port, () => {
    console.log(`Campus Fix API listening on port ${port}`);
    connectDB()
        .then((connected) => {
            if (connected) io.emit('storage:ready');
            else console.warn('Campus Fix is using local JSON storage.');
        })
        .catch((error) => {
            console.error(`Database initialization failed: ${error.message}`);
        });
});

server.on('error', (error) => {
    console.error(`Campus Fix API could not listen on port ${port}: ${error.message}`);
    process.exitCode = 1;
});
