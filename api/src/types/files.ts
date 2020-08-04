/** @todo finalize */
export type File = {
	id: string; // uuid
	storage: string;
	filename_disk: string;
	filename_download: string;
	title: string | null;
	type: string | null;
	folder: string | null; // uuid
	uploaded_by: string | null; // uuid
	uploaded_on: Date;
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
};
