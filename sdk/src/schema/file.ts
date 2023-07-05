import type { DirectusUser } from "./user.js";

// Base type for directus_files
export interface DirectusFile {
	id: string;
	storage: string;
	filename_disk: string;
	filename_download: string;
	title: string;
	type: string;
	folder: /* DirectusFolder | */ string;
	uploaded_by: DirectusUser | string;
	uploaded_on: string;
	modified_by: DirectusUser | string;
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
}
