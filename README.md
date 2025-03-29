# Log Analyzer and Alert System

The Log Analyzer and Alert System is a comprehensive tool designed to ingest, process, analyze, and alert on log data. It leverages a combination of Node.js, a C module for performance-critical log processing, and a Python module for advanced analysis.

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Setup Instructions](#setup-instructions)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

## Features

- **Log Ingestion**: Accepts logs via a REST API.
- **Log Processing**: Processes logs using a high-performance C module.
- **Advanced Analysis**: Analyzes logs using a Python module for anomaly detection and more.
- **Alerts**: Generates alerts based on log analysis and provides an API to query these alerts.
- **Dashboard**: A web interface to visualize logs and alerts.

## Architecture

The system is composed of the following components:

1. **Node.js Server**: Handles API requests for log ingestion, querying, and alert management.
2. **C Module**: Processes logs for performance and severity analysis.
3. **Python Analyzer**: Performs advanced analysis using machine learning and anomaly detection.
4. **Dashboard**: Displays logs and alerts via a web interface.

## Prerequisites

- Node.js (v14.x or later)
- Python (v3.6 or later)
- GCC (for compiling the C module)
- Make (for building the C module)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/megafemworld/Log-Analyzer-and-Alert-System.git
cd Log-Analyzer-and-Alert-System
```

### 2. Install Node.js Dependencies

```bash
cd server
npm install
```

### 3. Build the C Module

```bash
cd ../processor
make clean
make
```

### 4. Set Up Environment Variables

Create a `.env` file in the root directory and set the following variables:

```env
NODE_SERVER_URL=http://localhost:3000
POLL_INTERVAL=5
API_KEY=your_api_key_here
USERNAME=megafemworld
PORT=3000
```

### 5. Run the Server

```bash
cd ../server
node index.js
```

### 6. Run the Python Analyzer

```bash
cd ../analyzer
python main.py
```

## Usage

### Ingesting Logs

You can ingest logs by sending a POST request to the `/api/ingest/log` endpoint:

```bash
curl -X POST http://localhost:3000/api/ingest/log \
  -H "Content-Type: application/json" \
  -d '{"message": "Test log message", "source": "test"}'
```

### Querying Logs

You can query logs by sending a GET request to the `/api/query/recent` endpoint:

```bash
curl http://localhost:3000/api/query/recent
```

### Viewing the Dashboard

Open a web browser and navigate to `http://localhost:3000` to view the dashboard.

## Project Structure

```plaintext
Log-Analyzer-and-Alert-System/
├── analyzer/               # Python analyzer
│   ├── main.py             # Main script for log analysis
│   ├── models/             # Models for analysis
│   │   └── log_analyzer.py # LogAnalyzer class
│   └── alerts/             # Alerts management
│       └── alert_manager.py# AlertManager class
├── processor/              # C module for log processing
│   ├── build/              # Compiled C library
│   ├── src/                # Source code for C module
│   └── Makefile            # Makefile for building the C module
├── server/                 # Node.js server
│   ├── api/                # API routes
│   │   ├── ingest.js       # Ingest API
│   │   └── query.js        # Query API
│   ├── ingestion/          # Log ingestion and processing
│   │   ├── processor.js    # Main processor
│   │   └── c_processor.js  # C module interface
│   ├── public/             # Static files for dashboard
│   ├── utils/              # Utility functions
│   │   └── logger.js       # Logger setup
│   └── index.js            # Entry point for the server
└── tools/                  # Tools for testing
    └── log-generator.js    # Script to generate test logs
```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any changes.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.