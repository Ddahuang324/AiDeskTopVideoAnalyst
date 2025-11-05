import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import analysisRoutes from './routes/analysisRoutes';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/analysis', analysisRoutes);

// A simple test route
app.get('/', (req, res) => {
  res.send('AI Desktop Analysis Tool Backend is running!');
});

app.listen(port, () => {
  console.log(`Backend server is listening on http://localhost:${port}`);
});
