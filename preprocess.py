"""
AEGIS Data Preprocessing Script
Loads node_registry, system_logs, and schema_config CSVs.
Decodes Base64 serial numbers, applies schema rotation logic,
classifies threats, and outputs aegis_unified.json.
"""

import csv
import base64
import json
import re
import os
from collections import defaultdict

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

def load_csv(filename):
    filepath = os.path.join(SCRIPT_DIR, filename)
    with open(filepath, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        return list(reader)

def decode_base64_serial(user_agent):
    """Extract and decode the Base64 hardware ID from the user agent string."""
    match = re.search(r'AEGIS-Node/[\d.]+ \(Linux\) (.+)', user_agent)
    if match:
        encoded = match.group(1).strip()
        try:
            decoded = base64.b64decode(encoded).decode('utf-8')
            return encoded, decoded
        except Exception:
            return encoded, 'DECODE_ERROR'
    return '', 'UNKNOWN'

def get_schema_version(log_id, schema_configs):
    """Determine which schema version applies based on log_id as time proxy."""
    log_id = int(log_id)
    active_version = schema_configs[0]
    for cfg in schema_configs:
        if log_id >= int(cfg['time_start']):
            active_version = cfg
    return active_version

def classify_log(http_code, response_time, node_infected, serial_valid, schema_parse_ok):
    """Classify a log entry as CLEAN, SUSPICIOUS, or COMPROMISED."""
    http_code = int(http_code)
    response_time = int(response_time)

    threat_signals = 0
    if http_code != 200:
        threat_signals += 1
    if response_time > 2000:
        threat_signals += 1
    if node_infected:
        threat_signals += 1
    if not serial_valid:
        threat_signals += 1
    if not schema_parse_ok:
        threat_signals += 1

    if threat_signals >= 2:
        return 'COMPROMISED'
    elif threat_signals == 1:
        return 'SUSPICIOUS'
    return 'CLEAN'

def compute_suspect_score(node_data):
    """
    Compute a 0-100 suspect score per node:
    - HTTP vs JSON mismatch: 30pts
    - Response time outlier: 25pts
    - Unknown/unregistered serial: 25pts
    - Schema parse failures: 20pts
    """
    score = 0.0

    # HTTP vs JSON mismatch weight: 30pts
    if node_data['mismatch_count'] > 0:
        mismatch_ratio = node_data['mismatch_count'] / max(node_data['total_logs'], 1)
        score += 30 * min(mismatch_ratio * 5, 1.0)  # scale up since mismatches are frequent

    # Response time outlier weight: 25pts
    if node_data['avg_response_time'] > 200:
        score += 25 * min((node_data['avg_response_time'] - 100) / 150, 1.0)

    # Unknown/unregistered serial: 25pts
    if not node_data['serial_valid']:
        score += 25

    # Schema parse failures: 20pts
    if node_data['schema_failures'] > 0:
        failure_ratio = node_data['schema_failures'] / max(node_data['total_logs'], 1)
        score += 20 * min(failure_ratio * 5, 1.0)

    return round(min(score, 100), 1)

def main():
    print("[AEGIS] Loading datasets...")
    nodes_raw = load_csv('datasets/node_registry.csv')
    logs_raw = load_csv('datasets/system_logs.csv')
    schema_raw = load_csv('datasets/schema_config.csv')

    print(f"  Nodes: {len(nodes_raw)}")
    print(f"  Logs:  {len(logs_raw)}")
    print(f"  Schema versions: {len(schema_raw)}")

    # Build node registry with decoded serials
    node_registry = {}
    valid_serials = set()
    for node in nodes_raw:
        node_id = int(node['node_uuid'])
        encoded, decoded = decode_base64_serial(node['user_agent'])
        is_infected = node['is_infected'].strip() == 'True'
        node_registry[node_id] = {
            'node_id': node_id,
            'user_agent': node['user_agent'],
            'masked_id': encoded,
            'decoded_serial': decoded,
            'is_infected': is_infected,
            'serial_valid': decoded.startswith('SN-') and not decoded == 'DECODE_ERROR',
        }
        if decoded.startswith('SN-'):
            valid_serials.add(decoded)

    # Sort schema configs by time_start
    schema_configs = sorted(schema_raw, key=lambda x: int(x['time_start']))

    # Process logs
    processed_logs = []
    node_stats = defaultdict(lambda: {
        'total_logs': 0,
        'mismatch_count': 0,
        'total_response_time': 0,
        'avg_response_time': 0,
        'max_response_time': 0,
        'schema_failures': 0,
        'serial_valid': True,
        'compromised_count': 0,
        'response_times': [],
    })

    for log in logs_raw:
        log_id = int(log['log_id'])
        node_id = int(log['node_id'])
        json_status = log['json_status']
        http_code = int(log['http_response_code'])
        response_time = int(log['response_time_ms'])

        # Resolve schema version
        schema = get_schema_version(log_id, schema_configs)
        active_column = schema['active_column']
        schema_version = int(schema['version'])

        # Get the correct load value based on schema
        load_value = log.get(active_column, '').strip()
        schema_parse_ok = len(load_value) > 0

        try:
            load_value = float(load_value) if load_value else None
        except ValueError:
            load_value = None
            schema_parse_ok = False

        # Check node registry
        node_info = node_registry.get(node_id, {})
        is_infected = node_info.get('is_infected', False)
        serial_valid = node_info.get('serial_valid', False)

        # HTTP vs JSON mismatch detection
        is_mismatch = (json_status == 'OPERATIONAL' and http_code != 200)

        # Classify
        classification = classify_log(http_code, response_time, is_infected, serial_valid, schema_parse_ok)

        processed_log = {
            'log_id': log_id,
            'node_id': node_id,
            'json_status': json_status,
            'http_code': http_code,
            'response_time_ms': response_time,
            'load_value': load_value,
            'schema_version': schema_version,
            'active_column': active_column,
            'schema_parse_ok': schema_parse_ok,
            'is_mismatch': is_mismatch,
            'classification': classification,
        }
        processed_logs.append(processed_log)

        # Aggregate node stats
        stats = node_stats[node_id]
        stats['total_logs'] += 1
        if is_mismatch:
            stats['mismatch_count'] += 1
        stats['total_response_time'] += response_time
        stats['max_response_time'] = max(stats['max_response_time'], response_time)
        stats['response_times'].append(response_time)
        if not schema_parse_ok:
            stats['schema_failures'] += 1
        if classification == 'COMPROMISED':
            stats['compromised_count'] += 1
        stats['serial_valid'] = serial_valid

    # Compute averages and suspect scores
    nodes_output = []
    for node_id in sorted(node_registry.keys()):
        info = node_registry[node_id]
        stats = node_stats[node_id]
        stats['avg_response_time'] = stats['total_response_time'] / max(stats['total_logs'], 1)

        suspect_score = compute_suspect_score(stats)

        # Determine alert types
        alerts = []
        if stats['mismatch_count'] > 0:
            alerts.append('HIJACK DETECTED')
        if info['is_infected']:
            alerts.append('COMPROMISED NODE')
        if not info['serial_valid']:
            alerts.append('UNKNOWN NODE')
        if stats['schema_failures'] > 0:
            alerts.append('SCHEMA BREACH')

        # Determine true status color
        http_codes_seen = set()
        for l in processed_logs:
            if l['node_id'] == node_id:
                http_codes_seen.add(l['http_code'])

        has_5xx = any(c >= 500 for c in http_codes_seen)
        has_non_2xx = any(c < 200 or c >= 300 for c in http_codes_seen)

        if has_5xx or info['is_infected']:
            true_status = 'RED'
        elif has_non_2xx:
            true_status = 'YELLOW'
        else:
            true_status = 'GREEN'

        # Generate pseudo-location for city map (deterministic grid)
        grid_cols = 25
        row = node_id // grid_cols
        col = node_id % grid_cols
        lat = 40.7 + (row * 0.008) + ((node_id * 7 % 100) / 10000)
        lng = -74.0 + (col * 0.008) + ((node_id * 13 % 100) / 10000)

        nodes_output.append({
            'node_id': node_id,
            'masked_id': info['masked_id'],
            'decoded_serial': info['decoded_serial'],
            'is_infected': info['is_infected'],
            'serial_valid': info['serial_valid'],
            'true_status': true_status,
            'total_logs': stats['total_logs'],
            'mismatch_count': stats['mismatch_count'],
            'avg_response_time': round(stats['avg_response_time'], 1),
            'max_response_time': stats['max_response_time'],
            'schema_failures': stats['schema_failures'],
            'compromised_count': stats['compromised_count'],
            'suspect_score': suspect_score,
            'alerts': alerts,
            'lat': round(lat, 6),
            'lng': round(lng, 6),
        })

    # Build schema timeline for console
    schema_timeline = []
    for cfg in schema_configs:
        schema_timeline.append({
            'version': int(cfg['version']),
            'time_start': int(cfg['time_start']),
            'active_column': cfg['active_column'],
        })

    # Compute summary stats
    total_threats = sum(1 for n in nodes_output if n['true_status'] == 'RED')
    total_suspicious = sum(1 for n in nodes_output if n['true_status'] == 'YELLOW')
    total_clean = sum(1 for n in nodes_output if n['true_status'] == 'GREEN')
    top_suspects = sorted(nodes_output, key=lambda x: x['suspect_score'], reverse=True)[:5]

    # Build heatmap data: aggregate response times per node over log_id windows
    window_size = 500
    heatmap_data = []
    for node_id in sorted(node_registry.keys()):
        node_windows = []
        window_logs = defaultdict(list)
        for l in processed_logs:
            if l['node_id'] == node_id:
                window_idx = l['log_id'] // window_size
                window_logs[window_idx].append(l['response_time_ms'])
        for w_idx in range(10000 // window_size):
            times = window_logs.get(w_idx, [])
            avg_time = sum(times) / len(times) if times else 0
            node_windows.append(round(avg_time, 1))
        heatmap_data.append({
            'node_id': node_id,
            'windows': node_windows,
        })

    unified = {
        'summary': {
            'total_nodes': len(nodes_output),
            'total_logs': len(processed_logs),
            'threats_detected': total_threats,
            'suspicious_nodes': total_suspicious,
            'clean_nodes': total_clean,
            'current_schema_version': schema_configs[-1]['version'],
            'top_suspects': [{'node_id': s['node_id'], 'score': s['suspect_score'], 'serial': s['decoded_serial']} for s in top_suspects],
        },
        'schema_timeline': schema_timeline,
        'nodes': nodes_output,
        'logs': processed_logs,
        'heatmap': heatmap_data,
    }

    output_path = os.path.join(SCRIPT_DIR, 'aegis-dashboard', 'public', 'aegis_unified.json')
    with open(output_path, 'w') as f:
        json.dump(unified, f, indent=2)

    print(f"\n[AEGIS] Preprocessing complete!")
    print(f"  Output: {output_path}")
    print(f"  Total nodes: {len(nodes_output)}")
    print(f"  Total logs:  {len(processed_logs)}")
    print(f"  Threats:     {total_threats}")
    print(f"  Suspicious:  {total_suspicious}")
    print(f"  Clean:       {total_clean}")
    print(f"\n  Top 5 Suspects:")
    for s in top_suspects:
        print(f"    Node {s['node_id']:3d} | Score: {s['suspect_score']:5.1f} | Serial: {s['decoded_serial']} | Alerts: {', '.join(s['alerts'])}")

if __name__ == '__main__':
    main()
