import { useState, useEffect } from 'react';

/**
 * Requests the browser's geolocation once on mount.
 *
 * Returns:
 *   status  — 'idle' | 'requesting' | 'granted' | 'denied' | 'unavailable'
 *   coords  — { latitude, longitude } | null
 *   error   — string | null
 */
export function useGeolocation() {
  const [state, setState] = useState({
    status: 'idle',
    coords: null,
    error: null,
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setState({
        status: 'unavailable',
        coords: null,
        error: 'Geolocation is not supported by your browser.',
      });
      return;
    }

    setState((prev) => ({ ...prev, status: 'requesting' }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          status: 'granted',
          coords: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
          error: null,
        });
      },
      (err) => {
        const denied = err.code === err.PERMISSION_DENIED;
        setState({
          status: denied ? 'denied' : 'unavailable',
          coords: null,
          error: err.message,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10_000,
        maximumAge: 60_000,
      }
    );
  }, []);

  return state;
}
