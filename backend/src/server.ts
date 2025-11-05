import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import analysisRoutes from './routes/analysisRoutes';
import settingsRoutes from './routes/settingsRoutes';
import { initAppConfig } from './services/appConfigService';

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
app.use('/api/settings', settingsRoutes);

// A simple test route
app.get('/', (req, res) => {
  res.send('AI Desktop Analysis Tool Backend is running!');
});

const startServer = async () => {
  try {
    await initAppConfig();
    app.listen(port, () => {
      console.log(`Backend server is listening on http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

void startServer();

export { app };
