import os
import sys
import json
import time
import logging
from datetime import datetime
import traceback
import requests
from models.log_analyzer import LogAnalyzer
from alerts.alert_manager import AlertManager

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger('log_analyzer')

# Configuration
NODE_SERVER_URL = os.environ.get('NODE_SERVER_URL', 'http://localhost:3000')
POLL_INTERVAL = int(os.environ.get('POLL_INTERVAL', '5'))  # seconds
API_KEY = os.environ.get('API_KEY', '')
USERNAME = os.environ.get('USERNAME', 'megafemworld')

class LogAnalyzerService:
    def __init__(self):
        self.log_analyzer = LogAnalyzer()
        self.alert_manager = AlertManager(node_server_url=NODE_SERVER_URL)
        self.last_processed_id = None
        self.headers = {
            'Content-Type': 'application/json',
            'User-Agent': f'LogAnalyzer/2.0 ({USERNAME})',
            'X-API-Key': API_KEY
        }
        
    def start(self):
        """Start the log analyzer service"""
        logger.info(f"Starting Log Analyzer service at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        logger.info(f"User: {USERNAME}")
        logger.info(f"Connecting to server: {NODE_SERVER_URL}")
        
        # Start alert manager
        self.alert_manager.start()
        
        try:
            self._run_processing_loop()
        except KeyboardInterrupt:
            logger.info("Received shutdown signal. Stopping Log Analyzer...")
        except Exception as e:
            logger.error(f"Fatal error: {str(e)}")
            logger.error(traceback.format_exc())
        finally:
            self._cleanup()
        
    def _run_processing_loop(self):
        """Main processing loop"""
        while True:
            try:
                self._process_batch()
            except requests.exceptions.RequestException as e:
                logger.error(f"Network error: {str(e)}")
                time.sleep(POLL_INTERVAL * 2)
            except json.JSONDecodeError as e:
                logger.error(f"Invalid JSON response: {str(e)}")
                time.sleep(POLL_INTERVAL)
            except Exception as e:
                logger.error(f"Unexpected error: {str(e)}")
                logger.error(traceback.format_exc())
                time.sleep(POLL_INTERVAL * 2)
                
    def _process_batch(self):
        """Process a batch of logs"""
        # Get logs to process
        response = self._fetch_logs()
        
        if response.status_code != 200:
            logger.warning(f"Failed to get logs: HTTP {response.status_code}")
            time.sleep(POLL_INTERVAL)
            return
        
        logs_data = response.json()
        logs = logs_data.get('logs', [])
        
        if not logs:
            logger.debug("No logs to process")
            time.sleep(POLL_INTERVAL)
            return
        
        logger.info(f"Processing {len(logs)} logs")
        
        processed_count = 0
        alert_count = 0
        
        # Process each log
        for log in logs:
            # Skip if we've already processed this log
            if self.last_processed_id == log.get('id'):
                continue
            
            # Process the log
            analysis_result = self.log_analyzer.process_log(log)
            processed_count += 1
            
            # Check if an alert should be generated
            if analysis_result.get('anomaly_detected', False):
                self.alert_manager.add_alert(log.get('id'), analysis_result)
                alert_count += 1
            
            # Update last processed ID
            self.last_processed_id = log.get('id')
        
        if processed_count > 0:
            logger.info(f"Processed {processed_count} logs, generated {alert_count} alerts")
                
        # Sleep between polling
        time.sleep(POLL_INTERVAL)
            
    def _fetch_logs(self):
        """Fetch logs from the server"""
        params = {'limit': 10}
        if self.last_processed_id:
            params['after_id'] = self.last_processed_id
        
        return requests.get(
            f"{NODE_SERVER_URL}/api/query/recent",
            params=params,
            headers=self.headers,
            timeout=10
        )
            
    def _cleanup(self):
        """Clean up resources"""
        logger.info("Shutting down alert manager...")
        self.alert_manager.stop()
        logger.info("Log Analyzer Service stopped")
        

def main():
    service = LogAnalyzerService()
    service.start()

if __name__ == "__main__":
    main()