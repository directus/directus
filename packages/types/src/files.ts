import type { Readable } from 'node:stream';

export type File = {
	id: string;
	storage: string;
	filename_disk: string;
	filename_download: string;
	title: string | null;
	type: string | null;
	folder: string | null;
	created_on: string;
	uploaded_by: string | null;
	uploaded_on: string | null;
	modified_by: string | null;
	modified_on: string;
	charset: string | null;
	filesize: number;
	width: number | null;
	height: number | null;
	duration: number | null;
	embed: string | null;
	description: string | null;
	location: string | null;
	tags: string | null;
	metadata: Record<string, any> | null;
	focal_point_x: number | null;
	focal_point_y: number | null;
	tus_id: string | null;
	tus_data: Record<string, any> | null;
};

export type BusboyFileStream = {
	truncated: boolean;
} & Readable;
