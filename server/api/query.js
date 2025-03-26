import express from 'express';
import { queryLogs, getLogStats } from '../ingestion/processor.js';
import { createLogger } from '../utils/logger.js';

const router = express.Router();
const logger = createLogger('query-api');

// Route to get recent logs
router.get('/recent', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const logs = await queryLogs({ limit });

        res.status(200).json({
            success: true,
            count: logs.length,
            logs
        })
    } catch (error) {
        logger.error('Error querying recent logs:', error);
        res.status(500).json({
            error: 'Failed to query logs'
        });
    }
});

router.get('/search', async (req, res) => {
    try {
        const { query, from, to, limit } = req.query;

        if (!query) {
            return res.status(400).json({
                eror: 'Search query is required'
            });
        }

        const options = {
            query,
            from: from ? new Date(from) : undefined,
            to: to ? new Date(to) : undefined,
            limit: parseInt(limit) || 10
        };

        const logs = await queryLogs(options);

        res.status(200).json({
            success: true,
            count: logs.length,
            logs
        });
    } catch(error) {
        logger.error('Error searching logs:', error);
        res.status(500).json({
            erorr: 'Failed to search logs'
        });
    }
});

router.get('/stats', async (req, res) => {
    try {
        const stats = await getLogStats();

        res.status(200).json({
            success: true,
            stats
        });
    } catch (error) {
        logger.error('Error getting log stats:', error);
        res.status(200).json({
            error: 'Failed to get log statstics'
        });
    }
});

export default router;