import type { Sources } from 'maplibre-gl';

const tiles = (subdomains: string, url: string) => Array.from(subdomains || '').map((s) => url.replace('{s}', s));
const esri = (url: string) => ['server', 'services'].map((s) => url.replace('{s}', s));

export default <Sources>{
	Mapbox_Light: {
		url: 'mapbox://styles/mapbox/light-v10',
		type: 'vector',
	},
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
	Esri_NationalGeographic: {
		tiles: esri('https://{s}.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}'),
		attribution:
			'National Geographic, DeLorme, HERE, UNEP-WCMC, USGS, NASA, ESA, METI, NRCAN, GEBCO, NOAA, increment P Corp.',
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
	Esri_DarkGray: {
		tiles: esri(
			'https://{s}.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}'
		),
		attribution: 'HERE, DeLorme, MapmyIndia, &copy; OpenStreetMap contributors',
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
};
