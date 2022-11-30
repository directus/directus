import { Storage } from '@directus/drive';
import { v2 } from 'cloudinary';
import type { ConfigOptions } from 'cloudinary';

export class CloudinaryStorage extends Storage {
	constructor(config: ConfigOptions) {
		super();
		v2.config(config);
	}
}
