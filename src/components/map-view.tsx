"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Link from "next/link";

interface Person {
  id: number;
  firstName: string;
  lastName: string;
  title: string | null;
  org: string | null;
  warmth: number;
  city: string | null;
  country: string | null;
}

interface MarkerData {
  location: string;
  coords: [number, number];
  people: Person[];
}

interface MapViewProps {
  markers: MarkerData[];
}

// Single person marker
const personIcon = L.divIcon({
  className: "custom-marker",
  html: `<div style="
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #3b82f6;
    box-shadow: 0 0 10px rgba(59, 130, 246, 0.8), 0 0 20px rgba(59, 130, 246, 0.4);
  "></div>`,
  iconSize: [12, 12],
  iconAnchor: [6, 6],
  popupAnchor: [0, -6],
});

// Custom cluster icon
function createClusterCustomIcon(cluster: L.MarkerCluster) {
  const count = cluster.getChildCount();
  const size = count > 50 ? 56 : count > 20 ? 48 : count > 10 ? 40 : 32;

  return L.divIcon({
    className: "custom-marker",
    html: `<div style="
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      background: #3b82f6;
      box-shadow: 0 0 ${size/2}px rgba(59, 130, 246, 0.8), 0 0 ${size}px rgba(59, 130, 246, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: ${count > 50 ? 16 : count > 20 ? 15 : 13}px;
      font-weight: 600;
    ">${count}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function warmthColor(warmth: number) {
  const colors = ["#94a3b8", "#eab308", "#f97316", "#22c55e"];
  return colors[warmth] || colors[0];
}

function warmthLabel(warmth: number) {
  const labels = ["Cold", "Warm", "Hot", "Champion"];
  return labels[warmth] || "Cold";
}

// Component to fit bounds
function FitBounds({ markers }: { markers: MarkerData[] }) {
  const map = useMap();

  useEffect(() => {
    if (markers.length > 0) {
      const bounds = L.latLngBounds(markers.map((m) => m.coords));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 5 });
    }
  }, [markers, map]);

  return null;
}

// Flatten markers to individual people with coords
function flattenMarkers(markers: MarkerData[]): Array<Person & { coords: [number, number]; location: string }> {
  const result: Array<Person & { coords: [number, number]; location: string }> = [];
  markers.forEach((marker) => {
    marker.people.forEach((person) => {
      // Add small random offset so same-city markers don't overlap exactly
      const offset = () => (Math.random() - 0.5) * 0.02;
      result.push({
        ...person,
        coords: [marker.coords[0] + offset(), marker.coords[1] + offset()],
        location: marker.location,
      });
    });
  });
  return result;
}

export default function MapView({ markers }: MapViewProps) {
  const allPeople = flattenMarkers(markers);

  return (
    <>
      <style jsx global>{`
        .leaflet-container {
          background: #f8fafc;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.12);
          border: none;
        }
        .leaflet-popup-tip {
          box-shadow: none;
        }
        .leaflet-control-attribution {
          background: rgba(255,255,255,0.7) !important;
          font-size: 10px;
        }
        .leaflet-control-zoom {
          border: none !important;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1) !important;
        }
        .leaflet-control-zoom a {
          border: none !important;
          color: #3b82f6 !important;
        }
        .leaflet-control-zoom a:hover {
          background: #f1f5f9 !important;
        }
        .custom-marker {
          background: transparent !important;
          border: none !important;
        }
        .marker-cluster {
          background: transparent !important;
        }
        .marker-cluster div {
          background: transparent !important;
        }
      `}</style>
      <MapContainer
        center={[30, 0]}
        zoom={2}
        style={{ height: "calc(100vh - 180px)", width: "100%", background: "#f8fafc" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
        />
        <FitBounds markers={markers} />
        <MarkerClusterGroup
          chunkedLoading
          iconCreateFunction={createClusterCustomIcon}
          maxClusterRadius={60}
          spiderfyOnMaxZoom={true}
          showCoverageOnHover={false}
          animate={true}
        >
          {allPeople.map((person) => (
            <Marker
              key={person.id}
              position={person.coords}
              icon={personIcon}
            >
              <Popup>
                <Link
                  href={`/people/${person.id}`}
                  className="block min-w-[180px]"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: warmthColor(person.warmth) }}
                      title={warmthLabel(person.warmth)}
                    />
                    <div>
                      <div className="font-semibold text-sm">
                        {person.firstName} {person.lastName}
                      </div>
                      {person.title && (
                        <div className="text-xs text-slate-500">{person.title}</div>
                      )}
                      {person.org && (
                        <div className="text-xs text-slate-500">{person.org}</div>
                      )}
                      <div className="text-xs text-slate-400 mt-1">{person.location}</div>
                    </div>
                  </div>
                </Link>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>
    </>
  );
}
