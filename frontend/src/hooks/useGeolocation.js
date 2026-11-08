import { useState, useEffect } from 'react';

/**
 * Maximum accuracy radius (metres) accepted from the browser's low-accuracy
 * (WiFi / cell-tower / IP) positioning call before falling back to city picker.
 *
 * Air quality is city-level data. Indian cities are typically 20–50 km apart,
 * so an accuracy circle larger than 10 km means we cannot reliably identify
 * which city the user is in.
 *
 *   GPS                      : ~5 – 50 m    → accepted via high-accuracy call
 *   WiFi / cell-tower        : ~20 – 2 000 m → accepted (well below threshold)
 *   Weak cell / IP fallback  : >10 km        → rejected → city picker shown
 */
const MAX_LOW_ACCURACY_METERS = 10_000; // 10 km

/**
 * Resolves the device's coordinates using a fully browser-native three-tier
 * fallback strategy. No API keys or backend calls are involved in location
 * resolution.
 *
 *   Tier 1 — High-accuracy GPS
 *     navigator.geolocation (enableHighAccuracy: true)
 *     Triggers the device GPS / precise location permission prompt.
 *
 *   Tier 2 — Browser WiFi / cell-tower / IP positioning
 *     navigator.geolocation (enableHighAccuracy: false)
 *     The browser/OS resolves location via available network signals.
 *     Only accepted when position.coords.accuracy ≤ MAX_LOW_ACCURACY_METERS.
 *
 *   Tier 3 — City picker
 *     Shown when both tiers fail or return low-confidence coordinates.
 *
 * Status transitions:
 *   'idle'       → initial state before any attempt
 *   'requesting' → actively attempting GPS or WiFi positioning
 *   'granted'    → coordinates resolved successfully
 *   'denied'     → all automatic methods failed; city picker is shown
 *
 * Returns: { status, coords: { latitude, longitude } | null, source, error }
 *   source: 'gps' | 'wifi' | null
 */
export function useGeolocation() {
  const [state, setState] = useState({
    status: 'idle',
    coords: null,
    source: null,
    error: null,
  });

  useEffect(() => {
    // Guard against setting state after the component unmounts
    let cancelled = false;

    // ------------------------------------------------------------------
    // Tier 3 — give up, show city picker
    // ------------------------------------------------------------------
    function fallbackToCityPicker(reason) {
      if (cancelled) return;
      setState({
        status: 'denied',
        coords: null,
        source: null,
        error: reason,
      });
    }

    // ------------------------------------------------------------------
    // Tier 2 — browser WiFi / cell-tower / IP positioning
    // ------------------------------------------------------------------
    function tryLowAccuracyPositioning() {
      if (!navigator.geolocation) {
        fallbackToCityPicker('Geolocation is not supported by this browser.');
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (cancelled) return;

          const { latitude, longitude, accuracy } = position.coords;

          // Reject results whose uncertainty circle is too large to reliably
          // identify a city. The check is skipped if accuracy is not reported.
          if (accuracy != null && accuracy > MAX_LOW_ACCURACY_METERS) {
            fallbackToCityPicker(
              `Network positioning accuracy too low (${Math.round(accuracy / 1000)} km).`
            );
            return;
          }

          setState({
            status: 'granted',
            coords: { latitude, longitude },
            source: 'wifi',
            error: null,
          });
        },
        () => {
          // WiFi positioning also denied or failed — city picker
          if (cancelled) return;
          fallbackToCityPicker('Could not determine location automatically.');
        },
        {
          enableHighAccuracy: false, // browser uses WiFi / cell / IP
          timeout: 8_000,
          maximumAge: 120_000,
        }
      );
    }

    // ------------------------------------------------------------------
    // Tier 1 — GPS (high accuracy)
    // ------------------------------------------------------------------
    function tryGpsPositioning() {
      if (!navigator.geolocation) {
        // No geolocation API at all — skip straight to city picker
        fallbackToCityPicker('Geolocation is not supported by this browser.');
        return;
      }

      setState((prev) => ({ ...prev, status: 'requesting' }));

      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (cancelled) return;
          setState({
            status: 'granted',
            coords: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            },
            source: 'gps',
            error: null,
          });
        },
        () => {
          // GPS denied or timed out → try WiFi positioning
          if (cancelled) return;
          tryLowAccuracyPositioning();
        },
        {
          enableHighAccuracy: true,
          timeout: 10_000,
          maximumAge: 60_000,
        }
      );
    }

    tryGpsPositioning();

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
