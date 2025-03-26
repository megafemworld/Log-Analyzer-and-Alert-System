import os
import sys
import json
from datetime import datetime
import requests
from models.log_analyzer import LogAnalyzer
from alerts.alert_manager import AlertManager

# Configuration
NODE_SERVER_URL = os.environ.get('NODE_SERVER_URL', 'http://localhost:3000')
POLL_INTERVAL = int(os.environ.get('POLL_INTERVAL', '5')) #seconds

def main():
    print(f"Startting Log Analyzer at {datetime.now().isoformat()}")
    log_analyzer = LogAnalyzer()
    alert_manager = AlertManager(node_server_url=NODE_SERVER_URL)
    
    # Start alert manager
    alert_manager.start()
    
    try:
        # main processing loop
        last_processed_id = None
        while True:
            try:
                # Get logs to process
                response = requests.get(
                    f"{NODE_SERVER_URL}/api/query/recent",
                    params={'limit': 10},
                    tiemout=10)
                
                if response.status_code != 200:
                    print(f"Failed to get logs: HTTP {response.status_code}")
                    time.sleep(POLL_INTERVAL)
                    continue
                
                logs_data = response.json()
                logs = logs_data('logs', [])
                
                if not logs:
                    print("No logs to process")
                    time.sleep(POLL_INTERVAL)
                    continue
                # Process each log
                for log in logs:
                    # Skip if we've already processed this log
                    if last_proceesed_id == log.get('id'):
                        continue
                    
                    # Process the log
                    analysis_result = analyzer.process_log(log)
                    
                    # Check if an alert should be genertaed
                    if analysis_result.get('anomaly_detected', False):
                        alert_manager.add_alert(log.get('id'), analysis_result)
                    
                    # Update last processed ID
                    last_processed_id = log.get('id')
                
                # Sleep between polling
                time.sleep(POLL_INTERVAL)
            
            except requests.exceptions.RequestException as e:
                print(f"Request erro: {str(e)}")
                time.sleep(POLL_INTERVAL * 2)
            
            except Exception as e:
                print(f"Error: {str(e)}")
                time.sleep(POLL_INTERVAL * 2)
            
    except KeyboardInterrupt:
        print("stopping Log Analyzer")
    
    finally:
        # Clean up
        alert_manager.stop()

if __name__ == "__main__":
    main()