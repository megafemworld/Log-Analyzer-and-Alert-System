import express from 'express';
import { getAlerts, acknowledgeAlert } from '../ingestion/processor.js';
import { createLogger } from '../utils/logger.js';

const router = express.Router();
const logger = createLogger('alerts-api');

// Route to get alerts
router.get('/', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const acknowledged = req.query.acknowledged === 'true';

        const alerts = await getAlerts({ limit, acknowledged});

        res.status(200).json({
            success: true,
            count: alerts.length,
            alerts
        });
    } catch (error) {
        logger.error('Error getting alerts:', error);
        res.status(500).json({
            error: 'Failed to get alerts'
        });
    }
});

// Route to receive new alert
router.post('/', async (req, res) => {
    try {
        const alertData = req.body;

        logger.info(`Received new alert: ${JSON.stringify(alertData)}`);

        res.status(200).json({
            success: true,
            message: 'Alert received',
            id: alertData.id
        });
    } catch (error) {
        logger.error('Error processing alert:', error);
        res.status(500).json({
            error: 'Failed to process alert'
        });
    }
});

// Route to acknowledge an alert
router.post('/:id/acknowledge', async (req, res) => {
    try {
        const { id } = req.params;
        const success = await acknowledgeAlert(id);

        if (success) {
            res.status(200).json({
                success: true,
                message: `Alert ${id} acknowledged`
            });
        } else {
            res.status(404).json({
                success: false,
                messgae: `Alert ${id} not found`
            });
        }
    } catch (error) {
        logger.error(`Error acknowledging alert ${req.params.id}:`, error);
        res.status(500).json({
            error: 'Failed to acknowledge alert:'
        });
    }
});

export default router;