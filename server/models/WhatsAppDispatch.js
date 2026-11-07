const mongoose = require('mongoose');

const whatsappDispatchSchema = new mongoose.Schema(
    {
        issueId: { type: mongoose.Schema.Types.Mixed, required: true },
        issueTitle: { type: String, required: true },
        location: { type: String, required: true },
        priority: { type: String, required: true },
        assignedWorker: { type: String, required: true },
        workerPhone: { type: String, default: '' },
        status: {
            type: String,
            enum: ['pending', 'accepted', 'failed', 'link_generated'],
            default: 'pending',
        },
        providerMessageId: { type: String, default: '' },
        failureReason: { type: String, default: '' },
    },
    { timestamps: true }
);

whatsappDispatchSchema.index({ issueId: 1, createdAt: -1 });

module.exports = mongoose.model('WhatsAppDispatch', whatsappDispatchSchema);
