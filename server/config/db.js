const mongoose = require('mongoose');

const connectDB = async () => {
    if (!process.env.MONGODB_URI) {
        console.warn('MONGODB_URI is not set. API will run without persistence.');
        return;
    }

    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB connected');
    } catch (error) {
        console.warn(`MongoDB connection failed. Running with demo data: ${error.message}`);
    }
};

module.exports = connectDB;
