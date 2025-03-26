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

// Hash taqble for tracking unique sources
static char* source_hash[HASH_SIZE] = {NULL};
static int source_count = 0;

/**
* Simple has function for strings
 */

static unsigned int hash_string(const char* str) {
    unsigned int hash = 5381;
    int c;

    while ((c = *str++)) {
        hash = ((hash << 5) + hash) + c;
    }
}