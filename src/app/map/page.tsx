"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users } from "lucide-react";

// Dynamically import the map component to avoid SSR issues with Leaflet
const MapView = dynamic(() => import("@/components/map-view"), {
  ssr: false,
  loading: () => (
    <div className="h-[calc(100vh-180px)] bg-slate-100 rounded-md flex items-center justify-center">
      <span className="text-muted-foreground">Loading map...</span>
    </div>
  ),
});

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

// City to coordinates mapping
const cityCoordinates: Record<string, [number, number]> = {
  "Atlanta": [33.749, -84.388],
  "Baltimore": [39.2904, -76.6122],
  "Berkeley": [37.8716, -122.2727],
  "Boston": [42.3601, -71.0589],
  "Chicago": [41.8781, -87.6298],
  "Couer d'Alene": [47.6777, -116.7805],
  "Dubai": [25.2048, 55.2708],
  "Fullerton": [33.8703, -117.9253],
  "Hong Kong": [22.3193, 114.1694],
  "Indianapolis": [39.7684, -86.1581],
  "Irvine": [33.6846, -117.8265],
  "Jurupa Valley": [33.9981, -117.4656],
  "London": [51.5074, -0.1278],
  "Los Angeles": [34.0522, -118.2437],
  "Miami": [25.7617, -80.1918],
  "Midvale": [40.6111, -111.8999],
  "New York City": [40.7128, -74.006],
  "New York": [40.7128, -74.006],
  "Oceanside": [33.1959, -117.3795],
  "Palm Beach": [26.7056, -80.0364],
  "Paris": [48.8566, 2.3522],
  "Puerto Rico": [18.2208, -66.5901],
  "San Diego": [32.7157, -117.1611],
  "San Francisco": [37.7749, -122.4194],
  "Stockholm": [59.3293, 18.0686],
  // Countries as fallback
  "Canada": [56.1304, -106.3468],
  "United Kingdom": [55.3781, -3.436],
  "United States": [37.0902, -95.7129],
};

function getCoordinates(city: string | null, country: string | null): [number, number] | null {
  if (city && cityCoordinates[city]) {
    return cityCoordinates[city];
  }
  if (country && cityCoordinates[country]) {
    return cityCoordinates[country];
  }
  return null;
}

export default function MapPage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/people`)
      .then((res) => res.json())
      .then((data) => {
        setPeople(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch people:", err);
        setLoading(false);
      });
  }, []);

  // Filter to only people with locations
  const peopleWithLocations = people.filter((p) => {
    const coords = getCoordinates(p.city, p.country);
    return coords !== null;
  });

  // Group people by location for clustering
  const locationGroups: Record<string, Person[]> = {};
  peopleWithLocations.forEach((person) => {
    const key = person.city || person.country || "Unknown";
    if (!locationGroups[key]) {
      locationGroups[key] = [];
    }
    locationGroups[key].push(person);
  });

  const markers = Object.entries(locationGroups).map(([location, persons]) => {
    const coords = getCoordinates(location, null) || getCoordinates(null, location);
    return {
      location,
      coords: coords!,
      people: persons,
    };
  }).filter((m) => m.coords);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold">People Map</h1>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {peopleWithLocations.length} with locations
            </span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {markers.length} locations
            </span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="h-[calc(100vh-180px)] bg-slate-100 rounded-md flex items-center justify-center">
          <span className="text-muted-foreground">Loading...</span>
        </div>
      ) : (
        <div className="rounded-md border overflow-hidden">
          <MapView markers={markers} />
        </div>
      )}

      {/* Location Summary */}
      <div className="flex flex-wrap gap-2">
        {markers.sort((a, b) => b.people.length - a.people.length).map((marker) => (
          <Badge key={marker.location} variant="secondary" className="gap-1">
            <MapPin className="h-3 w-3" />
            {marker.location}
            <span className="ml-1 text-muted-foreground">({marker.people.length})</span>
          </Badge>
        ))}
      </div>
    </div>
  );
}
