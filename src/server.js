import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { MongoClient, ObjectId } from 'mongodb';
import connectDB from '../data/db'

dotenv.config()
const app = express();

// Middleware to parse JSON
app.use(express.json());

const URL = process.env.MONGO_URL
const PORT = process.env.PORT || 5000;


MongoClient.connect(URL)
.then(
    client=>{
        console.log("MongoDB connected.");
        app.listen(PORT, ()=> {
            console.log(`Listening on port: ${PORT}`)
        });

        const db = client.db('db_edushop');
        const lessons = db.collection('lessons');
        const orders = db.collection('orders');

        app.use(cors());
        app.use(express.json());

        // for creating multiple lessons
        app.post('/api/lessons', (req, res) => {
            lessons.insertMany(req.body)
            .then(result =>{
                res.status(201).json({
                    message: "successful",
                    result
                })
            })
            .catch(err =>{
                res.status(500).json({
                    err: err.message,
                    success: false
                })
            })
        });

        // PUT route to update any attribute of a lesson
        app.put('/api/lessons/:id', async (req, res) => {
            const { id } = req.params;
            const update = req.body; // Assumes a JSON object with the fields to update

            // Correctly create ObjectId with 'new'
            const objectId = new ObjectId(id);
        
            await lessons.updateOne({ _id: objectId }, { $set: update });
            res.json({ message: 'Lesson updated successfully' });
        });

        // for fetching all lessons
        app.get('/api/lessons', (req, res) => {
            lessons.find({})
            .toArray({})
            .then(results =>{
                res.status(201).json({
                    message: "successful",
                    results
                })
            })
            .catch(err =>{
                res.status(500).json({
                    err: err.message,
                    success: false
                })
            })
        });


        // POST route to create a new order
        app.post('/api/orders', async (req, res) => {
            const db = await connectDB();
            const { name, phone, lessonIDs, spaces } = req.body;
        
            if (!name || !phone || !lessonIDs || !spaces) {
            return res.status(400).json({ message: 'All fields are required.' });
            }
        
            const order = {
                name,
                phone,
                lessonIDs, // Array of lesson IDs
                spaces, // Number of spaces booked
                date: new Date(),
            };
        
            // Save order to the database
            await orders.insertOne(order);
            res.json({ message: 'Order created successfully', order });
        });

        // GET route to fetch all orders
        app.get('/orders', async (req, res) => {
            const orders = await db.collection('orders').find().toArray();
            res.json(orders);
        });
})
.catch(err =>{
    console.log(`error: ${err.message}`);
});
