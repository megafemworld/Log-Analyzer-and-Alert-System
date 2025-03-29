import ffi from 'ffi-napi';
import ref from 'ref-napi';
import StructDi from 'ref-struct-di';
import path from 'path';
import { fileURLToPath } from 'url';
import { createLogger } from '../utils/logger.js';


// Initialize StructType
const StructType = StructDi(ref);

// For ES modules for get __dirname
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logger = createLogger('c-processor');

// Define the C structure
const LogEntryType = StructType({
    id: ref.types.CString,
    timestamp: ref.types.CString,
    message: ref.types.CString,
    source: ref.types.CString,
    level: ref.types.int
});

const LogStatsType = StructType({
    error_count: ref.types.int,
    warning_count: ref.types.int,
    info_count: ref.types.int,
    avg_message_length: ref.types.double,
    unique_sources: ref.types.int
});

// create pointer types
const LogEntryPtr = ref.refType(LogEntryType);
const LogStatsPtr = ref.refType(LogStatsType);

// try to load the library with better error handling

let libLogprocessor;
try {
    const libPath = path.join(__dirname, '../../processor/build/liblogprocessor');
    logger.info(`Loading C library from ${libPath}`);

    // Define the FFI interface
    libLogprocessor = ffi.Library(libPath, {
        'init_log_processor': ['int', []],
        'clean_up_processor': ['void', []],
        'process_log_entry': ['int', ['pointer']],
        'get_log_stats': ['int', ['pointer']],
    });
    

    // Initialize the prcessor
    logger.info('Initializing C log processor');
    const initResult = libLogprocessor.init_log_processor();
    logger.info(`Initialization result: ${initResult}`);

    if (initResult !== 0) {
        throw new Error('Failed to initialize log processor');
    }
} catch (error) {
    logger.error(`Failed to load C libraray: ${error.message}`);
    libLogprocessor = null;
}

// Export functions with better error handling
export const processLogEntry = (logEntry) => {
    if (!libLogprocessor) {
        logger.error('C library not loaded, cannot process log entry');
        return -1;
    }
    try {
        const entry = new LogEntryType();
        entry.id = logEntry.id || '';
        entry.timestamp = logEntry.timestamp || '';
        entry.message = logEntry.message || '';
        entry.source = logEntry.source || '';
        entry.level = getLogLevel(logEntry);

        return libLogprocessor.process_log_entry(entry.ref());
    } catch (error) {
        logger.error(`Error in processLogEntry: ${error.message}`);
        return -1;
    }
};

export const getLogStats = () => {
    try {
        const stats = new LogStatsType();
        const result = libLogprocessor.get_log_stats(stats.ref());

        if (result === 0) {
            return {
                errorCount: stats.error_count,
                warningCount: stats.warning_count,
                infoCount: stats.info_count,
                avgMessageLength: stats.avg_message_length,
                uniqueSources: stats.unique_sources
            };
        } else {
            return null;
        }
    } catch (error) {
        logger.error(`Error in getLogStats: ${error.message}`);
        return null;
    }
};

export const cleanup = () => {
    try {
        libLogprocessor.clean_up_processor();
    } catch (error) {
        logger.error(`Error in cleanup: ${error.message}`);
    }
};

// Register cleanup handler
process.on('exit', cleanup);


// Helper function to determine log level

function getLogLevel(logEntry) {
if (!logEntry.message) return 2;

const message = logEntry.message.toLowerCase();

if (message.includes('error') || message.includes('exception') ||
    message.includes('fail') || message.includes('crash')) {
        return 0;
    } else if (message.includes('warn') || message.includes('timeout')) {
        return -1;
    } else {
        return 2;
    }
}