
import csv
import sqlite3
import unicodedata
from pathlib import Path

# Project paths
BASE_DIR = Path(__file__).resolve().parent.parent
CSV_PATH = BASE_DIR / "india-city-data" / "india_cities.csv"
DB_PATH = BASE_DIR / "india-city-data" / "india_cities.db"


def normalize_name(name):
    """Normalize city names for consistent prefix searching."""
    name = unicodedata.normalize("NFKD", name)
    name = "".join(
        char for char in name
        if not unicodedata.combining(char)
    )
    return name.casefold().strip()


# Remove an older database if it exists
if DB_PATH.exists():
    DB_PATH.unlink()

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

# Create table
cursor.execute("""
    CREATE TABLE cities (
        geonameid INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        normalized_name TEXT NOT NULL,
        state TEXT,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        population INTEGER,
        feature_code TEXT
    )
""")

# Read CSV and insert records
insert_query = """
    INSERT INTO cities (
        geonameid,
        name,
        normalized_name,
        state,
        latitude,
        longitude,
        population,
        feature_code
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
"""

batch = []
total = 0

with open(CSV_PATH, "r", encoding="utf-8-sig", newline="") as file:
    reader = csv.DictReader(file)

    expected_columns = {
        "geonameid", "name", "state",
        "latitude", "longitude", "population",
        "feature_code"
    }

    if not reader.fieldnames or not expected_columns.issubset(reader.fieldnames):
        raise ValueError(
            f"CSV headers do not match expected columns. Found: {reader.fieldnames}"
        )

    for row in reader:
        try:
            name = row["name"].strip()

            if not name:
                continue

            batch.append((
                int(row["geonameid"]),
                name,
                normalize_name(name),
                row["state"].strip() or None,
                float(row["latitude"]),
                float(row["longitude"]),
                int(row["population"]) if row["population"].strip() else None,
                row["feature_code"].strip() or None
            ))

            if len(batch) >= 5000:
                cursor.executemany(insert_query, batch)
                total += len(batch)
                batch.clear()

        except (ValueError, TypeError) as error:
            print(f"Skipping invalid row: {row}. Error: {error}")

# Insert remaining records
if batch:
    cursor.executemany(insert_query, batch)
    total += len(batch)

# Create index after inserting records
cursor.execute("""
    CREATE INDEX idx_cities_normalized_name
    ON cities(normalized_name COLLATE NOCASE)
""")

conn.commit()

# Database statistics
cursor.execute("SELECT COUNT(*) FROM cities")
count = cursor.fetchone()[0]

conn.close()

print(f"Database created successfully!")
print(f"Total records inserted: {count}")
print(f"Database location: {DB_PATH}")
print(f"Database size: {DB_PATH.stat().st_size / (1024 * 1024):.2f} MB")

