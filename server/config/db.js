const mongoose = require('mongoose');

const connectDB = async () => {
    if (!process.env.MONGODB_URI) {
        console.warn('MONGODB_URI is not set. API will use local JSON storage.');
        return;
    }

    try {
        const databaseName = process.env.MONGODB_DATABASE?.trim();
        await mongoose.connect(
            process.env.MONGODB_URI,
            databaseName ? { dbName: databaseName } : undefined
        );
        console.log(`MongoDB connected to database "${mongoose.connection.name}"`);
    } catch (error) {
        console.warn(`MongoDB connection failed. Falling back to local JSON storage: ${error.message}`);
    }
};

module.exports = connectDB;
