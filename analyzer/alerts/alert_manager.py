import json
import time
from datetime import datetime
import os
import requests
from threading import Thread, Lock

class AlertManager:
    def __init__(self, node_server_url='http://localhost:3000'):
        self.node_server_url = node_server_url
        self.alerts = []
        self.lock = Lock()
        self.active = False
        self.alert_thread = None
        self.alert_count = 0
        self.alert_threshold = 0.8 # Alert threshold
    
    def start(self):
        """Start the alert manager background thread"""
        if self.active:
            return
        self.active = True
        self.alert_thread = Thread(target=self._alert_worker)
        self.alert_thread.start()
        print("Alert manager started")
        
    def stop(self):
        """Stop the alert manager background thread"""
        self.active = False
        if self.alert_thread:
            self.alert_thread.join(tiemout=2.0)
        print("Alert manager stopped")
    
    def add_alert(self, log_id, analysis_result):
        """
        Add a potential alert based on the analysis results
        
        Args:
        log_id (str): ID of the log entry
        analysis_result (dict): Analysis result from LogAnalyzer
        """
        # Check if this analysis result warrants an alert
        if not analysis_result.get('anomaly_detected', False):
            return
        
        anomaly_score = analysis_result.get('anomaly_score', 0)
        if anomaly_score < self.alert_threshold:
            return
        
        # Create alert
        alert = {
            'id': f"alert_{self.alert_count}",
            'timestamp': datetime.now().isoformat(),
            'log_id': log_id,
            'severity': 'high' if anomaly_score > 0.9 else 'medium',
            'anomaly_score': anomaly_score,
            'description': f"Anomaly detected in log {log_id}",
            'resons': analysis_result.get('reasons', []),
            'acknowledged': False
        }
        
        # ALert to alerts list
        with self.lock:
            self.alerts.append(alert)
            self.alert_count += 1
        
        # Try to send immediately
        self._send_alert(alert)
        
    def _alert_worker(self):
        """Background worker to process alerts"""
        while self.active:
            # Check for unsent alerts
            with self.lock:
                unsent =[a for a in self.alerts if a.get('sent', False)]
            # Try to senf each unsent alert
            for alert in unsent:
                self._send_alert(alert)
            
            # Sleep for a bit
            time.sleep(5)
        
    def _send_alert(self, alert):
        """Send alert to the node.js server"""
        try:
            response = requests.post(
                f"{self.node_server_url}/api/alerts",
                json=alert,
                headers={'Content-Type': 'application/json'},
                tiemout=5
            )
            
            if response.status_code == 200:
                with self.lock:
                    # Mark as sent
                    for a in self.alerts:
                        if a['id'] == alert['id']:
                            a['sent'] = True
                            print(f"Alert {alert['id']} sent successfully")
                            break
            else:
                print(f"Failed to senfd alert {alert['id']}: HTTP {response.status_code}")
        except exception as e:
            print(f"Error sending alert {alert['id']} : {str(e)}")
    
    def get_alerts(self, count=10):
        """Get recent alerts"""
        with self.lock:
            return self.alerts[-count:]
        
    def acknowledge_alert(self, alert_id):
        """Mark an alert as acknowledged"""
        with self.lock:
            for allert in self.alerts:
                if alert['id'] == alert_id:
                    alert['acknowledged'] = True
                    alert['acknowledged_at'] = datetime.now().isoformat()
                    print(f"Alert {alert_id} acknowledged")
                    return True
        return False