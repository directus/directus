import { CameraOptions, AnyLayer } from 'maplibre-gl';
import { GeometryFormat } from '@directus/shared/types';

export type LayoutQuery = {
	fields: string[];
	sort: string[];
	limit: number;
	page: number;
};

export type LayoutOptions = {
	cameraOptions?: CameraOptions & { bbox: any };
	customLayers?: Array<AnyLayer>;
	geometryFormat?: GeometryFormat;
	geometryField?: string;
	autoLocationFilter?: boolean;
	clusterData?: boolean;
	animateOptions?: any;
	displayTemplate?: string;
};
