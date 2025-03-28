import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

// Configuration
const SERVER_URL = 'http://localhost:3000';
const LOG_TYPES = ['info', 'warning', 'error'];
const LOG_SOURCES = ['web-server', 'database', 'auth-service', 'payment-gateway', 'user-service'];
const ERROR_MESSAGES = [
  'Connection timeout',
  'Database query failed',
  'Authentication failed',
  'Invalid input received',
  'Memory allocation error',
  'Segmentation fault detected',
  'Deadlock detected in transaction',
  'File not found',
  'Permission denied',
  'Service unavailable'
];
const INFO_MESSAGES = [
  'User login successful',
  'Transaction completed',
  'Data backup completed',
  'Service started successfully',
  'Configuration loaded',
  'Cache refreshed',
  'Task scheduled',
  'Message sent successfully',
  'File uploaded successfully',
  'API request completed'
];

/**
 * Generate a random log entry
 */
function generateLog() {
  // Randomly decide log severity
  const logType = LOG_TYPES[Math.floor(Math.random() * LOG_TYPES.length)];
  const source = LOG_SOURCES[Math.floor(Math.random() * LOG_SOURCES.length)];
  
  // Generate appropriate message based on type
  let message;
  if (logType === 'error') {
    message = ERROR_MESSAGES[Math.floor(Math.random() * ERROR_MESSAGES.length)];
  } else {
    message = INFO_MESSAGES[Math.floor(Math.random() * INFO_MESSAGES.length)];
  }
  
  // Add some randomization to messages
  const randomId = Math.floor(Math.random() * 1000);
  message = `${message} (ID: ${randomId})`;
  
  return {
    timestamp: new Date().toISOString(),
    source,
    type: logType,
    message,
    user: `user-${Math.floor(Math.random() * 100)}`,
    requestId: uuidv4()
  };
}

/**
 * Generate anomalous log entries
 */
function generateAnomalousLog() {
  const log = generateLog();
  log.type = 'error';
  
  // Create an unusual message - very long with repetition
  const baseError = ERROR_MESSAGES[Math.floor(Math.random() * ERROR_MESSAGES.length)];
  let repeatedError = '';
  for (let i = 0; i < 30; i++) {
    repeatedError += `${baseError} `;
  }
  log.message = repeatedError;
  
  return log;
}

/**
 * Send log to server
 */
async function sendLog(log) {
  try {
    const response = await axios.post(`${SERVER_URL}/api/ingest/log`, log);
    console.log(`Log sent successfully: ${log.type} - ${log.message.substring(0, 30)}...`);
    return response.data;
  } catch (error) {
    console.error('Error sending log:', error.message);
    return null;
  }
}

/**
 * Main function to generate and send logs
 */
async function main() {
  console.log('Starting log generator...');
  
  // Generate normal logs
  for (let i = 0; i < 20; i++) {
    const log = generateLog();
    await sendLog(log);
    // Wait a bit between logs
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  // Generate an anomalous log
  console.log('\nSending anomalous log...');
  const anomalousLog = generateAnomalousLog();
  await sendLog(anomalousLog);
  
  // Generate a burst of error logs
  console.log('\nSending error burst...');
  for (let i = 0; i < 5; i++) {
    const errorLog = generateLog();
    errorLog.type = 'error';
    errorLog.message = ERROR_MESSAGES[0]; // Same error repeatedly
    await sendLog(errorLog);
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\nLog generation completed!');
}

main().catch(console.error);