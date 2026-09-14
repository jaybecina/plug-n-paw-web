"use client";

import { useEffect, useMemo } from "react";
import {
  divIcon,
  type LatLngExpression,
  type LatLng,
  type Map as LeafletMap,
} from "leaflet";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import type { SearchResponse, VetResult } from "@/lib/vets/types";

type VetMapProps = {
  data: SearchResponse | null;
  selectedId: string | null;
  resizeSignal: number;
  onSelect: (id: string) => void;
};

const DEFAULT_CENTER: LatLngExpression = [14.5995, 120.9842];

export default function VetMap({
  data,
  selectedId,
  resizeSignal,
  onSelect,
}: VetMapProps) {
  const center = data?.center
    ? ([data.center.lat, data.center.lon] satisfies LatLngExpression)
    : DEFAULT_CENTER;

  return (
    <MapContainer
      center={center}
      zoom={data?.center ? 13 : 11}
      className="h-full w-full"
      scrollWheelZoom
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapController
        data={data}
        selectedId={selectedId}
        resizeSignal={resizeSignal}
      />
      {data?.results.map((vet) => (
        <Marker
          key={vet.id}
          position={[vet.lat, vet.lon]}
          icon={createMarkerIcon(selectedId === vet.id)}
          eventHandlers={{
            click: () => onSelect(vet.id),
          }}
        >
          <Popup>
            <div className="max-w-56 space-y-1">
              <p className="font-semibold text-foreground">{vet.name}</p>
              <p className="text-sm text-muted-foreground">{vet.address}</p>
              {vet.distanceKm !== undefined ? (
                <p className="text-xs text-muted-foreground">
                  {vet.distanceKm.toFixed(1)} km away
                </p>
              ) : null}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

function MapController({
  data,
  selectedId,
  resizeSignal,
}: {
  data: SearchResponse | null;
  selectedId: string | null;
  resizeSignal: number;
}) {
  const map = useMap();
  const selectedVet = useMemo(
    () => data?.results.find((vet) => vet.id === selectedId) ?? null,
    [data, selectedId]
  );

  useEffect(() => {
    window.setTimeout(() => map.invalidateSize(), 120);
  }, [map, resizeSignal]);

  useEffect(() => {
    if (data?.center) {
      map.setView([data.center.lat, data.center.lon], 13, { animate: true });
    }
  }, [data?.center, map]);

  useEffect(() => {
    if (!selectedVet) {
      return;
    }

    map.setView([selectedVet.lat, selectedVet.lon], Math.max(map.getZoom(), 14), {
      animate: true,
    });
    openSelectedPopup(map, selectedVet);
  }, [map, selectedVet]);

  return null;
}

function openSelectedPopup(map: LeafletMap, selectedVet: VetResult) {
  map.eachLayer((layer) => {
    if (isPopupMarker(layer)) {
      const latLng = layer.getLatLng();

      if (latLng.lat === selectedVet.lat && latLng.lng === selectedVet.lon) {
        layer.openPopup();
      }
    }
  });
}

function isPopupMarker(
  layer: unknown
): layer is { getLatLng: () => LatLng; openPopup: () => void } {
  return (
    typeof layer === "object" &&
    layer !== null &&
    "getLatLng" in layer &&
    "openPopup" in layer &&
    typeof layer.openPopup === "function"
  );
}

function createMarkerIcon(isSelected: boolean) {
  return divIcon({
    className: "",
    html: `<span class="vet-marker${isSelected ? " vet-marker-selected" : ""}"></span>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -16],
  });
}
