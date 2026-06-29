import csv
import json
import urllib.request
import zipfile
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
IMPORT_DIR = ROOT / "data" / "imports" / "msha"
IMPORT_DIR.mkdir(parents=True, exist_ok=True)

MINE_ZIP_URL = "https://arlweb.msha.gov/opengovernmentdata/DataSets/Mines.zip"
ZIP_PATH = IMPORT_DIR / "Mines.zip"
OUT_PATH = ROOT / "data" / "mines" / "mine_registry.json"
SOURCE_INDEX = ROOT / "data" / "sources" / "source_index.json"

TODAY = str(date.today())

def clean(v):
    return str(v or "").strip()

def parse_float(v):
    try:
        if clean(v) == "":
            return None
        return float(clean(v))
    except Exception:
        return None

def slug(s):
    return "".join(c.lower() if c.isalnum() else "-" for c in clean(s)).strip("-").replace("--", "-")

print("Downloading MSHA Mines dataset...")
urllib.request.urlretrieve(MINE_ZIP_URL, ZIP_PATH)

with zipfile.ZipFile(ZIP_PATH) as z:
    names = z.namelist()
    data_names = [n for n in names if n.lower().endswith((".txt", ".csv", ".dat"))]
    if not data_names:
        raise SystemExit(f"No delimited data file found in {ZIP_PATH}: {names}")
    data_name = data_names[0]
    extracted = IMPORT_DIR / Path(data_name).name
    extracted.write_bytes(z.read(data_name))

print("Reading:", extracted)

records = []
with extracted.open("r", encoding="latin-1", errors="replace", newline="") as f:
    reader = csv.DictReader(f, delimiter="|")
    for row in reader:
        state = clean(row.get("STATE"))
        if state != "AL":
            continue

        mine_id = clean(row.get("MINE_ID"))
        name = clean(row.get("CURRENT_MINE_NAME"))
        lat = parse_float(row.get("LATITUDE"))
        lon = parse_float(row.get("LONGITUDE"))

        rec = {
            "id": f"msha-{mine_id}" if mine_id else f"msha-{slug(name)}",
            "msha_mine_id": mine_id,
            "name": name,
            "state": "Alabama",
            "state_abbr": "AL",
            "county": clean(row.get("FIPS_CNTY_NM")).title(),
            "fips_county_code": clean(row.get("FIPS_CNTY_CD")),
            "operator": clean(row.get("CURRENT_OPERATOR_NAME")),
            "operator_id": clean(row.get("CURRENT_OPERATOR_ID")),
            "controller": clean(row.get("CURRENT_CONTROLLER_NAME")),
            "controller_id": clean(row.get("CURRENT_CONTROLLER_ID")),
            "mine_type": clean(row.get("CURRENT_MINE_TYPE")),
            "status": clean(row.get("CURRENT_MINE_STATUS")),
            "status_date": clean(row.get("CURRENT_STATUS_DT")),
            "coal_metal_indicator": clean(row.get("COAL_METAL_IND")),
            "primary_sic": clean(row.get("PRIMARY_SIC")),
            "primary_canvass": clean(row.get("PRIMARY_CANVASS")),
            "nearest_town": clean(row.get("NEAREST_TOWN")),
            "latitude": lat,
            "longitude": lon,
            "coordinates": {"lat": lat, "lon": lon} if lat is not None and lon is not None else None,
            "summary": f"{name} is an Alabama mine listed in the MSHA Mines dataset." if name else "Alabama mine listed in the MSHA Mines dataset.",
            "source": "MSHA Mines Dataset",
            "source_url": MINE_ZIP_URL,
            "source_definition_url": "https://arlweb.msha.gov/OpenGovernmentData/DataSets/Mines_Definition_File.txt",
            "research_status": "source_backed_msha",
            "last_updated": TODAY,
            "raw_msha": row,
        }

        records.append(rec)

records = sorted(records, key=lambda r: (r.get("county") or "", r.get("name") or "", r.get("msha_mine_id") or ""))

OUT_PATH.write_text(json.dumps(records, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

sources = []
if SOURCE_INDEX.exists():
    try:
        sources = json.loads(SOURCE_INDEX.read_text())
    except Exception:
        sources = []

source_id = "source-msha-mines-dataset"
if not any(s.get("id") == source_id for s in sources if isinstance(s, dict)):
    sources.append({
        "id": source_id,
        "title": "MSHA Mines Dataset",
        "publisher": "Mine Safety and Health Administration",
        "url": MINE_ZIP_URL,
        "definition_url": "https://arlweb.msha.gov/OpenGovernmentData/DataSets/Mines_Definition_File.txt",
        "type": "official-federal-mine-dataset",
        "notes": "Lists coal and metal/non-metal mines under MSHA jurisdiction, including status, operator, county, mine type, and coordinates where available.",
        "status": "active_source",
        "last_checked": TODAY
    })
    SOURCE_INDEX.write_text(json.dumps(sources, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

with_coords = [r for r in records if r.get("coordinates")]
print("Alabama MSHA mine records:", len(records))
print("With coordinates:", len(with_coords))
print("Without coordinates:", len(records) - len(with_coords))
print("Wrote:", OUT_PATH)
