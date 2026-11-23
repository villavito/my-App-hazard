import { type Coordinates, OSM_REQUEST_HEADERS } from "./location";

// The maths behind the app's own maps (components/LocationMap and
// components/TileMap): OpenStreetMap's standard 256px tiles in the Web
// Mercator projection, the same one every web map uses.

export const TILE_SIZE = 256;
// Ground resolution at zoom 0 on the equator, in meters per pixel.
const METERS_PER_PIXEL_AT_ZOOM_0 = 156543.03392;
// Web Mercator stops here; beyond it the map would be infinitely tall.
const MAX_LATITUDE = 85.05112878;

/** A point on the square world map, both axes 0..1 (x eastward, y southward). */
export type WorldPoint = { x: number; y: number };

export function toWorld({ latitude, longitude }: Coordinates): WorldPoint {
  const lat =
    (Math.max(-MAX_LATITUDE, Math.min(MAX_LATITUDE, latitude)) * Math.PI) /
    180;
  return {
    x: (longitude + 180) / 360,
    y: (1 - Math.log(Math.tan(lat) + 1 / Math.cos(lat)) / Math.PI) / 2,
  };
}

export function fromWorld({ x, y }: WorldPoint): Coordinates {
  const n = Math.PI - 2 * Math.PI * y;
  return {
    latitude: (180 / Math.PI) * Math.atan(Math.sinh(n)),
    longitude: x * 360 - 180,
  };
}

/** Width (and height) of the whole world map in pixels at this zoom. */
export function worldSize(zoom: number) {
  return TILE_SIZE * 2 ** zoom;
}

export function metersPerPixel(latitude: number, zoom: number) {
  return (
    (METERS_PER_PIXEL_AT_ZOOM_0 * Math.cos((latitude * Math.PI) / 180)) /
    2 ** zoom
  );
}

export type MapTile = {
  key: string;
  source: { uri: string; headers?: Record<string, string> };
  /** Position inside the view, in pixels. */
  left: number;
  top: number;
};

/** The tiles that cover a width x height view centred on `center`. */
export function tilesForView(
  center: WorldPoint,
  zoom: number,
  width: number,
  height: number,
): MapTile[] {
  const size = worldSize(zoom);
  const left = center.x * size - width / 2;
  const top = center.y * size - height / 2;
  const tilesPerSide = 2 ** zoom;
  const tiles: MapTile[] = [];
  for (let ty = Math.floor(top / TILE_SIZE); ty * TILE_SIZE < top + height; ty++) {
    if (ty < 0 || ty >= tilesPerSide) continue;
    for (let tx = Math.floor(left / TILE_SIZE); tx * TILE_SIZE < left + width; tx++) {
      // The map repeats sideways, so wrap past the date line.
      const wrappedX = ((tx % tilesPerSide) + tilesPerSide) % tilesPerSide;
      tiles.push({
        key: `${zoom}/${tx}/${ty}`,
        source: {
          uri: `https://tile.openstreetmap.org/${zoom}/${wrappedX}/${ty}.png`,
          headers: OSM_REQUEST_HEADERS,
        },
        // Rounded the same way for every tile, so neighbours meet without
        // hairline gaps.
        left: Math.round(tx * TILE_SIZE - left),
        top: Math.round(ty * TILE_SIZE - top),
      });
    }
  }
  return tiles;
}
