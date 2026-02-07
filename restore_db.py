#!/usr/bin/env python3
"""
Delete current MongoDB data and restore from JSON files in db-dump/.
Uses backend/.env for MONGO_URL and DB_NAME.
"""
import json
import os
import sys
from pathlib import Path

import certifi
from dotenv import load_dotenv
from pymongo import MongoClient

ROOT = Path(__file__).resolve().parent
BACKEND = ROOT / "backend"
DB_DUMP = ROOT / "db-dump"
ENV_FILE = BACKEND / ".env"

load_dotenv(ENV_FILE)

MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME")

if not MONGO_URL or not DB_NAME:
    print("Missing MONGO_URL or DB_NAME in backend/.env", file=sys.stderr)
    sys.exit(1)

if not DB_DUMP.is_dir():
    print(f"db-dump directory not found: {DB_DUMP}", file=sys.stderr)
    sys.exit(1)


def latest_dump(prefix: str):
    """Return path to latest dump file matching prefix (e.g. full_database_ or doctors_)."""
    files = list(DB_DUMP.glob(f"{prefix}*.json"))
    if not files:
        return None
    return max(files, key=lambda p: p.stat().st_mtime)


def main():
    client = MongoClient(
        MONGO_URL,
        tlsCAFile=certifi.where(),
        serverSelectionTimeoutMS=30000,
    )
    db = client[DB_NAME]

    # Prefer full_database_*.json (single snapshot for both collections)
    full_path = latest_dump("full_database_")
    if full_path:
        print(f"Using full dump: {full_path.name}")
        with open(full_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        doctors_data = data.get("doctors", [])
        prescriptions_data = data.get("prescriptions", [])
    else:
        doctors_path = latest_dump("doctors_")
        prescriptions_path = latest_dump("prescriptions_")
        if not doctors_path and not prescriptions_path:
            print("No dump files found in db-dump (full_database_*.json or doctors_*.json / prescriptions_*.json)", file=sys.stderr)
            sys.exit(1)
        doctors_data = []
        prescriptions_data = []
        if doctors_path:
            print(f"Using doctors dump: {doctors_path.name}")
            with open(doctors_path, "r", encoding="utf-8") as f:
                doctors_data = json.load(f)
        if prescriptions_path:
            print(f"Using prescriptions dump: {prescriptions_path.name}")
            with open(prescriptions_path, "r", encoding="utf-8") as f:
                prescriptions_data = json.load(f)

    # Clear existing data
    if "doctors" in db.list_collection_names():
        db.doctors.delete_many({})
        print("Cleared doctors collection.")
    if "prescriptions" in db.list_collection_names():
        db.prescriptions.delete_many({})
        print("Cleared prescriptions collection.")

    # Restore
    if doctors_data:
        db.doctors.insert_many(doctors_data)
        print(f"Restored {len(doctors_data)} doctor(s).")
    if prescriptions_data:
        db.prescriptions.insert_many(prescriptions_data)
        print(f"Restored {len(prescriptions_data)} prescription(s).")

    client.close()
    print("Done.")


if __name__ == "__main__":
    main()
