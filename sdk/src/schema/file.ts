import type { CoreCollection } from '../index.js';
import type { DirectusUser } from './user.js';
import type { DirectusFolder } from './folder.js';

// Base type for directus_files
export type DirectusFile<Schema extends object> = CoreCollection<Schema, 'directus_files', {
	id: string;
	storage: string;
	filename_disk: string;
	filename_download: string;
	title: string;
	type: string;
	folder: DirectusFolder<Schema> | string;
	uploaded_by: DirectusUser<Schema> | string;
	uploaded_on: string;
	modified_by: DirectusUser<Schema> | string;
	modified_on: string;
	charset: string | null;
	filesize: string;
	width: number | null;
	height: number | null;
	duration: number | null;
	embed: unknown | null;
	description: string | null;
	location: string | null;
	tags: string[];
	metadata: Record<string, any> | null;
}>;
