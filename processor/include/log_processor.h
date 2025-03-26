#ifndef LOG_PROCESSOR_h
#define LOG_PROCESSOR_h

#include <stddef.h>

/**
* Represents a log entry structure
*/

typedef struct {
    char* id;
    char* timestamp;
    char* message;
    char* source;
    int level;
} LogEntry;

/**
* Represents proceesing statistics
 */

typedef struct {
    int error_count;
    int warning_count;
    int info_count;
    double avg_message_length;
    int unique_sources;
 } LogStats;

 /**
 * Initialize the log processor
 * @return 0 on success, non-zero on failure
  */

int init_log_processor(void);

/**
* Process a single entry
* @param entry Point to log entry
* @return 0 on success, non-zero on failure
*/

int process_log_entry(LogEntry* entry);

/**
 * Process multiple log entries in batch
 * @param entries Array of log entries
 * @param count Number of entries in the array
 * @return 0 on success, non-zero on failure
 */

int process_log_entries(LogEntry* entries, size_t count);

/**
 * Search for pattern in logs
 * @param pattern Search pattern
 * @param results Array to store matching log IDs
 * @param max_results Maximum number of results to return
 * @return Number of matches found
 */

int Search_logs(const char* pattern, char** results, size_t max_results);

/**
 * Get statistics about processed logs
 * @param stats Pointer to stats structure to fill
 * @return 0 on success, non-zero on failure
 */

int get_log_stats(LogStats* stats);

/**
 * Clean up resources used by the log processor
 */

void cleanup_log_processor(void);

#endif /* LOG_PROCESSOR_H */