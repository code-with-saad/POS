import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { connectDB } from './config/db.js';
import healthRoutes from './routes/healthRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 5000;
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

app.use(helmet());
app.use(
  cors({
    origin: clientOrigin,
    credentials: true,
  })
);
app.use(express.json());

app.use('/api/health', healthRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Not found' });
});

app.use(errorHandler);

async function start() {
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });

  try {
    await connectDB();
  } catch (err) {
    console.error(
      'MongoDB connection failed:',
      err.message,
      '\nStart MongoDB (e.g. docker compose up -d) and restart the server.'
    );
  }
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
