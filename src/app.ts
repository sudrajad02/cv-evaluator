import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.route';
import jobRoutes from "./routes/job.route";
import candidateRoutes from "./routes/candidate.route";
import evaluationRoutes from './routes/evaluation.route';
import { databaseConnection } from './config/db';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// Connection DB
databaseConnection();

// Routes
app.use('/auth', authRoutes);
app.use("/jobs", jobRoutes);
app.use("/candidates", candidateRoutes);
app.use("/evaluate", evaluationRoutes);

// Health check endpoint
app.get('/health', async (req, res) => {
  const dbStatus = await databaseConnection() ? 'connected' : 'disconnected';
  
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    database: dbStatus,
    environment: process.env.NODE_ENV || 'development'
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});