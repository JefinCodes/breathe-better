import { useState, useRef, useEffect, useId } from 'react';
import { MapPin, Search, Loader2, X } from 'lucide-react';
import { useCitySearch } from '../hooks/useCitySearch';

/**
 * CityAutocomplete - Reusable city search autocomplete component.
 *
 * Props:
 *   onCitySelect (function): Called with the full city object when a suggestion is selected.
 *   placeholder (string): Input placeholder text.
 *   className (string): Extra CSS classes for the wrapper.
 *   label (string): Optional label text.
 */
export default function CityAutocomplete({
  onCitySelect,
  placeholder = 'Search for a city...',
  className = '',
  label,
  clearOnSelect = false,
}) {
  const listboxId = useId();
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const wrapperRef = useRef(null);

  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [selectedCity, setSelectedCity] = useState(null);

  const { query, suggestions, loading, error, search, clearSearch } = useCitySearch(300);

  // Format city name: first char uppercase, rest lowercase
  const formatCityName = (name) =>
    name ? name.charAt(0).toUpperCase() + name.slice(1).toLowerCase() : '';

  // Open dropdown when suggestions arrive or when typing
  useEffect(() => {
    if (query.length > 0) {
      setIsOpen(true);
      setActiveIndex(-1);
    } else {
      setIsOpen(false);
    }
  }, [query, suggestions]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleInputChange(e) {
    const value = e.target.value;
    // If user edits after selection, clear the selection
    if (selectedCity) {
      setSelectedCity(null);
    }
    search(value);
  }

  function handleSelect(city) {
    if (clearOnSelect) {
      setSelectedCity(null);
      clearSearch();
      setIsOpen(false);
    } else {
      setSelectedCity(city);
      setIsOpen(false);
      clearSearch();
    }
    if (onCitySelect) onCitySelect(city);
  }

  function handleClear() {
    setSelectedCity(null);
    clearSearch();
    setIsOpen(false);
    inputRef.current?.focus();
    if (onCitySelect) onCitySelect(null);
  }

  function handleKeyDown(e) {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && suggestions[activeIndex]) {
          handleSelect(suggestions[activeIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setActiveIndex(-1);
        inputRef.current?.blur();
        break;
      default:
        break;
    }
  }

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const item = listRef.current.children[activeIndex];
      if (item) {
        item.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [activeIndex]);

  const showDropdown = isOpen && (loading || suggestions.length > 0 || error || (query.length >= 1 && !loading));

  const displayValue = selectedCity ? formatCityName(selectedCity.name) : query;

  return (
    <div ref={wrapperRef} className={`relative w-full ${className}`}>
      {label && (
        <label htmlFor={listboxId + '-input'} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}

      {/* Input wrapper */}
      <div className="relative flex items-center">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
        <input
          id={listboxId + '-input'}
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-activedescendant={activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined}
          aria-autocomplete="list"
          autoComplete="off"
          value={displayValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (query.length > 0 && suggestions.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2.5 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
        />
        {/* Loading spinner or clear button */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {loading ? (
            <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
          ) : (selectedCity || query) ? (
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
              aria-label="Clear selection"
            >
              <X className="w-4 h-4" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <ul
          id={listboxId}
          ref={listRef}
          role="listbox"
          aria-label="City suggestions"
          className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {/* Error state */}
          {error && (
            <li className="px-4 py-3 text-sm text-red-500 text-center">
              {error}
            </li>
          )}

          {/* Suggestions */}
          {!error && suggestions.map((city, index) => (
            <li
              key={city.geonameid}
              id={`${listboxId}-option-${index}`}
              role="option"
              aria-selected={activeIndex === index}
              onMouseDown={(e) => {
                e.preventDefault(); // prevent blur before click registers
                handleSelect(city);
              }}
              onMouseEnter={() => setActiveIndex(index)}
              className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors ${
                activeIndex === index
                  ? 'bg-blue-50 text-blue-900'
                  : 'text-gray-800 hover:bg-gray-50'
              }`}
            >
              <MapPin className={`w-4 h-4 mt-0.5 flex-shrink-0 ${activeIndex === index ? 'text-blue-500' : 'text-gray-400'}`} />
              <div>
                <p className="text-sm font-medium leading-tight">{formatCityName(city.name)}</p>
                <p className="text-xs text-gray-500 leading-tight mt-0.5">{city.state}</p>
              </div>
            </li>
          ))}

          {/* Empty state (after debounce, no loading, no results, no error) */}
          {!loading && !error && suggestions.length === 0 && query.length >= 1 && (
            <li className="px-4 py-3 text-sm text-gray-500 text-center">
              No cities found for &ldquo;{query}&rdquo;
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
