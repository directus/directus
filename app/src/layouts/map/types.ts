import { CameraOptions } from 'maplibre-gl';

export type LayoutQuery = {
	fields: string[];
	sort: string[];
	limit: number;
	page: number;
};

export type LayoutOptions = {
	cameraOptions?: CameraOptions & { bbox: any };
	geometryField?: string;
	autoLocationFilter?: boolean;
	clusterData?: boolean;
	animateOptions?: any;
	displayTemplate?: string;
};
