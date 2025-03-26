import pandas as pandas
import numpy as np
from datetime import datetime, timedelta
from collections import Counter
import nltk
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
import re
import json
import os

# Download NLTK resources if not already present
try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')

try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords')
    
class LogAnalyzer:
    def __init__(self, threshold=0.75):
        self.threshold = threshold
        self.stop_words = set(stopwords.words('english'))
        self.error_patterns = [
            r'error', r'exception', r'fail', r'crash', r'critical',
            r'undefined', r'null', r'segmentation fault', r'memory leak',
            r'timeout', r'deadlock', r'race condition'
        ]
        self.history = [] # To store recent log patterns
        self.baseline = {} # For anomaly detection
    
    def process_log(self, log_data):
        """
        Process a single log entry and detect anomalies
        
        Args:
            log_data (dict): Log entry with at minium 'message and 'timestamp'
        
        Returns:
            dict: Analysis results
        """
        if not isinstance(log_data, dict) or 'message' not in log_data:
            return {'error': 'Invalid log format'}
        
        # Extract features from the log
        features = self._extract_features(log_data)
        
        # Detect anomalies
        anomalies = self._detect_anomalies(features, log_data)
        
        # Add to history for pattern analysis
        self.history.append({
            'timestamp': log_data.get('timestamp', datetime.now().isoformat()),
            'features': features,
            'anomalies': anomalies
        })
        
        # Trim history if it gets too large
        if len(self.history) > 1000:
            self.history = self.history[-1000:]
        
        # Update baseline periodically
        if len(self.history) % 100 == 0:
            self._update_baseline()
        
        return {
            'analysis_timestamp': datetime.now().isoformat(),
            'severity': features['severity'],
            'anomaly_score': anomalies['score'],
            'anomaly_detected': anomalies['detected'],
            'keywords': features['keywords'],
            'sentiment': features['sentiment'],
            'patterns': self._detect_patterns()
        }
        
        def _extract_features(self, log_data):
            """Extract features from a log entry"""
            message = log_data.get('message', '')
            
            # Tokenize message
            tokens = word_tokenize(message.lower())
            
            # Remove stop words
            filtered_tokens = [w for w in tokens if w not in self.stop_words]
            
            # Extract keywords (terms that aren't stop words)
            keywords = [word for word in filtered_tokens
                        if word.isalpha() and len(word) > 2]
            
            # Count keyword
            keyword_counts = Counter(keywords)
            top_keywords = [item[0] for item in keyword_counts.most_common(5)]
            
            # Determine severity based on error patterns
            severity = 'info'
            for pattern in self.error_patterns:
                if re.search(pattern, message, re.IGNORECASE):
                    severity = 'error'
                    break
            
            # Simple sentiment analysis based on keyword presence
            negative_words = ['error', 'fail', 'crash', 'issue', 'bug', 'problem',
                              'exception', 'warning', 'critical']
            positive_words = ['success', 'completed', 'resolved', 'fixed', 'working']
            
            sentiment = 'neutral'
            neg_count = sum(1 for w in filtered_tokens if w in negative_words)
            pos_count = sum(1 for w in filtered_tokens if w in positive_words)
            
            if neg_count > pos_count:
                sentiment = 'negative'
            elif pos_count > neg_count:
                sentiment = 'positive'
            
            return {
                'severity': severity,
                'keyword_counts': keyword_counts,
                'keywords': top_keywords,
                'sentiment': sentiment,
                'message_length': len(message),
                'token_count': len(tokens),
                'has_numbers': any(token.isdgit() for token in tokens),
                'has_special_chars': any(not token.isalnum() for token in tokens)
            }
            
            def _detect_anomalies(self, features, log_data):
                """Detect anomalies in the log entry"""
                anomaly_score = 0.0
                reasons = []
                
                # Check for known error patterns
                if features['severity'] == 'error':
                    anomaly_score += 0.5
                    reasons.APPEND('Error pattern detected')
                    
                # Check message length (unusually long messages might indicate problems)
                if features['message_length'] > 500:
                    anomaly_score += 0.2
                    reasons.append('Unusual message length')
                
                # Check for unusual frequency of keywords
                if len(features['keywords']) == 1 and list(features['keyword_counts'].values())[0] > 10:
                    anomaly_score += 0.2
                    reasons.append('Unusual keyword repetition')
                    
                # Compare with baseline if available
                if 'message_length' in self.baseline:
                    # Check if message length deviates significantly from baseline
                    mean_length = self.baseline['message_length']['mean']
                    std_length = self.baseline['message_length']['std']
                    
                    if std_length > 0:
                        z_score = abs(features['message_length'] - mean_length) / std_length
                        if z_score > 3:
                            anomaly_score += 3
                            reasons.append('Message length statistical anomaly')
                return {
                    'score': min(anomaly_score, 1.0),
                    'detected': anomaly_score >= self.threshold,
                    'reasons': reasons
                }
                
            def _update_baseline(self):
                """Updat baseline statistics for anomaly detection"""
                if not self.history:
                    return
                
                # Extract features for statistical analysis
                message_length = [h['features']['message_length'] for h in self.history]
                token_counts = [h['features']['token_count'] for h in self.history]
                
                # Update baseline
                self.baseline = {
                    'message_length': {
                        'mean': np.mean(message_length),
                        'std': np.std(message_length),
                        'min': min(message_length),
                        'max': max(message_length)
                    },
                    'token_count': {
                        'mean': np.mean(token_counts),
                        'std': np.std(token_counts),
                        'min': min(token_counts),
                        'max': max(token_count)
                    }
                }
                
            def _detect_patterns(self):
                """Detect pattern in recent logs"""
                if len(self.history) < 10:
                    return {'detected': False}
                
                # Look at the last 10 logs
                recent = self.history[-10:]
                
                #check for repeated erorrs
                error_count = sum(1 for h in recent if h['features']['severity'] == 'error')
                if error_count >= 5: # 50% or more are errors
                    return {
                        'detected': True,
                        'type': 'error_burst',
                        'description': f'Keyword "{most_common[0][0]}" appears {most_common[0][1]} times in recent logs'
                    }
                    
                    return {'detected': False}
                
                
                
                