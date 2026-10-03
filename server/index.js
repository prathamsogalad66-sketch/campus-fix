const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db');
const issueRoutes = require('./routes/issues');

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(helmet());
const clientOrigin = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(cors({
    origin: (origin, callback) => {
        const isLocalDevOrigin = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin || '');
        const isCloudflareQuickTunnel = /^https:\/\/[a-z0-9-]+\.trycloudflare\.com$/i.test(origin || '');
        if (!origin || origin === clientOrigin || isLocalDevOrigin || isCloudflareQuickTunnel) return callback(null, true);
        return callback(new Error('Origin is not allowed by CORS.'));
    },
}));
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'Campus Fix API' });
});

app.use('/api/issues', issueRoutes);

app.use((error, req, res, next) => {
    console.error(error);
    res.status(error.status || 500).json({ message: error.message || 'Something went wrong.' });
});

const start = async () => {
    await connectDB();
    app.listen(port, () => console.log(`Campus Fix API running on port ${port}`));
};

start();
