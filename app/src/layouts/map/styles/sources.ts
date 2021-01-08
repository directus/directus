import type { Sources } from 'maplibre-gl';

const tiles = (subdomains: string, url: string) => Array.from(subdomains || '').map((s) => url.replace('{s}', s));
const esri = (url: string) => ['server', 'services'].map((s) => url.replace('{s}', s));

export default <Sources>{
	OpenStreetMap_Mapnik: {
		tiles: tiles('abc', 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'),
		attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
		type: 'raster',
		maxzoom: 19,
		tileSize: 256,
	},
	CartoDB_Positron: {
		tiles: tiles('abcd', 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'),
		attribution:
			'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
		type: 'raster',
		maxzoom: 19,
		tileSize: 256,
	},
	CartoDB_PositronNoLabels: {
		tiles: tiles('abcd', 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png'),
		attribution:
			'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
		type: 'raster',
		maxzoom: 19,
		tileSize: 256,
	},
	CartoDB_DarkMatter: {
		tiles: tiles('abcd', 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'),
		attribution:
			'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
		type: 'raster',
		maxzoom: 19,
		tileSize: 256,
	},
	CartoDB_DarkMatterNoLabels: {
		tiles: tiles('abcd', 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png'),
		attribution:
			'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
		type: 'raster',
		maxzoom: 19,
		tileSize: 256,
	},
	CartoDB_Voyager: {
		tiles: tiles('abcd', 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'),
		attribution:
			'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
		type: 'raster',
		maxzoom: 19,
		tileSize: 256,
	},
	CartoDB_VoyagerNoLabels: {
		tiles: tiles('abcd', 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png'),
		attribution:
			'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
		type: 'raster',
		maxzoom: 19,
		tileSize: 256,
	},
	Esri_Streets: {
		tiles: esri('https://{s}.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}'),
		attribution: 'USGS, NOAA',
		type: 'raster',
		minzoom: 1,
		maxzoom: 19,
	},
	Esri_Topographic: {
		tiles: esri('https://{s}.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}'),
		attribution: 'USGS, NOAA',
		type: 'raster',
		minzoom: 1,
		maxzoom: 19,
	},
	Esri_Oceans: {
		tiles: esri('https://{s}.arcgisonline.com/arcgis/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}'),
		attribution: 'USGS, NOAA',
		type: 'raster',
		minzoom: 1,
		maxzoom: 16,
	},
	Esri_OceansLabels: {
		tiles: esri(
			'https://{s}.arcgisonline.com/arcgis/rest/services/Ocean/World_Ocean_Reference/MapServer/tile/{z}/{y}/{x}'
		),
		attribution: '',
		type: 'raster',
		minzoom: 1,
		maxzoom: 16,
	},
	Esri_NationalGeographic: {
		tiles: esri('https://{s}.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}'),
		attribution:
			'National Geographic, DeLorme, HERE, UNEP-WCMC, USGS, NASA, ESA, METI, NRCAN, GEBCO, NOAA, increment P Corp.',
		type: 'raster',
		minzoom: 1,
		maxzoom: 16,
	},
	Esri_DarkGray: {
		tiles: esri(
			'https://{s}.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}'
		),
		attribution: 'HERE, DeLorme, MapmyIndia, &copy; OpenStreetMap contributors',
		type: 'raster',
		minzoom: 1,
		maxzoom: 16,
	},
	Esri_DarkGrayLabels: {
		tiles: esri(
			'https://{s}.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}'
		),
		attribution: '',
		type: 'raster',
		minzoom: 1,
		maxzoom: 16,
	},
	Esri_Gray: {
		tiles: esri(
			'https://{s}.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}'
		),
		attribution: 'HERE, DeLorme, MapmyIndia, &copy; OpenStreetMap contributors',
		type: 'raster',
		minzoom: 1,
		maxzoom: 16,
	},
	Esri_GrayLabels: {
		tiles: esri(
			'https://{s}.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}'
		),
		attribution: '',
		type: 'raster',
		minzoom: 1,
		maxzoom: 16,
	},
	Esri_Imagery: {
		tiles: esri('https://{s}.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'),
		attribution:
			'DigitalGlobe, GeoEye, i-cubed, USDA, USGS, AEX, Getmapping, Aerogrid, IGN, IGP, swisstopo, and the GIS User Community',
		type: 'raster',
		minzoom: 1,
		maxzoom: 19,
	},
	Esri_ImageryLabels: {
		tiles: esri(
			'https://{s}.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}'
		),
		attribution: '',
		type: 'raster',
		minzoom: 1,
		maxzoom: 19,
	},
	Esri_ImageryTransportation: {
		tiles: esri(
			'https://{s}.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}'
		),
		attribution: '',
		type: 'raster',
		minzoom: 1,
		maxzoom: 19,
	},
	Esri_ShadedRelief: {
		tiles: esri('https://{s}.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/{z}/{y}/{x}'),
		attribution: 'USGS',
		type: 'raster',
		minzoom: 1,
		maxzoom: 13,
	},
	Esri_ShadedReliefLabels: {
		tiles: esri(
			'https://{s}.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places_Alternate/MapServer/tile/{z}/{y}/{x}'
		),
		attribution: '',
		type: 'raster',
		minzoom: 1,
		maxzoom: 12,
	},
	Esri_Terrain: {
		tiles: esri('https://{s}.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer/tile/{z}/{y}/{x}'),
		attribution: 'USGS, NOAA',
		type: 'raster',
		minzoom: 1,
		maxzoom: 13,
	},
	Esri_TerrainLabels: {
		tiles: esri(
			'https://{s}.arcgisonline.com/ArcGIS/rest/services/Reference/World_Reference_Overlay/MapServer/tile/{z}/{y}/{x}'
		),
		attribution: '',
		type: 'raster',
		minzoom: 1,
		maxzoom: 13,
	},
	Esri_USATopo: {
		tiles: esri('https://{s}.arcgisonline.com/ArcGIS/rest/services/USA_Topo_Maps/MapServer/tile/{z}/{y}/{x}'),
		attribution: 'USGS, National Geographic Society, i-cubed',
		type: 'raster',
		minzoom: 1,
		maxzoom: 15,
	},
	Esri_ImageryClarity: {
		tiles: esri('https://clarity.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'),
		attribution:
			'Esri, DigitalGlobe, GeoEye, Earthstar Geographics, CNES/Airbus DS, USDA, USGS, AeroGRID, IGN, and the GIS User Community',
		type: 'raster',
		minzoom: 1,
		maxzoom: 19,
	},
	Esri_Physical: {
		tiles: esri('https://{s}.arcgisonline.com/arcgis/rest/services/World_Physical_Map/MapServer/tile/{z}/{y}/{x}'),
		attribution: 'U.S. National Park Service',
		type: 'raster',
		minzoom: 1,
		maxzoom: 8,
	},
	Esri_ImageryFirefly: {
		tiles: esri(
			'https://fly.maptiles.arcgis.com/arcgis/rest/services/World_Imagery_Firefly/MapServer/tile/{z}/{y}/{x}'
		),
		attribution:
			'Esri, DigitalGlobe, GeoEye, Earthstar Geographics, CNES/Airbus DS, USDA, USGS, AeroGRID, IGN, and the GIS User Community',
		type: 'raster',
		minzoom: 1,
		maxzoom: 19,
	},
};
