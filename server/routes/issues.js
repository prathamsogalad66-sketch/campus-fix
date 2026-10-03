const express = require('express');
const mongoose = require('mongoose');
const Issue = require('../models/Issue');

const router = express.Router();

const demoNow = Date.now();
let demoIssues = [
    { _id: 'demo-1', title: 'Water dispenser on level 2 is leaking', category: 'Facilities', location: 'North Hall, Level 2', priority: 'High', status: 'In progress', reporter: 'Maya Patel', votes: 28, description: 'The dispenser near the study rooms has been leaking since yesterday.', createdAt: new Date(demoNow - 2 * 86400000), updatedAt: new Date(demoNow - 86400000) },
    { _id: 'demo-2', title: 'Wi-Fi drops in the library after 6 PM', category: 'IT support', location: 'Main Library', priority: 'Medium', status: 'Open', reporter: 'Jordan Lee', votes: 19, description: 'Connection becomes unreliable across the second floor in the evening.', createdAt: new Date(demoNow - 4 * 86400000), updatedAt: new Date(demoNow - 4 * 86400000) },
    { _id: 'demo-3', title: 'Broken lights along the east walkway', category: 'Safety', location: 'East Walkway', priority: 'High', status: 'Open', reporter: 'Sam Wilson', votes: 14, description: 'Three lights are out, making the path difficult to use after dark.', createdAt: new Date(demoNow - 7 * 86400000), updatedAt: new Date(demoNow - 7 * 86400000) },
    { _id: 'demo-4', title: 'Lecture hall projector repaired', category: 'IT support', location: 'Science Block, Room 104', priority: 'Low', status: 'Resolved', reporter: 'Aarav Shah', votes: 9, description: 'Projector lamp was replaced and is working normally again.', createdAt: new Date(demoNow - 12 * 86400000), updatedAt: new Date(demoNow - 3 * 86400000) },
];

router.get('/', async (req, res, next) => {
    try {
        if (mongooseReady()) {
            const issues = await Issue.find().sort({ createdAt: -1 });
            return res.json(issues);
        }
        return res.json(demoIssues);
    } catch (error) {
        next(error);
    }
});

router.post('/', async (req, res, next) => {
    try {
        const { title, description, category, location, priority, reporter } = req.body;
        if (!title || !description || !location) {
            return res.status(400).json({ message: 'Title, description, and location are required.' });
        }
        if (!mongooseReady()) {
            const created = { _id: `local-${Date.now()}`, title, description, category, location, priority, reporter: reporter || 'Anonymous', status: 'Open', votes: 0, createdAt: new Date(), updatedAt: new Date() };
            demoIssues = [created, ...demoIssues];
            return res.status(201).json(created);
        }
        const issue = await Issue.create({ title, description, category, location, priority, reporter });
        return res.status(201).json(issue);
    } catch (error) {
        next(error);
    }
});

router.patch('/:id/status', async (req, res, next) => {
    try {
        const { status } = req.body;
        if (!['Open', 'In progress', 'Resolved'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status.' });
        }
        if (!mongooseReady()) {
            const issue = demoIssues.find((item) => item._id === req.params.id);
            if (!issue) return res.status(404).json({ message: 'Issue not found.' });
            issue.status = status;
            issue.updatedAt = new Date();
            return res.json(issue);
        }
        const issue = await Issue.findByIdAndUpdate(req.params.id, { status }, { new: true });
        if (!issue) return res.status(404).json({ message: 'Issue not found.' });
        return res.json(issue);
    } catch (error) {
        next(error);
    }
});

router.delete('/:id', async (req, res, next) => {
    try {
        const reporter = typeof req.body?.reporter === 'string' ? req.body.reporter.trim() : '';
        if (!reporter) return res.status(400).json({ message: 'Reporter is required to remove this issue.' });

        if (!mongooseReady()) {
            const issue = demoIssues.find((item) => item._id === req.params.id);
            if (!issue) return res.status(404).json({ message: 'Issue not found.' });
            if ((issue.reporter || 'Anonymous').trim().toLowerCase() !== reporter.toLowerCase()) {
                return res.status(403).json({ message: 'Only the report owner can remove this issue.' });
            }
            demoIssues = demoIssues.filter((item) => item._id !== req.params.id);
            return res.json({ message: 'Issue removed.' });
        }

        const issue = await Issue.findById(req.params.id);
        if (!issue) return res.status(404).json({ message: 'Issue not found.' });
        if ((issue.reporter || 'Anonymous').trim().toLowerCase() !== reporter.toLowerCase()) {
            return res.status(403).json({ message: 'Only the report owner can remove this issue.' });
        }
        await Issue.findByIdAndDelete(req.params.id);
        return res.json({ message: 'Issue removed.' });
    } catch (error) {
        next(error);
    }
});

const mongooseReady = () => mongoose.connection.readyState === 1;

module.exports = router;
