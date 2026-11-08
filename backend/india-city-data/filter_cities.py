
import pandas as pd

# 1. Define the 19 columns in GeoNames IN.txt
columns = [
    "geonameid",
    "name",
    "asciiname",
    "alternatenames",
    "latitude",
    "longitude",
    "feature_class",
    "feature_code",
    "country_code",
    "cc2",
    "admin1_code",
    "admin2_code",
    "admin3_code",
    "admin4_code",
    "population",
    "elevation",
    "dem",
    "timezone",
    "modification_date",
]

# 2. Read India's GeoNames records
df = pd.read_csv(
    "IN.txt",
    sep="\t",
    header=None,
    names=columns,
    dtype={"admin1_code": "string"},
    low_memory=False,
)

# 3. Keep relevant populated places
allowed_codes = [
    "PPLC",
    "PPLA",
    "PPLA2",
    "PPLA3",
    "PPLA4",
    "PPL",
]

cities = df[
    (df["country_code"] == "IN")
    & (df["feature_class"] == "P")
    & (df["feature_code"].isin(allowed_codes))
].copy()

# 4. Read the state/UT lookup file
admin1 = pd.read_csv(
    "admin1CodesASCII.txt",
    sep="\t",
    header=None,
    names=[
        "admin1_key",
        "state",
        "state_ascii",
        "admin1_geonameid",
    ],
    dtype="string",
)

# 5. Keep India's administrative divisions
admin1 = admin1[
    admin1["admin1_key"].str.startswith("IN.", na=False)
].copy()

# Convert IN.KL into KL, IN.TN into TN, etc.
admin1["admin1_code"] = (
    admin1["admin1_key"].str.split(".", n=1).str[1]
)

# 6. Match every place to its state/UT
cities = cities.merge(
    admin1[["admin1_code", "state"]],
    on="admin1_code",
    how="left",
)

# 7. Clean and validate coordinates
cities["latitude"] = pd.to_numeric(
    cities["latitude"], errors="coerce"
)
cities["longitude"] = pd.to_numeric(
    cities["longitude"], errors="coerce"
)
cities["population"] = pd.to_numeric(
    cities["population"], errors="coerce"
)

cities = cities.dropna(
    subset=["name", "latitude", "longitude"]
)

cities = cities[
    cities["latitude"].between(6, 38)
    & cities["longitude"].between(68, 98)
].copy()

# 8. Split matched and unmatched places
matched = cities[cities["state"].notna()].copy()

unmatched = cities[cities["state"].isna()].copy()

# 9. Select output columns
output_columns = [
    "geonameid",
    "name",
    "state",
    "latitude",
    "longitude",
    "population",
    "feature_code",
]

result = matched[output_columns].copy()

unmatched_result = unmatched[
    output_columns
].copy()

# 10. Save both files
result.to_csv("india_cities.csv", index=False)

unmatched_result.to_csv(
    "unmatched_places.csv",
    index=False
)

# 11. Display summary
print("Successfully mapped places:", len(result))
print("Unmatched places:", len(unmatched_result))
print("Total places:", len(result) + len(unmatched_result))

print("\nSample matched places:")
print(result.head(10).to_string(index=False))

print("\nSample unmatched places:")
print(unmatched_result.head(10).to_string(index=False))

print("\nFiles generated:")
print("1. india_cities.csv")
print("2. unmatched_places.csv")
