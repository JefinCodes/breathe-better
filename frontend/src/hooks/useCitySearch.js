import { useState, useEffect, useCallback, useRef } from 'react';
import { searchCities } from '../api/cities';

/**
 * Custom hook for debounced city search.
 * @param {number} debounceMs - Debounce delay in milliseconds (default: 300).
 */
export function useCitySearch(debounceMs = 300) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const debounceTimer = useRef(null);

  const search = useCallback((value) => {
    setQuery(value);

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (!value || value.trim().length === 0) {
      setSuggestions([]);
      setLoading(false);
      setError(null);
      return;
    }

    debounceTimer.current = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const results = await searchCities(value);
        setSuggestions(results);
      } catch (err) {
        setError('Failed to fetch city suggestions. Please try again.');
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, debounceMs);
  }, [debounceMs]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  const clearSearch = useCallback(() => {
    setQuery('');
    setSuggestions([]);
    setLoading(false);
    setError(null);
  }, []);

  return { query, suggestions, loading, error, search, clearSearch };
}
