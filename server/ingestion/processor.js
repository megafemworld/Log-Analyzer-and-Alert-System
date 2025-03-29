import { v4 as uuid4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import { createLogger } from '../utils/logger.js';
import * as cProcessor from './c_processor.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const logger = createLogger('log-processor');

const recentLogs = [];
const MAX_RECENT_LOGS = 1000;

// In-memory storage for alerts
const alerts = [];

// Temporary file storage path
const LOGS_DIR = path.join(__dirname, '../../data/logs');

// Ensure log directory exists
const ensureDirectories = async () => {
    try {
        await fs.mkdir(LOGS_DIR, { recursive: true});
        logger.info('Log directory created or already exist');
    } catch (error) {
        logger.error('Error creating logs directory:', error);
    }
};

ensureDirectories();

// Load the C library
// const logProcessor = ffi.Library(path.join(__dirname, '../../processor/build/liblogprocessor'), {
//     'init_log_processor': ['int', []],
//     'clean_up_processor': ['void', []],
//     'process_log_entry': ['int', ['pointer']],
//     'get_log_stats': ['int', ['pointer']],
//     // Add other functions as needed
// });

// Initiliaze the C log Processor
// logProcessor.init_log_processor();

/**
 * Process an incoming log entry
 * @param {Object} logData - The log data to process
 * @returns {Promise<Object>} - Result of processing
 */
export const processLog = async (logData) => {
    // Generate a unique ID for this log entry
    const logId = uuid4();

    // Add timestamp if not presnet
    if (!logData.timestamp) {
        logData.timestamp = new Date().toISOString();
    }

    // Add the ID to the log data
    logData.id = logId;

    // Store in memory for recent logs
    recentLogs.push(logData);
    if (recentLogs.length > MAX_RECENT_LOGS) {
        recentLogs.shift();
    }

    // Write to file system
    const logFileName = `${logId}.json`;
    const logFilePath = path.join(LOGS_DIR, logFileName);

    await fs.writeFile(logFilePath, JSON.stringify(logData, null, 2));

    try {
        // try to use the C module
        const result = cProcessor.processLogEntry(logData);

        if (result === 0) {
            logger.info(`Log processed by C module: ${logId}`);
        } else {
            logger.warn(`C module processing failed with code ${result} using fallback`);
        }
    } catch (error) {
        logger.error(`Error using C module: ${error.message}`);
    }

    // Simulate C procesing for now (as fallback)
    const processingResult = {
        proccessed: true,
        severity: getSeverity(logData),
        wordCount: logData.message ? logData.message.split(/\s+/).length: 0
    };

    // Send to python to analysis
    const analysisResult = await analyzeLogWithPython(logData);

    // Create an alert if the anomaly scroe if high enough
    if (analysisResult.anomalyScore > 0.7) {
        const alert = {
            id: uuid4(),
            logId,
            timestamp: new Date().toISOString(),
            message: `Anomaly detected in log ${logId}`,
            severity: analysisResult.anomalyScore > 0.9 ? 'High' : 'medium',
            anomalyScore: analysisResult.anomalyScore,
            acknowledge: false
        };

        alerts.push(alert);
        if (alerts.length > 100) {
            alerts.shift(); // keep only the most recent 100 alerts
        }
    }

    return {
        id: logId,
        processingResult,
        analysisResult
    };
};

/**
 * Query logs based on criteria
 * @param {Object} options - Query options
 * @return {Promise<Array>} - Query results
 */

export const queryLogs = async (options = {}) => {
    const { limit = 10, query, from, to } = options;

    // Filter logs based on criteria
    let filteredLogs = [...recentLogs];

    if (query) {
        const lowerQuery = query.toLowerCase();
        filteredLogs = filteredLogs.filter(log =>
            log.message && log.message.toLowerCase().includes(lowerQuery)
        );
    }

    if (from) {
        filteredLogs = filteredLogs.filter(log =>
            new Date(log.timestamp) >= new Date(from)
        );
    }

    if (to) {
        filteredLogs = filteredLogs.filter(log =>
            new Date(log.timestamp) >= new Date(from)
        );
    }

    // Sort by timestamp descending (newest first)
    filteredLogs.sort((a, b) =>
        new Date(b.timestamp) - new Date(a.timestamp)
    )

    // Return limit results
    return filteredLogs.slice(0, limit)

};

/**
 * Get log statistic
 * @returns {Promise<Object>} - Statistics object
 */

export const getLogStats = async () => {
    // Count severity levels
    const severityCounts = {
        error: 0,
        warning: 0,
        info: 0
    };

    recentLogs.forEach(log => {
        const severity = getSeveroty(log);
        if (severityCounts[severity] !== undefined) {
            severityCounts[severity]++;
        }
    });

    // Calculate average message length
    const avgMessagelength = recentLogs.length > 0
        ? recentLogs.reduce((sum, log) => sum + (log.message?.length || 0), 0) / recentLogs.length
        : 0;
    
    // Get unique sources
    const sources = new Set();
    recentLogs.forEach(log => {
        if (log.source) sources.add(log.source);
    });

    return {
        totalLogs: recentLogs.length,
        severityCounts,
        avgMessagelength,
        uniqueSources: sources.size
    };

};

ensureDirectories()

/**
 * Get alerts
 * @param {Object} options - Query options
 * @returns {Promise<Object} - Alerts
 */
export const getAlerts = async (options = {}) => {
    const { limit = 10, acknowledged = false } = options;

    let filteredAlerts = alerts;

    if (acknowledged !== undefined) {
        filteredAlerts = filteredAlerts.filter(alert =>
            alert.acknowledged === acknowledged
        );
    }

    // Sort by timestamp descending (newest first)
    filteredAlerts.sort((a, b) =>
        new Date(b.timestamp) - new Date(a.timestamp)
    );

    // Return limited results
    return filteredAlerts.slice(0, limit);
};

/**
 * Acknowledge an alert
 * @param {string} alertId - Alert ID
 * @returns {Promise<boolean>} - Success or failure
 */
export const acknowledgeAlert = async (alertId) => {
    const alert = alerts.find(a => a.id === alertId);

    if (alert) {
        alert.acknowledged = true;
        alert.acknowledgedAt = new Date().toISOString();
        return true;
    }

    return false;
};

/**
 * Simulate calling the C module for processing
 * @param {Object} logdata - Log data to process
 * @returns {Promise<object>} - Processing resuly
 */
const simulateProcessing = async (logData) => {
    // This will be replaced by actual C module integration
    return new Promise(resolve => {
        setTimeout(() => {
            resolve({
                processed: true,
                severity: getSeverity(logData),
                wordCount: logData.message.split(/\s+/).length
            });
        }, 10);
    });
};

/**
 * Determine log severity based on content
 * @param {Object} logData - log entry to analyze
 * @returns {string} - Severity level
 */
const getSeverity = (logData) => {
    if (!logData.message) return 'info';

    const message = logData.message.toLowerCase();

    if (message.includes('error') || message.includes('exception') ||
        message.includes('fail') || message.includes('crash')) {
            return 'error';
        } else if (message.includes('warn') || message.includes('timeout')) {
            return 'warning';
        } else if (message.includes('debug')) {
            return 'debug';
        } else {
            return 'info';
        }
};

/**
 * ANanlyze log with python analyzer
 * @param {Object} logData - Log data to analyze
 * @returns {Promise<Object} - Analysis result
 */

const analyzeLogWithPython = async (logData) => {
    return new Promise((resolve, reject) => {
        const pythonProcess = spawn('python3', [path.join(__dirname, '../../analyzer/main.py'), JSON.stringify(logData)]);

        let output = '';
        pythonProcess.stdout.on('data', (data) => {
            output += data.toString();
        });

        pythonProcess.strerr.on('data', (data) => {
            logger.error(`Python stderr: ${data}`);
        });

        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                return reject(new Error(`Python process exited with code ${code}`));
            }
            resolve(JSON.parse(output));
        })
    })
}