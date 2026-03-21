"use client";

import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L, { LatLngBoundsExpression } from "leaflet";
import "leaflet/dist/leaflet.css";

type OfferingItem = {
  id: string;
  name: string;
  title: string;
  category?: string;
  city?: string;
  price: string | number;
  rating: number;
  experience?: string;
  reliabilityScore?: number;
  lat: number;
  lng: number;
};

type OfferingsMapProps = {
  data: OfferingItem[];
  onSelect: (item: OfferingItem) => void;
};

const defaultCenter: [number, number] = [20.5937, 78.9629];

const pinIcon = new L.DivIcon({
  html: `
    <div style="
      width:18px;
      height:18px;
      border-radius:9999px;
      background:#8b5cf6;
      border:3px solid rgba(255,255,255,0.96);
      box-shadow:0 0 0 8px rgba(139,92,246,0.18), 0 6px 16px rgba(0,0,0,0.22);
    "></div>
  `,
  className: "",
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

function FitBounds({ data }: { data: OfferingItem[] }) {
  const map = useMap();

  useEffect(() => {
    if (!data.length) return;

    if (data.length === 1) {
      map.setView([data[0].lat, data[0].lng], 14);
      return;
    }

    const bounds: LatLngBoundsExpression = data.map((item) => [
      item.lat,
      item.lng,
    ]);

    map.fitBounds(bounds, {
      padding: [40, 40],
      maxZoom: 13,
    });
  }, [data, map]);

  return null;
}

export default function OfferingsMap({
  data,
  onSelect,
}: OfferingsMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const safeData = useMemo(() => (Array.isArray(data) ? data : []), [data]);

  if (!mounted) {
    return <div className="h-full w-full bg-black" />;
  }

  return (
    <div className="h-full w-full">
      <MapContainer
        center={defaultCenter}
        zoom={5}
        className="h-full w-full"
        zoomControl={false}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FitBounds data={safeData} />

        {safeData.map((item) => (
          <Marker
            key={item.id}
            position={[item.lat, item.lng]}
            icon={pinIcon}
            eventHandlers={{
              click: () => onSelect(item),
            }}
          />
        ))}
      </MapContainer>
    </div>
  );
}