const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true },
        description: { type: String, required: true, trim: true },
        category: { type: String, enum: ['Facilities', 'IT support', 'Academics', 'Safety', 'Transport'], default: 'Facilities' },
        location: { type: String, required: true, trim: true },
        priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
        status: { type: String, enum: ['Open', 'In progress', 'Resolved'], default: 'Open' },
        reporter: { type: String, default: 'Anonymous', trim: true },
        votes: { type: Number, default: 0 },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Issue', issueSchema);
