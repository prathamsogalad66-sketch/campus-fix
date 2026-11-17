const express = require('express');
const path = require('path');
const fs = require('fs');

const router = express.Router();
const workersFilePath = path.join(__dirname, '../data/workers.json');

const DEFAULT_WORKERS = [
    { id: 'worker-1', name: 'Ramesh Kumar', trade: 'Electrician', phone: '+91 8123751706' },
    { id: 'worker-2', name: 'Suresh Patil', trade: 'Plumber', phone: '+91 77953 69555' },
    { id: 'worker-3', name: 'Anand Deshpande', trade: 'IT & Network Tech', phone: '+91 98453 45623' },
    { id: 'worker-4', name: 'Kumar Naik', trade: 'Carpenter & Furniture', phone: '+91 98454 56734' },
    { id: 'worker-5', name: 'Sunita Hiremath', trade: 'Housekeeping & Sanitation', phone: '+91 98455 67845' },
    { id: 'worker-6', name: 'Prakash Joshi', trade: 'Civil & Maintenance', phone: '+91 63660 21757' },
];

function loadWorkers() {
    try {
        if (fs.existsSync(workersFilePath)) {
            const data = fs.readFileSync(workersFilePath, 'utf8');
            const parsed = JSON.parse(data);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed;
            }
        }
    } catch (e) {
        console.error('Error loading workers file:', e.message);
    }
    return DEFAULT_WORKERS;
}

function saveWorkers(data) {
    try {
        const dir = path.dirname(workersFilePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(workersFilePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
        console.error('Error saving workers file:', e.message);
    }
}

// GET all workers
router.get('/', (req, res) => {
    const workers = loadWorkers();
    res.json(workers);
});

// PUT update workers list
router.put('/', (req, res) => {
    const { workers } = req.body;
    if (!Array.isArray(workers)) {
        return res.status(400).json({ message: 'Invalid workers data, must be an array.' });
    }
    saveWorkers(workers);
    const io = req.app.get('io');
    if (io) {
        io.emit('workers:updated', workers);
    }
    res.json({ success: true, workers });
});

module.exports = router;
