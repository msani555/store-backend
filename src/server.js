// 

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { MongoClient, ObjectId } from 'mongodb';

dotenv.config();
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

const URL = process.env.MONGO_URL;
const PORT = process.env.PORT || 5000;

// Initialize MongoDB Connection
MongoClient.connect(URL)
  .then((client) => {
    console.log('MongoDB connected.');
    const db = client.db('db_edushop');
    const lessons = db.collection('lessons');
    const orders = db.collection('orders');

    // Start the server
    app.listen(PORT, () => {
      console.log(`Server running on port: ${PORT}`);
    });

    // Routes

    // 1. Create multiple lessons
    app.post('/api/lessons', async (req, res) => {
      try {
        const result = await lessons.insertMany(req.body);
        res.status(201).json({
          message: 'Lessons created successfully',
          result,
        });
      } catch (err) {
        res.status(500).json({
          error: err.message,
          success: false,
        });
      }
    });

    // 2. Update a lesson
    app.put('/api/lessons/:id', async (req, res) => {
      try {
        const { id } = req.params;
        const update = req.body;
        const result = await lessons.updateOne({ _id: new ObjectId(id) }, { $set: update });
        res.json({ message: 'Lesson updated successfully', result });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });

    // 3. Fetch all lessons
    app.get('/api/lessons', async (req, res) => {
      try {
        const results = await lessons.find({}).toArray();
        res.status(200).json({
          message: 'Lessons fetched successfully',
          results,
        });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });

    // 4. Create an order
    app.post('/api/orders', async (req, res) => {
      const { name, phone, lessonIDs, spaces } = req.body;
      try {
        // Validate input
        if (!name || !phone || !lessonIDs || !spaces) {
          return res.status(400).json({ error: 'All fields are required.' });
        }

        // Fetch lessons to validate spaces
        const selectedLessons = await lessons
          .find({ _id: { $in: lessonIDs.map((id) => new ObjectId(id)) } })
          .toArray();


        for (const lesson of selectedLessons) {
          if (lesson.spaces < spaces[lesson._id]) {
            return res.status(400).json({
              error: `Not enough spaces available for lesson: ${lesson.subject}`,
            });
          }
        }


        // Save order to the database
        const order = {
          name,
          phone,
          lessonIDs,
          spaces,
          createdAt: new Date(),
        };
        const orderResult = await orders.insertOne(order);


        // Reduce lesson spaces
        // for (const lesson of lessonIDs) {
        //   await lessons.updateOne(
        //     { _id: new ObjectId(lesson) },
        //     { $inc: { spaces: -spaces[lesson] } }
        //   );
        // }

        res.status(201).json({ message: 'Order created successfully', order: orderResult });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });

    // 5. Fetch all orders
    app.get('/api/orders', async (req, res) => {
      try {
        const results = await orders.find({}).toArray();
        res.json({ message: 'Orders fetched successfully', results });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });
  })
  .catch((err) => {
    console.error(`Error connecting to MongoDB: ${err.message}`);
  });
