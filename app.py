import os
import urllib.request
import xml.etree.ElementTree as ET
import re
from datetime import datetime
from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

# Cache for release notes
# Structure: { "data": [...], "fetched_at": datetime }
CACHE = {
    "data": None,
    "fetched_at": None
}
CACHE_DURATION_SECONDS = 3600  # Cache for 1 hour

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

def parse_content_html(content_html):
    if not content_html:
        return []
    # Find all h3 tags and their positions
    h3_matches = list(re.finditer(r'<h3>(.*?)</h3>', content_html, re.DOTALL))
    if not h3_matches:
        return [("Update", content_html)]
    
    items = []
    for i in range(len(h3_matches)):
        start = h3_matches[i].end()
        end = h3_matches[i+1].start() if i + 1 < len(h3_matches) else len(content_html)
        update_type = h3_matches[i].group(1).strip()
        item_html = content_html[start:end].strip()
        items.append((update_type, item_html))
    return items

def fetch_and_parse_feed():
    headers = {'User-Agent': 'Mozilla/5.0'}
    req = urllib.request.Request(FEED_URL, headers=headers)
    with urllib.request.urlopen(req) as response:
        xml_data = response.read()
        
    root = ET.fromstring(xml_data)
    ns = "{http://www.w3.org/2005/Atom}"
    
    parsed_items = []
    for entry in root.findall(f"{ns}entry"):
        title = entry.find(f"{ns}title").text
        updated = entry.find(f"{ns}updated").text
        
        # Link in atom feed can have multiple links or attributes, find href
        link_elem = entry.find(f"{ns}link")
        link = link_elem.attrib.get('href') if link_elem is not None else ""
        
        content_elem = entry.find(f"{ns}content")
        content_html = content_elem.text if content_elem is not None else ""
        
        entry_id = entry.find(f"{ns}id").text
        
        items = parse_content_html(content_html)
        for idx, (utype, uhtml) in enumerate(items):
            # Create a unique ID for each individual update section
            item_id = f"{entry_id}#{idx}"
            parsed_items.append({
                'id': item_id,
                'date': title,
                'updated': updated,
                'link': link,
                'type': utype,
                'html': uhtml
            })
            
    return parsed_items

def get_release_notes(force_refresh=False):
    global CACHE
    now = datetime.now()
    
    if force_refresh or CACHE["data"] is None or CACHE["fetched_at"] is None or \
       (now - CACHE["fetched_at"]).total_seconds() > CACHE_DURATION_SECONDS:
        try:
            CACHE["data"] = fetch_and_parse_feed()
            CACHE["fetched_at"] = now
        except Exception as e:
            # If fetch fails but we have cached data, fall back to cached data
            if CACHE["data"] is not None:
                return CACHE["data"], True  # Data, is_stale = True
            raise e
            
    return CACHE["data"], False  # Data, is_stale = False

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/release-notes')
def release_notes_api():
    force_refresh = request.args.get('refresh', 'false').lower() == 'true'
    try:
        notes, is_stale = get_release_notes(force_refresh=force_refresh)
        return jsonify({
            'success': True,
            'data': notes,
            'cached_at': CACHE["fetched_at"].isoformat() if CACHE["fetched_at"] else None,
            'is_stale': is_stale
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    # Run on port 5000 by default
    app.run(debug=True, port=5000)
