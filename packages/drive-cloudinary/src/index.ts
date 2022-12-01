import { Storage } from '@directus/drive';
import { v2 as cloudinary } from 'cloudinary';
import type { ConfigOptions } from 'cloudinary';

export class CloudinaryStorage extends Storage {
	constructor(config: ConfigOptions) {
		super();
		cloudinary.config(config);
	}
}
