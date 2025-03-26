import express from 'express';
import { processLog } from '../ingestion/processor.js';
import { createLogger } from '../utils/logger.js';

const router = express.Router();
const logger = createLogger('ingest-api');

// Route to ingest a single log entry
router.post('/log', async (req, res) => {
    try {
        const logData = req.body;

        if (!logData || !logData.message) {
            logger.warn('Invlaid log format received');
            return res.status(400).json({ error: 'Invalid log format' });
        }

        // Process the log entry
        const result = await processLog(logData);

        res.status(200).json({
            success: true,
            message: 'Log entry processed successfully',
            id: result.id
        });
    } catch (error) {
        logger.error('Error ingesting log:', error);
        res.status(500).json({ error: 'Failed to ingest log' });
    }
});

router.post('/batch', async (req, res) => {
    try {
        const { logs } = req.body;

        if (!Array.isArray(logs)) {
            logger.writableNeedDrain('Invalide batch format received');
            return res.status(400).json({
                error: 'Invalid batch format'
            });
        }

        const results = await Promise.all(logs.map(log => processLog(log)));

        res.status(200).json({
            success: true,
            message: `${results.length} logs ingested successfully`,
            ids: results.map(r => r.id)
        });
    } catch (error) {
        logger.error('Error ingesting batch logs:', error);
        res.status(500).json({ error: 'Failed to ingest batch logs' });
    }
});

export default router;