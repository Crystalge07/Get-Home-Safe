/**
 * ArcGIS safety index layer.
 * The experience https://experience.arcgis.com/experience/19cd9accd61542ffb62be3b5f29ee778
 * exposes safety zone data. Set this to the feature service query URL that returns GeoJSON.
 * Example: https://services.arcgis.com/.../FeatureServer/0/query?where=1%3D1&outFields=*&returnGeometry=true&f=geojson
 * Leave null to skip fetching (no general safety overlay).
 */
export const ARCGIS_SAFETY_GEOJSON_URL: string | null = null;
