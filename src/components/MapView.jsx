import { useEffect } from 'react'
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const pinSvg = (fill, inner) => `
<svg width="38" height="46" viewBox="0 0 38 46" xmlns="http://www.w3.org/2000/svg">
  <path d="M19 45C19 45 35 28.6 35 17.5C35 8.4 27.8 2 19 2C10.2 2 3 8.4 3 17.5C3 28.6 19 45 19 45Z" fill="${fill}" stroke="white" stroke-width="3"/>
  ${inner}
</svg>`

const CROSS = '<path d="M16.5 10h5v5h5v5h-5v5h-5v-5h-5v-5h5z" fill="white"/>'
const PILL = '<rect x="11" y="14" width="16" height="8" rx="4" fill="white"/><rect x="19" y="14" width="8" height="8" rx="0" fill="#ffffffaa"/>'

const icons = {}
export function pinIcon(kind = 'hospital', active = false) {
  const key = `${kind}-${active}`
  if (!icons[key]) {
    const fill = kind === 'partner' ? '#04677d' : kind === 'pharmacy' ? '#5fa39a' : '#3b8a9b'
    icons[key] = L.divIcon({
      className: 'mm-pin',
      html: `<div style="transform:scale(${active ? 1.25 : 1});transform-origin:bottom center;transition:transform .2s">${pinSvg(
        fill,
        kind === 'pharmacy' ? PILL : CROSS,
      )}</div>`,
      iconSize: [38, 46],
      iconAnchor: [19, 45],
    })
  }
  return icons[key]
}

const youIcon = L.divIcon({
  className: 'mm-pin',
  html: '<div style="width:22px;height:22px;border-radius:50%;background:#3b82f6;border:4px solid white;box-shadow:0 0 0 8px rgba(59,130,246,.2)"></div>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
})

function FlyTo({ center, zoom }) {
  const map = useMap()
  useEffect(() => {
    map.flyTo([center.lat, center.lng], zoom ?? map.getZoom(), { duration: 0.6 })
  }, [center.lat, center.lng, zoom, map])
  return null
}

/**
 * places: [{ id, lat, lng, kind }]. CARTO light tiles keep the map calm next to the teal UI.
 */
export default function MapView({ center, you, places = [], activeId, onSelect, zoom = 14, className = 'h-72' }) {
  return (
    <div className={`relative isolate overflow-hidden ${className}`}>
      <MapContainer center={[center.lat, center.lng]} zoom={zoom} zoomControl={false} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        <FlyTo center={center} />
        {you && <Marker position={[you.lat, you.lng]} icon={youIcon} />}
        {places.map((p) => (
          <Marker
            key={p.id}
            position={[p.lat, p.lng]}
            icon={pinIcon(p.kind, p.id === activeId)}
            zIndexOffset={p.id === activeId ? 1000 : 0}
            eventHandlers={{ click: () => onSelect?.(p) }}
          />
        ))}
      </MapContainer>
    </div>
  )
}
