import {MongoClient} from 'mongodb';
import dotenv from 'dotenv';

dotenv.config()

const URL = process.env.MONGO_URL
const PORT = process.env.PORT || 5000;
const DATABASE_NAME = process.env.DATABASE_NAME

let db;

async function connectDB() {
    if (db) return db; // Reuse the existing connection
    try {
        const client = new MongoClient(URL);
        await client.connect();
        db = client.db(DATABASE_NAME); // Use the database name from .env
        console.log('Connected to MongoDB');
        return db;
    } catch (error) {
        console.error('Could not connect to MongoDB:', error);
        throw error;
    }
}

module.exports = connectDB;

