import { useState, useCallback, useRef, useEffect } from 'react';

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
 * Resolves the device's coordinates using a browser-native multi-tier
 * fallback strategy. No external API keys or backend calls are involved in location
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
 *   Tier 3 — Fallback failure / manual city selection
 *     Reported when both tiers fail or return low-confidence coordinates.
 *
 * Status transitions:
 *   'idle'       → initial state before any attempt
 *   'requesting' → actively attempting GPS or WiFi positioning
 *   'granted'    → coordinates resolved successfully
 *   'denied'     → automatic methods failed
 *
 * Returns: { status, coords: { latitude, longitude } | null, source, error, detectLocation }
 *   source: 'gps' | 'wifi' | null
 *   detectLocation: function returning Promise<{ success, coords, source, error }>
 */
export function useGeolocation() {
  const [state, setState] = useState({
    status: 'idle',
    coords: null,
    source: null,
    error: null,
  });

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const detectLocation = useCallback(() => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !navigator.geolocation) {
        const errorMsg = 'Geolocation is not supported by this browser.';
        if (isMountedRef.current) {
          setState({
            status: 'denied',
            coords: null,
            source: null,
            error: errorMsg,
          });
        }
        resolve({ success: false, coords: null, source: null, error: errorMsg });
        return;
      }

      if (isMountedRef.current) {
        setState((prev) => ({ ...prev, status: 'requesting', error: null }));
      }

      function finishFailure(reason) {
        if (isMountedRef.current) {
          setState({
            status: 'denied',
            coords: null,
            source: null,
            error: reason,
          });
        }
        resolve({ success: false, coords: null, source: null, error: reason });
      }

      function finishSuccess(coords, source) {
        if (isMountedRef.current) {
          setState({
            status: 'granted',
            coords,
            source,
            error: null,
          });
        }
        resolve({ success: true, coords, source, error: null });
      }

      // ------------------------------------------------------------------
      // Tier 2 — Browser WiFi / cell-tower / IP positioning
      // ------------------------------------------------------------------
      function tryLowAccuracyPositioning() {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude, accuracy } = position.coords;

            // Reject results whose uncertainty circle is too large to reliably
            // identify a city. The check is skipped if accuracy is not reported.
            if (accuracy != null && accuracy > MAX_LOW_ACCURACY_METERS) {
              finishFailure(
                `Network positioning accuracy too low (${Math.round(accuracy / 1000)} km). Please select your city.`
              );
              return;
            }

            finishSuccess({ latitude, longitude }, 'wifi');
          },
          (err) => {
            let msg = 'Could not determine location automatically.';
            if (err?.code === 1) {
              msg = 'Location permission was denied. Please allow location access or select a city.';
            } else if (err?.code === 2) {
              msg = 'Location information is unavailable on your device.';
            } else if (err?.code === 3) {
              msg = 'Location request timed out. Please try again or select a city.';
            }
            finishFailure(msg);
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
      navigator.geolocation.getCurrentPosition(
        (position) => {
          finishSuccess(
            {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            },
            'gps'
          );
        },
        () => {
          // GPS denied or timed out → try WiFi positioning
          tryLowAccuracyPositioning();
        },
        {
          enableHighAccuracy: true,
          timeout: 10_000,
          maximumAge: 60_000,
        }
      );
    });
  }, []);

  return {
    ...state,
    detectLocation,
  };
}
