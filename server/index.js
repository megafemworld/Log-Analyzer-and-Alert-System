import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createLogger } from './utils/logger.js';
import ingestRoutes from './api/ingest.js';
import queryRoutes from './api/query.js';
import alertRoutes from './api/alert.js';

// ES Modules in Node.js does not have __dirname
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Create a logger
const logger = createLogger('server');

//initialize express app
const app = express();
app.use(cors());
app.use(express.json( { limit: '50mb' } ));
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Basic health check
app.get('/api/health', (req, res) => {
  res.status(200).json({status: 'OK', timestamp: new Date().toISOString()});
});

// use router handlers
app.use('/api/ingest', ingestRoutes);
app.use('/api/query', queryRoutes);
app.use('/api/alerts', alertRoutes);

// Serve the dashboard
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// error handling middleware
app.use((err, req, res, next) => {
    logger.error(`error: ${err.message}`);
    res.status(500).json({error: 'Internal Server error', message: err.message });
});

// start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
  console.log(`Server is running on port ${PORT}`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received: closing HTTP server');
    process.exit(0);
});