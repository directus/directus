import { CameraOptions } from 'maplibre-gl';
import { GeometryFormat } from '@directus/shared/types';

export type LayoutQuery = {
	fields: string[];
	sort: string[];
	limit: number;
	page: number;
};

export type LayoutOptions = {
	cameraOptions?: CameraOptions & { bbox: any };
	geometryFormat?: GeometryFormat;
	geometryField?: string;
	autoLocationFilter?: boolean;
	clusterData?: boolean;
	animateOptions?: any;
	displayTemplate?: string;
};
