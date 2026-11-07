const path = require('path');
const fs = require('fs');
const dataFilePath = path.join(__dirname, '../data/issues.json');

function loadLocalIssues() {
    try {
        if (fs.existsSync(dataFilePath)) {
            const data = fs.readFileSync(dataFilePath, 'utf8');
            const parsed = JSON.parse(data);
            if (Array.isArray(parsed)) return parsed;
        }
    } catch (e) {
        console.error('Error loading local issues:', e);
    }
    return null;
}

function saveLocalIssues(data) {
    try {
        const dir = path.dirname(dataFilePath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
        console.error('Error saving local issues:', e);
        throw e;
    }
}
const express = require('express');
const mongoose = require('mongoose');
const Issue = require('../models/Issue');
const WhatsAppDispatch = require('../models/WhatsAppDispatch');
const { notifyWorkerAssignment, getWhatsAppUrl, extractWorkerName, WORKER_PHONES } = require('../utils/whatsapp');

const router = express.Router();

let demoIssues = [
    {
        _id: 'demo-1',
        title: 'Water dispenser on level 2 is leaking',
        category: 'Facilities',
        location: 'North Hall, Level 2',
        priority: 'High',
        status: 'In progress',
        reporter: 'Maya Patel',
        reporterEmail: 'maya@sdmcet.ac.in',
        assignedWorker: 'Suresh Patil (Plumber)',
        adminNotes: 'Inspection done. Replacement valve ordered; fix expected by 2 PM.',
        votes: 28,
        description: 'The dispenser near the study rooms has been leaking since yesterday, creating a puddle near electrical points.',
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        updatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    },
    {
        _id: 'demo-2',
        title: 'Wi-Fi drops in the library after 6 PM',
        category: 'IT support',
        location: 'Main Library 2nd Floor',
        priority: 'Medium',
        status: 'Open',
        reporter: 'Jordan Lee',
        reporterEmail: 'jordan@sdmcet.ac.in',
        assignedWorker: 'Anand Deshpande (IT Tech)',
        adminNotes: 'Network technician scheduled to reconfigure access point firmware.',
        votes: 19,
        description: 'Connection becomes unstable across the 2nd floor silent reading zone during evening study hours.',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
        _id: 'demo-3',
        title: 'Broken floodlights along the East Walkway',
        category: 'Safety',
        location: 'East Walkway to Boys Hostel',
        priority: 'Urgent',
        status: 'Open',
        reporter: 'Sam Wilson',
        reporterEmail: 'sam@sdmcet.ac.in',
        assignedWorker: 'Ramesh Kumar (Electrician)',
        adminNotes: 'Emergency duty allocated. 3 LED fixtures picked up from campus maintenance depot.',
        votes: 14,
        description: 'Three lampposts are dark, making the walkway hazardous for students returning after late lab sessions.',
        createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
        updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
        _id: 'demo-4',
        title: 'Classroom 204 projector repaired and calibrated',
        category: 'Academics',
        location: 'Science Block, Room 204',
        priority: 'Low',
        status: 'Resolved',
        reporter: 'Aarav Shah',
        reporterEmail: 'aarav@sdmcet.ac.in',
        assignedWorker: 'Anand Deshpande (IT Tech)',
        adminNotes: 'Replaced projector bulb and fixed HDMI signal converter. Tested with faculty laptop.',
        votes: 9,
        description: 'Projector color was flickering and turning magenta during lectures.',
        createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
        updatedAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
        _id: 'demo-5',
        title: 'Ceiling fan making rattling noise in Mechanical Seminar Hall',
        category: 'Facilities',
        location: 'Mech Block, Seminar Hall 1',
        priority: 'Medium',
        status: 'In progress',
        reporter: 'suprita',
        reporterEmail: 'suprita@gmail.com',
        assignedWorker: 'Ramesh Kumar (Electrician)',
        adminNotes: 'Technician visited and verified loose bearing. Will tighten during lunch break.',
        votes: 7,
        description: 'The middle ceiling fan makes a loud grinding noise making it hard to hear lectures.',
        createdAt: new Date(Date.now() - 3600000 * 10).toISOString(),
        updatedAt: new Date(Date.now() - 3600000).toISOString(),
    },
];
// Load from disk if available
const savedOnDisk = loadLocalIssues();
if (savedOnDisk) demoIssues = savedOnDisk;
else saveLocalIssues(demoIssues);


const mongooseReady = () => mongoose.connection.readyState === 1;

// GET /api/issues - optionally filter by reporter/email for student, or return all for admin
router.get('/', async (req, res, next) => {
    try {
        const { reporter, email } = req.query;
        if (mongooseReady()) {
            const query = {};
            if (email) {
                query.$or = [{ reporterEmail: email.toLowerCase() }, { reporter: new RegExp(`^${reporter}$`, 'i') }];
            } else if (reporter) {
                query.reporter = new RegExp(`^${reporter}$`, 'i');
            }
            const issues = await Issue.find(query).sort({ createdAt: -1 });
            return res.json(issues);
        }

        let filtered = demoIssues;
        if (email || reporter) {
            filtered = demoIssues.filter((item) => {
                const matchesEmail = email && item.reporterEmail && item.reporterEmail.toLowerCase() === email.toLowerCase();
                const matchesName = reporter && item.reporter && item.reporter.toLowerCase() === reporter.toLowerCase();
                return matchesEmail || matchesName;
            });
        }
        return res.json(filtered);
    } catch (error) {
        next(error);
    }
});

// POST /api/issues - user registers a new campus issue
router.post('/', async (req, res, next) => {
    try {
        const { title, description, category, location, priority, reporter, reporterEmail, photoBefore } = req.body;
        if (!title || !description || !location) {
            return res.status(400).json({ message: 'Title, description, and location are required.' });
        }

        const newDoc = {
            title: title.trim(),
            description: description.trim(),
            category: category || 'Facilities',
            location: location.trim(),
            priority: priority || 'Medium',
            reporter: reporter || 'Anonymous',
            reporterEmail: reporterEmail || '',
            status: 'Open',
            assignedWorker: 'Unassigned',
            adminNotes: 'Report received by SDMCET facility helpdesk. Awaiting admin review.',
            votes: 0,
            upvotedBy: [],
            photoBefore: photoBefore || '',
            photoAfter: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        if (!mongooseReady()) {
            const created = { ...newDoc, _id: `local-${Date.now()}` };
            demoIssues.unshift(created);
            saveLocalIssues(demoIssues);
            return res.status(201).json(created);
        }

        const issue = await Issue.create(newDoc);
        return res.status(201).json(issue);
    } catch (error) {
        next(error);
    }
});

// POST /api/issues/:id/upvote - Upvote / "Me Too" duplicate report endorsement
router.post('/:id/upvote', async (req, res, next) => {
    try {
        const userIdentifier = req.body.userEmail || req.body.userName || req.ip || 'anonymous';
        if (!mongooseReady()) {
            const index = demoIssues.findIndex((i) => i._id === req.params.id);
            if (index === -1) return res.status(404).json({ message: 'Issue not found.' });
            const issue = demoIssues[index];
            issue.votes = (issue.votes || 0) + 1;
            if (!issue.upvotedBy) issue.upvotedBy = [];
            issue.upvotedBy.push(userIdentifier);
            issue.updatedAt = new Date().toISOString();
            saveLocalIssues(demoIssues);
            return res.json(issue);
        }

        const issue = await Issue.findById(req.params.id);
        if (!issue) return res.status(404).json({ message: 'Issue not found.' });

        issue.votes = (issue.votes || 0) + 1;
        if (!issue.upvotedBy) issue.upvotedBy = [];
        issue.upvotedBy.push(userIdentifier);
        await issue.save();

        return res.json(issue);
    } catch (error) {
        next(error);
    }
});

// PATCH /api/issues/:id/photo - Upload Before or After photo proof directly into MongoDB
router.patch('/:id/photo', async (req, res, next) => {
    try {
        const { photoBefore, photoAfter } = req.body;
        const updates = { updatedAt: new Date().toISOString() };
        if (photoBefore !== undefined) updates.photoBefore = photoBefore;
        if (photoAfter !== undefined) updates.photoAfter = photoAfter;

        if (!mongooseReady()) {
            const index = demoIssues.findIndex((i) => i._id === req.params.id);
            if (index === -1) return res.status(404).json({ message: 'Issue not found.' });
            demoIssues[index] = { ...demoIssues[index], ...updates };
            saveLocalIssues(demoIssues);
            return res.json(demoIssues[index]);
        }

        const issue = await Issue.findByIdAndUpdate(req.params.id, updates, { new: true });
        if (!issue) return res.status(404).json({ message: 'Issue not found.' });
        return res.json(issue);
    } catch (error) {
        next(error);
    }
});

// PATCH /api/issues/:id - general update (status, priority, assignedWorker, adminNotes)
router.patch('/:id', async (req, res, next) => {
    try {
        const { status, priority, assignedWorker, adminNotes, photoBefore, photoAfter } = req.body;
        const updates = {};
        if (status) updates.status = status;
        if (priority) updates.priority = priority;
        if (assignedWorker !== undefined) updates.assignedWorker = assignedWorker;
        if (adminNotes !== undefined) updates.adminNotes = adminNotes;
        if (photoBefore !== undefined) updates.photoBefore = photoBefore;
        if (photoAfter !== undefined) updates.photoAfter = photoAfter;
        updates.updatedAt = new Date().toISOString();

        if (!mongooseReady()) {
            const index = demoIssues.findIndex((i) => i._id === req.params.id);
            if (index === -1) return res.status(404).json({ message: 'Issue not found.' });
            demoIssues[index] = { ...demoIssues[index], ...updates };
            saveLocalIssues(demoIssues);
            return res.json(demoIssues[index]);
        }

        const issue = await Issue.findByIdAndUpdate(req.params.id, updates, { new: true });
        if (!issue) return res.status(404).json({ message: 'Issue not found.' });
        return res.json(issue);
    } catch (error) {
        next(error);
    }
});

// PATCH /api/issues/:id/status - quick status update
router.patch('/:id/status', async (req, res, next) => {
    try {
        const { status } = req.body;
        if (!['Open', 'In progress', 'Resolved', 'Rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status.' });
        }
        if (!mongooseReady()) {
            const index = demoIssues.findIndex((i) => i._id === req.params.id);
            if (index === -1) return res.status(404).json({ message: 'Issue not found.' });
            demoIssues[index].status = status;
            demoIssues[index].updatedAt = new Date().toISOString();
            saveLocalIssues(demoIssues);
            return res.json(demoIssues[index]);
        }
        const issue = await Issue.findByIdAndUpdate(req.params.id, { status }, { new: true });
        if (!issue) return res.status(404).json({ message: 'Issue not found.' });
        return res.json(issue);
    } catch (error) {
        next(error);
    }
});

// PATCH /api/issues/:id/assign - admin assigns worker and sets priority
router.patch('/:id/assign', async (req, res, next) => {
    try {
        const { assignedWorker, priority, adminNotes, status, photoBefore, photoAfter } = req.body;
        const updates = { updatedAt: new Date().toISOString() };
        if (assignedWorker) updates.assignedWorker = assignedWorker;
        if (priority) updates.priority = priority;
        if (adminNotes !== undefined) updates.adminNotes = adminNotes;
        if (status) updates.status = status;
        if (photoBefore !== undefined) updates.photoBefore = photoBefore;
        if (photoAfter !== undefined) updates.photoAfter = photoAfter;

        let savedIssue;

        if (!mongooseReady()) {
            const index = demoIssues.findIndex((i) => i._id === req.params.id);
            if (index === -1) return res.status(404).json({ message: 'Issue not found.' });
            demoIssues[index] = { ...demoIssues[index], ...updates };
            saveLocalIssues(demoIssues);
            savedIssue = demoIssues[index];
        } else {
            const issue = await Issue.findByIdAndUpdate(req.params.id, updates, { new: true });
            if (!issue) return res.status(404).json({ message: 'Issue not found.' });
            savedIssue = issue;
        }

        let whatsappUrl = null;
        let workerPhone = null;

        if (assignedWorker && assignedWorker !== 'Unassigned') {
            const workerName = extractWorkerName(savedIssue.assignedWorker);
            workerPhone = WORKER_PHONES[workerName] || null;

            if (workerPhone) {
                whatsappUrl = getWhatsAppUrl(workerPhone, {
                    issueTitle: savedIssue.title,
                    location: savedIssue.location,
                    priority: savedIssue.priority,
                    adminNotes: savedIssue.adminNotes,
                });
            }

            if (mongooseReady()) {
                const dispatch = await WhatsAppDispatch.create({
                    issueId: savedIssue._id,
                    issueTitle: savedIssue.title,
                    location: savedIssue.location,
                    priority: savedIssue.priority,
                    assignedWorker: savedIssue.assignedWorker,
                    workerPhone: workerPhone || '',
                    status: 'pending',
                });

                notifyWorkerAssignment({
                    assignedWorker: savedIssue.assignedWorker,
                    issueTitle: savedIssue.title,
                    location: savedIssue.location,
                    priority: savedIssue.priority,
                    adminNotes: savedIssue.adminNotes,
                })
                    .then(async (result) => {
                        const status = result.success
                        ? 'accepted'
                            : result.reasonCode === 'not_configured'
                                ? 'link_generated'
                                : 'failed';
                        await WhatsAppDispatch.findByIdAndUpdate(dispatch._id, {
                            status,
                            providerMessageId: result.id || '',
                            failureReason: status === 'failed' ? result.reason || 'WhatsApp message could not be sent.' : '',
                        });
                    })
                    .catch((error) => {
                        console.error('[WhatsApp] Could not update dispatch history:', error);
                    });
            } else {
                notifyWorkerAssignment({
                    assignedWorker: savedIssue.assignedWorker,
                    issueTitle: savedIssue.title,
                    location: savedIssue.location,
                    priority: savedIssue.priority,
                    adminNotes: savedIssue.adminNotes,
                }).catch((error) => {
                    console.error('[WhatsApp] Unexpected notification error:', error);
                });
            }
        }

        const responseData = savedIssue && savedIssue.toObject ? savedIssue.toObject() : { ...savedIssue };
        if (whatsappUrl) responseData.whatsappUrl = whatsappUrl;
        if (workerPhone) responseData.workerPhone = workerPhone;

        return res.json(responseData);
    } catch (error) {
        next(error);
    }
});


// DELETE /api/issues/:id - remove issue
router.delete('/:id', async (req, res, next) => {
    try {
        if (!mongooseReady()) {
            const index = demoIssues.findIndex((i) => i._id === req.params.id);
            if (index === -1) return res.status(404).json({ message: 'Issue not found.' });
            demoIssues.splice(index, 1);
            saveLocalIssues(demoIssues);
            return res.json({ message: 'Issue deleted successfully.' });
        }
        const issue = await Issue.findByIdAndDelete(req.params.id);
        if (!issue) return res.status(404).json({ message: 'Issue not found.' });
        return res.json({ message: 'Issue deleted successfully.' });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
