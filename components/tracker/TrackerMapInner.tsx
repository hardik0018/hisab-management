'use client';

/**
 * TrackerMapInner.tsx
 * The actual Leaflet map implementation (Client Component, no SSR).
 * Imported via dynamic() in TrackerMap.tsx.
 *
 * Route data: fetches session points when sessionId changes.
 * Live point: appended to the active polyline via TrackerContext.
 */

import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTrackerContext } from './TrackerProvider';

// Fix default Leaflet icon paths broken by webpack
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom marker icons
const currentIcon = L.divIcon({
  html: `<div style="
    width:20px;height:20px;border-radius:50%;
    background:hsl(221,83%,53%);
    border:3px solid white;
    box-shadow:0 0 0 3px hsl(221,83%,53%,0.3),0 2px 8px rgba(0,0,0,0.3);
  "></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  className: '',
});

const startIcon = L.divIcon({
  html: `<div style="
    width:16px;height:16px;border-radius:50%;
    background:hsl(142,70%,45%);
    border:3px solid white;
    box-shadow:0 2px 6px rgba(0,0,0,0.3);
  "></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
  className: '',
});

interface LatLng { lat: number; lng: number }

// Downsample large arrays to keep rendering fast
function downsample<T>(arr: T[], maxPoints: number): T[] {
  if (arr.length <= maxPoints) return arr;
  const step = Math.ceil(arr.length / maxPoints);
  const result: T[] = [];
  for (let i = 0; i < arr.length; i += step) result.push(arr[i]);
  // Always include the last point
  if (result[result.length - 1] !== arr[arr.length - 1]) {
    result.push(arr[arr.length - 1]);
  }
  return result;
}

/** Automatically re-centers map when the tracked position changes */
function MapAutoCenter({ position }: { position: [number, number] | null }) {
  const map = useMap();
  const prevPos = useRef<[number, number] | null>(null);

  useEffect(() => {
    if (!position) return;
    const [lat, lng] = position;
    if (
      !prevPos.current ||
      Math.abs(prevPos.current[0] - lat) > 0.00005 ||
      Math.abs(prevPos.current[1] - lng) > 0.00005
    ) {
      map.panTo([lat, lng], { animate: true, duration: 0.5 });
      prevPos.current = [lat, lng];
    }
  }, [position, map]);

  return null;
}

export default function TrackerMapInner() {
  const { latest } = useTrackerContext();

  // Historical route points fetched from the API
  const [historicalPoints, setHistoricalPoints] = useState<LatLng[]>([]);
  // Live points appended via SSE (current session only)
  const [livePoints, setLivePoints] = useState<LatLng[]>([]);
  const currentSessionRef = useRef<string | null>(null);

  // Fetch route when sessionId changes
  useEffect(() => {
    const sessionId = latest?.sessionId;
    if (!sessionId) return;
    if (sessionId === currentSessionRef.current) return;

    currentSessionRef.current = sessionId;
    setLivePoints([]); // Clear live trail for new session

    fetch(`/api/tracker/session/${encodeURIComponent(sessionId)}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success && Array.isArray(res.data?.points)) {
          const pts: LatLng[] = res.data.points.map((p: { lat: number; lng: number }) => ({
            lat: p.lat,
            lng: p.lng,
          }));
          const sampled = downsample(pts, 500);
          setHistoricalPoints(sampled);
        }
      })
      .catch(() => {/* silent — map still works without history */});
  }, [latest?.sessionId]);

  // Append live point from SSE
  useEffect(() => {
    if (
      latest?.lat == null ||
      latest?.lng == null ||
      latest.status !== 'live'
    ) return;

    setLivePoints((prev) => {
      const newPt = { lat: latest.lat!, lng: latest.lng! };
      // Avoid duplicates
      const last = prev[prev.length - 1];
      if (last && last.lat === newPt.lat && last.lng === newPt.lng) return prev;
      return [...prev, newPt];
    });
  }, [latest?.lat, latest?.lng, latest?.status]);

  const hasPosition = latest?.lat != null && latest?.lng != null;
  const currentPos: [number, number] | null = hasPosition
    ? [latest!.lat!, latest!.lng!]
    : null;

  // Merge historical + live for polyline (live session points only at the end)
  const allPoints = [...historicalPoints, ...livePoints];
  const polylinePositions = allPoints.map((p) => [p.lat, p.lng] as [number, number]);
  const startPosition = allPoints[0]
    ? ([allPoints[0].lat, allPoints[0].lng] as [number, number])
    : null;

  const defaultCenter: [number, number] = currentPos ?? [23.0225, 72.5714]; // Default: Ahmedabad
  const defaultZoom = currentPos ? 16 : 12;

  return (
    <MapContainer
      center={defaultCenter}
      zoom={defaultZoom}
      style={{ height: '400px', width: '100%' }}
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Auto-center on live position */}
      {currentPos && <MapAutoCenter position={currentPos} />}

      {/* Route polyline */}
      {polylinePositions.length > 1 && (
        <Polyline
          positions={polylinePositions}
          color="#3b82f6"
          weight={4}
          opacity={0.85}
        />
      )}

      {/* Start marker */}
      {startPosition && polylinePositions.length > 1 && (
        <Marker position={startPosition} icon={startIcon}>
          <Popup>
            <strong>Session Start</strong>
          </Popup>
        </Marker>
      )}

      {/* Current position marker */}
      {currentPos && (
        <Marker position={currentPos} icon={currentIcon}>
          <Popup>
            <div className="text-sm">
              <strong>Current Position</strong>
              <br />
              {latest?.lat?.toFixed(6)}, {latest?.lng?.toFixed(6)}
              <br />
              Speed: {latest?.speedKmh?.toFixed(1) ?? '—'} km/h
              <br />
              Battery: {latest?.battery ?? '—'}%
            </div>
          </Popup>
        </Marker>
      )}

      {/* Empty state placeholder */}
      {!hasPosition && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[1000]">
          <div className="bg-background/90 backdrop-blur-sm px-4 py-2 rounded-xl text-muted-foreground text-sm">
            No location received yet
          </div>
        </div>
      )}
    </MapContainer>
  );
}
