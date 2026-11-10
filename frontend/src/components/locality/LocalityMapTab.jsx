import { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Layers,
  MapPin,
  MessageSquare,
  CheckCircle,
  Send,
  X,
  Loader2,
  Bell,
} from 'lucide-react';
import { getHeatmapTileUrl } from '../../api/airQuality';
import {
  getThreadMessages,
  postThreadMessage,
  notifyResolved,
} from '../../api/locality';

// Custom Pin Marker Creator based on message count
function createThreadIcon(messageCount) {
  let bgColor = '#eab308'; // Yellow for <= 10
  let ringColor = 'rgba(234, 179, 8, 0.4)';

  if (messageCount > 40) {
    bgColor = '#ef4444'; // Red for > 40
    ringColor = 'rgba(239, 68, 68, 0.4)';
  } else if (messageCount > 10) {
    bgColor = '#f97316'; // Orange for 11 - 40
    ringColor = 'rgba(249, 115, 22, 0.4)';
  }

  return L.divIcon({
    className: 'custom-thread-pin',
    html: `
      <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
        <span style="position: absolute; width: 34px; height: 34px; background: ${ringColor}; border-radius: 50%; animation: pulse 2s infinite;"></span>
        <div style="width: 26px; height: 26px; background: ${bgColor}; border: 2.5px solid #ffffff; border-radius: 50%; box-shadow: 0 4px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-size: 11px; font-weight: 800; font-family: sans-serif;">
          ${messageCount}
        </div>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
}

// Center Pin for locality center
function createLocalityCenterIcon() {
  return L.divIcon({
    className: 'custom-locality-home-pin',
    html: `
      <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
        <div style="width: 22px; height: 22px; background: #059669; border: 2px solid #ffffff; border-radius: 50%; box-shadow: 0 3px 8px rgba(0,0,0,0.25); display: flex; align-items: center; justify-content: center; color: white;">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

export default function LocalityMapTab({
  locality,
  threads,
  currentUser,
  selectedThread,
  onSelectThread,
  onRefreshThreads,
}) {
  const [mapMode, setMapMode] = useState('pins'); // 'pins' | 'heatmap'
  const [heatmapMetric, setHeatmapMetric] = useState('UAQI_RED_GREEN');
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isNotifyingResolve, setIsNotifyingResolve] = useState(false);
  const [notificationSuccess, setNotificationSuccess] = useState(null);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const heatmapLayerRef = useRef(null);
  const markersLayerRef = useRef(null);
  const chatBottomRef = useRef(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [locality.latitude, locality.longitude],
        zoom: 13,
        zoomControl: true,
        scrollWheelZoom: true,
      });

      // Base OpenStreetMap tiles
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 18,
      }).addTo(map);

      // Locality radius circle
      L.circle([locality.latitude, locality.longitude], {
        radius: (locality.radius_km || 5) * 1000,
        color: '#10b981',
        fillColor: '#10b981',
        fillOpacity: 0.1,
        weight: 2,
        dashArray: '6, 6',
      }).addTo(map);

      // Center home marker
      L.marker([locality.latitude, locality.longitude], {
        icon: createLocalityCenterIcon(),
      })
        .addTo(map)
        .bindPopup(`<b>${locality.locality_name || 'Locality Center'}</b><br/>Center coordinate`);

      // Layer group for thread pins
      const markersGroup = L.layerGroup().addTo(map);
      markersLayerRef.current = markersGroup;

      mapInstanceRef.current = map;

      setTimeout(() => {
        map.invalidateSize();
      }, 200);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersLayerRef.current = null;
        heatmapLayerRef.current = null;
      }
    };
  }, [locality.latitude, locality.longitude, locality.radius_km]);

  // Update Thread Pins on normal map mode
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    if (mapMode === 'pins') {
      threads.forEach((t) => {
        const marker = L.marker([t.latitude, t.longitude], {
          icon: createThreadIcon(t.message_count || 0),
        });

        marker.on('click', () => {
          onSelectThread(t);
        });

        marker.bindTooltip(`<b>${t.title}</b><br/>${t.message_count || 0} messages`, {
          direction: 'top',
          offset: [0, -15],
        });

        markersGroup.addLayer(marker);
      });
    }
  }, [threads, mapMode, onSelectThread]);

  // Heat Map Overlay Toggle
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (heatmapLayerRef.current) {
      map.removeLayer(heatmapLayerRef.current);
      heatmapLayerRef.current = null;
    }

    if (mapMode === 'heatmap') {
      const tileUrl = getHeatmapTileUrl(heatmapMetric);
      const layer = L.tileLayer(tileUrl, {
        opacity: 0.75,
        tileSize: 256,
        maxZoom: 18,
      });
      layer.addTo(map);
      heatmapLayerRef.current = layer;
    }
  }, [mapMode, heatmapMetric]);

  // Pan to selected thread
  useEffect(() => {
    if (selectedThread && mapInstanceRef.current) {
      mapInstanceRef.current.setView([selectedThread.latitude, selectedThread.longitude], 14, {
        animate: true,
      });
    }
  }, [selectedThread]);

  // Fetch discussion messages when a thread is selected
  useEffect(() => {
    if (!selectedThread) {
      setMessages([]);
      return;
    }

    let isMounted = true;
    setIsLoadingMessages(true);
    setNotificationSuccess(null);

    getThreadMessages(selectedThread.id)
      .then((res) => {
        if (isMounted) {
          setMessages(res.messages || []);
        }
      })
      .catch((err) => {
        console.warn('Failed to load thread messages:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingMessages(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedThread]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedThread || isSendingMessage) return;

    if (!currentUser) {
      alert('Please sign in or create an account to post messages.');
      return;
    }

    setIsSendingMessage(true);
    try {
      const res = await postThreadMessage(selectedThread.id, newMessage.trim());
      if (res.success && res.message) {
        setMessages((prev) => [...prev, res.message]);
        setNewMessage('');
        onRefreshThreads?.();
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to post message.');
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Notify creator that issue is resolved
  const handleNotifyResolved = async () => {
    if (!selectedThread || isNotifyingResolve) return;

    if (!currentUser) {
      alert('Please sign in to notify the thread creator.');
      return;
    }

    if (currentUser.id === selectedThread.user_id) {
      alert('You created this thread. You can close it directly in the My Threads section.');
      return;
    }

    setIsNotifyingResolve(true);
    try {
      const res = await notifyResolved(selectedThread.id, 'Neighbor confirmed issue appears resolved.');
      if (res.success) {
        setNotificationSuccess('Thank you! Thread creator was notified that this issue is resolved.');
        onRefreshThreads?.();
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to send resolution notification.');
    } finally {
      setIsNotifyingResolve(false);
    }
  };

  return (
    <div className="relative w-full rounded-3xl border border-slate-200 overflow-hidden bg-white shadow-xs">
      {/* Map Mode Toolbar */}
      <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-2">
        <div className="bg-white/95 backdrop-blur-md p-1 rounded-2xl border border-slate-200 shadow-md flex items-center gap-1">
          <button
            type="button"
            onClick={() => setMapMode('pins')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              mapMode === 'pins'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Pollution Pins</span>
          </button>

          <button
            type="button"
            onClick={() => setMapMode('heatmap')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              mapMode === 'heatmap'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Heat Map View</span>
          </button>
        </div>

        {mapMode === 'heatmap' && (
          <div className="bg-white/95 backdrop-blur-md px-2 py-1 rounded-2xl border border-slate-200 shadow-md flex items-center gap-1.5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setHeatmapMetric('UAQI_RED_GREEN')}
              className={`px-2 py-1 rounded-lg ${
                heatmapMetric === 'UAQI_RED_GREEN'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Universal AQI
            </button>
            <button
              type="button"
              onClick={() => setHeatmapMetric('PM25_INDIGO_PERSIAN')}
              className={`px-2 py-1 rounded-lg ${
                heatmapMetric === 'PM25_INDIGO_PERSIAN'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              PM2.5 Tile
            </button>
          </div>
        )}
      </div>

      {/* Pin Color Legend (Overlay on Bottom Left) */}
      <div className="absolute bottom-4 left-4 z-20 bg-white/95 backdrop-blur-md px-3.5 py-2.5 rounded-2xl border border-slate-200/90 shadow-md text-xs space-y-1.5">
        <span className="font-extrabold text-[10px] uppercase tracking-wider text-slate-400 block">
          Pin Activity Legend
        </span>
        <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-700">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block"></span>
            <span>≤ 10 msgs</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block"></span>
            <span>11 - 40 msgs</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"></span>
            <span>&gt; 40 msgs</span>
          </span>
        </div>
      </div>

      {/* Leaflet Map Canvas */}
      <div
        ref={mapContainerRef}
        className="w-full h-[540px] sm:h-[620px] bg-slate-100 relative z-0 isolate"
      />

      {/* Thread Discussion Drawer / Widget (Overlay on Right Side) */}
      {selectedThread && (
        <div className="absolute top-0 right-0 bottom-0 z-30 w-full sm:w-[420px] bg-white border-l border-slate-200 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
          {/* Drawer Header */}
          <div className="p-4 border-b border-slate-100 flex items-start justify-between bg-slate-50/80">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                Pollution Discussion Thread
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-1 leading-snug">
                {selectedThread.title}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Reported by <strong className="text-slate-800">@{selectedThread.username}</strong>
              </p>
            </div>
            <button
              type="button"
              onClick={() => onSelectThread(null)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Description & Action Strip */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/40 space-y-3">
            <p className="text-xs text-slate-700 leading-relaxed bg-white p-3 rounded-xl border border-slate-100 shadow-2xs">
              {selectedThread.description}
            </p>

            {notificationSuccess ? (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{notificationSuccess}</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleNotifyResolved}
                disabled={isNotifyingResolve}
                className="w-full py-2 px-3 rounded-xl border border-emerald-200 bg-emerald-50/80 hover:bg-emerald-100/80 text-emerald-800 text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {isNotifyingResolve ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Bell className="w-3.5 h-3.5 text-emerald-700" />
                )}
                <span>Notify Creator: Issue Appears Resolved</span>
              </button>
            )}
          </div>

          {/* Live Message Chat Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
            <div className="text-center my-2">
              <span className="text-[10px] text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full uppercase tracking-wider font-semibold">
                Community Discussion Feed
              </span>
            </div>

            {isLoadingMessages ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-emerald-600 mb-2" />
                <span className="text-xs text-slate-400">Loading messages…</span>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-10 px-4">
                <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-600">No messages yet</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Start the discussion! Share details, updates, or municipal contact steps.
                </p>
              </div>
            ) : (
              messages.map((m) => {
                const isMe = currentUser && currentUser.id === m.user_id;
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 px-1">
                      <span className="text-[11px] font-bold text-slate-700">
                        @{m.username}
                      </span>
                      {isMe && (
                        <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1 rounded font-bold">
                          You
                        </span>
                      )}
                    </div>
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed shadow-2xs ${
                        isMe
                          ? 'bg-emerald-600 text-white rounded-tr-none'
                          : 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200/60'
                      }`}
                    >
                      {m.message}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Chat Message Input Form */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 border-t border-slate-100 bg-slate-50 flex items-center gap-2"
          >
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={
                currentUser
                  ? `Message as @${currentUser.username}…`
                  : 'Sign in to post message…'
              }
              disabled={!currentUser || isSendingMessage}
              className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-100 transition-all"
            />
            <button
              type="submit"
              disabled={!currentUser || !newMessage.trim() || isSendingMessage}
              className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-40 transition-colors shadow-xs"
            >
              {isSendingMessage ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
