const express = require('express');
const { getDb } = require('../db/database');

const router = express.Router();

/**
 * Normalize a city name using the same rules applied when building the DB:
 *  1. NFKD Unicode decomposition (separates base chars from diacritics)
 *  2. Strip combining characters (removes the diacritics)
 *  3. Lowercase + trim
 *
 * This mirrors the Python `normalize_name()` in scripts/create_cities_database.py.
 */
function normalizeName(name) {
  return name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // strip combining diacritical marks
    .toLowerCase()
    .trim();
}

/**
 * GET /api/cities/search?q={query}
 *
 * Returns up to 10 city suggestions whose normalized_name starts with the
 * normalized query. Uses the idx_cities_normalized_name index for fast prefix
 * lookups. Results are sorted by population descending so the most prominent
 * cities surface first.
 */
router.get('/search', (req, res) => {
  const raw = req.query.q;

  // Reject empty / missing queries
  if (!raw || typeof raw !== 'string' || raw.trim().length === 0) {
    return res.status(400).json({ error: 'Query parameter "q" is required.' });
  }

  const normalized = normalizeName(raw);

  if (normalized.length === 0) {
    return res.json({ results: [] });
  }

  try {
    const db = getDb();

    /**
     * Prefix LIKE on the indexed normalized_name column.
     * SQLite uses the index for LIKE patterns that don't start with a wildcard,
     * so "normalized_name LIKE 'prefix%'" hits idx_cities_normalized_name.
     *
     * We parameterize the value to prevent SQL injection.
     * The '%' is appended in JS so the bound value is a plain string.
     */
    const stmt = db.prepare(`
      SELECT
        geonameid,
        name,
        state,
        latitude,
        longitude
      FROM cities
      WHERE normalized_name LIKE ?
      ORDER BY population DESC NULLS LAST
      LIMIT 10
    `);

    const results = stmt.all(`${normalized}%`);

    return res.json({ results });
  } catch (err) {
    console.error('[cities/search] DB error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
