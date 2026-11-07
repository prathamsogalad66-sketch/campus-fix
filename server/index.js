const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');
const issueRoutes = require('./routes/issues');

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const port = process.env.PORT || 5000;

app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
const clientOrigin = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(cors({
    origin: (origin, callback) => {
        const isLocalDevOrigin = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin || '');
        const isCloudflareQuickTunnel = /^https:\/\/[a-z0-9-]+\.trycloudflare\.com$/i.test(origin || '');
        const isHostedDomain = /^https:\/\/[a-z0-9-]+\.(vercel\.app|onrender\.com|netlify\.app)$/i.test(origin || '');
        if (!origin || origin === clientOrigin || isLocalDevOrigin || isCloudflareQuickTunnel || isHostedDomain) return callback(null, true);
        return callback(new Error('Origin is not allowed by CORS.'));
    },
}));
app.use(express.json());
app.use(morgan('dev'));

// Static files from built client
const clientDistPath = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDistPath)) {
    app.use(express.static(clientDistPath));
}

app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'Campus Fix API',
        storageMode: mongoose.connection.readyState === 1 ? 'mongodb' : 'local',
    });
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

const start = async () => {
    try {
        await connectDB();
    } catch (error) {
        console.error(`MongoDB connection failed: ${error.message}`);
        console.warn('Starting in local JSON mode. Reports will not be saved to MongoDB until its connection is restored.');
    }

    app.listen(port, () => {
        const storage = mongoose.connection.readyState === 1 ? 'MongoDB' : 'local JSON storage';
        console.log(`Campus Fix API running on port ${port} with ${storage}`);
    });
};

start().catch((error) => {
    console.error('Campus Fix API failed to start:', error.message);
    process.exitCode = 1;
});
