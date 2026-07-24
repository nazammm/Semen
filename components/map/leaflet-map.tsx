"use client"

import "leaflet/dist/leaflet.css"
import { CircleMarker, MapContainer, Popup, TileLayer, Tooltip } from "react-leaflet"
import type { StoreRow, BranchPoint } from "@/lib/queries"
import { formatDate, formatTonCompact } from "@/lib/format"

export default function LeafletMap({
  stores,
  branches,
}: {
  stores: StoreRow[]
  branches: BranchPoint[]
}) {
  return (
    <MapContainer
      center={[-2.5, 117]}
      zoom={5}
      scrollWheelZoom
      className="h-full w-full"
      style={{ background: "#0f1115" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />

      {branches.map((b) => (
        <CircleMarker
          key={`b-${b.id}`}
          center={[b.lat, b.lng]}
          radius={9}
          pathOptions={{
            color: "#f5f5f5",
            weight: 2,
            fillColor: "var(--branch-color, #e8a838)",
            fillOpacity: 1,
          }}
        >
          <Tooltip direction="top" offset={[0, -6]}>
            <strong>{b.name}</strong>
          </Tooltip>
          <Popup>
            <div className="space-y-0.5">
              <p className="font-semibold">{b.name}</p>
              <p className="text-xs">Kantor Cabang</p>
              <p className="text-xs">
                {b.city}, {b.province}
              </p>
            </div>
          </Popup>
        </CircleMarker>
      ))}

      {stores.map((s) => {
        const aktif = s.status === "aktif"
        const color = aktif ? "#3fb27f" : "#e5484d"
        return (
          <CircleMarker
            key={`s-${s.id}`}
            center={[s.lat, s.lng]}
            radius={6}
            pathOptions={{
              color,
              weight: 1.5,
              fillColor: color,
              fillOpacity: 0.65,
            }}
          >
            <Popup>
              <div className="space-y-1">
                <p className="font-semibold">{s.name}</p>
                <p className="text-xs capitalize">
                  Status:{" "}
                  <span style={{ color }}>{s.status}</span>
                </p>
                <p className="text-xs">
                  {s.city}, {s.province}
                </p>
                {s.owner ? <p className="text-xs">Pemilik: {s.owner}</p> : null}
                <p className="text-xs">Sales: {s.salesman ?? "-"}</p>
                <p className="text-xs">Cabang: {s.branch ?? "-"}</p>
                <p className="text-xs">Order terakhir: {formatDate(s.lastOrderDate)}</p>
                <p className="text-xs">Total tonase: {formatTonCompact(s.omzetTotal)}</p>
              </div>
            </Popup>
          </CircleMarker>
        )
      })}
    </MapContainer>
  )
}
