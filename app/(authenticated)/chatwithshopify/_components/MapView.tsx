"use client";

import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
} from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";

export type MapPoint = {
  label: string;
  lat: number;
  lng: number;
  value: number;
  orderIds?: number[];
  customerIds?: number[];
};

export default function MapView({
  title,
  points,
}: {
  title?: string;
  points: MapPoint[];
}) {
  const [mounted, setMounted] = useState(false);

  // 🔑 CRITICAL: wait until component is fully mounted
  useEffect(() => {
    setMounted(true);
    return () => {
      setMounted(false);
    };
  }, []);

  if (!mounted || !points?.length) return null;

  const center: LatLngExpression = [39, -98];

  return (
    <div className="w-full rounded-lg border bg-background p-3">
      {title && <h3 className="text-sm font-semibold mb-2">{title}</h3>}

      <MapContainer
        key={`map-${Date.now()}`} // 🔥 HARD RESET — REQUIRED
        center={center}
        zoom={4}
        scrollWheelZoom={false}
        style={{ height: 320, width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {points.map((p, idx) => (
          <CircleMarker
            key={idx}
            center={[p.lat, p.lng]}
            radius={Math.min(20, 6 + p.value * 2)}
            pathOptions={{
              color: "#2563eb",
              fillColor: "#3b82f6",
              fillOpacity: 0.6,
            }}
          >
            <Popup>
              <div className="text-sm">
                <div className="font-semibold">{p.label}</div>
                <div>Count: {p.value}</div>

                {p.orderIds && (
                  <div className="text-xs mt-1">
                    Orders: {p.orderIds.join(", ")}
                  </div>
                )}

                {p.customerIds && (
                  <div className="text-xs mt-1">
                    CustomerID: {p.customerIds.join(", ")}
                  </div>
                )}
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
