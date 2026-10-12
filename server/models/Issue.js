const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true },
        description: { type: String, required: true, trim: true },
        category: { type: String, default: 'Facilities' },
        location: { type: String, required: true, trim: true },
        priority: { type: String, enum: ['Low', 'Medium', 'High', 'Urgent'], default: 'Medium' },
        status: { type: String, enum: ['Open', 'In progress', 'Resolved', 'Rejected'], default: 'Open' },
        reporter: { type: String, default: 'Anonymous', trim: true },
        reporterEmail: { type: String, default: '', trim: true },
        assignedWorker: { type: String, default: 'Unassigned', trim: true },
        adminNotes: { type: String, default: '', trim: true },
        votes: { type: Number, default: 0 },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Issue', issueSchema);
