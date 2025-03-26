#include "../include/log_processor.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>
#include <time.h>

// Maximum number of logs to keep in memory
#define MAX_LOG 10000

// Hash table size for unique source tracking
#define HASH_SIZE 1024

// Internal storage for log entries
static LogEntry* log_entries = NULL;
static size_t log_count = 0;
static size_t log_capacity = 0;

// Statistics tracking
static LogStats current_stats = {0};

// Hash table for tracking unique sources
static char* source_hash[HASH_SIZE] = {NULL};
static int source_count = 0;

/**
* Simple has function for strings
 */

static unsigned int hash_string(const char* str) {
    unsigned int hash = 5381;
    int c;

    while ((c = *str++)) {
        hash = ((hash << 5) + hash) + c; /* hash * 33 * c */
    }

    return hash % HASH_SIZE;
}

/**
 * Add a source to the hash table if it does not already exist
 */

static void track_unique_source(const char* source) {
    if (!source) return;

    unsigned int hash = hash_string(source);
    unsigned  index = hash;

    //Linear probing to find the source or an empty slot
    while (source_hash[index] != NULL) {
        if (strcmp(source_hash[index], source) == 0) {
            return;
        }
        index = (index + 1) % HASH_SIZE;
        if (index == hash) {
            return;
        }
    }

    //add the source to the hash table
    source_hash[index] = strdup(source);
    source_count++;
}

int init_log_processor(void) {
    if (log_entries != NULL) {
        return 1; // Already initialized
    }

    // Allocate memory for log entries
    log_capacity = 1000;
    log_entries = (LogEntry*)malloc(log_capacity * sizeof(LogEntry));

    if (log_entries == NULL) {
        return 2; // Memory allocation failed
    }

    // Initialize the statistics
    memset(&current_stats, 0, sizeof(LogStats));

    // Initialize the hash table
    for (int i = 0; i < HASH_SIZE; i++) {
        source_hash[i] = NULL;
    }

    return 0; // Success
}

int process_log_entry(LogEntry* entry) {
    if (entry == NULL || log_entries == NULL) {
        return 1; // Invalid entry
    }

    if (log_count >= log_capacity) {
        // Double the capacity
        LogEntry* new_entries = (LogEntry*)realloc(log_entries, log_capacity * 2 * sizeof(LogEntry));

        if (new_entries == NULL) {
            return 2; // Memory allocation failed
        }

        log_entries = new_entries;
        log_capacity *= 2;
    }

    // Copy the log entry
    log_entries[log_count].id = strdup(entry->id);
    log_entries[log_count].timestamp = strdup(entry->timestamp);
    log_entries[log_count].message = strdup(entry->message);
    log_entries[log_count].source = entry->source ? strdup(entry->source) : NULL;
    log_entries[log_count].level = entry->level;

    // Update statistics
    switch (entry->level) {
        case 0:
            current_stats.error_count++;
            break;
        case 1:
            current_stats.warning_count++;
            break;
        case 2:
            current_stats.info_count++;
            break;
        default:
            break;
    }

    // Track unique sources
    if (entry->source) {
        track_unique_source(entry->source);
        current_stats.unique_sources = source_count;
    }

    // Update average message length
    size_t msg_len = strlen(entry->message);
    current_stats.avg_message_length = 
        (current_stats.avg_message_length * log_count + msg_len) / (log_count + 1);
    
    log_count++;

    if (log_count > MAX_LOG) {
        // Free the oldest log entry
        free(log_entries[0].id);
        free(log_entries[0].timestamp);
        free(log_entries[0].message);
        if (log_entries[0].source) {
            free(log_entries[0].source);
        }

        // Shift the entries
        memmove(&log_entries[0], &log_entries[1], (log_count - 1) * sizeof(LogEntry));
        log_count--;
    }

    return 0; // Success
}

int process_log_entries(LogEntry* entries, size_t count) {
    if (entries == NULL || log_entries == NULL) {
        return 1; // Invalid entries
    }

    int result = 0;
    for (size_t i = 0; i < count; i++) {
        int entry_result = process_log_entry(&entries[i]);
        if (entry_result != 0) {
            result = entry_result;
        }
    }

    return result;
}

 int search_log(const char* pattern, char** results, size_t max_results) {
    if (pattern == NULL || results == NULL || log_entries == NULL) {
        return 0;
    }

    size_t match_count = 0;

    for (size_t i = 0; i < log_count && match_count < max_results; i++) {
        if (strstr(log_entries[i].message, pattern) != NULL) {
            results[match_count] = strdup(log_entries[i].id);
            match_count++;
        }
    }

    return match_count;
}

int get_log_stats(LogStats* stats) {
    if (stats == NULL || log_entries == NULL) {
        return 1;
    }

    *stats = current_stats;
    return 0;
}

void clean_up_processor(void) {
    if (log_entries != NULL) {
        // Free all log entries
        for (size_t i = 0; i < log_count; i++) {
            free(log_entries[i].id);
            free(log_entries[i].timestamp);
            free(log_entries[i].message);
            if (log_entries[i].source) {
                free(log_entries[i].source);
            }
        }

        free(log_entries);
        log_entries = NULL;
        log_count = 0;
        log_capacity = 0;
    }

    // Free source hash table
    for (int i = 0; i < HASH_SIZE; i++) {
        if (source_hash[i] != NULL) {
            free(source_hash[i]);
            source_hash[i] = NULL;
        }
    }

    source_count = 0;
}