from flask import Flask, jsonify, render_template, request
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

REGISTRIES = {
    "mines": ROOT / "data/mines/mine_registry.json",
    "companies": ROOT / "data/companies/company_registry.json",
    "coal_camps": ROOT / "data/coal_camps/coal_camp_registry.json",
    "railroads": ROOT / "data/railroads/railroad_registry.json",
    "disasters": ROOT / "data/disasters/disaster_registry.json",
    "maps": ROOT / "data/maps/mine_map_source_index.json",
    "sources": ROOT / "data/sources/source_index.json",
}

def load_json(path):
    if not path.exists():
        return []
    try:
        return json.loads(path.read_text())
    except Exception:
        return []

def registry_counts():
    return {name: len(load_json(path)) for name, path in REGISTRIES.items()}

def all_records():
    records = []
    for section, path in REGISTRIES.items():
        for item in load_json(path):
            if isinstance(item, dict):
                x = dict(item)
                x["section"] = section
                records.append(x)
    return records

def search_records(q):
    q = (q or "").strip().lower()
    if not q:
        return all_records()

    results = []
    for item in all_records():
        text = json.dumps(item, ensure_ascii=False).lower()
        if q in text:
            results.append(item)
    return results

def create_app():
    app = Flask(
        __name__,
        template_folder=str(ROOT / "templates"),
        static_folder=str(ROOT / "static"),
    )

    @app.route("/")
    def index():
        return render_template("index.html", counts=registry_counts())

    @app.route("/api/status")
    def api_status():
        return jsonify({
            "app": "Alabama Mine Map",
            "status": "foundation",
            "port": 5084,
            "counts": registry_counts()
        })

    @app.route("/api/search")
    def api_search():
        return jsonify(search_records(request.args.get("q", "")))

    @app.route("/health")
    def health():
        return jsonify({"status": "ok", "project": "alabama-mine-map"})

    return app
