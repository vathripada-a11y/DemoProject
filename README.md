# BigQuery Release Notes Explorer

A modern, responsive single-page web application (SPA) built with Python Flask and plain vanilla HTML, JavaScript, and CSS that fetches Google Cloud's official BigQuery Release Notes feed, structures the updates into searchable categories, and lets you share individual updates on Twitter/X with a customized mockup composer.

---

## 🚀 Key Features

*   **Feed Parser & De-aggregation**: Dynamically fetches the BigQuery Release Notes Atom feed (`https://docs.cloud.google.com/feeds/bigquery-release-notes.xml`) and splits aggregated daily release posts into separate cards categorized by type.
*   **In-Memory Server-Side Caching**: Caches feed data in-memory for 1 hour to reduce latency and respect GCP server rate-limits. Includes support for forced refreshes (`?refresh=true`).
*   **Live Client-Side Filtering**: 
    *   **Category Tags**: Filter by update types: *Features, Changes, Deprecations, Notices, Announcements, and Issues*.
    *   **Interactive Metrics**: View live count badges on every filter chip.
    *   **Debounced Keyword Search**: Type keywords to perform rapid, instant rendering searches across titles, content, and dates.
*   **Modern Design & Aesthetics**: Styled with a dark glassmorphic layout, glowing animated badges, layout transitions, and shimmering loading state skeletons.
*   **Twitter / X Composer Modal**: Select any individual card to review, edit, and share it on Twitter. Features a verified username mockup layout, live character limit tracker (280 characters), and an SVG progress ring.

---

## 🛠️ Technology Stack

*   **Backend**: Python 3.x, Flask
*   **Frontend**: HTML5 (Semantic elements), Vanilla Javascript (ES6), Custom Vanilla CSS

---

## 📁 Project Structure

```
.
├── app.py                  # Flask Web Server & Atom feed parser
├── requirements.txt        # Backend dependencies
├── .gitignore              # Ignored files for version control
├── templates/
│   └── index.html          # Frontend page layout
└── static/
    ├── css/
    │   └── style.css       # Core stylesheets & micro-animations
    └── js/
        └── app.js          # Client-side state, DOM manipulation & Twitter modal
```

---

## 💻 Getting Started

### Prerequisites
Make sure you have **Python 3.x** and **pip** installed.

### 1. Clone & Setup
```bash
git clone https://github.com/vathripada-a11y/DemoProject.git
cd DemoProject
```

### 2. Install Dependencies
Install Flask using the provided requirements file:
```bash
pip install -r requirements.txt
```

### 3. Run the Server
Launch the Flask development server:
```bash
python app.py
```

Open your browser and navigate to:
```
http://127.0.0.1:5000
```

---

## 📡 API Documentation

### `GET /api/release-notes`
Returns parsed and structured release note records.

**Query Parameters:**
*   `refresh` (optional): If set to `true`, bypasses the server cache and fetches a fresh version directly from Google Cloud.

**Example Response:**
```json
{
  "success": true,
  "cached_at": "2026-06-18T19:00:00.000000",
  "is_stale": false,
  "data": [
    {
      "id": "tag:google.com,2016:bigquery-release-notes#June_17_2026#0",
      "date": "June 17, 2026",
      "updated": "2026-06-17T00:00:00-07:00",
      "link": "https://docs.cloud.google.com/bigquery/docs/release-notes#June_17_2026",
      "type": "Feature",
      "html": "<p>You can enable autonomous embedding generation...</p>"
    }
  ]
}
```
